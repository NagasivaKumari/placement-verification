import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';

import * as algosdk from 'algosdk';
import { signAndSendPlacementClaim_FINAL } from '../utils/blockchain_engine';
import { tryRestorePeraSession } from '../wallet';
import TxModal from '../components/TxModal';

const StudentDashboard = ({ token, account }) => {
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  
  // Upload Form State
  const [offerCompany, setOfferCompany] = useState("");
  const [offerRole, setOfferRole] = useState("");
  const [offerSalary, setOfferSalary] = useState("");
  const [offerSenderEmail, setOfferSenderEmail] = useState("");
  const [placementType, setPlacementType] = useState("full-time");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");
   const [isUploading, setIsUploading] = useState(false);
    const [walletConnected, setWalletConnected] = useState(false);
   const [txModalVisible, setTxModalVisible] = useState(false);
   const [txModalData, setTxModalData] = useState<{txId?: string | null; message?: string}>({ txId: null, message: '' });

  // Verification State
  const [salaryAmount, setSalaryAmount] = useState("");
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetchPlacements();
    fetchCompanies();
    fetchProfile();
      // Attempt to restore a Pera session silently on mount — do not prompt/connect.
      (async () => {
         try {
            const accounts = await tryRestorePeraSession();
            setWalletConnected(Array.isArray(accounts) && accounts.length > 0);
         } catch (e) {
            setWalletConnected(false);
         }
      })();
  }, [token]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/api/user/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.role) setProfile(data);
    } catch (e) { console.error(e); }
  };

  const fetchPlacements = async () => {
    try {
      const res = await fetch(`${API_URL}/api/student/placements`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.placements) setPlacements(data.placements);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await fetch(`${API_URL}/api/companies/active`);
      const data = await res.json();
      if (data.companies) setCompanies(data.companies);
    } catch (e) { console.error(e); }
  };

  const handleUploadOffer = async (e) => {
    e.preventDefault();
      // Require an active Pera session (do not auto-open connect here)
      if (!walletConnected) { setUploadMessage("No active wallet session. Please press Connect Wallet first."); window.alert('Please connect your Pera Wallet before publishing to ledger.'); return; }
      if (!account) { setUploadMessage("Wallet connection lost. Please refresh."); return; }
    if (!offerCompany) { setUploadMessage("Select target employer."); return; }
    if (!selectedFile) { setUploadMessage("Please select your offer letter."); return; }
    setIsUploading(true);
    setUploadMessage("");
    
    try {
      // Convert file to base64 for IPFS anchoring
      const reader = new FileReader();
      const fileData = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(selectedFile);
      });

      // 1. REAL BLOCKCHAIN TRANSACTION (ANCHOR THE CLAIM)
      // ==========================================
      // CALL SITE AUDIT (BRUTAL TRUTH)
      // ==========================================
         console.log("CALL SITE SENDER:", account, typeof account);
         console.log("CALL SITE COMPANY:", offerCompany, typeof offerCompany);

         if (!account || account === "null" || account === "undefined") {
            window.alert("CALL SITE ERROR: ACCOUNT IS UNDEFINED AT RUNTIME");
            throw new Error("Call Site Breach: Sender is undefined before function call.");
         }

         // Normalize and canonicalize addresses. Accept common raw formats (hex/base64)
         const hexToBytes = (hex: string) => {
            const bytes: number[] = [];
            for (let i = 0; i < hex.length; i += 2) {
               bytes.push(parseInt(hex.substr(i, 2), 16));
            }
            return new Uint8Array(bytes);
         };

         const normalizeAndCanonicalize = (value: any) => {
            if (!value && value !== '') return null;
            // unwrap arrays or objects
            if (Array.isArray(value) && value.length > 0) value = value[0];
            if (typeof value === 'object' && value !== null) {
               if (value.address) value = value.address;
               else value = String(value);
            }
            let v = String(value).trim();

            // Strip common CAIP / namespace prefixes (e.g. algorand:ADDR, did:algorand:ADDR)
            if (v.includes(':')) {
               const parts = v.split(':');
               v = parts[parts.length - 1];
            }
            if (algosdk.isValidAddress(v)) return v;

            // Hex (64 chars) -> public key
            const hex64 = /^[0-9a-fA-F]{64}$/;
            if (hex64.test(v)) {
               try {
                  const pk = hexToBytes(v);
                  return algosdk.encodeAddress(pk);
               } catch (e) {}
            }

            // base64 -> raw 32 bytes
            try {
               const decoded = Uint8Array.from(atob(v), (c) => c.charCodeAt(0));
               if (decoded.length === 32) return algosdk.encodeAddress(decoded);
            } catch (e) {}

            return null;
         };

         const senderAddr = normalizeAndCanonicalize(account);
         if (!senderAddr) {
            setUploadMessage("Invalid wallet address: your connected account is not a valid Algorand address or public key.");
            window.alert(`Invalid wallet address: ${String(account)}`);
            setIsUploading(false);
            return;
         }

         const companyAddr = normalizeAndCanonicalize(offerCompany);
         if (!companyAddr) {
            setUploadMessage("Invalid company address: please select a valid Algorand wallet or provide a valid public key.");
            window.alert(`Invalid company address: ${String(offerCompany)}`);
            setIsUploading(false);
            return;
         }

      let claimTxId = null;
      try {
            claimTxId = await signAndSendPlacementClaim_FINAL(
               senderAddr, companyAddr, offerRole, offerSalary
            );
         } catch (txnError: any) {
            console.error("FULL STACK TRACE:", txnError.stack);
            setUploadMessage(`Blockchain Error: ${txnError.message}\nCheck Console for Stack Trace.`);
            setTxModalData({ txId: claimTxId, message: `Blockchain Error: ${txnError.message}` });
            setTxModalVisible(true);
            setIsUploading(false); return;
         }

      // 2. SEND METADATA TO BACKEND
         try {
            const res = await fetch(`${API_URL}/api/placements/student-upload`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
               body: JSON.stringify({
                  companyWallet: offerCompany,
                  role: offerRole,
                  salary: parseFloat(offerSalary) || 0,
                  placementType: placementType,
                  senderEmail: offerSenderEmail,
                  documentHash: fileData, // Real file data for IPFS
                  txHash: claimTxId 
               })
            });

            if (res.ok) {
               setUploadMessage("Success! Offer anchored with CID and TxID.");
               setOfferRole(""); setOfferSalary(""); setSelectedFile(null);
               fetchPlacements();
            } else {
               // Backend endpoint returned non-OK (404/500). Don't treat this as a failure
               // of the on-chain anchoring. Inform the user that the txn was sent to the
               // wallet and provide the TXID so they can verify on-chain later.
               console.warn('Backend upload returned non-OK:', res.status, await res.text().catch(() => ''));
               const message = `Transaction sent to wallet. Backend returned ${res.status}.`;
               setUploadMessage(message);
               setTxModalData({ txId: claimTxId, message });
               setTxModalVisible(true);
            }
         } catch (err) {
            // Network or CORS error — again, treat the on-chain result as the source of truth.
            console.warn('Backend upload failed:', err);
            const message = `Transaction sent to wallet. Could not reach backend.`;
            setUploadMessage(message);
            setTxModalData({ txId: claimTxId, message });
            setTxModalVisible(true);
            }
    } catch (err) { 
      setUploadMessage("Network failure during anchoring."); 
    } finally { setIsUploading(false); }
  };

  const verifyPhase = async (phase, code) => {
    try {
      let endpoint = '';
      let body: any = { verificationCode: code };
      
      if (phase === 'join-upload' || phase === 'salary-upload') {
        // Trigger file picker
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = async (e: any) => {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = async () => {
             endpoint = phase === 'join-upload' ? '/api/placements/upload-joining' : '/api/placements/upload-salary-slip';
             body.documentHash = reader.result;
             const res = await fetch(`${API_URL}${endpoint}`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
               body: JSON.stringify(body)
             });
             if (res.ok) fetchPlacements();
          };
          reader.readAsDataURL(file);
        };
        input.click();
        return;
      } else if (phase === 'salary-match') {
        endpoint = '/api/placements/verify-salary';
        body.amount = parseFloat(salaryAmount) || 0;
      }
      
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      if (res.ok) { fetchPlacements(); setSalaryAmount(''); }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="container-custom py-16 max-w-7xl">
      {/* Header Banner */}
      <div className="relative mb-16 overflow-hidden bg-slate-950 border border-white/5 rounded-[3rem] p-10 md:p-14 shadow-2xl">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-[120px]"></div>
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex flex-col md:flex-row items-center gap-8">
               <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2.5rem] blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative w-28 h-28 rounded-[2.2rem] bg-slate-900 border-2 border-white/10 flex items-center justify-center shadow-2xl overflow-hidden">
                     {profile?.details?.avatar ? (
                        <img src={profile.details.avatar} alt="Avatar" className="w-full h-full object-cover" />
                     ) : (
                        <span className="text-4xl font-black italic text-white">{profile?.name?.charAt(0) || 'S'}</span>
                     )}
                  </div>
               </div>
               <div className="text-center md:text-left">
                  <p className="text-indigo-400 font-black uppercase tracking-[0.3em] text-[10px] mb-3">SBT Identity Passport</p>
                  <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tight mb-4">{profile?.name || "Student Node"}</h1>
                  
                   {profile?.details?.resumeUrl && (
                     <div className="mb-4">
                        <button 
                          onClick={() => {
                            const url = profile.details.resumeUrl;
                            if (url.startsWith('http') || url.startsWith('data:')) {
                              window.open(url, '_blank');
                            } else if (url.startsWith('Qm') || url.startsWith('ba')) {
                              window.open(`https://ipfs.io/ipfs/${url}`, '_blank');
                            } else {
                              alert(`" ${url} " is a local record with no viewable data. Please re-upload your file.`);
                            }
                          }}
                          className="text-[10px] text-slate-400 font-black uppercase tracking-widest hover:text-white transition-all flex items-center gap-2 group"
                        >
                           <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                           View Active Resume
                           <span className="opacity-0 group-hover:opacity-100 transition-all ml-1">→</span>
                        </button>
                     </div>
                   )}

                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                     <span className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-black text-emerald-400 uppercase tracking-widest">🛡️ Identity verified</span>
                     <span className="flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-black text-indigo-400 uppercase tracking-widest">Algorand Mainnet Linked</span>
                  </div>
               </div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] text-center min-w-[200px]">
               <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Truth Reputation</p>
               <div className="text-5xl font-black text-white italic">{profile?.trustScore || 0}%</div>
               <div className="w-full h-1 bg-slate-800 rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: `${profile?.trustScore || 0}%` }}></div>
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         
         {/* Left Side: Forms and Stats */}
         <div className="lg:col-span-4 space-y-10">
            
            {/* NFT Credentials Section */}
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] pl-4 border-l-4 border-indigo-500">Digital Truth Assets</h3>
            <div className="grid grid-cols-1 gap-4">
               {/* Degree Token */}
               <div className="relative group cursor-help">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                  <div className="relative bg-slate-900 border border-white/5 p-6 rounded-3xl flex items-center gap-5">
                     <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 14l9-5-9-5-9 5 9 5z"></path></svg>
                     </div>
                     <div>
                        <p className="text-xs font-black text-white uppercase tracking-widest mb-0.5">Academic SBT</p>
                        <p className="text-[10px] text-slate-500 font-bold">{profile?.details?.college || "Verification Pending"}</p>
                     </div>
                     <div className="ml-auto">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${profile?.details?.degreeVerified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-600'}`}>
                           {profile?.details?.degreeVerified ? 'MINTED' : 'LOCKED'}
                        </span>
                     </div>
                  </div>
               </div>

               {/* Employment Token */}
               <div className="relative group cursor-help">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                  <div className="relative bg-slate-900 border border-white/5 p-6 rounded-3xl flex items-center gap-5">
                     <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                     </div>
                     <div>
                        <p className="text-xs font-black text-white uppercase tracking-widest mb-0.5">Professional SBT</p>
                        <p className="text-[10px] text-slate-500 font-bold">{placements.find(p => p.status === 'salary_verified')?.companyName || "No Verifications"}</p>
                     </div>
                     <div className="ml-auto">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${placements.some(p => p.status === 'salary_verified') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-600'}`}>
                           {placements.some(p => p.status === 'salary_verified') ? 'ANCHORED' : 'LOCKED'}
                        </span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Verification Form */}
            <div className="bg-slate-900 border border-white/5 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rotate-45 translate-x-12 -translate-y-12"></div>
               <h3 className="text-xl font-black text-white mb-8 italic">New Placement Truth</h3>
               <form onSubmit={handleUploadOffer} className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Target Corporation</label>
                    <select value={offerCompany} onChange={e => setOfferCompany(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white text-sm outline-none focus:border-indigo-500 transition-all">
                       <option value="">Select Company...</option>
                       {companies.map(c => <option key={c.walletAddress} value={c.walletAddress}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Role Title</label>
                        <input type="text" placeholder="DevOps Lead" value={offerRole} onChange={e => setOfferRole(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white text-sm outline-none focus:border-indigo-500" />
                     </div>
                     <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Annual Package (₹)</label>
                        <input type="number" placeholder="1200000" value={offerSalary} onChange={e => setOfferSalary(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white text-sm font-mono outline-none focus:border-indigo-500" />
                     </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Verification Email (HR)</label>
                    <input type="email" placeholder="hr@corp.com" value={offerSenderEmail} onChange={e => setOfferSenderEmail(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white text-sm outline-none focus:border-indigo-500" />
                  </div>
                  <div onClick={() => document.getElementById('offerFile').click()} className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${selectedFile ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-800 hover:border-indigo-500/50'}`}>
                     <input type="file" id="offerFile" className="hidden" onChange={e => setSelectedFile(e.target.files[0])} />
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{selectedFile ? selectedFile.name : 'Click to Upload Offer Letter'}</p>
                  </div>
                  <button type="submit" disabled={isUploading || !walletConnected} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-[0.98] transition-all disabled:opacity-50">
                     {isUploading ? 'ANCHORING...' : 'PUBLISH TO LEDGER'}
                  </button>
                  {!walletConnected && (
                    <p className="text-center text-[10px] font-black text-rose-400 uppercase tracking-widest mt-2">Wallet not connected — press Connect Wallet in the header first.</p>
                  )}
                  {uploadMessage && <p className="text-center text-[10px] font-black text-emerald-400 uppercase tracking-widest">{uploadMessage}</p>}
               </form>
            </div>
         </div>

         {/* Right Side: Placement List */}
         <div className="lg:col-span-8">
            <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
               <div className="p-8 md:p-10 border-b border-white/5 flex items-center justify-between bg-slate-800/20">
                  <h3 className="text-xl font-black text-white italic">Lifecycle Tracking</h3>
                  <div className="flex gap-4">
                     <div className="px-4 py-2 bg-slate-950 rounded-xl border border-white/5 text-center">
                        <p className="text-[9px] text-slate-500 font-black uppercase mb-0.5">Active</p>
                        <p className="text-lg font-black text-indigo-400 line-height-1">{placements.filter(p => p.status !== 'salary_verified').length}</p>
                     </div>
                     <div className="px-4 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/10 text-center">
                        <p className="text-[9px] text-emerald-500/70 font-black uppercase mb-0.5">Verified</p>
                        <p className="text-lg font-black text-emerald-400 line-height-1">{placements.filter(p => p.status === 'salary_verified').length}</p>
                     </div>
                  </div>
               </div>
               
               <div className="divide-y divide-white/5">
                  {loading ? (
                    <div className="p-20 text-center text-slate-500 font-bold uppercase tracking-widest animate-pulse">Synchronizing Ledger...</div>
                  ) : placements.length === 0 ? (
                    <div className="p-24 text-center">
                       <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                          <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                       </div>
                       <p className="text-sm font-black text-slate-500 uppercase tracking-widest">No truth claims found on-chain</p>
                    </div>
                  ) : (
                    placements.map((p, idx) => (
                      <div key={p._id || idx} className="p-8 md:p-10 hover:bg-white/5 transition-all">
                         <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div>
                               <div className="flex flex-wrap items-center gap-3 mb-3">
                                  <h4 className="text-2xl font-black text-white italic">{p.role}</h4>
                                  <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                                     ₹{parseInt(p.salary).toLocaleString()} / yr
                                  </span>
                               </div>
                               <div className="flex items-center gap-4">
                                  <p className="text-slate-400 font-black uppercase text-[11px] tracking-wider">{p.companyName}</p>
                                  <div className="w-1.5 h-1.5 bg-slate-700 rounded-full"></div>
                                  <p className="text-[10px] font-mono text-slate-600 uppercase tracking-tighter">Claim ID: {p.verificationCode?.slice(0, 12)}</p>
                               </div>
                            </div>
                            
                            <div className="w-full md:w-64 space-y-3">
                               <div className="flex justify-between items-center mb-1">
                                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Verification Status</span>
                                  <span className="text-[10px] font-black text-white">{p.status === 'salary_verified' ? '100%' : 'PROGRESSING'}</span>
                               </div>
                               <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                  <div className={`h-full transition-all duration-1000 ${p.status === 'salary_verified' ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                                    style={{ width: p.status === 'pending_company_approval' ? '20%' : p.status === 'offer_verified' ? '40%' : p.status === 'joining_pending' ? '60%' : p.status === 'joining_verified' ? '80%' : p.status === 'salary_pending' ? '90%' : '100%' }}></div>
                               </div>
                               <div className="pt-2">
                                  {p.status === 'pending_company_approval' && <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest italic animate-pulse text-center">Awaiting HR Signature...</p>}
                                  {p.status === 'offer_verified' && <button onClick={() => verifyPhase('join-upload', p.verificationCode)} className="w-full py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-500 transition-all">Phase 2: Join On-Chain</button>}
                                  {p.status === 'joining_pending' && <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest italic animate-pulse text-center">Confirming Onboarding...</p>}
                                  {p.status === 'joining_verified' && <button onClick={() => verifyPhase('salary-upload', p.verificationCode)} className="w-full py-2 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-purple-500 transition-all">Phase 3: Upload Payroll Evidence</button>}
                                  {p.status === 'salary_pending' && (
                                     <div className="space-y-2">
                                        <input type="number" placeholder="Net Amount Recv" value={salaryAmount} onChange={e => setSalaryAmount(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-[10px] font-mono outline-none focus:border-emerald-500" />
                                        <button onClick={() => verifyPhase('salary-match', p.verificationCode)} className="w-full py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-500 transition-all">Finalize & Immutable Seal</button>
                                     </div>
                                  )}
                                  {p.status === 'salary_verified' && (
                                     <div className="flex items-center justify-center gap-2 text-emerald-500 bg-emerald-500/5 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] border border-emerald-500/10">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                        Anchored to Algorand
                                     </div>
                                  )}
                               </div>
                            </div>
                         </div>
                      </div>
                    ))
                  )}
               </div>
            </div>
         </div>

         </div>
         <TxModal visible={txModalVisible} txId={txModalData.txId} message={txModalData.message} onClose={() => setTxModalVisible(false)} />
      </div>
   );
};

export default StudentDashboard;

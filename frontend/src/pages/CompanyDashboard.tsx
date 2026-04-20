import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { peraWallet } from '../wallet';
import algosdk from 'algosdk';

const CompanyDashboard = ({ token, account }) => {
  const [placements, setPlacements] = useState([]);
  const [talents, setTalents] = useState([]);
  const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' | 'talents'
  const [loading, setLoading] = useState(true);

  // Filters for talent pool
  const [filterCgpa, setFilterCgpa] = useState("");
  const [filterCourse, setFilterCourse] = useState("");

  useEffect(() => {
    fetchPlacements();
    fetchTalents();
    fetchSuspiciousCompanies();
  }, [token]);

  const [suspicious, setSuspicious] = useState([]);
  const fetchSuspiciousCompanies = async () => {
    try {
      const res = await fetch(`${API_URL}/api/companies/suspicious?min_flags=2`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setSuspicious(data.suspicious || []);
    } catch (e) { console.error('Failed to fetch suspicious companies', e); }
  };

  const fetchTalents = async () => {
    try {
      let url = 'http://localhost:8000/api/company/discover-talent';
      const params = [];
      if (filterCgpa) params.push(`min_cgpa=${filterCgpa}`);
      if (filterCourse) params.push(`course=${filterCourse}`);
      if (params.length) url += `?${params.join('&')}`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setTalents(data.talents);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPlacements = async () => {
    try {
      const res = await fetch(`${API_URL}/api/company/placements`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.placements) {
        setPlacements(data.placements);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const [verifying, setVerifying] = useState(null);
  const [verifyMsg, setVerifyMsg] = useState({});

  const handleConfirmStep = async (verificationCode, step, extraData = {}) => {
    setVerifying(verificationCode);
    try {
      let endpoint = '';
      let body = { verificationCode, ...extraData };
      
      if (step === 'joining') endpoint = '/api/placements/company-verify-joining';
      if (step === 'payroll') endpoint = '/api/placements/verify-salary';

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        setVerifyMsg(prev => ({ ...prev, [verificationCode]: '✅ Step verified!' }));
      } else {
        setVerifyMsg(prev => ({ ...prev, [verificationCode]: `❌ ${data.detail || 'Failed'}` }));
      }
      fetchPlacements();
    } catch (err) {
       console.error(err);
    } finally {
       setVerifying(null);
    }
  };

  const handleVerify = async (verificationCode) => {
    setVerifying(verificationCode);
    setVerifyMsg(prev => ({ ...prev, [verificationCode]: '' }));
    try {
      // New MVP flow: prefer off-chain wallet signature; otherwise record dashboard approval
      const ipfsCid = null; // backend will compute if missing

      // Canonical message must match backend format
      const canonicalMessage = `CollegeTruth|offchain_verify|${verificationCode}|${ipfsCid}`;

      // If account available, attempt to request a signature from Pera (best-effort)
      if (account && window && peraWallet) {
        try {
          // Some wallets support signMessage; try it, otherwise fall back to dashboard approval
          if (typeof peraWallet.signMessage === 'function') {
            const signed = await peraWallet.signMessage(canonicalMessage);
            // signed might be base64 or object; normalize
            let signatureB64 = '';
            if (typeof signed === 'string') signatureB64 = signed;
            else if (signed && signed.signature) signatureB64 = signed.signature;

            if (signatureB64) {
              const submitRes = await fetch(`${API_URL}/api/placements/company-sign-offchain`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ verificationCode, signature: signatureB64, signerAddress: account, message: canonicalMessage })
              });
              const submitData = await submitRes.json();
              if (submitData.success) {
                setVerifyMsg(prev => ({ ...prev, [verificationCode]: '✅ Employer signed (off-chain) and recorded.' }));
                fetchPlacements();
                return;
              }
            }
          }
        } catch (e) {
          console.warn('Wallet signing not available or failed, falling back to dashboard approval', e);
        }
      }

      // Fallback: record dashboard approval via authenticated request (no crypto signature)
      try {
        const res = await fetch(`${API_URL}/api/placements/company-sign-offchain`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ verificationCode, approvedViaDashboard: true })
        });
        const data = await res.json();
        if (data.success) {
          setVerifyMsg(prev => ({ ...prev, [verificationCode]: '✅ Employer approval recorded (dashboard).' }));
          fetchPlacements();
        } else {
          setVerifyMsg(prev => ({ ...prev, [verificationCode]: `❌ ${data.detail || 'Failed to record approval'}` }));
        }
      } catch (err) {
        console.error('Dashboard approval failed:', err);
        setVerifyMsg(prev => ({ ...prev, [verificationCode]: 'Network error while recording approval.' }));
      }

      fetchPlacements();
    } catch (err) {
      console.error('Verification error:', err);
      setVerifyMsg(prev => ({ ...prev, [verificationCode]: 'Network error. Is the backend running?' }));
    } finally {
      setVerifying(null);
    }
  };

  const handleOpenResume = (e, href) => {
    if (!href) {
      e.preventDefault();
      alert('Resume not available for this candidate.');
      return;
    }
    // If data URL, convert to Blob and open via object URL to avoid blank tabs
    if (href.startsWith('data:')) {
      e.preventDefault();
      try {
        const parts = href.split(',');
        const meta = parts[0];
        const b64 = parts[1] || '';
        const mimeMatch = meta.match(/data:([^;]+);/);
        const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
        const binary = atob(b64);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: mime });
        const url = URL.createObjectURL(blob);
        const w = window.open(url, '_blank');
        if (!w) {
          alert('Popup blocked. Please allow popups for this site to view the resume.');
          URL.revokeObjectURL(url);
          return;
        }
        setTimeout(() => URL.revokeObjectURL(url), 60 * 1000);
      } catch (err) {
        console.error('Failed to open data URL resume:', err);
        alert('Failed to open resume.');
      }
    }
  };

  return (
    <div className="container-custom py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-white mb-2">Employer Verification Audit</h1>
          <p className="text-slate-400">Reviewing and certifying student identity claims to ensure institutional integrity.</p>
        </div>
        <div className="px-6 py-4 bg-indigo-600 rounded-2xl shadow-2xl shadow-indigo-600/30">
           <p className="text-[10px] font-black uppercase text-indigo-200 tracking-[0.2em] mb-1">Corporate Trust Score</p>
           <p className="text-2xl font-black text-white">99.8% Certified</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
           <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-2">Incoming Claims</p>
           <p className="text-4xl font-black text-white">{placements.filter(p => p.status === 'pending_company_approval').length}</p>
        </div>
        <div className="bg-slate-900 border border-emerald-500/20 rounded-3xl p-6 relative overflow-hidden">
           <p className="text-emerald-500 font-bold uppercase tracking-widest text-[10px] mb-2">Verified Hire Ledger</p>
            <p className="text-4xl font-black text-emerald-400">{placements.filter(p => p.status !== 'pending_company_approval').length}</p>
            {suspicious.find(s => s.companyWallet === account) && (
             <p className="mt-2 text-[11px] font-black text-rose-400 uppercase">🚨 This company has recent dispute flags</p>
            )}
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
           <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-2">Cumulative Salary Audit</p>
           <p className="text-4xl font-black text-white">₹{placements.reduce((a, b) => a + (b.salary || 0), 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="flex gap-4 mb-8">
        <button onClick={() => setActiveTab('inbox')} className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'inbox' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500 hover:text-white'}`}>Verification Inbox</button>
        <button onClick={() => setActiveTab('talents')} className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'talents' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500 hover:text-white'}`}>Discover Talent Pool</button>
      </div>

      {activeTab === 'inbox' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white uppercase italic">Verification Inbox</h2>
              <div className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-500/10 alert-pulse">Action Required</div>
          </div>
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50 text-[10px] font-black tracking-[0.2em] text-slate-500 border-b border-slate-800 uppercase">
                <th className="px-8 py-5">Student / Identity</th>
                <th className="px-8 py-5">Academic Origin</th>
                <th className="px-8 py-5">Target Role</th>
                <th className="px-8 py-5">Offered Package</th>
                <th className="px-8 py-5">Audit Status</th>
                <th className="px-8 py-5 text-right whitespace-nowrap">Ledger Resolve</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr><td colSpan="6" className="p-20 text-center text-slate-500 font-bold uppercase text-xs tracking-widest">Auditing Incoming Claims...</td></tr>
              ) : placements.length === 0 ? (
                <tr><td colSpan="6" className="p-20 text-center text-slate-500 uppercase font-black text-xs tracking-widest opacity-30 italic">Truth ledger is currently empty</td></tr>
              ) : (
                placements.map(p => (
                  <tr key={p._id} className="hover:bg-slate-800/30 transition-all group">
                    <td className="px-8 py-6">
                      <div className="font-bold text-white group-hover:text-indigo-400 transition-colors uppercase text-sm tracking-tight">{p.studentName}</div>
                      <div className="text-[10px] font-mono text-slate-500 lowercase opacity-60 tracking-tighter">{p.studentEmail}</div>
                    </td>
                    <td className="px-8 py-6">
                       <span className="text-xs font-bold text-slate-300">{p.college}</span>
                    </td>
                    <td className="px-8 py-6">
                       <span className="text-xs font-bold text-white bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">{p.role}</span>
                    </td>
                    <td className="px-8 py-6">
                        {p.placementType === 'internship' && p.salary === 0 ? (
                          <span className="text-purple-400 font-bold text-sm">🎓 Unpaid Intern</span>
                        ) : p.placementType === 'internship' ? (
                          <span className="font-mono text-purple-400 font-bold text-sm tracking-tighter">₹{p.salary.toLocaleString()} Stipend</span>
                        ) : (
                          <span className="font-mono text-emerald-400 font-bold text-sm tracking-tighter">₹{p.salary.toLocaleString()}</span>
                        )}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      {p.status === 'pending_company_approval' ? (
                        <div className="flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                           <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Awaiting Initial Review</span>
                        </div>
                      ) : p.status === 'offer_verified' ? (
                        <div className="flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                           <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Offer Sealed</span>
                        </div>
                      ) : p.status === 'joining_pending' ? (
                        <div className="flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                           <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Joining Proof Uploaded</span>
                        </div>
                      ) : p.status === 'joining_verified' ? (
                        <div className="flex items-center gap-2 text-blue-500">
                           <span className="text-[10px] font-black uppercase tracking-widest">Onboarded</span>
                        </div>
                      ) : p.status === 'salary_pending' ? (
                        <div className="flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                           <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Payroll Proof Uploaded</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-emerald-500">
                           <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10">Fully Certified</span>
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      {p.status === 'pending_company_approval' || p.status === 'offer_signing_requested' ? (
                        <button 
                          onClick={() => handleVerify(p.verificationCode)}
                          disabled={verifying === p.verificationCode}
                          className="bg-white text-slate-900 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all shadow-xl active:scale-95 disabled:opacity-50"
                        >
                          {verifying === p.verificationCode ? 'Signing...' : 'Approve Offer'}
                        </button>
                      ) : p.status === 'joining_pending' ? (
                         <button 
                           onClick={() => handleConfirmStep(p.verificationCode, 'joining')}
                           disabled={verifying === p.verificationCode}
                           className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-500 transition-all"
                         >
                           Verify Onboarding
                         </button>
                      ) : p.status === 'salary_pending' ? (
                        <button 
                          onClick={() => {
                            const amt = prompt(`Confirm Salary amount for ${p.studentName}\nStudent reported: ₹${p.salary}`, p.salary);
                            if (amt) handleConfirmStep(p.verificationCode, 'payroll', { amount: parseFloat(amt), salaryTxHash: 'PAYROLL_SYSTEM_MATCH' });
                          }}
                          disabled={verifying === p.verificationCode}
                          className="bg-purple-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-purple-500 transition-all"
                        >
                          Verify Payroll
                        </button>
                      ) : p.status === 'salary_verified' ? (
                         <div className="text-emerald-500 flex items-center justify-end gap-2 text-[10px] font-bold uppercase tracking-widest">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                            On-Chain Certified
                         </div>
                      ) : (
                         <div className="text-slate-600 flex items-center justify-end gap-2 text-[10px] font-bold uppercase tracking-widest">
                            {p.status.split('_').join(' ')}
                         </div>
                      )}
                      {verifyMsg[p.verificationCode] && (
                        <p className="text-[10px] text-emerald-400 font-bold mt-1 text-right">{verifyMsg[p.verificationCode]}</p>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-wrap gap-4 mb-8 bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
             <div className="flex-1 min-w-[200px]">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Minimum CGPA</label>
                <input type="number" step="0.1" placeholder="Search by merit..." value={filterCgpa} onChange={e => setFilterCgpa(e.target.value)} onBlur={fetchTalents} className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white w-full outline-none focus:border-indigo-500" />
             </div>
             <div className="flex-1 min-w-[200px]">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Specialization / Course</label>
                <input type="text" placeholder="e.g. Computer Science" value={filterCourse} onChange={e => setFilterCourse(e.target.value)} onBlur={fetchTalents} className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white w-full outline-none focus:border-indigo-500" />
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {talents.map(t => (
               <div key={t._id} className="premium-card group hover:border-indigo-500/40 transition-all">
                   <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 flex items-center justify-center text-indigo-400 font-black text-xl italic">{t.name.charAt(0)}</div>
                      <div className="flex flex-col items-end gap-1">
                         <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-1 rounded text-[9px] font-black uppercase">College Verified 🛡️</span>
                         <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500 rounded-lg">
                            <span className="text-[8px] font-black text-indigo-100 uppercase tracking-tighter">Trust</span>
                            <span className="text-[10px] font-black text-white">{t.trustScore || 0}%</span>
                         </div>
                      </div>
                   </div>
                  <h4 className="text-lg font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors uppercase">{t.name}</h4>
                  <p className="text-xs text-slate-400 font-bold mb-4">{t.details?.college}</p>
                  
                  <div className="grid grid-cols-2 gap-3 mb-6">
                     <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Merit Score</p>
                        <p className="text-sm font-black text-white">{t.details?.cgpa || "N/A"} CGPA</p>
                     </div>
                     <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Stream</p>
                        <p className="text-sm font-black text-white truncate">{t.details?.branch || t.details?.course || "General"}</p>
                     </div>
                  </div>

                  <div className="flex flex-col gap-2">
                     {(() => {
                        const raw = t.details?.resumeUrl || '';
                        const normalize = (u) => {
                          if (!u) return null;
                          const s = String(u).trim();
                          if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:') || s.startsWith('ipfs://')) return s;
                          // If it's an IPFS CID (Qm...), convert to gateway URL
                          if (/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(s) || s.length >= 46 && s.includes('Qm')) return `https://ipfs.io/ipfs/${s}`;
                          // If it's a bare path (starts with /) treat as relative
                          if (s.startsWith('/')) return s;
                          return null;
                        };
                        const href = normalize(raw);
                        console.log('resume normalize:', { raw, href });
                        if (href) {
                          return (
                            <a href={href || '#'} target="_blank" rel="noopener noreferrer" onClick={(e) => handleOpenResume(e, href)} className="bg-white text-slate-900 text-center py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-slate-200">View Resume 📄</a>
                          );
                        }
                        return (
                          <div className="text-center py-2.5 text-slate-500 text-[10px] font-bold uppercase italic bg-slate-950 rounded-xl border border-slate-800/50">Resume Not Linked</div>
                        );
                    })()}
                     <button onClick={() => alert('Initiate Hiring — TODO: implement workflow')} className="bg-indigo-600/20 text-indigo-400 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">Initiate Hiring</button>
                  </div>
               </div>
             ))}
             {talents.length === 0 && (
                <div className="col-span-full py-20 text-center text-slate-500 uppercase font-black tracking-widest text-xs opacity-40 italic">No candidates matching these filters.</div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyDashboard;

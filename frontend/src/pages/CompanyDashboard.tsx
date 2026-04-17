import React, { useState, useEffect } from 'react';
import { peraWallet } from '../wallet';
import algosdk from 'algosdk';

const CompanyDashboard = ({ token, account }) => {
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlacements();
  }, []);

  const fetchPlacements = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/company/placements', {
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

  const handleVerify = async (verificationCode) => {
    setVerifying(verificationCode);
    setVerifyMsg(prev => ({ ...prev, [verificationCode]: '' }));
    try {
      // Step 1: Tell backend to approve & get unsigned Algorand txn
      const res = await fetch('http://localhost:8000/api/placements/company-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ verificationCode })
      });
      const data = await res.json();
      
      if (!data.success) {
        setVerifyMsg(prev => ({ ...prev, [verificationCode]: data.detail || 'Verification failed.' }));
        return;
      }

      // Step 2: Sign with Pera Wallet (if txn was prepared)
      if (data.unsignedTxn && account) {
        try {
          const txnBytes = new Uint8Array(Buffer.from(data.unsignedTxn, 'base64'));
          const decodedTxn = algosdk.decodeUnsignedTransaction(txnBytes);
          const txnGroup = [{ txn: decodedTxn, signers: [account.toUpperCase()] }];
          
          // Pera Wallet signs — user sees popup
          const signedTxns = await peraWallet.signTransaction([txnGroup]);
          
          // Step 3: Submit signed txn to Algorand & get TX Hash
          const submitRes = await fetch('http://localhost:8000/api/placements/submit-signed-txn', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              verificationCode,
              signedTxn: Buffer.from(signedTxns[0]).toString('base64')
            })
          });
          const submitData = await submitRes.json();
          if (submitData.txHash) {
            setVerifyMsg(prev => ({ 
              ...prev, 
              [verificationCode]: `✅ Anchored on Algorand! TX: ${submitData.txHash.slice(0, 12)}... | View: ${submitData.explorerUrl}`
            }));
          }
        } catch (sigErr) {
          console.warn('Pera signing cancelled or failed:', sigErr);
          setVerifyMsg(prev => ({ ...prev, [verificationCode]: '✅ Approved (wallet signing skipped)' }));
        }
      } else {
        setVerifyMsg(prev => ({ ...prev, [verificationCode]: '✅ Claim approved successfully!' }));
      }

      fetchPlacements();
    } catch (err) {
      console.error('Verification error:', err);
      setVerifyMsg(prev => ({ ...prev, [verificationCode]: 'Network error. Is the backend running?' }));
    } finally {
      setVerifying(null);
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
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
           <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-2">Cumulative Salary Audit</p>
           <p className="text-4xl font-black text-white">₹{placements.reduce((a, b) => a + (b.salary || 0), 0).toLocaleString()}</p>
        </div>
      </div>

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
                       <span className="font-mono text-emerald-400 font-bold text-sm tracking-tighter">₹{p.salary.toLocaleString()}</span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      {p.status === 'pending_company_approval' ? (
                        <div className="flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                           <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Pending Review</span>
                        </div>
                      ) : p.status === 'offer_verified' ? (
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/5 px-2 py-1 rounded border border-indigo-500/10">Offer Sealed</span>
                      ) : p.status === 'joining_verified' ? (
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/5 px-2 py-1 rounded border border-blue-500/10">Joined Work</span>
                      ) : (
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10">Fully Certified</span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      {p.status === 'pending_company_approval' ? (
                        <button 
                          onClick={() => handleVerify(p.verificationCode)}
                          disabled={verifying === p.verificationCode}
                          className="bg-white text-slate-900 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-wait"
                        >
                          {verifying === p.verificationCode ? 'Signing...' : 'Approve Claim'}
                        </button>
                      ) : (
                         <div className="text-slate-600 flex items-center justify-end gap-2 text-[10px] font-bold uppercase tracking-widest">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            Signed
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
    </div>
  );
};

export default CompanyDashboard;

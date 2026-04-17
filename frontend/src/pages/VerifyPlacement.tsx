import React, { useState } from 'react';
import TalentPassport from '../components/TalentPassport';

const VerifyPlacement = () => {
  const [activeTab, setActiveTab] = useState('verify');
  // ... (rest of states)
  const [lookupCode, setLookupCode] = useState('');
  const [verifyEmail, setVerifyEmail] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = 'http://localhost:8000';

  const handleLookup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/api/placements/lookup/${lookupCode}`);
      const data = await response.json();
      if (data.success) {
        setResult(data.placement);
      } else {
        setError(data.error || 'Placement not found');
      }
    } catch (err) {
      setError('Network error. Profile not found.');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentConfirm = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const resp = await fetch(`${API_URL}/api/placements/student-confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationCode: lookupCode, studentEmail: verifyEmail })
      });
      const data = await resp.json();
      if (data.success) {
        setResult({ ...data.placement, isConfirmation: true, message: data.message });
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-custom py-20 flex flex-col items-center">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-black mb-4 tracking-tight">Credential <span className="gradient-text italic">Audit Hub.</span></h1>
        <p className="text-slate-400 max-w-xl mx-auto italic leading-relaxed">
          The non-repudiable audit portal for the Algorand employment ledger. Verify individual career milestones or professional certificates instantly.
        </p>
      </div>

      <div className="w-full max-w-2xl">
        {/* Tabs and Form (omitted for brevity in replacement, but I will keep them) */}
        <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 mb-8">
           <button 
            onClick={() => { setActiveTab('verify'); setError(null); setResult(null); }}
            className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all ${activeTab === 'verify' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}
           >
            Public Lookup
           </button>
           <button 
            onClick={() => { setActiveTab('student'); setError(null); setResult(null); }}
            className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all ${activeTab === 'student' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}
           >
            Student: Confirm Joining
           </button>
        </div>

        <div className="premium-card">
          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-6 font-bold text-sm text-center">{error}</div>}

          {activeTab === 'verify' ? (
            <form onSubmit={handleLookup} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Verification Code</label>
                <input 
                  type="text" 
                  value={lookupCode}
                  onChange={(e) => setLookupCode(e.target.value)}
                  className="input-field text-center font-mono text-xl tracking-widest uppercase"
                  placeholder="EX: 0XAF3B..." 
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-4 uppercase tracking-widest text-sm">
                Query Ledger
              </button>
            </form>
          ) : (
            <form onSubmit={handleStudentConfirm} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Secret Code from Employer</label>
                <input 
                  type="text" 
                  value={lookupCode}
                  onChange={(e) => setLookupCode(e.target.value)}
                  className="input-field font-mono"
                  placeholder="Paste your 18-digit code" 
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Registered Email</label>
                <input 
                  type="email" 
                  value={verifyEmail}
                  onChange={(e) => setVerifyEmail(e.target.value)}
                  className="input-field"
                  placeholder="yourname@gmail.com" 
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-4 uppercase tracking-widest text-sm">
                Signed Check-In
              </button>
            </form>
          )}

          {result && (
            <div className={`mt-12 pt-8 border-t border-white/5 animate-in fade-in slide-in-from-bottom-4 ${result.status === 'salary_verified' ? 'flex justify-center' : ''}`}>
               {result.isConfirmation ? (
                 <div className="text-center">
                    <div className="bg-emerald-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                       <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2 uppercase italic">{result.studentName}</h3>
                    <p className="text-emerald-400 font-bold mb-6 italic tracking-tight">{result.message}</p>
                 </div>
               ) : result.status === 'salary_verified' ? (
                 <TalentPassport placement={result} />
               ) : (
                 <div>
                     <div>
                        <div className="flex flex-col mb-6 bg-indigo-600/10 border border-indigo-500/20 p-4 rounded-2xl relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-2 opacity-10">
                              <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path></svg>
                           </div>
                           <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                              On-Chain Authenticity Proof
                           </p>
                           <p className="text-[10px] text-slate-400 mb-1">Digitally Signed By (Employer Wallet):</p>
                           <p className="text-xs font-mono text-white break-all">{result.companyWallet}</p>
                        </div>
                        <div className="flex justify-between items-start mb-6">
                           <div>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Employee Identity</p>
                              <h3 className="text-3xl font-black text-white">{result.studentName}</h3>
                              <p className="text-indigo-400 font-bold text-sm tracking-tight">{result.role} @ {result.companyName}</p>
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Verify Tier</p>
                              <span className="badge-verified">Tier 3 Verified</span>
                           </div>
                        </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-8">
                       <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Affiliation</p>
                          <p className="text-sm font-bold text-white truncate">{result.college}</p>
                       </div>
                       <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Salary Package</p>
                          <p className="text-sm font-bold text-white">₹{parseInt(result.salary).toLocaleString()}</p>
                       </div>
                    </div>
                 </div>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyPlacement;

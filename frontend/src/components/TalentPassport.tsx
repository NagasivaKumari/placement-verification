import React from 'react';

const TalentPassport = ({ placement }) => {
  if (!placement || !placement.passportMinted) return null;

  return (
    <div className="relative group perspective-1000">
      <div className="talent-passport-card glass-card !p-0 overflow-hidden border-indigo-500/30 group-hover:border-indigo-500/60 transition-all duration-500 shadow-2xl shadow-indigo-500/10">
        {/* Header Aesthetic */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-24 relative">
          <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
            <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] font-black text-white uppercase tracking-widest">SBT Verified</span>
            </div>
            <div className="bg-amber-400/20 backdrop-blur-md px-3 py-1 rounded-full border border-amber-400/30 flex items-center gap-2 shadow-lg shadow-amber-400/10">
              <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              <span className="text-[9px] font-black text-amber-100 uppercase tracking-widest leading-none">Bank API Verified</span>
            </div>
          </div>
          <div className="absolute -bottom-10 left-8">
            <div className="w-20 h-20 rounded-2xl bg-slate-900 border-4 border-indigo-500/30 flex items-center justify-center overflow-hidden shadow-xl">
               <div className="text-3xl">🛡️</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-14 pb-8 px-8">
          <div className="mb-6">
            <h3 className="text-3xl font-black tracking-tight text-white mb-1 uppercase italic leading-none">{placement.studentName}</h3>
            <p className="text-indigo-400 font-bold text-sm tracking-widest uppercase">Certified Professional</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 group-hover:bg-indigo-500/5 transition-colors">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Occupation</p>
              <p className="font-bold text-slate-200 truncate">{placement.role} @ {placement.companyName || 'Verified Partner'}</p>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 group-hover:bg-emerald-500/5 transition-colors">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Payroll Proof</p>
              <p className="font-bold text-emerald-400">₹{parseInt(placement.salary).toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-4 border-t border-white/5 pt-6">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">College Affiliate</span>
              <span className="text-xs font-bold text-white">{placement.college}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Token ID (SBT)</span>
              <span className="text-xs font-mono text-indigo-400">#TP-{placement.tokenId || '00231'}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Issuance Date</span>
                <span className="text-xs text-slate-400">{new Date(placement.salaryVerifiedAt || placement.createdAt).toDateString()}</span>
            </div>
          </div>

          {/* Footer Ribbon */}
          <div className="mt-8 bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04a11.952 11.952 0 00-1.02 7.492c.859 3.397 3.13 6.374 6.218 8.183l.784.457.784-.457c3.088-1.809 5.359-4.786 6.218-8.183a11.952 11.952 0 00-1.02-7.492z" /></svg>
             </div>
             <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-tighter leading-tight">
                This credential is Soulbound to wallet {placement.studentWallet?.slice(0, 8)}... and is immutable on the Algorand Blockchain.
             </p>
          </div>
        </div>
      </div>
      
      {/* Visual Glare Effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none group-hover:translate-x-full transition-transform duration-1000"></div>
    </div>
  );
};

export default TalentPassport;

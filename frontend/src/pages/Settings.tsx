import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

const Settings = ({ token, account, userRole }) => {
  const [profile, setProfile] = useState({ name: "", email: "", details: {}, trustScore: 0, identityTx: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("profile");
  const avatarInputRef = React.useRef(null);
  const resumeInputRef = React.useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
        navigate('/'); return;
    }
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/api/user/profile`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        if (data.walletAddress) {
          setProfile({ 
            name: data.name || "", 
            email: data.email || "", 
            details: data.details || {},
            trustScore: data.trustScore || 0,
            identityTx: data.identityTx || ""
          });
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchProfile();
  }, [token]);

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (type === 'avatar') {
        const reader = new FileReader();
        reader.onloadend = () => {
          handleDetail('avatar', reader.result);
          setMessage("Avatar updated. Don't forget to click 'Seal Changes'.");
        };
        reader.readAsDataURL(file);
      } else if (type === 'resume') {
        // Fallback for resume filename
        handleDetail('resumeUrl', file.name);
        setMessage(`"${file.name}" ready for synchronization.`);
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`${API_URL}/api/user/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(profile)
      });
      const data = await res.json();
      if (data.success) {
        setMessage("Configuration successfully verified and saved.");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (e) {
      setMessage("Update failed. Please check connection.");
    } finally {
      setSaving(false);
    }
  };

  const handleDetail = (key, value) => {
    setProfile(p => ({ ...p, details: { ...p.details, [key]: value } }));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400 font-semibold tracking-widest uppercase">Fetching Identity...</div>;

  return (
    <div className="container-custom py-16 max-w-6xl">
      <div className="mb-12 border-b border-white/5 pb-8 flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Platform Settings</h1>
          <p className="text-slate-400 font-medium tracking-tight">Manage your {userRole || 'verified'} profile attributes securely on the trust ledger.</p>
        </div>
        <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
           <div className="text-right">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Global Trust Score</p>
              <p className="text-2xl font-black text-indigo-400">{profile.trustScore}%</p>
           </div>
           <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04a11.952 11.952 0 00-1.02 7.492c.859 3.397 3.13 6.374 6.218 8.183l.784.457.784-.457c3.088-1.809 5.359-4.786 6.218-8.183a11.952 11.952 0 00-1.02-7.492z"></path></svg>
           </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-10">
        
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-1.5">
           <button 
             onClick={() => setActiveTab('profile')}
             className={`text-left px-5 py-3.5 rounded-xl font-bold uppercase text-[11px] tracking-widest transition-all ${activeTab === 'profile' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-200'}`}
           >
             General Profile
           </button>
           {userRole === 'student' && (
             <button 
               onClick={() => setActiveTab('audit')}
               className={`text-left px-5 py-3.5 rounded-xl font-bold uppercase text-[11px] tracking-widest transition-all ${activeTab === 'audit' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-200'}`}
             >
               Trust Score Audit
             </button>
           )}
           <button 
             onClick={() => setActiveTab('security')}
             className={`text-left px-5 py-3.5 rounded-xl font-bold uppercase text-[11px] tracking-widest transition-all ${activeTab === 'security' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-200'}`}
           >
             Wallet & Security
           </button>
        </div>

        {/* Form Container */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-10 shadow-2xl overflow-hidden relative">
                  <div className="flex flex-col md:flex-row items-center gap-10 mb-10">
                    <div className="relative group shrink-0">
                       <div className="w-32 h-32 rounded-3xl bg-slate-950 border-2 border-slate-800 flex items-center justify-center overflow-hidden shadow-2xl transition-all group-hover:border-indigo-500">
                          {profile.details.avatar ? (
                            <img src={profile.details.avatar} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-4xl text-slate-700 font-black italic">{profile.name?.charAt(0) || 'U'}</div>
                          )}
                       </div>
                       <input 
                         type="file" ref={avatarInputRef} className="hidden" accept="image/*"
                         onChange={(e) => handleFileUpload(e, 'avatar')}
                       />
                       <button 
                         onClick={() => avatarInputRef.current.click()}
                         className="absolute -bottom-3 -right-3 w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl hover:scale-110 transition-all border-4 border-slate-900"
                       >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path></svg>
                       </button>
                    </div>
                     <div className="flex-1 w-full space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                           <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Legal Display Name</label>
                              <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 w-full text-white font-bold focus:border-indigo-500 transition-all outline-none" />
                           </div>
                           <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Official email</label>
                              <input type="email" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} className="bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 w-full text-white font-bold focus:border-indigo-500 transition-all outline-none" />
                           </div>
                        </div>
                        <p className="text-[10px] text-slate-500 italic mt-2">
                          <span className="text-indigo-400 font-black">Note:</span> Click the camera icon on the left to update your profile avatar. Use a permanent link (like Imgur) for cross-device persistence.
                        </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8 py-8 border-y border-slate-800/50">
                     <div className="space-y-4">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest border-l-4 border-indigo-600 pl-4">{userRole === 'student' ? 'Academic Truths' : 'Professional Details'}</h3>
                        {userRole === 'student' && (
                          <div className="space-y-4">
                             <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Current College</label>
                                <input type="text" value={profile.details.college || ''} onChange={e => handleDetail('college', e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 w-full text-white text-sm outline-none focus:border-indigo-500" />
                             </div>
                             <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Resume / Talent Profile</label>
                                 <div className="bg-slate-950 border border-slate-800 rounded-xl p-1 flex items-center gap-2">
                                   <input 
                                     type="text" readOnly placeholder="Upload PDF/Doc or IPFS link..." 
                                     value={profile.details.resumeUrl || ''} 
                                     className="flex-1 bg-transparent border-none px-4 py-1.5 text-white text-sm outline-none" 
                                   />
                                   <input type="file" ref={resumeInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'resume')} />
                                   
                                   {profile.details.resumeUrl && (
                                     <button 
                                       onClick={() => {
                                         const url = profile.details.resumeUrl;
                                         if (url.startsWith('http')) {
                                           window.open(url, '_blank');
                                         } else if (url.startsWith('Qm') || url.startsWith('ba')) {
                                           window.open(`https://ipfs.io/ipfs/${url}`, '_blank');
                                         } else {
                                           alert(`" ${url} " is a local record. In a production environment, this file would be anchored to IPFS to provide a permanent CID.`);
                                         }
                                       }}
                                       className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                                     >
                                       View
                                     </button>
                                   )}
                                   
                                   <button 
                                     onClick={() => resumeInputRef.current.click()}
                                     className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap"
                                   >
                                     {profile.details.resumeUrl ? 'Update' : 'Upload'}
                                   </button>
                                </div>
                                <p className="text-[9px] text-slate-500 mt-2 italic px-1">Supports PDF, Word, or IPFS CID. Linked to your Soulbound Portrait.</p>
                             </div>
                          </div>
                        )}
                        {userRole === 'company' && (
                          <div>
                             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Primary Industry</label>
                             <input type="text" value={profile.details.industry || ''} onChange={e => handleDetail('industry', e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 w-full text-white text-sm" />
                          </div>
                        )}
                     </div>
                     <div className="space-y-4">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest border-l-4 border-indigo-600 pl-4">Social Media Identifiers</h3>
                        <div className="grid grid-cols-1 gap-3">
                           <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">in/</span>
                              <input type="text" placeholder="LinkedIn handle" value={profile.details.linkedin || ''} onChange={e => handleDetail('linkedin', e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 w-full text-white text-sm focus:border-indigo-500 outline-none" />
                           </div>
                           <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">@</span>
                              <input type="text" placeholder="Twitter (X)" value={profile.details.twitter || ''} onChange={e => handleDetail('twitter', e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 w-full text-white text-sm focus:border-indigo-500 outline-none" />
                           </div>
                           <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">gh/</span>
                              <input type="text" placeholder="GitHub" value={profile.details.github || ''} onChange={e => handleDetail('github', e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 w-full text-white text-sm focus:border-indigo-500 outline-none" />
                           </div>
                        </div>
                     </div>
                  </div>

                  {userRole === 'student' && !profile.details.collegeVerified && (
                     <div className="mt-8 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 flex items-center gap-4">
                        <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center shrink-0">
                           <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        </div>
                        <p className="text-xs text-amber-500 font-bold leading-relaxed">
                          <span className="block uppercase text-[10px] tracking-widest mb-1">Institutional Verification Pending</span>
                          Your profile is awaiting approval from your college placement cell. You will be able to submit placement claims once verified.
                        </p>
                     </div>
                  )}

                  <div className="mt-10 flex items-center justify-between">
                    <div>
                        {message && <div className="text-emerald-400 font-bold bg-emerald-500/10 px-6 py-2.5 rounded-2xl text-[10px] uppercase tracking-widest border border-emerald-500/20">{message}</div>}
                    </div>
                    <button 
                       onClick={handleSave} disabled={saving}
                       className="bg-indigo-600 text-white hover:bg-indigo-500 px-10 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50"
                    >
                       {saving ? 'Syncing...' : 'Seal Changes'}
                    </button>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'audit' && userRole === 'student' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-slate-900 border border-slate-800 rounded-3xl p-10">
               <div className="flex justify-between items-start mb-10">
                  <div>
                     <h2 className="text-2xl font-black text-white mb-2 italic">Trust Audit Breakdown</h2>
                     <p className="text-slate-400 text-sm">How your on-chain reputation is calculated by the protocol.</p>
                  </div>
                  <div className="text-right">
                     <p className="text-5xl font-black text-indigo-400">{profile.trustScore}%</p>
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Active Score</p>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className={`p-5 rounded-2xl border transition-all ${profile.details.collegeVerified ? 'bg-indigo-500/5 border-indigo-500/30' : 'bg-slate-950 border-slate-800'}`}>
                     <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${profile.details.collegeVerified ? 'bg-indigo-500 text-white shadow-lg' : 'bg-slate-800 text-slate-500'}`}>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-7h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                           </div>
                           <div>
                              <p className="text-sm font-black text-white uppercase tracking-tighter">College Identity Verification</p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{profile.details.collegeVerified ? 'Completed' : 'Pending Action'}</p>
                           </div>
                        </div>
                        <span className={`font-black ${profile.details.collegeVerified ? 'text-indigo-400' : 'text-slate-600'}`}>+40%</span>
                     </div>
                  </div>

                  <div className={`p-5 rounded-2xl border transition-all ${profile.details.degreeVerified ? 'bg-indigo-500/5 border-indigo-500/30' : 'bg-slate-950 border-slate-800'}`}>
                     <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${profile.details.degreeVerified ? 'bg-indigo-500 text-white shadow-lg' : 'bg-slate-800 text-slate-500'}`}>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"></path></svg>
                           </div>
                           <div>
                              <p className="text-sm font-black text-white uppercase tracking-tighter">On-Chain Degree Certification</p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{profile.details.degreeVerified ? 'Minted' : 'Pending Graduation'}</p>
                           </div>
                        </div>
                        <span className={`font-black ${profile.details.degreeVerified ? 'text-indigo-400' : 'text-slate-600'}`}>+20%</span>
                     </div>
                  </div>

                  <div className="p-5 rounded-2xl border bg-slate-950 border-slate-800">
                     <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-500 flex items-center justify-center">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                           </div>
                           <div>
                              <p className="text-sm font-black text-white uppercase tracking-tighter">Professional Milestone Anchors</p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">Cumulative boost from offer, joining, and payroll verifications.</p>
                           </div>
                        </div>
                        <span className="font-black text-slate-600">+40% Max</span>
                     </div>
                  </div>
               </div>

               <div className="mt-10 p-6 bg-indigo-600/10 rounded-3xl border border-indigo-500/20">
                  <h4 className="text-indigo-400 font-black uppercase text-[10px] tracking-widest mb-3">Auditor Notes</h4>
                  <p className="text-xs text-slate-400 leading-relaxed italic">
                    The trust score is a mathematical representation of your cryptographic reliability. High-score profiles (80%+) are prioritized in the Talent Discovery portal. To increase your score, ensure your college verifies your identity and submit real placement documents.
                  </p>
               </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-10 shadow-2xl">
               <h2 className="text-xl font-bold text-white mb-6">Cryptographic Security</h2>
               <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 mb-8">
                  <div className="flex items-center gap-4 mb-4">
                     <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04a11.952 11.952 0 00-1.02 7.492c.859 3.397 3.13 6.374 6.218 8.183l.784.457.784-.457c3.088-1.809 5.359-4.786 6.218-8.183a11.952 11.952 0 00-1.02-7.492z"></path></svg>
                     </div>
                     <div>
                        <h3 className="text-emerald-500 font-bold tracking-widest uppercase text-sm mb-1">Active Pera Wallet Connection</h3>
                        <p className="text-[14px] text-white font-mono break-all line-clamp-1">{account}</p>
                     </div>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">Your actions on this platform are irreversibly signed by this Algorand wallet address. The platform does not store your private keys—only your public public address is used for identity anchoring.</p>
               </div>

               <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Account Persistence</h4>
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                     <div className="overflow-hidden w-full">
                        <p className="text-sm font-bold text-white mb-1">Blockchain Registration Identifier</p>
                        <p className="text-[10px] text-indigo-400 font-mono italic break-all leading-relaxed">
                          {profile.identityTx || "#ANCHORING_SEQUENCE_INITIALIZING..."}
                        </p>
                     </div>
                     <span className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-500/20 shrink-0">Immutable</span>
                  </div>
                  <p className="text-[9px] text-slate-500 italic mt-2">
                    * The Registration Identifier is the Algorand Transaction ID that anchored your initial identity. Every subsequent change (like uploading a new resume) requires a micro-transaction of ~0.001 ALGO to update the on-chain state.
                  </p>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
;

export default Settings;

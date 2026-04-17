import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Settings = ({ token, account, userRole }) => {
  const [profile, setProfile] = useState({ name: "", email: "", details: {} });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("profile");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
        navigate('/'); return;
    }
    const fetchProfile = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/user/profile', { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        if (data.walletAddress) {
          setProfile({ name: data.name || "", email: data.email || "", details: data.details || {} });
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchProfile();
  }, [token]);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch('http://localhost:8000/api/user/profile', {
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
    <div className="container-custom py-16 max-w-5xl">
      <div className="mb-12 border-b border-white/5 pb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Platform Settings</h1>
        <p className="text-slate-400">Manage your {userRole || 'verified'} profile attributes securely.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-10">
        
        {/* Sleek Minimal Navigation Sidebar */}
        <div className="w-full md:w-56 shrink-0 flex flex-col gap-2">
           <button 
             onClick={() => setActiveTab('profile')}
             className={`text-left px-5 py-3.5 rounded-xl font-semibold transition-all ${activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
           >
             General Profile
           </button>
           <button 
             onClick={() => setActiveTab('security')}
             className={`text-left px-5 py-3.5 rounded-xl font-semibold transition-all ${activeTab === 'security' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
           >
             Wallet & Security
           </button>
        </div>

        {/* Form Container */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-10 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-6">Identity Verification Attributes</h2>
              
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Legal Display Name</label>
                    <input 
                      type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white focus:border-indigo-500 focus:ring-1 outline-none transition-all"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Official Email Address</label>
                    <input 
                      type="email" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white focus:border-indigo-500 focus:ring-1 outline-none transition-all"
                    />
                 </div>
              </div>

              {/* Dynamic Role Mapping */}
              <div className="border-t border-slate-800/80 pt-8 mt-4 grid md:grid-cols-2 gap-6">
                 {userRole === 'student' && (
                   <>
                     <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Affiliated College / University</label>
                        <input type="text" value={profile.details.college || ''} onChange={e => handleDetail('college', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white" />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Enrollment ID</label>
                        <input type="text" value={profile.details.enrollmentId || ''} onChange={e => handleDetail('enrollmentId', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white" />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Academic Course</label>
                        <input type="text" value={profile.details.course || ''} onChange={e => handleDetail('course', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white" />
                     </div>
                   </>
                 )}

                 {userRole === 'company' && (
                   <>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Primary Industry</label>
                        <input type="text" value={profile.details.industry || ''} onChange={e => handleDetail('industry', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white" />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Corporate Website</label>
                        <input type="url" value={profile.details.website || ''} onChange={e => handleDetail('website', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white" />
                     </div>
                   </>
                 )}

                 {userRole === 'college' && (
                   <>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Accreditation ID</label>
                        <input type="text" value={profile.details.collegeId || ''} onChange={e => handleDetail('collegeId', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white" />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Headquarters</label>
                        <input type="text" value={profile.details.cityState || ''} onChange={e => handleDetail('cityState', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white" />
                     </div>
                   </>
                 )}
              </div>

              <div className="mt-10 pt-8 border-t border-slate-800 flex items-center justify-between">
                <div>
                   {message && <div className="text-emerald-400 font-bold bg-emerald-400/10 px-4 py-2 rounded-lg text-sm">{message}</div>}
                </div>
                <button 
                  onClick={handleSave} disabled={saving}
                  className="bg-white text-slate-900 hover:bg-slate-200 px-8 py-3.5 rounded-xl font-black transition-all disabled:opacity-50"
                >
                  {saving ? 'Syncing Ledger...' : 'Update Records'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-10 shadow-2xl">
               <h2 className="text-xl font-bold text-white mb-6">Cryptographic Security</h2>
               <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6">
                  <div className="flex items-center gap-4 mb-4">
                     <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04a11.952 11.952 0 00-1.02 7.492c.859 3.397 3.13 6.374 6.218 8.183l.784.457.784-.457c3.088-1.809 5.359-4.786 6.218-8.183a11.952 11.952 0 00-1.02-7.492z"></path></svg>
                     </div>
                     <div>
                        <h3 className="text-emerald-500 font-bold tracking-widest uppercase text-sm mb-1">Active Pera Wallet Connection</h3>
                        <p className="text-white font-mono">{account}</p>
                     </div>
                  </div>
                  <p className="text-slate-400 text-sm">Your actions on this platform are irreversibly signed by this Algorand wallet address. Do not lose access to your mnemonic phrase.</p>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Settings;

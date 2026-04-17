import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = ({ account, token, userRole, connectWallet, onLogout }) => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/5 py-4">
      <div className="container-custom">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="bg-indigo-600 rounded-xl p-2 group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-indigo-600/20">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04a11.952 11.952 0 00-1.02 7.492c.859 3.397 3.13 6.374 6.218 8.183l.784.457.784-.457c3.088-1.809 5.359-4.786 6.218-8.183a11.952 11.952 0 00-1.02-7.492z" />
              </svg>
            </div>
            <div>
              <span className="text-2xl font-black gradient-text tracking-tighter block leading-tight">CollegeTruth</span>
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.2em] block underline decoration-indigo-500/30 underline-offset-4">Transparent Placement Network</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            {!userRole ? (
              <>
                <Link to="/" className={`nav-link ${isActive('/') ? 'nav-link-active' : ''}`}>Vision</Link>
                <Link to="/leaderboard" className={`nav-link ${isActive('/leaderboard') ? 'nav-link-active' : ''}`}>Institutional Ranks</Link>
                <Link to="/verify" className={`nav-link ${isActive('/verify') ? 'nav-link-active' : ''}`}>Credential Audit</Link>
              </>
            ) : (
              <>
                <Link to={`/${userRole}/dashboard`} className={`nav-link ${isActive(`/${userRole}/dashboard`) ? 'nav-link-active' : ''}`}>
                  {userRole.charAt(0).toUpperCase() + userRole.slice(1)} Dashboard
                </Link>
                <Link to="/leaderboard" className={`nav-link ${isActive('/leaderboard') ? 'nav-link-active' : ''}`}>Institutional Audit</Link>
                <Link to="/verify" className={`nav-link ${isActive('/verify') ? 'nav-link-active' : ''}`}>Verify Individual</Link>
              </>
            )}
          </nav>

          <div className="flex items-center gap-4">
            {account ? (
              <div className="relative group">
                <button className="flex items-center gap-2.5 bg-[#1e293b] hover:bg-slate-800 border border-white/10 px-4 py-2 rounded-2xl transition-all duration-300 shadow-xl group/btn">
                  <div className="w-8 h-8 flex-shrink-0 bg-[#ffeb3b] rounded-lg flex items-center justify-center shadow-lg shadow-yellow-500/20">
                    <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="currentColor">
                       <circle cx="12" cy="12" r="3" />
                       <path d="M12 2v4m0 12v4M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="text-left leading-none uppercase">
                    <p className="text-[14px] text-white font-mono font-black tracking-tight">{account.slice(0, 4)}...{account.slice(-4)}</p>
                  </div>
                  <svg className="w-4 h-4 text-slate-500 ml-1 group-hover/btn:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-3 w-72 bg-[#1e293b] border border-white/10 rounded-2xl shadow-2xl opacity-0 translate-y-2 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible transition-all duration-300 z-50 p-5">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                       <span className="text-[13px] text-white font-mono font-bold">{account.slice(0, 8)}...{account.slice(-4)}</span>
                       <button 
                          onClick={() => {
                            navigator.clipboard.writeText(account);
                            alert('Address copied!');
                          }}
                          className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                       >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 012-2v-8a2 2 0 01-2-2h-8a2 2 0 01-2 2v8a2 2 0 012 2z"></path></svg>
                       </button>
                    </div>
                    <a 
                      href={`https://testnet.explorer.perawallet.app/address/${account}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[13px] text-emerald-400 font-bold underline hover:text-emerald-300 pt-1"
                    >
                      View
                    </a>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {userRole && (
                        <Link to={`/${userRole}/settings`} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 text-slate-300 transition-colors group/link">
                            <svg className="w-5 h-5 text-slate-500 group-hover/link:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            <span className="text-xs font-bold uppercase tracking-widest">Settings</span>
                        </Link>
                    )}
                    <button 
                      onClick={onLogout}
                      className="flex items-center gap-4 px-3 py-3 rounded-xl border border-white/5 bg-white/5 hover:bg-red-500/10 text-slate-300 hover:text-red-400 transition-all group/logout"
                    >
                      <svg className="w-5 h-5 text-slate-400 group-hover/logout:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      <span className="text-xs font-bold uppercase tracking-widest">Disconnect</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button 
                onClick={connectWallet}
                className="btn-primary flex items-center gap-2 px-6 py-2.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                <span className="text-sm font-black uppercase tracking-widest">Connect Wallet</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default Header;

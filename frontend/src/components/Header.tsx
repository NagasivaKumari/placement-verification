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
                <button className="flex items-center gap-2.5 bg-slate-800/50 hover:bg-slate-800 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-2xl transition-all duration-300 shadow-xl group/btn">
                  <div className="bg-indigo-500/20 p-1.5 rounded-lg border border-indigo-500/20 group-hover/btn:bg-indigo-500/30 transition-colors">
                    <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                  </div>
                  <div className="text-left leading-none">
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{userRole ? userRole : 'Connected'}</p>
                    <p className="text-xs text-white font-mono font-black">{account.slice(0, 6)}...{account.slice(-4)}</p>
                  </div>
                  <svg className="w-4 h-4 text-slate-500 ml-1 group-hover/btn:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-3 w-64 bg-[#1e293b] border border-white/10 rounded-2xl shadow-2xl opacity-0 translate-y-2 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible transition-all duration-300 z-50 p-4 overflow-hidden">
                  <div className="text-center mb-4 border-b border-white/5 pb-4">
                    <div className="bg-indigo-500/10 w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center border border-indigo-500/20">
                        <span className="text-indigo-400 font-black text-xs">{account.slice(0, 2)}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active Wallet</p>
                    <p className="text-[10px] text-white font-mono break-all line-clamp-2 px-2 mt-1">{account}</p>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    {userRole && (
                        <Link to={`/${userRole}/settings`} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-700/50 text-slate-300 transition-colors group/link">
                            <svg className="w-5 h-5 text-slate-500 group-hover/link:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            <span className="text-xs font-bold uppercase tracking-widest">Settings</span>
                        </Link>
                    )}
                    <button 
                      onClick={onLogout}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-slate-300 hover:text-red-400 transition-all group/logout"
                    >
                      <svg className="w-5 h-5 text-slate-500 group-hover/logout:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
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

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
              <span className="text-2xl font-black gradient-text tracking-tighter block leading-tight">TruePlacement</span>
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.2em] block">Proof of Employment Ledger</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            <Link to="/" className={`nav-link ${isActive('/') ? 'nav-link-active' : ''}`}>Home</Link>
            <Link to="/leaderboard" className={`nav-link ${isActive('/leaderboard') ? 'nav-link-active' : ''}`}>Leaderboard</Link>
            <Link to="/verify" className={`nav-link ${isActive('/verify') ? 'nav-link-active' : ''}`}>Verify Student</Link>
            {account && userRole && (
              <Link to={`/${userRole}/dashboard`} className={`nav-link ${isActive(`/${userRole}/dashboard`) ? 'nav-link-active' : ''}`}>
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)} Dashboard
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-4">
            {account ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{userRole ? userRole : 'Verified'} Account</p>
                  <p className="text-xs text-white font-mono">{account.slice(0, 6)}...{account.slice(-4)}</p>
                </div>
                <button 
                  onClick={onLogout}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl transition-colors border border-white/5"
                  title="Logout"
                >
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Logout</span>
                </button>
              </div>
            ) : (
              <button 
                onClick={connectWallet}
                className="btn-primary flex items-center gap-2 px-6 py-2.5 text-sm"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

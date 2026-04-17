import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import CompanyDashboard from './pages/CompanyDashboard';
import VerifyPlacement from './pages/VerifyPlacement';
import CollegeLeaderboard from './pages/CollegeLeaderboard';
import Web3Onboarding from './pages/Web3Onboarding';
import StudentDashboard from './pages/StudentDashboard';
import CollegeDashboard from './pages/CollegeDashboard';
import Settings from './pages/Settings';
import { peraWallet } from './wallet';
import { API_URL } from './config';
import './App.css';

function App() {
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [token, setToken] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);

  // Check if token exists in localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    const savedAccount = localStorage.getItem('userAccount');
    const savedRole = localStorage.getItem('userRole');
    if (savedToken) {
      setToken(savedToken);
    }
    if (savedAccount) {
      setAccount(savedAccount);
    }
    if (savedRole) {
      setUserRole(savedRole);
      // Redirect if on landing page
      if (window.location.pathname === '/') {
        navigate(`/${savedRole}/dashboard`);
      }
    }
  }, []);

  const handleLogout = () => {
    peraWallet.disconnect().catch(console.error);
    setToken(null);
    setAccount(null);
    setUserRole(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userAccount');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  const connectWallet = async () => {
    try {
      const newAccounts = await peraWallet.connect();
      if (newAccounts.length > 0) {
        handleConnect(newAccounts[0]);
      }
    } catch (error) {
      if (error?.data?.type !== "CONNECT_MODAL_CLOSED") {
        console.error("Wallet connection failed.", error);
      }
    }
  };

  const handleConnect = async (accountAddress) => {
    setAccount(accountAddress);
    // Call backend to authenticate
    try {
      const response = await fetch(`${API_URL}/api/auth/verify-signature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: accountAddress, signature: 'pera-signature-placeholder' })
      });
      const data = await response.json();
      
      if (data.success) {
        setToken(data.token);
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userAccount', accountAddress);
        
        if (data.role) {
            localStorage.setItem('userRole', data.role);
            setUserRole(data.role);
            navigate(`/${data.role}/dashboard`);
        } else {
            setShowRoleModal(true);
            navigate('/');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header account={account} token={token} userRole={userRole} onLogout={handleLogout} connectWallet={connectWallet} />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home account={account} setAccount={setAccount} setToken={setToken} userRole={userRole} setUserRole={setUserRole} connectWallet={connectWallet} showRoleModal={showRoleModal} setShowRoleModal={setShowRoleModal} />} />
          <Route 
            path="/company/dashboard" 
            element={
              token ?
                <CompanyDashboard token={token} account={account} /> 
                : <Home account={account} setAccount={setAccount} setToken={setToken} userRole={userRole} setUserRole={setUserRole} connectWallet={connectWallet} showRoleModal={showRoleModal} setShowRoleModal={setShowRoleModal} />
            } 
          />
          <Route 
            path="/student/dashboard" 
            element={
              token ? 
                <StudentDashboard token={token} account={account} /> 
                : <Home account={account} setAccount={setAccount} setToken={setToken} userRole={userRole} setUserRole={setUserRole} connectWallet={connectWallet} showRoleModal={showRoleModal} setShowRoleModal={setShowRoleModal} />
            } 
          />
          <Route 
            path="/college/dashboard" 
            element={
              token ? 
                <CollegeDashboard token={token} account={account} /> 
                : <Home setAccount={setAccount} setToken={setToken} setUserRole={setUserRole} />
            } 
          />
          <Route path="/verify" element={<VerifyPlacement />} />
          <Route path="/leaderboard" element={<CollegeLeaderboard />} />
          <Route path="/onboarding" element={<Web3Onboarding />} />
          <Route 
            path="/:role/settings" 
            element={
              token ? 
                <Settings token={token} account={account} userRole={userRole} /> 
                : <Home setAccount={setAccount} setToken={setToken} setUserRole={setUserRole} connectWallet={connectWallet} showRoleModal={showRoleModal} setShowRoleModal={setShowRoleModal} />
            } 
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;

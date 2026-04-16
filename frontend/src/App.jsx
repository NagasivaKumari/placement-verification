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
import './App.css';

function App() {
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [token, setToken] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(false);

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
    }
  }, []);

  const handleLogout = () => {
    setToken(null);
    setAccount(null);
    setUserRole(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userAccount');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header account={account} token={token} userRole={userRole} onLogout={handleLogout} />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home setAccount={setAccount} setToken={setToken} setUserRole={setUserRole} />} />
          <Route 
            path="/company/dashboard" 
            element={
              token ?
                <CompanyDashboard token={token} account={account} /> 
                : <Home setAccount={setAccount} setToken={setToken} setUserRole={setUserRole} />
            } 
          />
          <Route 
            path="/student/dashboard" 
            element={
              token ? 
                <StudentDashboard token={token} account={account} /> 
                : <Home setAccount={setAccount} setToken={setToken} setUserRole={setUserRole} />
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
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;

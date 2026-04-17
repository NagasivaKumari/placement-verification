import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PeraWalletConnect } from '@perawallet/connect';

import { peraWallet } from '../wallet';

const Home = ({ account, setAccount, setToken, setUserRole, connectWallet, showRoleModal, setShowRoleModal }) => {
  const [walletError, setWalletError] = useState("");
  const [selectedRole, setSelectedRole] = useState("company");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  // Student Specific
  const [studentCollege, setStudentCollege] = useState("");
  const [studentId, setStudentId] = useState("");
  const [studentCourse, setStudentCourse] = useState("");
  const [studentYear, setStudentYear] = useState("");
  // College Specific
  const [collegeId, setCollegeId] = useState("");
  const [collegeCity, setCollegeCity] = useState("");
  // Company Specific
  const [companyId, setCompanyId] = useState("");
  const [companyIndustry, setCompanyIndustry] = useState("");
  
  const navigate = useNavigate();

  useEffect(() => {
    // Automatic reconnect Disabled intentionally for UX
  }, []);

  const registerRole = async () => {
    try {
      let payload = { wallet: account, role: selectedRole, name: userName, email: userEmail, details: {} };
      if (selectedRole === "student") {
        payload.details = {
          college: studentCollege,
          enrollmentId: studentId,
          course: studentCourse,
          year: studentYear
        };
      } else if (selectedRole === "college") {
        payload.details = {
          collegeId: collegeId,
          cityState: collegeCity
        };
      } else if (selectedRole === "company") {
        payload.details = {
          companyId: companyId,
          industry: companyIndustry
        };
      }
      const response = await fetch('http://localhost:8000/api/auth/register-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('userRole', selectedRole);
        if (setUserRole) setUserRole(selectedRole);
        setShowRoleModal(false);
        navigate(`/${selectedRole}/dashboard`);
      }
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Role Selection Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#0f172a] rounded-2xl border border-white/10 p-8 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setShowRoleModal(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white text-xl font-bold">✕</button>
            <h3 className="text-2xl font-bold text-white mb-2">Complete Profile</h3>
            <p className="text-slate-400 mb-6 font-semibold">Select your role to view your dashboard.</p>
            <div className="flex flex-col gap-4 mb-6">
              <select
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
              >
                <option value="company">Company / Employer</option>
                <option value="student">Student</option>
                <option value="college">College</option>
              </select>

              {/* Student Fields */}
              {selectedRole === "student" && (
                <>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={userEmail}
                    onChange={e => setUserEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
                  />
                  <input
                    type="text"
                    placeholder="College Name"
                    value={studentCollege || ""}
                    onChange={e => setStudentCollege(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Enrollment Number / Student ID"
                    value={studentId || ""}
                    onChange={e => setStudentId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Course / Program"
                    value={studentCourse || ""}
                    onChange={e => setStudentCourse(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Year of Study / Graduation Year"
                    value={studentYear || ""}
                    onChange={e => setStudentYear(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
                  />
                </>
              )}

              {/* College Fields */}
              {selectedRole === "college" && (
                <>
                  <input
                    type="text"
                    placeholder="College Name"
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
                  />
                  <input
                    type="email"
                    placeholder="Official Email Address"
                    value={userEmail}
                    onChange={e => setUserEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Affiliation Code / College ID"
                    value={collegeId || ""}
                    onChange={e => setCollegeId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
                  />
                  <input
                    type="text"
                    placeholder="City / State"
                    value={collegeCity || ""}
                    onChange={e => setCollegeCity(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
                  />
                </>
              )}

              {/* Company Fields */}
              {selectedRole === "company" && (
                <>
                  <input
                    type="text"
                    placeholder="Company Name"
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
                  />
                  <input
                    type="email"
                    placeholder="Official Email Address"
                    value={userEmail}
                    onChange={e => setUserEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Organization Code / Company Registration Number"
                    value={companyId || ""}
                    onChange={e => setCompanyId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Industry (e.g. IT, Finance)"
                    value={companyIndustry || ""}
                    onChange={e => setCompanyIndustry(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
                  />
                </>
              )}
            </div>
            <button onClick={registerRole} className="btn-primary w-full py-3">Continue to Dashboard</button>
          </div>
        </div>
      )}

      {/* Wallet Connect Section */}
      {!account && (
        <div className="flex justify-center items-center py-8">
          <button onClick={connectWallet} className="btn-primary px-8 py-3 text-lg">Connect Pera Wallet</button>
          {walletError && <p className="text-red-500 ml-4">{walletError}</p>}
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-indigo-600/10 blur-[120px] rounded-full -z-10" />
        <div className="container-custom relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-xs uppercase tracking-widest mb-8 animate-float">
               <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Algorand Pera Wallet Ready
            </div>
            <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[0.9] tracking-tight text-white">
              The Ledger of <br/>
              <span className="gradient-text">Employment Truth.</span>
            </h1>
            <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              We eliminate fake placement claims by colleges. Using cryptographic proof and payroll auditing, we ensure every "placed" student is actually working and getting paid.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/leaderboard" className="btn-primary w-full sm:w-auto text-lg py-4 px-10">
                View Proof-of-Truth Leaderboard
              </Link>
              <Link to="/verify" className="btn-outline w-full sm:w-auto text-lg py-4 px-10">
                Verify a Professional
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Tiers Section */}
      <section className="py-24 bg-slate-950/50">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">The 4 Tiers of Verification</h2>
            <p className="text-slate-400">Our proprietary 4-Phase auditing process for total fraud prevention.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="premium-card">
              <div className="text-3xl font-black text-indigo-500 mb-4 opacity-30">01</div>
              <h3 className="text-xl font-bold mb-2">Offer Issued</h3>
              <p className="text-sm text-slate-400 mb-4">Company posts an immutable offer on-chain.</p>
              <span className="badge-unverified">Tier 1: Documented</span>
            </div>

            <div className="premium-card">
              <div className="text-3xl font-black text-blue-500 mb-4 opacity-30">02</div>
              <h3 className="text-xl font-bold mb-2">Student Join</h3>
              <p className="text-sm text-slate-400 mb-4">Student signs a wallet confirmation of joining.</p>
              <span className="badge-unverified">Tier 2: Witnessed</span>
            </div>

            <div className="premium-card">
              <div className="text-3xl font-black text-purple-500 mb-4 opacity-30">03</div>
              <h3 className="text-xl font-bold mb-2">Employer Verif</h3>
              <p className="text-sm text-slate-400 mb-4">Company confirms active employment status.</p>
              <span className="badge-verified">Tier 3: Verified</span>
            </div>

            <div className="premium-card border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50">
              <div className="text-3xl font-black text-emerald-500 mb-4 opacity-30">04</div>
              <h3 className="text-xl font-bold mb-2">Payroll Proof</h3>
              <p className="text-sm text-slate-400 mb-4">Cross-referenced with First Salary payment hash.</p>
              <span className="badge-verified bg-emerald-500 text-white border-none">Tier 4: Certified ✅</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-24">
         <div className="container-custom">
            <div className="glass-card p-12 overflow-hidden relative">
               <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
               <div className="flex flex-col md:flex-row items-center gap-12">
                  <div className="flex-1">
                     <h2 className="text-4xl font-bold mb-6">Built for Parents & Recruiters</h2>
                     <p className="text-slate-400 mb-8 leading-relaxed">
                        Don't be fooled by fake 100% placement PDFs. Our platform allows parents to search by student code and see the exact block number where the employment was verified. 
                     </p>
                  </div>
                  <div className="flex-1 w-full flex justify-center">
                     <div className="w-full max-w-sm aspect-square bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl rotate-3 shadow-2xl relative">
                        <div className="absolute inset-4 bg-slate-900 rounded-2xl p-6 flex flex-col justify-center">
                           <div className="h-4 w-3/4 bg-slate-800 rounded mb-4" />
                           <div className="h-4 w-1/2 bg-slate-800 rounded mb-8" />
                           <div className="h-20 w-full bg-emerald-500/10 rounded-xl border border-emerald-500/30 flex items-center justify-center">
                              <span className="text-emerald-500 font-bold text-sm tracking-widest">VERIFIED ON ALGORAND</span>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>
      <div className="flex flex-col items-center gap-4">
        <button className="btn-primary w-full sm:w-auto text-lg py-4 px-10" onClick={connectWallet}>
          Connect Pera Wallet
        </button>
        {account && (
          <div className="text-white">
            Connected: {account}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;

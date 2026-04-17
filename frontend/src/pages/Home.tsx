import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PeraWalletConnect } from '@perawallet/connect';

import { peraWallet } from '../wallet';
import { signAndSendRegistration } from '../utils/algorand';

import { API_URL } from '../config';

const Home = ({ account, setAccount, setToken, userRole, setUserRole, connectWallet, showRoleModal, setShowRoleModal }) => {
  const [walletError, setWalletError] = useState("");
  const [selectedRole, setSelectedRole] = useState("company");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  // Student Specific
  const [studentCollege, setStudentCollege] = useState("");
  const [studentId, setStudentId] = useState("");
  const [studentCourse, setStudentCourse] = useState("");
  const [studentYear, setStudentYear] = useState("");
  const [studentBranch, setStudentBranch] = useState("");
  const [studentCgpa, setStudentCgpa] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  // College Specific
  const [collegeId, setCollegeId] = useState("");
  const [collegeCity, setCollegeCity] = useState("");
  const [collegeNaac, setCollegeNaac] = useState("");
  const [collegeAffiliation, setCollegeAffiliation] = useState("");
  const [collegePlacementOfficer, setCollegePlacementOfficer] = useState("");
  const [collegeWebsite, setCollegeWebsite] = useState("");
  // Company Specific
  const [companyId, setCompanyId] = useState("");
  const [companyIndustry, setCompanyIndustry] = useState("");
  const [companyDomain, setCompanyDomain] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [companyCin, setCompanyCin] = useState("");
  
  const [regPhase, setRegPhase] = useState(0); // 0: Form, 1: OTP
  const [userOtp, setUserOtp] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [regError, setRegError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  const handleSendOTP = async () => {
    if (!userEmail) return setRegError("Email is required for verification.");
    setIsSendingOtp(true);
    setRegError("");
    try {
      const response = await fetch(`${API_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      });
      const data = await res.json();
      if (data.success) {
        setRegPhase(1);
      } else {
        setRegError(data.detail || "Failed to send OTP.");
      }
    } catch (err) {
      setRegError("Server error. Check if backend is running.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const registerRole = async () => {
    setRegError("");
    setLoading(true);
    try {
      let registrationTxId = null;
      
      // REAL BLOCKCHAIN TRANSACTION FOR STUDENTS
      if (selectedRole === "student") {
        try {
          registrationTxId = await signAndSendRegistration(account, selectedRole);
          console.log("On-chain registration success:", registrationTxId);
        } catch (txnError) {
          setRegError("Blockchain transaction rejected by user or network.");
          setLoading(false);
          return;
        }
      }

      let payload: any = { 
        wallet: account, 
        role: selectedRole, 
        name: userName, 
        email: userEmail, 
        otp: userOtp, 
        identityTx: registrationTxId, // Pass the real TxID
        details: {} 
      };
      if (selectedRole === "student") {
        payload.details = {
          college: studentCollege,
          enrollmentId: studentId,
          course: studentCourse,
          branch: studentBranch,
          year: studentYear,
          cgpa: studentCgpa,
          phone: studentPhone,
          collegeVerified: false 
        };
      }
      // ... (rest of the detailed payloads for other roles)
      else if (selectedRole === "college") {
        payload.details = {
          collegeId: collegeId,
          cityState: collegeCity,
          naacGrade: collegeNaac,
          affiliation: collegeAffiliation,
          placementOfficer: collegePlacementOfficer,
          website: collegeWebsite
        };
      } else if (selectedRole === "company") {
        payload.details = {
          companyId: companyId,
          industry: companyIndustry,
          officialDomain: companyDomain.toLowerCase().replace('@','').trim(),
          website: companyWebsite,
          size: companySize,
          cin: companyCin
        };
      }
      
      const response = await fetch(`${API_URL}/api/auth/register-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok && data.success) {
        localStorage.setItem('userRole', selectedRole);
        if (setUserRole) setUserRole(selectedRole);
        setShowRoleModal(false);
        navigate(`/${selectedRole}/dashboard`);
      } else {
        setRegError(data.detail || "Registration failed. Check OTP.");
      }
    } catch (e) {
      setRegError("Network error during registration.");
    } finally {
      setLoading(false);
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
              {regPhase === 0 ? (
                <>
                  <select
                    value={selectedRole}
                    onChange={e => setSelectedRole(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
                  >
                    <option value="company">Company / Employer</option>
                    <option value="student">Student</option>
                    <option value="college">College</option>
                  </select>

                  {/* Shared Identity Fields */}
                  <input
                    type="text"
                    placeholder="Official Name"
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
                  />
                  <input
                    type="email"
                    placeholder="Primary Email Address"
                    value={userEmail}
                    onChange={e => setUserEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
                  />

                  {/* Student Fields */}
                  {selectedRole === "student" && (
                    <div className="flex flex-col gap-2">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest border-l-2 border-indigo-500 pl-2">Academic Identity</p>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="College Name *" value={studentCollege} onChange={e => setStudentCollege(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white" required />
                        <input type="text" placeholder="Enrollment / Roll No *" value={studentId} onChange={e => setStudentId(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white" required />
                        <input type="text" placeholder="Course (e.g. B.Tech) *" value={studentCourse} onChange={e => setStudentCourse(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white" required />
                        <input type="text" placeholder="Branch (e.g. CSE, ECE)" value={studentBranch} onChange={e => setStudentBranch(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white" />
                        <input type="text" placeholder="Graduation Year (e.g. 2025)" value={studentYear} onChange={e => setStudentYear(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white" />
                        <input type="text" placeholder="CGPA / % (e.g. 8.5)" value={studentCgpa} onChange={e => setStudentCgpa(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white" />
                      </div>
                      <input type="tel" placeholder="Phone Number *" value={studentPhone} onChange={e => setStudentPhone(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white" required />
                      <p className="text-[10px] text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
                        ⚠️ Your college must verify your enrollment before you can submit placement claims.
                      </p>
                    </div>
                  )}

                  {/* College Fields */}
                  {selectedRole === "college" && (
                    <div className="flex flex-col gap-2">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest border-l-2 border-indigo-500 pl-2">Institutional Details</p>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="City / State *" value={collegeCity} onChange={e => setCollegeCity(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white" required />
                        <select value={collegeNaac} onChange={e => setCollegeNaac(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white">
                          <option value="">NAAC Grade</option>
                          <option value="A++">A++</option>
                          <option value="A+">A+</option>
                          <option value="A">A</option>
                          <option value="B++">B++</option>
                          <option value="B+">B+</option>
                          <option value="B">B</option>
                          <option value="Not Accredited">Not Accredited</option>
                        </select>
                        <input type="text" placeholder="Affiliated University" value={collegeAffiliation} onChange={e => setCollegeAffiliation(e.target.value)} className="col-span-2 bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white" />
                        <input type="text" placeholder="Placement Officer Name" value={collegePlacementOfficer} onChange={e => setCollegePlacementOfficer(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white" />
                        <input type="text" placeholder="College Website" value={collegeWebsite} onChange={e => setCollegeWebsite(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white" />
                      </div>
                    </div>
                  )}

                  {/* Company Fields */}
                  {selectedRole === "company" && (
                    <div className="flex flex-col gap-2">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest border-l-2 border-indigo-500 pl-2">Company Identity</p>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="Industry (e.g. IT, Finance) *" value={companyIndustry} onChange={e => setCompanyIndustry(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white" required />
                        <input type="text" placeholder="Official Email Domain * (e.g. tcs.com)" value={companyDomain} onChange={e => setCompanyDomain(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white" required />
                        <input type="text" placeholder="Company Website" value={companyWebsite} onChange={e => setCompanyWebsite(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white" />
                        <select value={companySize} onChange={e => setCompanySize(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white">
                          <option value="">Company Size</option>
                          <option value="startup">Startup (1-50)</option>
                          <option value="sme">SME (51-500)</option>
                          <option value="enterprise">Enterprise (500+)</option>
                          <option value="mnc">MNC / Global</option>
                        </select>
                        <input type="text" placeholder="CIN / GST Number" value={companyCin} onChange={e => setCompanyCin(e.target.value)} className="col-span-2 bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white" />
                      </div>
                      <p className="text-[10px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-2">
                        📧 Your official email domain is used to validate offer letters sent to students.
                      </p>
                    </div>
                  )}

                  <button 
                    onClick={handleSendOTP} 
                    disabled={isSendingOtp}
                    className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                  >
                    {isSendingOtp ? 'Sending OTP...' : 'Verify Email & Continue'}
                    {!isSendingOtp && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>}
                  </button>
                </>
              ) : (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 mb-4">
                     <p className="text-xs text-indigo-300 font-bold mb-1 uppercase tracking-widest text-center">Verification Required</p>
                     <p className="text-[10px] text-slate-500 text-center">We sent a 6-digit code to <span className="text-slate-300 font-bold">{userEmail}</span>. Enter it below to secure your identity.</p>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={userOtp}
                    onChange={e => setUserOtp(e.target.value)}
                    className="w-full bg-slate-900 border border-indigo-500/50 rounded-xl p-4 text-center text-2xl font-black tracking-[0.5em] placeholder:tracking-normal placeholder:font-medium text-white focus:ring-4 ring-indigo-500/20 outline-none mb-4"
                    maxLength={6}
                  />
                  <div className="flex gap-2 mb-4">
                    <button onClick={() => setRegPhase(0)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all">Back</button>
                    <button onClick={registerRole} className="flex-[2] btn-primary py-3">Finish Registration</button>
                  </div>
                  <button onClick={handleSendOTP} disabled={isSendingOtp} className="w-full text-center text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50">
                    {isSendingOtp ? "Sending..." : "Didn't receive it? Resend OTP"}
                  </button>
                </div>
              )}
              
              {regError && (
                <p className="text-xs text-red-400 font-bold bg-red-400/10 border border-red-400/20 p-3 rounded-xl animate-shake">
                  {regError}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Wallet Connect Banner - Only shown if connected but no role yet */}
      {account && !userRole && !showRoleModal && (
        <div className="container-custom">
           <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-6 mb-8 flex items-center justify-between">
              <div>
                 <h4 className="text-white font-bold text-lg">Account Connected: {account.slice(0, 8)}...</h4>
                 <p className="text-slate-400 text-sm">Please complete your profile to access your dashboard.</p>
              </div>
              <button onClick={() => setShowRoleModal(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg">
                 Complete Registration
              </button>
           </div>
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
              The <span className="gradient-text italic">CollegeTruth.</span> <br/>
              Project
            </h1>
            <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              We verify every campus placement claim using blockchain signatures. Don't let your family be fooled by fake marketing—audit the truth before you pay tuition.
            </p>

            {/* Public Truth Search Portal */}
            <div className="max-w-2xl mx-auto bg-slate-900/50 border border-slate-700/50 rounded-3xl p-2 mb-12 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row items-center gap-2 group focus-within:border-indigo-500/50 transition-all">
                <div className="flex-1 flex items-center px-4 w-full">
                    <svg className="w-5 h-5 text-slate-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    <input 
                      type="text" 
                      placeholder="Search for a College or University to view verified truth..." 
                      className="bg-transparent border-none outline-none text-white w-full py-4 text-lg placeholder-slate-600"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => { 
                        if (e.key === 'Enter' && searchQuery) {
                           navigate(`/leaderboard?q=${encodeURIComponent(searchQuery)}`);
                        } 
                      }}
                    />
                </div>
                <button 
                  onClick={() => {
                    if (searchQuery) navigate(`/leaderboard?q=${encodeURIComponent(searchQuery)}`);
                    else navigate('/leaderboard');
                  }}
                  className="w-full md:w-auto bg-white text-slate-900 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-slate-200 transition-all"
                >
                  Search
                </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {userRole ? (
                <Link to={`/${userRole}/dashboard`} className="btn-primary w-full sm:w-auto text-lg py-4 px-10 flex items-center justify-center gap-2">
                  Go to {userRole.charAt(0).toUpperCase() + userRole.slice(1)} Dashboard
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                </Link>
              ) : !account ? (
                <button onClick={connectWallet} className="btn-primary w-full sm:w-auto text-lg py-4 px-10 flex items-center justify-center gap-2">
                   Connect Wallet to Start
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                </button>
              ) : (
                <button onClick={() => setShowRoleModal(true)} className="btn-primary w-full sm:w-auto text-lg py-4 px-10">
                   Complete Registration
                </button>
              )}
              <Link to="/leaderboard" className="btn-outline w-full sm:w-auto text-lg py-4 px-10">
                View Leaderboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* The Trust Loop Explanation */}
      <section className="py-24 border-y border-white/5 bg-slate-900/20">
        <div className="container-custom">
           <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">How do we know it's <span className="text-indigo-500 italic">Real?</span></h2>
              <p className="text-slate-400">Our 3-party verification loop ensures no single entity can forge a placement record.</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              {/* Connector lines (Desktop only) */}
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent -z-10"></div>
              
              <div className="flex flex-col items-center text-center">
                 <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 border border-white/10 shadow-xl">
                    <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                 </div>
                 <h4 className="text-lg font-bold text-white mb-2">1. Student Claims</h4>
                 <p className="text-xs text-slate-500 leading-relaxed">Student uploads their offer letter details and tags the employer's official wallet.</p>
              </div>

              <div className="flex flex-col items-center text-center">
                 <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-indigo-600/40">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04a11.952 11.952 0 00-1.02 7.492c.859 3.397 3.13 6.374 6.218 8.183l.784.457.784-.457c3.088-1.809 5.359-4.786 6.218-8.183a11.952 11.952 0 00-1.02-7.492z"></path></svg>
                 </div>
                 <h4 className="text-lg font-bold text-white mb-2">2. Company Signs</h4>
                 <p className="text-xs text-slate-500 leading-relaxed">The Employer logs in via Pera Wallet and cryptographically signs the claim, anchoring it on Algorand.</p>
              </div>

              <div className="flex flex-col items-center text-center">
                 <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 border border-white/10 shadow-xl">
                    <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                 </div>
                 <h4 className="text-lg font-bold text-white mb-2">3. Public Audits</h4>
                 <p className="text-xs text-slate-500 leading-relaxed">Parents and Recruiters query the ledger. The proof is undeniable because only the Company could have signed it.</p>
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
              <h3 className="text-xl font-bold mb-2">Employment Truth Ledger</h3>
              <p className="text-sm text-slate-400 mb-4">A decentralized, immutable record of job offers verified by company cryptographic signatures.</p>
              <span className="badge-verified bg-indigo-500/10 text-indigo-400">Core Protocol</span>
            </div>

            <div className="premium-card">
              <div className="text-3xl font-black text-blue-500 mb-4 opacity-30">02</div>
              <h3 className="text-xl font-bold mb-2">Institutional Audit</h3>
              <p className="text-sm text-slate-400 mb-4">A public portal where parents can view a college's real placement trust score on-chain.</p>
              <span className="badge-verified bg-blue-500/10 text-blue-400">Public Portal</span>
            </div>

            <div className="premium-card">
              <div className="text-3xl font-black text-purple-500 mb-4 opacity-30">03</div>
              <h3 className="text-xl font-bold mb-2">Identity Audit Gate</h3>
              <p className="text-sm text-slate-400 mb-4">Query individual student verification hashes to confirm authenticity for recruitment.</p>
              <span className="badge-verified bg-purple-500/10 text-purple-400">Recruiter Tool</span>
            </div>

            <div className="premium-card border-emerald-500/30 bg-emerald-500/5">
              <div className="text-3xl font-black text-emerald-500 mb-4 opacity-30">04</div>
              <h3 className="text-xl font-bold mb-2">Payroll Proof</h3>
              <p className="text-sm text-slate-400 mb-4">The ultimate verification phase cross-referenced with actual salary transaction hashes.</p>
              <span className="badge-verified bg-emerald-500 text-white border-none">Tier 4 Authority</span>
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
    </div>
  );
};

export default Home;

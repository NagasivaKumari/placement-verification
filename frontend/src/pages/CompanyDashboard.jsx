import React, { useState, useEffect } from 'react';
import { ethers } from "ethers";
// import PlacementRegistryABI from "../contracts/PlacementRegistry.abi.json";
import { PLACEMENT_REGISTRY_ADDRESS } from "../contracts/contractAddress";

const CompanyDashboard = ({ token, account }) => {
  const [company, setCompany] = useState(null);
  const [stats, setStats] = useState(null);
  const [placements, setPlacements] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [lastVerificationCode, setLastVerificationCode] = useState(null);
  const [salaryProofInput, setSalaryProofInput] = useState({ code: '', txHash: '' });
  const [selectedPlacement, setSelectedPlacement] = useState(null);
  const [docUpload, setDocUpload] = useState({ docType: '', hash: '', verifier: '' });
  const [fraudScore, setFraudScore] = useState(null);
  const [insuranceClaimed, setInsuranceClaimed] = useState(false);
  const [legalSupport, setLegalSupport] = useState(null);
  const [authorityMode, setAuthorityMode] = useState(false); // Toggle for authority actions

  const API_URL = 'http://localhost:3000';

  useEffect(() => {
    fetchCompanyProfile();
  }, [token]);

  const fetchCompanyProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/company/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        setCompany(null);
        setLoading(false);
        return;
      }

      const data = await response.json();
      setCompany(data);

      const statsResponse = await fetch(`${API_URL}/api/company/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statsData = await statsResponse.json();
      setStats(statsData);

      const placementsResponse = await fetch(`${API_URL}/api/company/placements`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const placementsData = await placementsResponse.json();
      setPlacements(placementsData.placements || []);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const [oracleVerifying, setOracleVerifying] = useState(false);
  const [oracleSuccess, setOracleSuccess] = useState(false);

  const handleSalaryProof = async (code, studentWallet) => {
    if (!salaryProofInput.txHash || !studentWallet) return alert("Please ensure Salary Tx and Student Wallet are provided.");
    
    // START ORACLE SIMULATION
    setOracleVerifying(true);
    setOracleSuccess(false);
    
    // Simulate complex financial background check
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    setOracleVerifying(false);
    setOracleSuccess(true);
    
    setLoading(true);
    try {
      const resp = await fetch(`${API_URL}/api/placements/salary-proof`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            verificationCode: code, 
            salaryTxHash: salaryProofInput.txHash,
            studentWallet: studentWallet 
        })
      });
      const data = await resp.json();
      if (data.success) {
        setSuccess(data.message);
        setSalaryProofInput({ code: '', txHash: '', studentWallet: '' });
        fetchCompanyProfile();
      } else {
        setError(data.error);
        setOracleSuccess(false);
      }
    } catch (err) {
      setError(err.message);
      setOracleSuccess(false);
    } finally {
      setLoading(false);
      setTimeout(() => setOracleSuccess(false), 3000);
    }
  };

  const handleEmployerVerify = async (code) => {
    setLoading(true);
    try {
      const resp = await fetch(`${API_URL}/api/placements/employer-verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ verificationCode: code })
      });
      const data = await resp.json();
      if (data.success) {
        setSuccess(data.message);
        fetchCompanyProfile();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Wallet-based Placement Registration (Re-routed to Backend API)
  const handleRegisterPlacement = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const form = e.target;
    const studentName = form.studentName.value;
    const studentEmail = form.studentEmail.value;
    const college = "Sample College"; // placeholder for missing UI
    const role = form.role.value;
    const salary = form.salary.value;
    const joiningDate = Math.floor(new Date(form.joiningDate.value).getTime() / 1000);

    setLoading(true);
    try {
      const resp = await fetch(`${API_URL}/api/placements/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            studentName, studentEmail, role, salary, joiningDate, college 
        })
      });
      const data = await resp.json();
      if(data.success) {
        setSuccess(`Placement registered successfully! Verification Code for student: ${data.verificationCode}`);
        setShowForm(false);
        fetchCompanyProfile();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message || "Transaction failed.");
    } finally {
        setLoading(false);
    }
  };

  // Verification override removed for MVP since EmployerVerify does this via Code.

  // --- Document Upload Handler ---
  const handleDocumentUpload = async (placementId) => {
    try {
        const resp = await fetch(`${API_URL}/api/documents/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                placementId: placementId,
                docType: docUpload.docType,
                fileHash: docUpload.hash,
                verifier: docUpload.verifier
            })
        });
        const data = await resp.json();
        if(data.success) {
            alert(data.message);
        } else {
            alert(data.error);
        }
    } catch(err) {
        alert(err.message);
    }
    setDocUpload({ docType: '', hash: '', verifier: '' });
  };

  // --- Authority Actions (Freeze/Override) ---
  const handleFreezePlacement = async (placementId) => {
    // TODO: Integrate with smart contract freezePlacement
    alert(`Placement ${placementId} frozen by authority.`);
  };
  const handleOverrideVerification = async (placementId, newStatus) => {
    // TODO: Integrate with smart contract overrideVerification
    alert(`Placement ${placementId} status overridden to ${newStatus}.`);
  };

  // --- Insurance Claim (Placeholder) ---
  const handleClaimInsurance = async (studentWallet) => {
    // TODO: Integrate with smart contract claimInsurance
    setInsuranceClaimed(true);
    setTimeout(() => setInsuranceClaimed(false), 3000);
  };

  // --- Legal Support (Placeholder) ---
  const handleContactLegal = () => {
    // TODO: Integrate with smart contract legalSupportContact
    setLegalSupport('legal@placement-audit.org');
    setTimeout(() => setLegalSupport(null), 5000);
  };

  // --- Fraud Score Fetch (Placeholder) ---
  const fetchFraudScore = async (placementId) => {
    // TODO: Integrate with smart contract fraudScores
    setFraudScore(Math.floor(Math.random() * 100));
    setTimeout(() => setFraudScore(null), 4000);
  };

  if (!account) {
    return (
      <div className="container-custom py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Connect your wallet to access the Company Dashboard</h2>
        <p className="text-slate-400">All actions require wallet authentication.</p>
      </div>
    );
  }

  if (loading && !company) {
    // ... (existing loading state)
    return (
      <div className="container-custom py-20 text-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-slate-400 font-bold uppercase tracking-widest text-xs">Accessing Ledger...</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="container-custom py-20">
        <div className="max-w-2xl mx-auto premium-card">
          <h1 className="text-3xl font-black mb-2">Register Employer Identity</h1>
          <p className="text-slate-400 mb-8">Access the network to post verified placement offers.</p>

          <form className="space-y-6" onSubmit={handleRegisterPlacement}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Student Name</label>
              <input type="text" name="studentName" required className="input-field" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Student Email</label>
              <input type="email" name="studentEmail" required className="input-field" placeholder="john@example.com" />
            </div>
            {/* Company Name removed since it handles automatically based on Token session */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Role</label>
              <input type="text" name="role" required className="input-field" placeholder="Software Engineer" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Salary</label>
              <input type="number" name="salary" required className="input-field" placeholder="1000000" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Joining Date</label>
              <input type="date" name="joiningDate" required className="input-field" />
            </div>
            <button className="btn-primary w-full py-4 uppercase tracking-widest text-sm">Register Placement On-Chain</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-5xl font-black tracking-tight">{company.name}</h1>
            {company.isVerified ? (
              <span className="badge-verified">Verified Employer</span>
            ) : (
              <span className="badge-unverified">Identity Pending</span>
            )}
          </div>
          <p className="text-slate-400 font-mono text-sm">{account}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel Operation' : 'Post New placement'}
        </button>
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="glass-card p-8 group hover:bg-indigo-500/5 transition-colors">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Total Impact</p>
          <p className="text-5xl font-black text-white">{stats?.totalPlacements || 0}</p>
          <p className="text-xs text-indigo-400 mt-2 font-bold uppercase">Active Placements</p>
        </div>
        <div className="glass-card p-8 group hover:bg-emerald-500/5 transition-colors">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Payroll Economy</p>
          <p className="text-5xl font-black text-white">₹{parseInt(stats?.avgSalary || 0).toLocaleString()}</p>
          <p className="text-xs text-emerald-400 mt-2 font-bold uppercase">Avg Salary Packages</p>
        </div>
        <div className="glass-card p-8 group hover:bg-purple-500/5 transition-colors">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Top Career Path</p>
          <p className="text-3xl font-black text-white truncate">{stats?.mostCommonRole || 'N/A'}</p>
          <p className="text-xs text-purple-400 mt-2 font-bold uppercase">Most Recruited Role</p>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl mb-8 flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
          <div className="bg-emerald-500 rounded-full p-2">
             <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
          </div>
          <p className="text-emerald-400 font-bold">{success}</p>
        </div>
      )}

      {/* Placement List Table (Enhanced) */}
      <div className="premium-card overflow-hidden !p-0">
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
            <h2 className="text-2xl font-black">Proof-of-Employment Log</h2>
            <div className="flex gap-2">
               <span className="w-3 h-3 rounded-full bg-orange-500"></span>
               <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
               <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5">
                <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Professional</th>
                <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Role & Package</th>
                <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Status</th>
                <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Actions</th>
                <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Fraud Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {placements.map((p, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-8 py-6">
                    {p.studentName} <br/>
                    <span className="text-xs text-slate-500">{p.studentEmail}</span>
                  </td>
                  <td className="px-8 py-6">
                    {p.role} <br/>
                    <span className="text-xs text-slate-500">₹{parseInt(p.salary).toLocaleString()}</span>
                  </td>
                  <td className="px-8 py-6">
                     {p.isVerified ? (
                      <span className="badge-verified">Verified</span>
                    ) : (
                      <span className="badge-unverified">Unverified</span>
                    )}
                  </td>
                  <td className="px-8 py-6 flex flex-col gap-2">
                    {p.status === 'applied' && (
                        <button className="btn-primary btn-xs" onClick={async () => {
                            const salaryInput = window.prompt("Enter Offerd Salary for this role (INR):", "1000000");
                            if(salaryInput) {
                                try {
                                    const resp = await fetch(`${API_URL}/api/placements/issue-offer`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                        body: JSON.stringify({ verificationCode: p.verificationCode, salary: salaryInput })
                                    });
                                    const data = await resp.json();
                                    if(data.success){ alert(data.message); fetchCompanyProfile(); } else { alert(data.error); }
                                } catch(err) { alert(err.message); }
                            }
                        }}>
                        Issue Offer 🚀
                        </button>
                    )}
                    {!p.isSalaryVerified && p.status === 'fully_verified' && (
                       <div className="flex flex-col gap-1 mb-2">
                           <input type="text" placeholder="Salary Hash" className="input-field btn-xs" value={salaryProofInput.txHash} onChange={e => setSalaryProofInput({...salaryProofInput, txHash: e.target.value})} />
                           <button className="btn-primary btn-xs" onClick={() => handleSalaryProof(p.verificationCode, p.studentWallet || 'PeraWalletAddressX')}>
                            Submit Salary Proof
                           </button>
                       </div>
                    )}
                    {p.status === 'student_confirmed' && (
                      <button className="btn-primary btn-xs" onClick={() => handleEmployerVerify(p.verificationCode)}>
                        Verify On-Chain (Employer Verify)
                      </button>
                    )}
                    {p.status === 'offer_issued' && (
                        <p className="text-xs text-orange-400">Waiting for Student. Code: <br/><strong className="select-all">{p.verificationCode}</strong></p>
                    )}
                    {/* Document Upload */}
                    <button className="btn-secondary btn-xs" onClick={() => setSelectedPlacement(p.placementId || p.verificationCode)}>
                      Upload Document
                    </button>
                    {/* Authority Actions */}
                    {authorityMode && (
                      <>
                        <button className="btn-danger btn-xs" onClick={() => handleFreezePlacement(p.placementId)}>Freeze</button>
                        <button className="btn-warning btn-xs" onClick={() => handleOverrideVerification(p.placementId, 'Verified')}>Override</button>
                      </>
                    )}
                    {/* Insurance Claim */}
                    <button className="btn-outline btn-xs" onClick={() => handleClaimInsurance(p.studentWallet)}>Claim Insurance</button>
                    {/* Legal Support */}
                    <button className="btn-outline btn-xs" onClick={handleContactLegal}>Legal Support</button>
                  </td>
                  <td className="px-8 py-6">
                    <button className="btn-outline btn-xs" onClick={() => fetchFraudScore(p.placementId)}>Check</button>
                    {fraudScore !== null && selectedPlacement === p.placementId && (
                      <span className={`ml-2 font-bold ${fraudScore > 50 ? 'text-red-500' : 'text-green-500'}`}>{fraudScore}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Upload Modal */}
      {selectedPlacement && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3 className="font-bold mb-2">Upload Document for Placement</h3>
            <select value={docUpload.docType} onChange={e => setDocUpload({ ...docUpload, docType: e.target.value })} className="input-field mb-2">
              <option value="">Select Document Type</option>
              <option value="college_id">College ID</option>
              <option value="offer_letter">Offer Letter</option>
              <option value="joining_letter">Joining Letter</option>
              <option value="salary_slip">Salary Slip</option>
            </select>
            <input type="text" className="input-field mb-2" placeholder="Document Hash (IPFS or SHA256)" value={docUpload.hash} onChange={e => setDocUpload({ ...docUpload, hash: e.target.value })} />
            <input type="text" className="input-field mb-2" placeholder="Verifier Address" value={docUpload.verifier} onChange={e => setDocUpload({ ...docUpload, verifier: e.target.value })} />
            <div className="flex gap-2">
              <button className="btn-primary" onClick={() => { handleDocumentUpload(selectedPlacement); setSelectedPlacement(null); }}>Upload</button>
              <button className="btn-outline" onClick={() => setSelectedPlacement(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Insurance Claim Notification */}
      {insuranceClaimed && (
        <div className="fixed top-8 right-8 bg-emerald-500 text-white p-4 rounded-xl shadow-lg z-50">Insurance Claimed!</div>
      )}
      {/* Legal Support Notification */}
      {legalSupport && (
        <div className="fixed top-8 left-8 bg-blue-500 text-white p-4 rounded-xl shadow-lg z-50">Contact: {legalSupport}</div>
      )}
    </div>
  );
};

export default CompanyDashboard;

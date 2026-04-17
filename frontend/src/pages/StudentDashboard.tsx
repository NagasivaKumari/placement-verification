import React, { useState, useEffect } from 'react';

const StudentDashboard = ({ token, account }) => {
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  
  // Upload Form State
  const [offerCompany, setOfferCompany] = useState("");
  const [offerRole, setOfferRole] = useState("");
  const [offerSalary, setOfferSalary] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Status Modals
  const [activeVerification, setActiveVerification] = useState(null); // { code, phase }
  const [salaryAmount, setSalaryAmount] = useState("");
  const [salaryHash, setSalaryHash] = useState("");

  useEffect(() => {
    fetchPlacements();
    fetchCompanies();
  }, []);

  const fetchPlacements = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/student/placements', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.placements) setPlacements(data.placements);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/companies/active');
      const data = await res.json();
      if (data.companies) setCompanies(data.companies);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUploadOffer = async (e) => {
    e.preventDefault();
    if (!offerCompany) {
      setUploadMessage("Please select a company.");
      return;
    }
    setIsUploading(true);
    setUploadMessage("");
    try {
      const res = await fetch('http://localhost:8000/api/placements/student-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          companyWallet: offerCompany,
          role: offerRole,
          salary: parseFloat(offerSalary) || 0,
          documentHash: "ipfs_offchain_mock_" + Math.random().toString(16).slice(2)
        })
      });
      const data = await res.json();
      if (data.success) {
        setUploadMessage("Offer successfully uploaded and tagged to company!");
        setOfferRole("");
        setOfferSalary("");
        fetchPlacements();
        setTimeout(() => setUploadMessage(""), 5000);
      }
    } catch (err) {
      setUploadMessage("Failed to upload offer.");
    } finally {
      setIsUploading(false);
    }
  };

  const verifyPhase = async (phase, code) => {
    try {
      let endpoint = '';
      let body = { verificationCode: code };
      
      if (phase === 'join') {
        endpoint = '/api/placements/student-join';
        body.location = 'Office - HQ'; 
      } else if (phase === 'salary') {
        endpoint = '/api/placements/verify-salary';
        body.amount = parseFloat(salaryAmount);
        body.salaryTxHash = salaryHash;
      }

      const res = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        setActiveVerification(null);
        setSalaryAmount("");
        setSalaryHash("");
        fetchPlacements();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container-custom py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-black mb-2 text-white">Student Hub</h1>
        <p className="text-slate-400">Manage your employment lifecycle and anchor the truth on-chain.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -translate-y-8 translate-x-8 blur-2xl group-hover:bg-indigo-500/10 transition-all"></div>
           <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-2">Total Submissions</p>
           <p className="text-4xl font-black text-white">{placements.length}</p>
        </div>
        <div className="bg-slate-900 border border-amber-500/20 rounded-3xl p-6 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -translate-y-8 translate-x-8 blur-2xl"></div>
           <p className="text-amber-500 font-bold uppercase tracking-widest text-[10px] mb-2">Awaiting Employer</p>
           <p className="text-4xl font-black text-amber-500">{placements.filter(p => p.status === 'pending_company_approval').length}</p>
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6 relative overflow-hidden text-emerald-500">
           <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -translate-y-8 translate-x-8 blur-2xl"></div>
           <p className="font-bold uppercase tracking-widest text-[10px] mb-2">Fully Verified Truth</p>
           <p className="text-4xl font-black">{placements.filter(p => p.status === 'salary_verified').length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Upload Form */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
             <div className="absolute top-0 left-12 w-24 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
            <h3 className="text-xl font-bold text-white mb-6">Verify New Offer</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-6 border-l-2 border-indigo-500 pl-3">
               Phase 1: Student Initiates Claim
            </p>
            <form onSubmit={handleUploadOffer} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Target Employer</label>
                <select 
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-white outline-none focus:border-indigo-500 transition-all cursor-pointer"
                  value={offerCompany}
                  onChange={(e) => setOfferCompany(e.target.value)}
                  required
                >
                  <option value="" disabled>Select Company...</option>
                  {companies.map(c => (
                    <option key={c.walletAddress} value={c.walletAddress}>{c.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Role Title</label>
                  <input type="text" placeholder="Engineer" value={offerRole} onChange={(e) => setOfferRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-white outline-none focus:border-indigo-500 transition-all" required />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Annual Package</label>
                  <input type="number" placeholder="800000" value={offerSalary} onChange={(e) => setOfferSalary(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-white outline-none focus:border-indigo-500 transition-all font-mono" required />
                </div>
              </div>

              {/* Real File Upload */}
              <div
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors cursor-pointer ${
                  selectedFile ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-800 hover:border-indigo-500/50'
                }`}
                onClick={() => document.getElementById('offerFileInput').click()}
              >
                <input
                  id="offerFileInput"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                />
                {selectedFile ? (
                  <>
                    <p className="text-indigo-400 font-bold text-sm mb-1">📄 {selectedFile.name}</p>
                    <span className="text-[10px] text-slate-500">Click to change file</span>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1 group-hover:text-indigo-400">📎 Click to Upload Offer Letter</p>
                    <span className="text-[10px] text-slate-600">PDF, JPG, PNG accepted</span>
                  </>
                )}
              </div>

              <button type="submit" disabled={isUploading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 px-4 rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">
                {isUploading ? 'Securing Claim...' : 'Publish to Ledger'}
              </button>
              {uploadMessage && <p className={`text-xs text-center font-bold ${uploadMessage.includes('Failed') ? 'text-red-400' : 'text-emerald-400'}`}>{uploadMessage}</p>}
            </form>
          </div>
        </div>

        {/* Timeline Tracking */}
        <div className="lg:col-span-2">
           <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl h-full flex flex-col">
              <div className="p-8 border-b border-slate-800 flex items-center justify-between">
                 <h3 className="text-xl font-bold text-white">Placement Lifecycle</h3>
                 <div className="flex gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Network Synced</span>
                 </div>
              </div>
              <div className="flex-1">
                 {loading ? (
                    <div className="p-12 text-center text-slate-500">Loading your history...</div>
                 ) : placements.length === 0 ? (
                    <div className="p-20 text-center opacity-40">
                       <p className="font-black text-xs uppercase tracking-[0.3em] text-slate-500">No active claims found</p>
                    </div>
                 ) : (
                    <div className="divide-y divide-slate-800/50">
                       {placements.map(p => (
                          <div key={p._id} className="p-8 hover:bg-slate-800/20 transition-all group">
                             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                   <div className="flex items-center gap-3 mb-2">
                                      <h4 className="text-2xl font-black text-white">{p.role}</h4>
                                      <span className="font-mono text-emerald-400 text-sm font-bold bg-emerald-400/10 px-3 py-1 rounded-xl border border-emerald-500/20">${p.salary.toLocaleString()}</span>
                                   </div>
                                   <div className="flex items-center gap-4">
                                      <p className="text-slate-400 text-sm font-semibold italic">{p.companyName}</p>
                                      <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
                                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Hash ID: {p.verificationCode.slice(0, 8)}</p>
                                   </div>
                                </div>
                                <div className="flex flex-col gap-3 min-w-[200px]">
                                   {/* Stage Progress */}
                                   <div className="flex justify-between items-center mb-1">
                                      <span className={`text-[10px] font-black uppercase tracking-widest ${p.status === 'salary_verified' ? 'text-emerald-500' : 'text-indigo-500'}`}>Verification Progress</span>
                                      <span className="text-[10px] font-black text-slate-400">{p.status === 'pending_company_approval' ? '33%' : p.status === 'offer_verified' ? '50%' : p.status === 'joining_verified' ? '75%' : '100%'}</span>
                                   </div>
                                   <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                      <div className={`h-full bg-indigo-500 transition-all duration-1000 ${p.status === 'salary_verified' ? 'bg-emerald-500' : ''}`} 
                                        style={{ width: p.status === 'pending_company_approval' ? '33%' : p.status === 'offer_verified' ? '50%' : p.status === 'joining_verified' ? '75%' : '100%' }}></div>
                                   </div>
                                   
                                   {/* ACTION BUTTONS BASED ON PHASE */}
                                   <div className="mt-2">
                                      {p.status === 'pending_company_approval' && (
                                        <div className="text-amber-500 bg-amber-500/10 px-4 py-2 rounded-xl text-center text-xs font-bold border border-amber-500/20">Awaiting Employer Review</div>
                                      )}
                                      {p.status === 'offer_verified' && (
                                        <button onClick={() => verifyPhase('join', p.verificationCode)} 
                                          className="w-full bg-white text-slate-900 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Phase 2: Verify Joining</button>
                                      )}
                                      {p.status === 'joining_verified' && (
                                        <div className="flex flex-col gap-2">
                                           <div className="flex gap-2">
                                              <input type="number" placeholder="Actual Salary" value={salaryAmount} onChange={e => setSalaryAmount(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
                                              <input type="text" placeholder="TX Hash" value={salaryHash} onChange={e => setSalaryHash(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
                                           </div>
                                           <button onClick={() => verifyPhase('salary', p.verificationCode)} 
                                             className="w-full bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20">Phase 3: Verify Salary</button>
                                        </div>
                                      )}
                                      {p.status === 'salary_verified' && (
                                        <div className="flex items-center justify-center gap-2 text-emerald-500 bg-emerald-500/5 border border-emerald-500/20 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] animate-fade-in">
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                          Ledger Finalized
                                        </div>
                                      )}
                                   </div>
                                </div>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;

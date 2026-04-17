import React, { useState, useEffect } from 'react';

const StudentDashboard = ({ token, account }) => {
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  
  // Upload Form State
  const [offerCompany, setOfferCompany] = useState("");
  const [offerRole, setOfferRole] = useState("");
  const [offerSalary, setOfferSalary] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

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
      }
    } catch (err) {
      setUploadMessage("Failed to upload offer.");
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container-custom py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-2 text-white">Student Hub</h1>
        <p className="text-slate-400">Upload your offer documents and track their cryptographic verification.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Upload Widget */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
              Upload Offer Proof
            </h3>
            
            <form onSubmit={handleUploadOffer} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tag Hiring Company</label>
                <select 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white appearance-none"
                  value={offerCompany}
                  onChange={(e) => setOfferCompany(e.target.value)}
                  required
                >
                  <option value="" disabled>Select a registered company...</option>
                  {companies.map(c => (
                    <option key={c.walletAddress} value={c.walletAddress}>{c.name} ({c.details?.industry || 'Corp'})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Job Role / Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Software Engineer"
                  value={offerRole}
                  onChange={(e) => setOfferRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Annual Salary ($)</label>
                <input 
                  type="number" 
                  placeholder="105000"
                  value={offerSalary}
                  onChange={(e) => setOfferSalary(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
                  required
                />
              </div>

              <div className="mt-2 border-2 border-dashed border-slate-700/50 rounded-xl p-6 text-center cursor-not-allowed hover:bg-slate-800/10 transition-colors">
                <svg className="w-8 h-8 text-slate-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                <span className="block text-sm text-slate-500 font-semibold mb-1">Upload PDF Offer Letter</span>
                <span className="block text-xs text-slate-600">Simulated via IPFS for MVP</span>
              </div>

              <button 
                type="submit" 
                disabled={isUploading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl transition-all mt-4 disabled:opacity-50"
              >
                {isUploading ? 'Uploading & Hashing...' : 'Submit Claim'}
              </button>
              
              {uploadMessage && (
                <p className={`text-sm text-center font-bold ${uploadMessage.includes('Failed') ? 'text-red-400' : 'text-emerald-400'}`}>
                  {uploadMessage}
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Status Tracker */}
        <div className="lg:col-span-2">
           <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden h-full">
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                 <h3 className="text-xl font-bold text-white">Live Tracking</h3>
                 <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{placements.length} Total Claims</span>
              </div>
              <div className="p-0">
                 {loading ? (
                    <div className="p-12 text-center text-slate-500">Loading your history...</div>
                 ) : placements.length === 0 ? (
                    <div className="p-12 text-center">
                       <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4"><svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></div>
                       <p className="text-slate-400 font-semibold mb-2">No placements claimed yet.</p>
                       <p className="text-sm text-slate-500">When you receive a real-world offer, upload it here to verify its authenticity.</p>
                    </div>
                 ) : (
                    <ul className="divide-y divide-slate-800/50">
                       {placements.map(p => (
                          <li key={p._id} className="p-6 hover:bg-slate-800/20 transition-colors">
                             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                   <div className="flex items-center gap-3 mb-1">
                                      <h4 className="text-lg font-bold text-white">{p.role}</h4>
                                      <span className="font-mono text-emerald-400 text-sm font-bold bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-500/20">${p.salary.toLocaleString()}</span>
                                   </div>
                                   <p className="text-slate-400 font-semibold text-sm">Tagged: <span className="text-indigo-300">{p.companyName}</span></p>
                                </div>
                                <div className="text-right">
                                   {p.status === 'pending_company_approval' && (
                                     <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-500 rounded-lg text-sm font-bold border border-amber-500/20">
                                       <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> Awaiting Employer
                                     </span>
                                   )}
                                   {p.status === 'verified_by_employer' && (
                                     <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm font-bold border border-emerald-500/20">
                                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Verified & Sealed
                                     </span>
                                   )}
                                </div>
                             </div>
                          </li>
                       ))}
                    </ul>
                 )}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;

import React, { useState, useEffect } from 'react';

const CompanyDashboard = ({ token, account }) => {
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlacements();
  }, []);

  const fetchPlacements = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/company/placements', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.placements) {
        setPlacements(data.placements);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (verificationCode) => {
    try {
      const res = await fetch('http://localhost:8000/api/placements/company-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ verificationCode, txHash: "0x" + Math.random().toString(16).slice(2) })
      });
      const data = await res.json();
      if (data.success) {
        fetchPlacements(); // refresh list
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container-custom py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-2 text-white">Company Approval Inbox</h1>
        <p className="text-slate-400">Review and mathematically verify placement claims uploaded by students.</p>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 bg-slate-900 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Pending verifications</h2>
            <div className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-bold uppercase tracking-wider border border-indigo-500/20">Action Required</div>
        </div>
        <div className="p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 text-xs font-bold tracking-widest text-slate-500 uppercase">
                <th className="p-4 pl-6">Student</th>
                <th className="p-4">College</th>
                <th className="p-4">Role</th>
                <th className="p-4">Salary</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="p-8 text-center text-slate-400">Loading inbox...</td></tr>
              ) : placements.length === 0 ? (
                <tr><td colSpan="6" className="p-12 text-center text-slate-500">No placements awaiting your verification.</td></tr>
              ) : (
                placements.map(p => (
                  <tr key={p._id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="font-bold text-white">{p.studentName}</div>
                      <div className="text-xs text-slate-400">{p.studentEmail}</div>
                    </td>
                    <td className="p-4 text-sm text-slate-300">{p.college}</td>
                    <td className="p-4 text-sm text-slate-300">{p.role}</td>
                    <td className="p-4 font-mono text-emerald-400">${p.salary.toLocaleString()}</td>
                    <td className="p-4">
                      {p.status === 'pending_company_approval' ? (
                        <span className="px-2 py-1 bg-amber-500/10 text-amber-500 rounded text-xs font-bold border border-amber-500/20">Pending Review</span>
                      ) : (
                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded text-xs font-bold border border-emerald-500/20">Verified</span>
                      )}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      {p.status === 'pending_company_approval' && (
                        <button 
                          onClick={() => handleVerify(p.verificationCode)}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                        >
                          Approve Identity
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;

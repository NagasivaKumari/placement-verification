import React, { useState, useEffect } from 'react';

const StudentDashboard = ({ account, token }) => {
  const [placements, setPlacements] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [applyRole, setApplyRole] = useState({});

  const API_URL = 'http://localhost:3000';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const placeResp = await fetch(`${API_URL}/api/student/placements`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const placeData = await placeResp.json();
        if (placeData.success) setPlacements(placeData.placements);

        const compResp = await fetch(`${API_URL}/api/companies/active`);
        const compData = await compResp.json();
        if(compData.success) setCompanies(compData.companies);

      } catch (err) {
        setError('Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const handleApply = async (companyWallet) => {
    const role = applyRole[companyWallet] || 'Software Engineer';
    try {
        const response = await fetch(`${API_URL}/api/placements/apply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ companyWallet, role })
        });
        const data = await response.json();
        if(data.success) {
            alert(`Applied successfully!`);
            window.location.reload();
        } else {
            alert(data.error);
        }
    } catch(err) {
        alert(err.message);
    }
  };

  const handleConfirmPlacement = async (e) => {
    e.preventDefault();
    if(!verificationCode || !studentEmail) return setError("Code and email required");
    setError(null);
    setSuccess(null);
    try {
        const response = await fetch(`${API_URL}/api/placements/student-confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ verificationCode, studentEmail })
        });
        const data = await response.json();
        if(data.success) {
            setSuccess(data.message);
            setVerificationCode('');
            window.location.reload(); 
        } else {
            setError(data.error);
        }
    } catch(err) {
        setError(err.message);
    }
  };

  if (!account) return <div className="container-custom py-20 text-center">Connect your wallet to access the Student Dashboard.</div>;
  if (loading) return <div className="container-custom py-20 text-center">Loading...</div>;

  return (
    <div className="container-custom py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <h1 className="text-4xl font-black mb-8">Student Dashboard</h1>
        <form onSubmit={handleConfirmPlacement} className="flex gap-2">
            <input type="email" placeholder="Your Email" value={studentEmail} onChange={e => setStudentEmail(e.target.value)} className="input-field" required/>
            <input type="text" placeholder="Offer Code" value={verificationCode} onChange={e => setVerificationCode(e.target.value)} className="input-field" required/>
            <button type="submit" className="btn-primary flex items-center gap-2">Accept Custom Offer</button>
        </form>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl mb-4 text-red-500">{error}</div>}
      {success && <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl mb-4 text-emerald-500">{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Active Placements / Applications */}
          <div className="premium-card overflow-hidden !p-0">
            <div className="p-6 border-b border-white/5"><h2 className="text-xl font-bold">My Applications</h2></div>
            <div className="overflow-x-auto">
                <table className="w-full text-left bg-transparent">
                  <thead className="bg-[#0f172a]">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Role</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Status</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {placements.map((p, i) => (
                      <tr key={i} className="hover:bg-white/[0.02]">
                        <td className="px-6 py-4 text-sm font-semibold">{p.role}</td>
                        <td className="px-6 py-4 text-xs">
                           {p.status === 'applied' && <span className="text-yellow-500">Application Sent</span>}
                           {p.status === 'offer_issued' && <span className="text-emerald-500 font-bold">Offer Issued!</span>}
                           {p.status === 'student_confirmed' && <span className="text-blue-500">Joined. Awaiting Employer Validation</span>}
                           {p.status === 'fully_verified' && <span className="text-purple-500">100% Verified</span>}
                        </td>
                        <td className="px-6 py-4 text-xs">
                            {p.status === 'offer_issued' && (
                                <div className="text-slate-400">Offer Code: <br/><strong className="text-white select-all">{p.verificationCode}</strong></div>
                            )}
                        </td>
                      </tr>
                    ))}
                    {placements.length === 0 && <tr><td colSpan="3" className="p-6 text-slate-500 text-center">No applications found.</td></tr>}
                  </tbody>
                </table>
            </div>
          </div>

          {/* Company Directory */}
          <div className="premium-card overflow-hidden !p-0">
            <div className="p-6 border-b border-white/5"><h2 className="text-xl font-bold">Company Directory</h2></div>
            <div className="overflow-x-auto h-[400px]">
                <table className="w-full text-left bg-transparent">
                  <thead className="bg-[#0f172a] sticky top-0">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Company</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Industry</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Target Role</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Apply</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {companies.map((c, i) => (
                      <tr key={i} className="hover:bg-white/[0.02]">
                        <td className="px-6 py-4 text-sm font-semibold">{c.name}</td>
                        <td className="px-6 py-4 text-xs text-slate-400">{c.details?.industry || 'General'}</td>
                        <td className="px-6 py-4">
                            <input type="text" className="input-field !py-1 !px-2 text-xs w-24" placeholder="Role?" onChange={e => setApplyRole({...applyRole, [c.walletAddress]: e.target.value})} />
                        </td>
                        <td className="px-6 py-4">
                            <button onClick={() => handleApply(c.walletAddress)} className="btn-primary btn-xs !py-1">Apply</button>
                        </td>
                      </tr>
                    ))}
                    {companies.length === 0 && <tr><td colSpan="4" className="p-6 text-slate-500 text-center">No companies registered.</td></tr>}
                  </tbody>
                </table>
            </div>
          </div>
      </div>
    </div>
  );
};

export default StudentDashboard;

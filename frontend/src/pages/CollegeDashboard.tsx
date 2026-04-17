import React, { useState, useEffect } from 'react';

const CollegeDashboard = ({ account, token }) => {
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({ totalStudents: 0, verifiedStudents: 0, placementTruthRate: 0, flags: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      const studentRes = await fetch('http://localhost:8000/api/college/students', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const studentData = await studentRes.json();
      if (studentData.success) {
        setStudents(studentData.students);
        const verified = studentData.students.filter(s => s.details?.collegeVerified).length;
        setStats({
          totalStudents: studentData.students.length,
          verifiedStudents: verified,
          placementTruthRate: 88, // Mocked for now
          flags: 0
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyStudent = async (studentWallet) => {
    try {
      const res = await fetch('http://localhost:8000/api/college/verify-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ studentWallet })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [verifyingDegree, setVerifyingDegree] = useState(null); // student wallet
  const [degreeForm, setDegreeForm] = useState({ name: '', year: new Date().getFullYear() });

  const handleVerifyDegree = async (studentWallet) => {
    try {
      const res = await fetch('http://localhost:8000/api/college/verify-degree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
            studentWallet, 
            degreeName: degreeForm.name, 
            graduationYear: parseInt(degreeForm.year) 
        })
      });
      const data = await res.json();
      if (data.success) {
        setVerifyingDegree(null);
        fetchData();
      } else {
        alert(data.message || "Failed to certify degree.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading College Interface...</div>;

  return (
    <div className="container-custom py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-white mb-2">Institutional Admin</h1>
          <p className="text-slate-400">Verifying identity and certifying degrees to prevent credential fraud.</p>
        </div>
        <div className="flex gap-4">
           <div className="px-6 py-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Truth Score</span>
              <span className="text-2xl font-black text-emerald-500">{stats.placementTruthRate}%</span>
           </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h4 className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-4">Total Roster</h4>
          <p className="text-4xl font-black text-white">{stats.totalStudents}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h4 className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-4">Identity Sealed</h4>
          <p className="text-4xl font-black text-emerald-400">{stats.verifiedStudents}</p>
        </div>
        <div className="bg-slate-900 border border-indigo-500/20 p-6 rounded-2xl">
          <h4 className="text-indigo-400 font-bold text-xs uppercase tracking-widest mb-4">Degrees Certified</h4>
          <p className="text-4xl font-black text-indigo-400">{students.filter(s => s.details?.degreeVerified).length}</p>
        </div>
        <div className="bg-slate-900 border border-red-500/10 p-6 rounded-2xl outline outline-1 outline-red-500/5">
          <h4 className="text-red-500 font-bold text-xs uppercase tracking-widest mb-4">Fraud Flags</h4>
          <p className="text-4xl font-black text-red-500">{stats.flags}</p>
        </div>
      </div>

      {/* Student List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h3 className="text-xl font-bold text-white">Academic Credential Ledger</h3>
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
             <button className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold">All Students</button>
             <button className="px-4 py-1.5 text-slate-500 hover:text-slate-300 rounded-lg text-xs font-bold">Pending Approval</button>
          </div>
        </div>
        <div className="p-0">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-950/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 border-b border-slate-800">
                <th className="px-8 py-4">Identity & Wallet</th>
                <th className="px-8 py-4">Academic Status</th>
                <th className="px-8 py-4">Certification</th>
                <th className="px-8 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {students.map((s, i) => (
                <tr key={i} className={`hover:bg-slate-800/20 transition-all ${verifyingDegree === s.walletAddress ? 'bg-indigo-500/5' : ''}`}>
                  <td className="px-8 py-6">
                    <div className="font-bold text-white mb-1 uppercase tracking-tighter">{s.name || "Anonymous User"}</div>
                    <div className="text-[10px] font-mono text-slate-600 truncate w-40">{s.walletAddress}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-xs text-slate-300 font-bold">{s.details?.course || "Not Programmed"}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase mt-1">ID: {s.details?.enrollmentId || "N/A"}</div>
                  </td>
                  <td className="px-8 py-6">
                     <div className="flex flex-col gap-1.5">
                        {s.details?.collegeVerified ? (
                          <span className="w-fit px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded text-[9px] font-black uppercase border border-indigo-500/20">Identity Sealed</span>
                        ) : (
                          <span className="w-fit px-2 py-0.5 bg-slate-800 text-slate-500 rounded text-[9px] font-black uppercase border border-slate-700">Unverified</span>
                        )}
                        {s.details?.degreeVerified && (
                           <div className="flex flex-col">
                              <span className="w-fit px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[9px] font-black uppercase border border-emerald-500/20">Degree Certified</span>
                              {s.details.degreeSbtId && <span className="text-[8px] font-mono text-slate-600 mt-1">ASA ID: {s.details.degreeSbtId}</span>}
                           </div>
                        )}
                     </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    {verifyingDegree === s.walletAddress ? (
                       <div className="flex flex-col gap-2 animate-in slide-in-from-right-2">
                          <input 
                            type="text" 
                            placeholder="Degree Name (e.g. B.Tech)" 
                            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                            value={degreeForm.name}
                            onChange={e => setDegreeForm(prev => ({...prev, name: e.target.value}))}
                          />
                          <input 
                            type="number" 
                            placeholder="Year" 
                            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                            value={degreeForm.year}
                            onChange={e => setDegreeForm(prev => ({...prev, year: e.target.value}))}
                          />
                          <div className="flex gap-2 justify-end">
                             <button onClick={() => setVerifyingDegree(null)} className="text-[10px] text-slate-500 font-bold">Cancel</button>
                             <button onClick={() => handleVerifyDegree(s.walletAddress)} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase">Issue SBT</button>
                          </div>
                       </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        {!s.details?.collegeVerified && (
                          <button 
                            onClick={() => handleVerifyStudent(s.walletAddress)}
                            className="bg-white text-slate-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all transform active:scale-95"
                          >
                            Seal Identity
                          </button>
                        )}
                        {s.details?.collegeVerified && !s.details?.degreeVerified && (
                          <button 
                            onClick={() => setVerifyingDegree(s.walletAddress)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                          >
                            Certify Degree
                          </button>
                        )}
                        {s.details?.degreeVerified && (
                           <span className="text-emerald-500 font-black text-[10px] uppercase tracking-widest">Verified 🏆</span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {students.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-20 text-center text-slate-500">
                     <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 grayscale opacity-20">
                        <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a7 7 0 00-7 7v1h12v-1a7 7 0 00-7-7z"></path></svg>
                     </div>
                     <p className="font-bold uppercase tracking-widest text-xs">No students have linked to this institution yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CollegeDashboard;

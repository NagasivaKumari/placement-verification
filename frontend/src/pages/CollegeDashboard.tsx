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
        const verified = studentData.students.filter(s => s.details?.isVerifiedByCollege).length;
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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading College Interface...</div>;

  return (
    <div className="container-custom py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-white mb-2">Institutional Admin</h1>
          <p className="text-slate-400">Verifying the identity of students to prevent institutional impersonation.</p>
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
          <h4 className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-4">Identity Verified</h4>
          <p className="text-4xl font-black text-white">{stats.verifiedStudents}</p>
        </div>
        <div className="bg-slate-900 border border-indigo-500/20 p-6 rounded-2xl">
          <h4 className="text-indigo-400 font-bold text-xs uppercase tracking-widest mb-4">Pending Approval</h4>
          <p className="text-4xl font-black text-indigo-400">{stats.totalStudents - stats.verifiedStudents}</p>
        </div>
        <div className="bg-slate-900 border border-red-500/10 p-6 rounded-2xl outline outline-1 outline-red-500/5">
          <h4 className="text-red-500 font-bold text-xs uppercase tracking-widest mb-4">Fraud Flags</h4>
          <p className="text-4xl font-black text-red-500">{stats.flags}</p>
        </div>
      </div>

      {/* Student List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h3 className="text-xl font-bold text-white">Student Enrollment Verification</h3>
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
             <button className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold">All Students</button>
             <button className="px-4 py-1.5 text-slate-500 hover:text-slate-300 rounded-lg text-xs font-bold">Pending Only</button>
          </div>
        </div>
        <div className="p-0">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-950/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 border-b border-slate-800">
                <th className="px-8 py-4">Identity & Wallet</th>
                <th className="px-8 py-4">Academic Details</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {students.map((s, i) => (
                <tr key={i} className="hover:bg-slate-800/20 transition-all">
                  <td className="px-8 py-6">
                    <div className="font-bold text-white mb-1">{s.name || "Anonymous User"}</div>
                    <div className="text-xs font-mono text-slate-500 truncate w-40">{s.walletAddress}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-sm text-slate-300">{s.details?.course || "Undeclared Course"}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase">ID: {s.details?.enrollmentId || "N/A"}</div>
                  </td>
                  <td className="px-8 py-6">
                    {s.details?.isVerifiedByCollege ? (
                      <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded text-[10px] font-black uppercase border border-emerald-500/20">Official Student</span>
                    ) : (
                      <span className="px-2 py-1 bg-slate-800 text-slate-400 rounded text-[10px] font-black uppercase border border-slate-700">Guest / Unverified</span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    {!s.details?.isVerifiedByCollege && (
                      <button 
                        onClick={() => handleVerifyStudent(s.walletAddress)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all transform active:scale-95"
                      >
                        Confirm Enrollment
                      </button>
                    )}
                    {s.details?.isVerifiedByCollege && (
                      <div className="text-emerald-500 flex items-center justify-end gap-2 text-xs font-bold">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        Identity Sealed
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

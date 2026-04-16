import React, { useState, useEffect } from 'react';

const CollegeDashboard = ({ account, token }) => {
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [anomalyFlag, setAnomalyFlag] = useState(false);

  const API_URL = 'http://localhost:3000';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsResponse = await fetch(`${API_URL}/api/colleges/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const statsData = await statsResponse.json();
        if (statsData.success) {
          const myStats = statsData.stats.length > 0 ? statsData.stats[0] : { totalOffers: 0, averageSalary: 0, fullyVerified: 0, isAnomaly: false };
          setStats({
              placementRate: myStats.totalOffers * 10,
              averageSalary: myStats.averageSalary || 0,
              verifiedPlacements: myStats.fullyVerified,
              studentSatisfaction: 95,
              fraudAttempts: myStats.isAnomaly ? 10 : 0
          });
          setAnomalyFlag(myStats.isAnomaly);
        }

        const studentResponse = await fetch(`${API_URL}/api/college/students`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const studentData = await studentResponse.json();
        if(studentData.success) {
            setStudents(studentData.students);
        }
      } catch (err) {
        setError('Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const verifyStudent = async (studentWallet) => {
    try {
        const response = await fetch(`${API_URL}/api/college/verify-student`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ studentWallet })
        });
        const data = await response.json();
        if(data.success) {
            alert("Student identity verified safely for the ledger!");
            setStudents(students.map(s => s.walletAddress === studentWallet ? { ...s, details: { ...s.details, isVerifiedByCollege: true } } : s));
        } else {
            alert(data.error);
        }
    } catch(err) {
        alert(err.message);
    }
  };

  if (!account) return <div className="container-custom py-20 text-center">Connect your wallet to access the College Dashboard.</div>;
  if (loading) return <div className="container-custom py-20 text-center">Loading dashboard...</div>;

  return (
    <div className="container-custom py-12">
      <h1 className="text-4xl font-black mb-8">College Dashboard</h1>
      {error && <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl mb-4 text-red-500">{error}</div>}
      
      {stats && (
        <div className="premium-card p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <h2 className="text-2xl font-black mb-2">Placement Statistics</h2>
              <ul className="text-slate-400 space-y-2">
                <li>Placement Rate: <span className="font-bold text-white">{stats.placementRate}%</span></li>
                <li>Average Salary: <span className="font-bold text-white">₹{stats.averageSalary}</span></li>
                <li>Verified Placements: <span className="font-bold text-white">{stats.verifiedPlacements}</span></li>
              </ul>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-black mb-2">Anomaly Detection</h2>
              {anomalyFlag ? (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-500 font-bold">High fraud attempts detected! Review placements.</div>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-emerald-500 font-bold">No anomalies detected. Valid Ledger.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Student Verification Table */}
      <div className="premium-card overflow-hidden !p-0">
        <div className="p-8 border-b border-white/5">
            <h2 className="text-2xl font-black">Enrolled Students Identity Verification</h2>
            <p className="text-sm text-slate-400 mt-2">Approve students to allow them to securely receive placement verification from companies under your banner.</p>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-white/5">
                        <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Student Name</th>
                        <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Course & Year</th>
                        <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">ID / Enrollment</th>
                        <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {students.map((student, i) => (
                        <tr key={i}>
                            <td className="px-8 py-6">{student.name} <br/><span className="text-xs text-slate-500">{student.email}</span></td>
                            <td className="px-8 py-6">{student.details?.course} <br/><span className="text-xs text-slate-500">Year: {student.details?.year}</span></td>
                            <td className="px-8 py-6 font-mono text-white">{student.details?.enrollmentId || "N/A"}</td>
                            <td className="px-8 py-6">
                                {student.details?.isVerifiedByCollege ? (
                                    <span className="badge-verified">Verified Active</span>
                                ) : (
                                    <button onClick={() => verifyStudent(student.walletAddress)} className="btn-primary btn-sm">Verify ID</button>
                                )}
                            </td>
                        </tr>
                    ))}
                    {students.length === 0 && (
                        <tr><td colSpan="4" className="px-8 py-6 text-center text-slate-500">No students found assigned to this college yet.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default CollegeDashboard;

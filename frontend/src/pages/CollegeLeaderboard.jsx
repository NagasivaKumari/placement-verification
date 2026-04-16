import React, { useState, useEffect } from 'react';

const CollegeLeaderboard = () => {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_URL = 'http://localhost:3000';

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch(`${API_URL}/api/colleges/stats`);
                const data = await response.json();
                if (data.success) {
                    setStats(data.stats);
                } else {
                    setError(data.error);
                }
            } catch (err) {
                setError('Failed to load leaderboard data.');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const getTrustScore = (stat) => {
        if (stat.totalOffers === 0) return 0;
        return Math.round((stat.fullyVerified / stat.totalOffers) * 100);
    };

    if (loading) {
        return (
            <div className="container-custom py-20 text-center">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-slate-400 font-bold uppercase tracking-widest text-xs">Auditing Network...</p>
            </div>
        );
    }

    return (
        <div className="container-custom py-12">
            <header className="mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-[10px] uppercase tracking-widest mb-4">
                   Blockchain Audit Live
                </div>
                <h1 className="text-5xl font-black mb-4">Institutional <span className="gradient-text">Trust Scoreboard.</span></h1>
                <p className="text-slate-400 max-w-2xl">
                    We rank colleges by their **Verified Employment Rate**, not just offer letters. 
                    <br/>Our algorithms filter out "Ghost Offers" and unconfirmed claims.
                </p>
            </header>

            {error && (
                <div className="premium-card border-red-500/20 bg-red-500/5 p-6 mb-8 flex items-center gap-4 text-red-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <p className="font-bold">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                {stats.length === 0 ? (
                    <div className="glass-card p-12 text-center text-slate-500">
                        No auditing data available yet. Be the first to verify a college!
                    </div>
                ) : (
                    stats.map((college, idx) => (
                        <div key={idx} className={`premium-card group hover:scale-[1.01] transition-all duration-300 ${college.isAnomaly ? 'border-red-500/30' : ''}`}>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black border border-white/5 ${college.isHighTrust ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-indigo-500'}`}>
                                            {idx + 1}
                                        </div>
                                        <h2 className="text-2xl font-black text-white group-hover:text-indigo-400 transition-colors uppercase italic tracking-tight">{college.college}</h2>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {college.isHighTrust && (
                                            <span className="badge-verified bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-4">
                                                ✓ Verified High-Trust
                                            </span>
                                        )}
                                        {college.isAnomaly && (
                                            <span className="badge-unverified bg-red-500 alert-pulse text-white border-none px-4 flex items-center gap-2">
                                                ⚠️ ANOMALY DETECTED
                                            </span>
                                        )}
                                        <span className="badge-verified bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                                            {college.employersCount} Verified Employers
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-8 md:px-8 border-l border-white/5">
                                    <div className="text-center">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 text-slate-400">Offers</p>
                                        <p className="text-2xl font-black text-slate-300">{college.totalOffers}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 text-yellow-500">Joined</p>
                                        <p className="text-2xl font-black text-yellow-500">{college.studentConfirmed}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 text-emerald-500">Certified</p>
                                        <p className="text-2xl font-black text-emerald-400">{college.salaryVerified}</p>
                                    </div>
                                </div>

                                <div className={`w-full md:w-32 flex flex-col items-center justify-center p-4 rounded-2xl border ${college.isHighTrust ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/5 border-white/5'}`}>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1 text-center leading-tight">Audit Score</p>
                                    <p className={`text-3xl font-black ${college.trustScore > 80 ? 'text-emerald-500' : college.isAnomaly ? 'text-red-500' : 'text-amber-500'}`}>
                                        {Math.round(college.trustScore)}%
                                    </p>
                                </div>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="mt-8 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                                <div 
                                    className={`h-full transition-all duration-1000 ${college.isAnomaly ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]'}`}
                                    style={{ width: `${college.trustScore}%` }}
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>

            <section className="mt-20 glass-card p-10 border-indigo-500/30">
               <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="bg-indigo-600 rounded-3xl p-6 shadow-2xl shadow-indigo-600/30 text-white">
                     <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                  <div>
                     <h3 className="text-2xl font-black mb-2 italic">How is the "Trust Score" calculated?</h3>
                     <p className="text-slate-400 text-sm leading-relaxed">
                        We calculate the ratio between **On-Chain Placement Offers** and **Final Employer Payroll Verification**. 
                        Colleges with a score below 50% are flagged for "High Verification Gap," meaning many of their claimed offers never turned into real jobs.
                     </p>
                  </div>
               </div>
            </section>
        </div>
    );
};

export default CollegeLeaderboard;

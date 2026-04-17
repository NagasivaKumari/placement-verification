import React, { useState } from 'react';
import TalentPassport from '../components/TalentPassport';

const statusLabel = (status) => {
  if (status === 'salary_verified') return { text: 'Fully Certified ✓', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
  if (status === 'joining_verified') return { text: 'Joined & Working ✓', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
  if (status === 'offer_verified')   return { text: 'Offer Verified ✓', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' };
  if (status === 'pending_company_approval') return { text: 'Awaiting Company Sign', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
  return { text: 'Pending', color: 'text-slate-400 bg-slate-800 border-slate-700' };
};

const VerifyPlacement = () => {
  const [activeTab, setActiveTab] = useState('college');

  // College Search State
  const [collegeName, setCollegeName] = useState('');
  const [collegeResults, setCollegeResults] = useState([]);
  const [collegeLoading, setCollegeLoading] = useState(false);
  const [collegeError, setCollegeError] = useState(null);
  const [collegeSearched, setCollegeSearched] = useState(false);

  // Verification Code State
  const [lookupCode, setLookupCode] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = 'http://localhost:8000';

  const handleCollegeSearch = async (e) => {
    e.preventDefault();
    if (!collegeName.trim()) return;
    setCollegeLoading(true);
    setCollegeError(null);
    setCollegeResults([]);
    setCollegeSearched(true);

    try {
      const response = await fetch(`${API_URL}/api/colleges/search?name=${encodeURIComponent(collegeName)}`);
      const data = await response.json();
      if (data.success) {
        setCollegeResults(data.placements);
      } else {
        setCollegeError('No placements found for this college.');
      }
    } catch (err) {
      setCollegeError('Network error. Please try again.');
    } finally {
      setCollegeLoading(false);
    }
  };

  const handleLookup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/api/placements/lookup/${lookupCode}`);
      const data = await response.json();
      if (data.success) {
        setResult(data.placement);
      } else {
        setError(data.error || 'Placement not found');
      }
    } catch (err) {
      setError('Network error. Profile not found.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-custom py-16">

      {/* Page Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-[10px] uppercase tracking-widest mb-4">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
          Public — No Account Required
        </div>
        <h1 className="text-5xl font-black mb-4 tracking-tight">
          Verify <span className="gradient-text italic">Placement Truth.</span>
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto leading-relaxed">
          Search any college name to see real, employer-signed placement records on the Algorand blockchain. No account needed.
        </p>
      </div>

      {/* Tabs */}
      <div className="max-w-3xl mx-auto">
        <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 mb-8">
          <button
            onClick={() => { setActiveTab('college'); setError(null); setResult(null); }}
            className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all text-sm ${activeTab === 'college' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            🏫 Search by College Name
          </button>
          <button
            onClick={() => { setActiveTab('code'); setCollegeError(null); setCollegeResults([]); }}
            className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all text-sm ${activeTab === 'code' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            🔍 Search by Verification Code
          </button>
        </div>

        {/* COLLEGE NAME SEARCH TAB */}
        {activeTab === 'college' && (
          <div>
            <form onSubmit={handleCollegeSearch} className="flex gap-3 mb-8">
              <div className="flex-1 relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  placeholder="Type college name... e.g. IIT Hyderabad"
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl pl-12 pr-4 py-4 text-white outline-none focus:border-indigo-500 transition-all text-lg placeholder-slate-600"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={collegeLoading}
                className="btn-primary px-8 py-4 whitespace-nowrap"
              >
                {collegeLoading ? 'Searching...' : 'Search'}
              </button>
            </form>

            {collegeError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-center font-bold text-sm mb-6">
                {collegeError}
              </div>
            )}

            {collegeSearched && !collegeLoading && collegeResults.length === 0 && !collegeError && (
              <div className="premium-card text-center py-16 opacity-60">
                <p className="text-4xl mb-4">🔍</p>
                <p className="font-black text-lg text-white mb-2">No Verified Placements Found</p>
                <p className="text-slate-500 text-sm">
                  No employer has signed any placement for "<strong className="text-white">{collegeName}</strong>" yet.
                  <br/>This could mean this college has <span className="text-red-400 font-bold">no real verified placements</span> on-chain.
                </p>
              </div>
            )}

            {collegeResults.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-black text-white">
                    {collegeResults.length} Verified Placement{collegeResults.length > 1 ? 's' : ''} at{' '}
                    <span className="text-indigo-400">{collegeName}</span>
                  </h2>
                  <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                    On-Chain Verified
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  {collegeResults.map((p, idx) => {
                    const badge = statusLabel(p.status);
                    return (
                      <div key={idx} className="premium-card hover:border-emerald-500/30 transition-all group">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h3 className="text-xl font-black text-white group-hover:text-emerald-400 transition-colors">{p.studentName}</h3>
                            <p className="text-slate-400 text-sm font-semibold">{p.role} <span className="text-slate-600">at</span> <span className="text-indigo-400 font-bold">{p.companyName}</span></p>
                            <p className="text-emerald-400 font-mono font-bold text-sm mt-1">₹{parseInt(p.salary).toLocaleString()} / year</p>
                          </div>
                          <div className="flex flex-col items-start md:items-end gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border text-emerald-500 bg-emerald-500/10 border-emerald-500/20">
                              ✓ Fully Certified — All 3 Phases
                            </span>
                            <div className="flex flex-col items-start md:items-end gap-1">
                              {p.txHash && (
                                <a href={`https://testnet.algoexplorer.io/tx/${p.txHash}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-400 font-mono hover:text-indigo-300">
                                  🔗 TX: {p.txHash.slice(0, 10)}...
                                </a>
                              )}
                              {p.sbtAssetId && (
                                <a href={`https://testnet.algoexplorer.io/asset/${p.sbtAssetId}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-emerald-400 font-mono hover:text-emerald-300">
                                  🆔 SBT ID: {p.sbtAssetId}
                                </a>
                              )}
                              {p.ipfsCid && (
                                <a href={`https://ipfs.io/ipfs/${p.ipfsCid}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-amber-500 font-mono hover:text-amber-400">
                                  📦 IPFS: {p.ipfsCid.slice(0, 10)}...
                                </a>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-600 font-mono">Signed by: {p.companyWallet?.slice(0,8)}...{p.companyWallet?.slice(-4)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VERIFICATION CODE SEARCH TAB */}
        {activeTab === 'code' && (
          <div className="premium-card">
            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-6 font-bold text-sm text-center">{error}</div>}
            <form onSubmit={handleLookup} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Verification Code</label>
                <p className="text-[10px] text-slate-600 mb-3">Find this code on the student's physical offer certificate or on their Student Hub dashboard.</p>
                <input
                  type="text"
                  value={lookupCode}
                  onChange={(e) => setLookupCode(e.target.value)}
                  className="input-field text-center font-mono text-xl tracking-widest uppercase"
                  placeholder="Paste code here..."
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-4 uppercase tracking-widest text-sm">
                {loading ? 'Querying Ledger...' : 'Query Ledger'}
              </button>
            </form>

            {result && (
              <div className="mt-12 pt-8 border-t border-white/5">
                {result.status === 'salary_verified' ? (
                  <TalentPassport placement={result} />
                ) : (
                  <div>
                    <div className="flex flex-col mb-6 bg-indigo-600/10 border border-indigo-500/20 p-4 rounded-2xl">
                      <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                        On-Chain Authenticity Proof
                      </p>
                      <p className="text-[10px] text-slate-400 mb-1">Digitally Signed By (Employer Wallet):</p>
                      <p className="text-xs font-mono text-white break-all">{result.companyWallet}</p>
                    </div>
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Employee Identity</p>
                        <h3 className="text-3xl font-black text-white">{result.studentName}</h3>
                        <p className="text-indigo-400 font-bold text-sm">{result.role} @ {result.companyName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Verify Tier</p>
                        <span className="badge-verified">Tier 3 Verified</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">College</p>
                        <p className="text-sm font-bold text-white truncate">{result.college}</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Salary Package</p>
                        <p className="text-sm font-bold text-white">₹{parseInt(result.salary).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyPlacement;

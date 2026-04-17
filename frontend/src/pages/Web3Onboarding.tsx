import React from 'react';
import { Link } from 'react-router-dom';

const Web3Onboarding = () => {
  const steps = [
    {
      id: 1,
      title: "Secure Your Identity",
      desc: "TruePlacement uses Blockchain to ensure your career data belongs to YOU, not a central server. To start, you need a 'Wallet'—a secure digital key.",
      icon: "🔑"
    },
    {
      id: 2,
      title: "Install MetaMask",
      desc: "Download the Pera Wallet extension for Chrome. This is your passport to the Algorand Blockchain. Follow the setup to create your secret recovery phrase.",
      icon: "🦊",
      link: "https://metamask.io/download/"
    },
    {
      id: 3,
      title: "Switch to Algorand TestNet",
      desc: "Add the Algorand TestNet to your wallet. This is where the magic happens—where your 'Talent Passport' is minted with near-zero fees.",
      icon: "🕸️",
      details: "Network: Algorand TestNet, Node: https://testnet-api.algonode.cloud, Chain ID: N/A"
    },
    {
      id: 4,
      title: "Mint Your Future",
      desc: "Once your wallet is connected, companies can verify your salary. You will receive a 'Soulbound Token' (SBT)—an immutable credential that proves your success.",
      icon: "🚀"
    }
  ];

  return (
    <div className="container-custom py-20 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <span className="badge-verified bg-indigo-500/10 text-indigo-400 px-4 mb-4">Web3 Onboarding Portal</span>
          <h1 className="text-6xl font-black mb-6 tracking-tight leading-tight">Your Career, <span className="gradient-text uppercase italic">On-Chain.</span></h1>
          <p className="text-slate-400 text-xl max-w-2xl mx-auto italic">
            Don't worry about the tech—we are here to guide you from Web2 student to Web3 Professional. 
          </p>
        </div>

        <div className="grid gap-8">
          {steps.map((step) => (
            <div key={step.id} className="premium-card relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-500">
              <div className="flex gap-8 items-start relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-white/5 flex items-center justify-center text-4xl shadow-xl shadow-indigo-500/10 group-hover:scale-110 transition-transform duration-500">
                  {step.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-indigo-500 font-black text-sm uppercase tracking-widest">Step 0{step.id}</span>
                    <h2 className="text-2xl font-black text-white uppercase italic">{step.title}</h2>
                  </div>
                  <p className="text-slate-400 text-lg leading-relaxed mb-4">{step.desc}</p>
                  
                  {step.link && (
                    <a href={step.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-indigo-400 font-bold hover:text-indigo-300 transition-colors">
                      Download Official Extension <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                  )}

                  {step.details && (
                    <div className="bg-slate-900/80 p-4 rounded-xl border border-white/5 mt-4">
                       <p className="text-xs font-mono text-indigo-300 break-all">{step.details}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute top-0 right-0 p-8 text-8xl font-black opacity-[0.03] select-none group-hover:opacity-[0.08] transition-opacity uppercase italic -rotate-12">
                {step.id}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link to="/verify" className="btn-primary py-4 px-12 text-lg uppercase tracking-widest">
            I'm Ready to Verify
          </Link>
          <p className="mt-6 text-slate-500 text-sm">
            Stuck? Connect with our <span className="text-indigo-400 font-bold underline cursor-pointer">Education Team</span> on Discord.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Web3Onboarding;

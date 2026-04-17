import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">PlacementVerify</h3>
            <p className="text-gray-400 text-sm">Decentralized placement verification on Algorand blockchain</p>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="/" className="hover:text-white">Home</a></li>
              <li><a href="/verify" className="hover:text-white">Verify</a></li>
              <li><a href="/directory" className="hover:text-white">Directory</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Resources</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="https://developer.algorand.org/docs/" target="_blank" className="hover:text-white">Algorand Docs</a></li>
              <li><a href="https://app.dappflow.org/explorer" target="_blank" className="hover:text-white">Block Explorer</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-white">Terms</a></li>
              <li><a href="#" className="hover:text-white">Privacy</a></li>
            </ul>
          </div>
        </div>

        <hr className="border-gray-700 my-8" />

        <div className="flex justify-between items-center text-gray-400 text-sm">
          <p>&copy; 2024 PlacementVerify. All rights reserved.</p>
          <p>Built for Algorand Global Hackfest 2026</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

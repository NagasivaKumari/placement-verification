import React from 'react';

const TxModal = ({ visible, txId, message, onClose }: { visible: boolean; txId?: string | null; message?: string; onClose: () => void }) => {
  if (!visible) return null;
  // Primary explorer: Pera Wallet's testnet explorer (works reliably with Pera flows)
  const peraExplorer = txId ? `https://testnet.explorer.perawallet.app/tx/${txId}` : 'https://testnet.explorer.perawallet.app/';

  const openUrl = async (url: string) => {
    try {
      const newWin = window.open(url, '_blank');
      if (!newWin) {
        try { await navigator.clipboard.writeText(url); } catch (e) {}
        alert('Could not open explorer tab. TX URL copied to clipboard: ' + url);
      }
    } catch (e) {
      try { await navigator.clipboard.writeText(url); } catch (e) {}
      alert('Could not open explorer. TX URL copied to clipboard: ' + url);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
      <div className="relative bg-slate-900 border border-white/5 rounded-2xl p-6 w-full max-w-lg text-left">
        <h3 className="text-lg font-black text-white mb-2">Transaction Sent</h3>
        {message && <p className="text-sm text-slate-300 mb-4">{message}</p>}
        {txId ? (
          <div className="bg-slate-800 p-4 rounded-md mb-4">
            <p className="text-xs text-slate-400">TXID</p>
            <p className="text-sm font-mono text-white break-all">{txId}</p>
          </div>
        ) : null}
        <div className="flex gap-3 justify-end">
          {txId && (
            <button onClick={() => openUrl(peraExplorer)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold">
              View on Pera Testnet Explorer
            </button>
          )}
          <button onClick={onClose} className="px-4 py-2 bg-white/5 text-slate-200 rounded-lg font-bold">Close</button>
        </div>
      </div>
    </div>
  );
};

export default TxModal;

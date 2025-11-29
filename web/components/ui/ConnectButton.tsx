'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Wallet, LogOut } from 'lucide-react';

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnected && address) {
    return (
      <div className="flex items-center space-x-3">
        <div className="monad-glass px-4 py-2 rounded-xl border border-white/10">
          <div className="text-sm text-gray-200 font-mono font-bold">
            {formatAddress(address)}
          </div>
        </div>
        <button
          onClick={() => disconnect()}
          className="flex items-center space-x-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl transition-all duration-200 backdrop-blur-sm hover:scale-105"
        >
          <LogOut size={16} />
          <span>Disconnect</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex space-x-2">
      {connectors.map((connector) => (
        <button
          key={connector.uid}
          onClick={() => connect({ connector })}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-monad-primary to-monad-purple-light hover:from-monad-purple-light hover:to-monad-primary text-white rounded-xl transition-all duration-300 font-bold shadow-[0_0_20px_rgba(108,84,248,0.3)] hover:shadow-[0_0_30px_rgba(108,84,248,0.5)] hover:scale-105 active:scale-95"
        >
          <Wallet size={18} />
          <span>{connector.name}</span>
        </button>
      ))}
    </div>
  );
}

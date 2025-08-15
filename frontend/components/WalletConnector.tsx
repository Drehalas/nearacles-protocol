/**
 * Simple Wallet Connector Component
 * Basic NEAR wallet connection UI
 */

'use client';

import { useState, useEffect } from 'react';
import { NearWallet } from '../lib/near-wallet.js';

interface WalletConnectorProps {
  onConnectionChange?: (isConnected: boolean, accountId: string | null) => void;
}

export default function WalletConnector({ onConnectionChange }: WalletConnectorProps) {
  const [wallet] = useState(() => new NearWallet());
  const [isConnected, setIsConnected] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      setIsLoading(true);
      await wallet.init();
      
      const connected = wallet.isSignedIn();
      const account = connected ? wallet.getAccountId() : null;
      
      setIsConnected(connected);
      setAccountId(account);
      onConnectionChange?.(connected, account);
    } catch (error) {
      console.error('Wallet connection error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = () => {
    wallet.signIn();
  };

  const handleDisconnect = () => {
    wallet.signOut();
    setIsConnected(false);
    setAccountId(null);
    onConnectionChange?.(false, null);
  };

  if (isLoading) {
    return <div className="p-4">Loading wallet...</div>;
  }

  if (isConnected) {
    return (
      <div className="p-4 border rounded">
        <p className="mb-2">Connected: {accountId}</p>
        <button
          onClick={handleDisconnect}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded">
      <p className="mb-2">Connect your NEAR testnet wallet</p>
      <button
        onClick={handleConnect}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Connect Wallet
      </button>
    </div>
  );
}
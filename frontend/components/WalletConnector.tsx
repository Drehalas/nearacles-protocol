/**
 * Wallet Connector Component
 * Handles NEAR wallet connection UI and state management
 */

'use client';

import { useState, useEffect } from 'react';
import { nearWallet } from '../lib/near-wallet';
import { TESTNET_CONFIG } from '../config/testnet';

interface WalletConnectorProps {
  onConnectionChange?: (isConnected: boolean, accountId: string | null) => void;
}

export default function WalletConnector({ onConnectionChange }: WalletConnectorProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const connected = nearWallet.isSignedIn();
      const account = nearWallet.getAccountId();
      
      setIsConnected(connected);
      setAccountId(account);

      if (connected && account) {
        try {
          const accountBalance = await nearWallet.getAccountBalance();
          setBalance(accountBalance);
        } catch (balanceError) {
          console.warn('Failed to get balance:', balanceError);
          setBalance('N/A');
        }
      }

      onConnectionChange?.(connected, account);
    } catch (error) {
      console.error('Failed to check wallet connection:', error);
      setError('Failed to connect to wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setError(null);
      await nearWallet.signIn();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setError('Failed to connect wallet');
    }
  };

  const handleDisconnect = () => {
    try {
      nearWallet.signOut();
      setIsConnected(false);
      setAccountId(null);
      setBalance(null);
      onConnectionChange?.(false, null);
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      setError('Failed to disconnect wallet');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        <span className="text-sm text-gray-600">Connecting...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-red-600">⚠️ {error}</span>
        <button
          onClick={checkWalletConnection}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-600">
          Connect to {TESTNET_CONFIG.network.networkId}
        </div>
        <button
          onClick={handleConnect}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      {/* Account Info */}
      <div className="flex flex-col items-end text-sm">
        <div className="text-gray-900 font-medium">
          {accountId?.length > 20 ? `${accountId.slice(0, 20)}...` : accountId}
        </div>
        {balance && (
          <div className="text-gray-600 text-xs">
            {balance} NEAR
          </div>
        )}
      </div>

      {/* Network Indicator */}
      <div className="flex items-center space-x-1">
        <span className="inline-flex h-2 w-2 rounded-full bg-green-400"></span>
        <span className="text-xs text-gray-600 uppercase">
          {TESTNET_CONFIG.network.networkId}
        </span>
      </div>

      {/* Disconnect Button */}
      <button
        onClick={handleDisconnect}
        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm transition-colors"
      >
        Disconnect
      </button>
    </div>
  );
}

export function WalletStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);

  useEffect(() => {
    const connected = nearWallet.isSignedIn();
    const account = nearWallet.getAccountId();
    setIsConnected(connected);
    setAccountId(account);
  }, []);

  if (!isConnected) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <span className="text-yellow-600">⚠️</span>
          <span className="text-sm text-yellow-800">
            Connect your NEAR wallet to use the oracle protocol
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-green-600">✅</span>
          <span className="text-sm text-green-800">
            Connected as {accountId}
          </span>
        </div>
        <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
          {TESTNET_CONFIG.network.networkId.toUpperCase()}
        </div>
      </div>
    </div>
  );
}
/**
 * Testnet Banner Component
 * Displays a prominent banner indicating testnet environment
 */

'use client';

import { TESTNET_CONFIG } from '../config/testnet';

export default function TestnetBanner() {
  if (!TESTNET_CONFIG.ui.showTestnetBanner) {
    return null;
  }

  return (
    <div className="bg-orange-500 text-white py-2 px-4 text-center text-sm font-medium">
      <div className="max-w-7xl mx-auto flex items-center justify-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className="inline-flex h-2 w-2 rounded-full bg-white animate-pulse"></span>
          <span>🧪 TESTNET ENVIRONMENT</span>
        </div>
        
        <div className="hidden md:block">•</div>
        
        <div className="text-xs opacity-90">
          This is a test environment. Transactions use testnet NEAR tokens.
        </div>
        
        <div className="hidden lg:block">•</div>
        
        <a 
          href="https://wallet.testnet.near.org"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden lg:inline-flex text-xs underline hover:no-underline"
        >
          Get Testnet NEAR →
        </a>
      </div>
    </div>
  );
}
/**
 * Simple Testnet Banner Component
 * Shows testnet environment indicator
 */

'use client';

export default function TestnetBanner() {
  return (
    <div className="bg-orange-500 text-white py-2 px-4 text-center text-sm">
      🧪 TESTNET ENVIRONMENT - Using test NEAR tokens
    </div>
  );
}
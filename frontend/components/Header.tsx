
'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
            <i className="ri-database-2-line text-white text-xl"></i>
          </div>
          <h1 className="font-['Pacifico'] text-2xl text-gray-900">Nearacles</h1>
        </Link>
        
        <nav className="flex items-center space-x-8">
          <Link href="/v1/dashboard" className="text-gray-600 hover:text-green-600 font-medium relative group">
            Dashboard
            <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-xs px-1.5 py-0.5 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">v1</span>
          </Link>
          <Link href="/v1/oracles" className="text-gray-600 hover:text-green-600 font-medium relative group">
            Oracles
            <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">v1</span>
          </Link>
          <Link href="/v1/analytics" className="text-gray-600 hover:text-green-600 font-medium relative group">
            Analytics
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">v1</span>
          </Link>
          <Link href="/v1/explorer" className="text-gray-600 hover:text-green-600 font-medium relative group">
            Explorer
            <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">v1</span>
          </Link>
          <button 
            className="bg-green-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-800 whitespace-nowrap cursor-pointer"
            aria-label="Connect your NEAR wallet to the platform"
            title="Connect Wallet"
          >
            Connect Wallet
          </button>
        </nav>
      </div>
    </header>
  );
}

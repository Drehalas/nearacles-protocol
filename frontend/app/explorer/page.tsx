
'use client';

import Header from '@/components/Header';
import NearBlocksIntegration from './NearBlocksIntegration';
import ExplorerSearch from './ExplorerSearch';
import TransactionAnalytics from './TransactionAnalytics';
import EntityBrowser from './EntityBrowser';

export default function Explorer() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">NearBlocks Explorer</h1>
          <p className="text-gray-600 mt-2">Integrated NEAR blockchain explorer with real-time analytics and multi-entity support</p>
        </div>
        
        <ExplorerSearch />
        <NearBlocksIntegration />
        <div className="grid lg:grid-cols-2 gap-8 mt-8">
          <TransactionAnalytics />
          <EntityBrowser />
        </div>
      </div>
    </div>
  );
}

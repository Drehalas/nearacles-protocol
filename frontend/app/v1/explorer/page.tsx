import { Metadata } from 'next';
import ExplorerSearch from '@/app/explorer/ExplorerSearch';
import EntityBrowser from '@/app/explorer/EntityBrowser';
import NearBlocksIntegration from '@/app/explorer/NearBlocksIntegration';
import TransactionAnalytics from '@/app/explorer/TransactionAnalytics';

// Version-specific metadata for better sharing and cache control
export const metadata: Metadata = {
  title: "Nearacles v1 - NEAR Blockchain Explorer | Transaction & Entity Browser",
  description: "Version 1.0 NEAR Protocol Blockchain Explorer with comprehensive transaction analytics, entity browsing, and NearBlocks integration.",
  keywords: "NEAR Protocol, Blockchain Explorer, Transactions, Entities, NearBlocks, v1, Analytics",
  openGraph: {
    title: "Nearacles v1 - NEAR Blockchain Explorer",
    description: "Comprehensive NEAR Protocol blockchain explorer with transaction analytics and entity browsing",
    type: "website",
    url: "/v1/explorer",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nearacles v1 - NEAR Blockchain Explorer",
    description: "Comprehensive NEAR Protocol blockchain explorer with transaction analytics and entity browsing",
  },
  robots: {
    index: true,
    follow: true,
    "max-snippet": -1,
    "max-image-preview": "large",
    "max-video-preview": -1,
  },
  other: {
    'cache-control': 'public, max-age=900, stale-while-revalidate=1800',
    'version': '1.0',
    'last-modified': new Date().toISOString(),
  }
};

export default function V1Explorer() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Version Badge */}
      <div className="bg-purple-600 text-white text-center py-2 px-4 text-sm font-medium">
        <span className="inline-flex items-center">
          <i className="ri-search-eye-line mr-2"></i>
          Nearacles v1.0 - Blockchain Explorer
          <span className="ml-2 bg-white/20 px-2 py-1 rounded text-xs">LIVE DATA</span>
        </span>
      </div>
      
      <main className="pt-8">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              NEAR Blockchain Explorer
              <span className="block text-2xl text-purple-600 font-normal mt-2">Version 1.0</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore the NEAR Protocol blockchain with comprehensive transaction analytics, 
              entity browsing, and real-time data integration with NearBlocks.
            </p>
          </div>

          {/* Components */}
          <div className="space-y-8">
            <ExplorerSearch />
            <div className="grid lg:grid-cols-2 gap-8">
              <EntityBrowser />
              <TransactionAnalytics />
            </div>
            <NearBlocksIntegration />
          </div>
        </div>
      </main>
    </div>
  );
}
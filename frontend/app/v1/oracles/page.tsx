import { Metadata } from 'next';
import OracleProviders from '@/app/oracles/OracleProviders';
import DataFeeds from '@/app/oracles/DataFeeds';
import ConsensusAlgorithms from '@/app/oracles/ConsensusAlgorithms';

// Version-specific metadata for better sharing and cache control
export const metadata: Metadata = {
  title: "Nearacles v1 - NEAR Protocol Oracle Services | Real-time Data Feeds",
  description: "Version 1.0 of Nearacles Oracle Services featuring NEAR Protocol integration, real-time data feeds, consensus algorithms, and enterprise-grade oracle providers.",
  keywords: "NEAR Protocol, Oracle, Blockchain, Data Feeds, Consensus, v1, Real-time",
  openGraph: {
    title: "Nearacles v1 - NEAR Protocol Oracle Services",
    description: "Advanced NEAR blockchain oracle platform with multiple data sources and real-time consensus algorithms",
    type: "website",
    url: "/v1/oracles",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nearacles v1 - NEAR Protocol Oracle Services",
    description: "Advanced NEAR blockchain oracle platform with multiple data sources and real-time consensus algorithms",
  },
  robots: {
    index: true,
    follow: true,
    "max-snippet": -1,
    "max-image-preview": "large",
    "max-video-preview": -1,
  },
  other: {
    'cache-control': 'public, max-age=3600, stale-while-revalidate=86400',
    'version': '1.0',
    'last-modified': new Date().toISOString(),
  }
};

export default function V1Oracles() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Version Badge */}
      <div className="bg-green-600 text-white text-center py-2 px-4 text-sm font-medium">
        <span className="inline-flex items-center">
          <i className="ri-code-s-slash-line mr-2"></i>
          Nearacles v1.0 - Oracle Services
          <span className="ml-2 bg-white/20 px-2 py-1 rounded text-xs">STABLE</span>
        </span>
      </div>
      
      <main className="pt-8">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              NEAR Protocol Oracle Services
              <span className="block text-2xl text-green-600 font-normal mt-2">Version 1.0</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Enterprise-grade oracle infrastructure for the NEAR ecosystem with real-time data feeds, 
              consensus algorithms, and comprehensive provider management.
            </p>
          </div>

          {/* Components */}
          <div className="space-y-12">
            <OracleProviders />
            <DataFeeds />
            <ConsensusAlgorithms />
          </div>
        </div>
      </main>
    </div>
  );
}
import { Metadata } from 'next';
import DashboardOverview from '@/app/dashboard/DashboardOverview';
import NetworkStatus from '@/app/dashboard/NetworkStatus';
import OracleMetrics from '@/app/dashboard/OracleMetrics';
import RecentActivity from '@/app/dashboard/RecentActivity';

// Version-specific metadata for better sharing and cache control
export const metadata: Metadata = {
  title: "Nearacles v1 - Dashboard | NEAR Oracle Network Overview",
  description: "Version 1.0 Dashboard for NEAR Protocol Oracle Network featuring network status, oracle metrics, and real-time activity monitoring.",
  keywords: "NEAR Protocol, Oracle Dashboard, Network Status, Metrics, Real-time, v1",
  openGraph: {
    title: "Nearacles v1 - Oracle Network Dashboard",
    description: "Comprehensive dashboard for NEAR Protocol Oracle Network with real-time metrics and status monitoring",
    type: "website",
    url: "/v1/dashboard",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nearacles v1 - Oracle Network Dashboard",
    description: "Comprehensive dashboard for NEAR Protocol Oracle Network with real-time metrics and status monitoring",
  },
  robots: {
    index: true,
    follow: true,
    "max-snippet": -1,
    "max-image-preview": "large",
    "max-video-preview": -1,
  },
  other: {
    'cache-control': 'public, max-age=600, stale-while-revalidate=1200',
    'version': '1.0',
    'last-modified': new Date().toISOString(),
  }
};

export default function V1Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Version Badge */}
      <div className="bg-indigo-600 text-white text-center py-2 px-4 text-sm font-medium">
        <span className="inline-flex items-center">
          <i className="ri-dashboard-3-line mr-2"></i>
          Nearacles v1.0 - Oracle Network Dashboard
          <span className="ml-2 bg-white/20 px-2 py-1 rounded text-xs">ACTIVE</span>
        </span>
      </div>
      
      <main className="pt-8">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Oracle Network Dashboard
              <span className="block text-2xl text-indigo-600 font-normal mt-2">Version 1.0</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Monitor and manage your NEAR Protocol Oracle Network with real-time status updates, 
              performance metrics, and comprehensive activity tracking.
            </p>
          </div>

          {/* Components */}
          <div className="space-y-8">
            <DashboardOverview />
            <div className="grid lg:grid-cols-2 gap-8">
              <NetworkStatus />
              <OracleMetrics />
            </div>
            <RecentActivity />
          </div>
        </div>
      </main>
    </div>
  );
}
import { Metadata } from 'next';
import NetworkAnalytics from '@/app/analytics/NetworkAnalytics';
import OraclePerformance from '@/app/analytics/OraclePerformance';
import CostTracking from '@/app/analytics/CostTracking';
import HealthMonitoring from '@/app/analytics/HealthMonitoring';

// Version-specific metadata for better sharing and cache control
export const metadata: Metadata = {
  title: "Nearacles v1 - Analytics Dashboard | NEAR Oracle Performance Metrics",
  description: "Version 1.0 Analytics Dashboard for NEAR Protocol Oracle Network featuring real-time performance metrics, cost tracking, and health monitoring.",
  keywords: "NEAR Protocol, Oracle Analytics, Performance Metrics, Cost Tracking, Health Monitoring, v1",
  openGraph: {
    title: "Nearacles v1 - Analytics Dashboard",
    description: "Real-time analytics and performance metrics for NEAR Protocol Oracle Network",
    type: "website",
    url: "/v1/analytics",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nearacles v1 - Analytics Dashboard",
    description: "Real-time analytics and performance metrics for NEAR Protocol Oracle Network",
  },
  robots: {
    index: true,
    follow: true,
    "max-snippet": -1,
    "max-image-preview": "large",
    "max-video-preview": -1,
  },
  other: {
    'cache-control': 'public, max-age=1800, stale-while-revalidate=3600',
    'version': '1.0',
    'last-modified': new Date().toISOString(),
  }
};

export default function V1Analytics() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Version Badge */}
      <div className="bg-blue-600 text-white text-center py-2 px-4 text-sm font-medium">
        <span className="inline-flex items-center">
          <i className="ri-bar-chart-line mr-2"></i>
          Nearacles v1.0 - Analytics Dashboard
          <span className="ml-2 bg-white/20 px-2 py-1 rounded text-xs">REAL-TIME</span>
        </span>
      </div>
      
      <main className="pt-8">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Analytics Dashboard
              <span className="block text-2xl text-blue-600 font-normal mt-2">Version 1.0</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive analytics and monitoring for your NEAR Protocol Oracle Network 
              with real-time metrics, performance tracking, and cost optimization insights.
            </p>
          </div>

          {/* Components */}
          <div className="space-y-8">
            <NetworkAnalytics />
            <div className="grid lg:grid-cols-2 gap-8">
              <OraclePerformance />
              <CostTracking />
            </div>
            <HealthMonitoring />
          </div>
        </div>
      </main>
    </div>
  );
}
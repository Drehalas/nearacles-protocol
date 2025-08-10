'use client';

import Header from '@/components/Header';
import NetworkAnalytics from './NetworkAnalytics';
import OraclePerformance from './OraclePerformance';
import CostTracking from './CostTracking';
import HealthMonitoring from './HealthMonitoring';

export default function Analytics() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Real-time analytics, monitoring, and performance tracking</p>
        </div>
        
        <NetworkAnalytics />
        <div className="grid lg:grid-cols-2 gap-8 mt-8">
          <OraclePerformance />
          <CostTracking />
        </div>
        <HealthMonitoring />
      </div>
    </div>
  );
}
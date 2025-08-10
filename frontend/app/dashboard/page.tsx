'use client';

import Header from '@/components/Header';
import DashboardOverview from './DashboardOverview';
import NetworkStatus from './NetworkStatus';
import OracleMetrics from './OracleMetrics';
import RecentActivity from './RecentActivity';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor your NEAR oracle network and blockchain performance</p>
        </div>
        
        <DashboardOverview />
        <div className="grid lg:grid-cols-2 gap-8 mt-8">
          <NetworkStatus />
          <OracleMetrics />
        </div>
        <RecentActivity />
      </div>
    </div>
  );
}
'use client';

export default function RecentActivity() {
  const activities = [
    { type: 'Oracle Update', message: 'Chainlink updated NEAR/USD price to $4.23', time: '2 minutes ago', icon: 'ri-refresh-line', status: 'success' },
    { type: 'Consensus', message: 'Price consensus reached for BTC/USD with 99.8% accuracy', time: '3 minutes ago', icon: 'ri-checkbox-circle-line', status: 'success' },
    { type: 'Validator', message: 'New validator joined the network with 890K NEAR stake', time: '8 minutes ago', icon: 'ri-user-add-line', status: 'info' },
    { type: 'Smart Contract', message: 'Oracle contract deployed to mainnet: oracle.nearacles.near', time: '12 minutes ago', icon: 'ri-code-s-slash-line', status: 'success' },
    { type: 'Storage', message: 'Digital ID document stored with AES-256 encryption', time: '15 minutes ago', icon: 'ri-file-shield-line', status: 'success' },
    { type: 'Token Service', message: 'NEP-141 token NRCS created with oracle pricing integration', time: '18 minutes ago', icon: 'ri-coin-line', status: 'info' },
    { type: 'Network', message: 'Switched to mainnet configuration successfully', time: '22 minutes ago', icon: 'ri-global-line', status: 'success' },
    { type: 'Audit', message: 'System metrics audit topic processed 1,247 messages', time: '25 minutes ago', icon: 'ri-audit-line', status: 'success' }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
        <button className="text-sm text-green-600 hover:text-green-700 font-medium cursor-pointer">
          View All
        </button>
      </div>
      
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-start space-x-4 p-4 hover:bg-gray-50 rounded-lg">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              activity.status === 'success' ? 'bg-green-50 text-green-600' : 
              activity.status === 'info' ? 'bg-blue-50 text-blue-600' : 
              'bg-gray-50 text-gray-600'
            }`}>
              <i className={`${activity.icon} text-lg`}></i>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900">{activity.type}</span>
                <span className="text-xs text-gray-500" suppressHydrationWarning={true}>{activity.time}</span>
              </div>
              <p className="text-sm text-gray-600">{activity.message}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 flex items-center justify-center">
        <button className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center space-x-2 cursor-pointer">
          <span>Load More Activity</span>
          <i className="ri-arrow-down-line"></i>
        </button>
      </div>
    </div>
  );
}
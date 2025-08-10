'use client';

export default function OracleProviders() {
  const providers = [
    { name: 'Chainlink', status: 'Active', reliability: '99.9%', feeds: 15, latency: '0.6s', cost: '$2.10' },
    { name: 'Band Protocol', status: 'Active', reliability: '99.8%', feeds: 12, latency: '0.8s', cost: '$1.85' },
    { name: 'API3', status: 'Active', reliability: '99.7%', feeds: 8, latency: '0.9s', cost: '$1.95' },
    { name: 'DIA', status: 'Active', reliability: '99.6%', feeds: 10, latency: '1.1s', cost: '$1.70' },
    { name: 'Tellor', status: 'Active', reliability: '99.5%', feeds: 6, latency: '1.3s', cost: '$1.50' },
    { name: 'Pyth Network', status: 'Active', reliability: '99.8%', feeds: 18, latency: '0.5s', cost: '$2.25' },
    { name: 'Flux Protocol', status: 'Active', reliability: '99.4%', feeds: 7, latency: '1.2s', cost: '$1.60' },
    { name: 'Chronicle Protocol', status: 'Active', reliability: '99.7%', feeds: 9, latency: '0.7s', cost: '$1.80' },
    { name: 'Umbrella Network', status: 'Syncing', reliability: '99.3%', feeds: 5, latency: '1.4s', cost: '$1.45' }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Oracle Providers</h2>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 text-sm whitespace-nowrap cursor-pointer">
          Add Provider
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm font-medium text-gray-500 border-b border-gray-200">
              <th className="pb-3">Provider</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Reliability</th>
              <th className="pb-3">Active Feeds</th>
              <th className="pb-3">Avg Latency</th>
              <th className="pb-3">Daily Cost</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {providers.map((provider, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="py-4">
                  <div className="font-medium text-gray-900">{provider.name}</div>
                </td>
                <td className="py-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${provider.status === 'Active' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <span className={provider.status === 'Active' ? 'text-green-600' : 'text-yellow-600'}>
                      {provider.status}
                    </span>
                  </div>
                </td>
                <td className="py-4">
                  <span className="font-medium text-gray-900">{provider.reliability}</span>
                </td>
                <td className="py-4">
                  <span className="text-gray-600">{provider.feeds}</span>
                </td>
                <td className="py-4">
                  <span className="text-gray-600">{provider.latency}</span>
                </td>
                <td className="py-4">
                  <span className="text-gray-600">{provider.cost}</span>
                </td>
                <td className="py-4">
                  <div className="flex items-center space-x-2">
                    <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-blue-600 cursor-pointer">
                      <i className="ri-settings-line"></i>
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-green-600 cursor-pointer">
                      <i className="ri-line-chart-line"></i>
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 cursor-pointer">
                      <i className="ri-pause-circle-line"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 grid grid-cols-4 gap-4">
        <div className="p-4 bg-green-50 rounded-lg text-center">
          <div className="text-xl font-bold text-green-600">9/9</div>
          <div className="text-sm text-green-700">Active Providers</div>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg text-center">
          <div className="text-xl font-bold text-blue-600">95</div>
          <div className="text-sm text-blue-700">Total Data Feeds</div>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg text-center">
          <div className="text-xl font-bold text-purple-600">0.8s</div>
          <div className="text-sm text-purple-700">Avg Response Time</div>
        </div>
        <div className="p-4 bg-orange-50 rounded-lg text-center">
          <div className="text-xl font-bold text-orange-600">$16.20</div>
          <div className="text-sm text-orange-700">Daily Total Cost</div>
        </div>
      </div>
    </div>
  );
}
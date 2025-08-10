'use client';

export default function NetworkAnalytics() {
  const networkMetrics = [
    { label: 'Current TPS', value: '3,247', trend: '+5.1%', icon: 'ri-speed-line' },
    { label: 'Peak TPS (24h)', value: '4,892', trend: '+12.3%', icon: 'ri-bar-chart-line' },
    { label: 'Total Transactions', value: '2.4M', trend: '+8.7%', icon: 'ri-exchange-line' },
    { label: 'Network Nodes', value: '28', trend: '0%', icon: 'ri-server-line' },
    { label: 'Avg Fee Cost', value: '$0.0001', trend: '-2.1%', icon: 'ri-money-dollar-line' },
    { label: 'Success Rate', value: '99.97%', trend: '+0.1%', icon: 'ri-check-line' }
  ];

  const hourlyData = [
    { time: '00:00', tps: 2100, transactions: 7560000 },
    { time: '01:00', tps: 1800, transactions: 6480000 },
    { time: '02:00', tps: 1400, transactions: 5040000 },
    { time: '03:00', tps: 1200, transactions: 4320000 },
    { time: '04:00', tps: 1600, transactions: 5760000 },
    { time: '05:00', tps: 2400, transactions: 8640000 },
    { time: '06:00', tps: 3200, transactions: 11520000 },
    { time: '07:00', tps: 4100, transactions: 14760000 },
    { time: '08:00', tps: 4800, transactions: 17280000 },
    { time: '09:00', tps: 4200, transactions: 15120000 },
    { time: '10:00', tps: 3800, transactions: 13680000 },
    { time: '11:00', tps: 3600, transactions: 12960000 }
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 mb-8">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Network Analytics</h2>
        <p className="text-gray-600 text-sm mt-1">Real-time NEAR network performance and transaction metrics</p>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {networkMetrics.map((metric, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <i className={`${metric.icon} text-white`}></i>
                </div>
                <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                  metric.trend.startsWith('+') ? 'text-green-700 bg-green-100' : 
                  metric.trend.startsWith('-') ? 'text-red-700 bg-red-100' : 'text-gray-700 bg-gray-100'
                }`}>
                  {metric.trend}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{metric.value}</h3>
              <p className="text-gray-600 text-sm mt-1">{metric.label}</p>
            </div>
          ))}
        </div>
        
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Transactions Per Second (TPS)</h3>
          <div className="flex items-end space-x-2 h-48 bg-gray-50 rounded-lg p-4">
            {hourlyData.map((data, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div 
                  className="w-full bg-gradient-to-t from-blue-600 to-purple-600 rounded-sm min-h-1"
                  style={{height: `${(data.tps / 5000) * 160}px`}}
                ></div>
                <span className="text-xs text-gray-500 mt-2">{data.time.slice(0, 2)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
            <span>Peak: 4,892 TPS at 08:00</span>
            <span>Average: 2,847 TPS</span>
            <span>Current: 3,247 TPS</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-lg p-6">
            <h4 className="font-semibold text-blue-900 mb-2">Transaction Types</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Consensus Messages</span>
                <span className="font-medium">47.2%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Token Transfers</span>
                <span className="font-medium">28.4%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Smart Contracts</span>
                <span className="font-medium">15.8%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">File Operations</span>
                <span className="font-medium">8.6%</span>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-6">
            <h4 className="font-semibold text-green-900 mb-2">Geographic Distribution</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">North America</span>
                <span className="font-medium">34.7%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Europe</span>
                <span className="font-medium">28.9%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Asia Pacific</span>
                <span className="font-medium">25.1%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Others</span>
                <span className="font-medium">11.3%</span>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-6">
            <h4 className="font-semibold text-purple-900 mb-2">Network Health</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-purple-700 text-sm">Consensus Health</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-purple-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{width: '99%'}}></div>
                  </div>
                  <span className="text-sm font-medium">99%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-purple-700 text-sm">Node Availability</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-purple-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{width: '96%'}}></div>
                  </div>
                  <span className="text-sm font-medium">96%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-purple-700 text-sm">Network Stability</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-purple-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{width: '98%'}}></div>
                  </div>
                  <span className="text-sm font-medium">98%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
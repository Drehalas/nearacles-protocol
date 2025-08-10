'use client';

export default function OraclePerformance() {
  const oracleStats = [
    {
      name: 'Chainlink',
      uptime: 99.8,
      responseTime: 1.2,
      accuracy: 98.5,
      dataPoints: 1247,
      lastUpdate: '30s ago',
      status: 'excellent'
    },
    {
      name: 'Band Protocol',
      uptime: 99.5,
      responseTime: 1.5,
      accuracy: 97.8,
      dataPoints: 1198,
      lastUpdate: '45s ago',
      status: 'good'
    },
    {
      name: 'API3',
      uptime: 99.2,
      responseTime: 1.8,
      accuracy: 97.2,
      dataPoints: 1089,
      lastUpdate: '1m ago',
      status: 'good'
    },
    {
      name: 'Chronicle',
      uptime: 98.9,
      responseTime: 2.1,
      accuracy: 96.8,
      dataPoints: 1034,
      lastUpdate: '1m ago',
      status: 'warning'
    },
    {
      name: 'Tellor',
      uptime: 96.8,
      responseTime: 3.2,
      accuracy: 94.2,
      dataPoints: 856,
      lastUpdate: '3m ago',
      status: 'warning'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-700 bg-green-100';
      case 'good': return 'text-blue-700 bg-blue-100';
      case 'warning': return 'text-yellow-700 bg-yellow-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Oracle Performance</h3>
        <p className="text-gray-600 text-sm mt-1">Real-time performance metrics for 9 oracle providers</p>
      </div>
      
      <div className="p-6">
        <div className="space-y-4 mb-6">
          {oracleStats.map((oracle, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <i className="ri-database-2-line text-white text-sm"></i>
                  </div>
                  <h4 className="font-medium text-gray-900">{oracle.name}</h4>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(oracle.status)}`}>
                  {oracle.status}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Uptime</div>
                  <div className="font-semibold text-gray-900">{oracle.uptime}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                    <div 
                      className="bg-green-600 h-1 rounded-full" 
                      style={{width: `${oracle.uptime}%`}}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Response Time</div>
                  <div className="font-semibold text-gray-900">{oracle.responseTime}s</div>
                  <div className="text-xs text-gray-500 mt-1">{oracle.dataPoints} data points</div>
                </div>
                <div>
                  <div className="text-gray-600">Accuracy</div>
                  <div className="font-semibold text-gray-900">{oracle.accuracy}%</div>
                  <div className="text-xs text-gray-500 mt-1">{oracle.lastUpdate}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Overall Oracle Network Health</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">98.4%</div>
              <div className="text-sm text-gray-600">Avg Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">1.8s</div>
              <div className="text-sm text-gray-600">Avg Response</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">96.9%</div>
              <div className="text-sm text-gray-600">Avg Accuracy</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
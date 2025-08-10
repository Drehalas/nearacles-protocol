'use client';

export default function DashboardOverview() {
  const metrics = [
    { title: 'Active Oracles', value: '9/9', change: '+0.0%', icon: 'ri-database-line', color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'NEAR TPS', value: '1,847', change: '+12.3%', icon: 'ri-speed-line', color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Data Feeds', value: '24', change: '+4.2%', icon: 'ri-line-chart-line', color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Consensus Accuracy', value: '99.9%', change: '+0.1%', icon: 'ri-checkbox-circle-line', color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Network Latency', value: '0.8s', change: '-0.2s', icon: 'ri-time-line', color: 'text-orange-600', bg: 'bg-orange-50' },
    { title: 'Daily Cost', value: '$23.45', change: '-8.7%', icon: 'ri-wallet-line', color: 'text-blue-600', bg: 'bg-blue-50' }
  ];

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {metrics.map((metric, index) => (
        <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 ${metric.bg} rounded-lg flex items-center justify-center`}>
              <i className={`${metric.icon} ${metric.color} text-xl`}></i>
            </div>
            <span className={`text-sm font-medium ${metric.change.startsWith('+') ? 'text-green-600' : metric.change.startsWith('-') && !metric.title.includes('Cost') && !metric.title.includes('Latency') ? 'text-red-600' : 'text-green-600'}`}>
              {metric.change}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</h3>
          <p className="text-gray-600 text-sm">{metric.title}</p>
        </div>
      ))}
    </div>
  );
}
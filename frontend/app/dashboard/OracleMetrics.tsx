'use client';

export default function OracleMetrics() {
  const priceFeeds = [
    { pair: 'NEAR/USD', price: '$4.23', change: '+2.4%', providers: 9, consensus: '99.9%' },
    { pair: 'BTC/USD', price: '$43,245', change: '+1.8%', providers: 9, consensus: '99.8%' },
    { pair: 'ETH/USD', price: '$2,456', change: '-0.3%', providers: 8, consensus: '99.7%' },
    { pair: 'USDC/USD', price: '$1.0001', change: '+0.0%', providers: 7, consensus: '100.0%' },
    { pair: 'USDT/USD', price: '$0.9998', change: '-0.0%', providers: 6, consensus: '99.9%' }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Oracle Price Feeds</h2>
        <span className="text-sm text-gray-500" suppressHydrationWarning={true}>
          Last updated: {new Date().toLocaleTimeString()}
        </span>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-500 border-b border-gray-200 pb-2">
          <span>Pair</span>
          <span>Price</span>
          <span>Providers</span>
          <span>Consensus</span>
        </div>
        
        {priceFeeds.map((feed, index) => (
          <div key={index} className="grid grid-cols-4 gap-4 text-sm items-center py-2">
            <div className="font-medium text-gray-900">{feed.pair}</div>
            <div className="flex flex-col">
              <span className="font-bold text-gray-900">{feed.price}</span>
              <span className={`text-xs ${feed.change.startsWith('+') ? 'text-green-600' : feed.change.startsWith('-') ? 'text-red-600' : 'text-gray-600'}`}>
                {feed.change}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-gray-600">{feed.providers}/9</span>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            <span className="font-medium text-green-600">{feed.consensus}</span>
          </div>
        ))}
      </div>
      
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="text-lg font-bold text-blue-600">1,247</div>
          <div className="text-sm text-blue-700">Updates Today</div>
        </div>
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="text-lg font-bold text-green-600">0.8s</div>
          <div className="text-sm text-green-700">Avg Response</div>
        </div>
      </div>
    </div>
  );
}
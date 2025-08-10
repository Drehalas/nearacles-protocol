'use client';

export default function DataFeeds() {
  const feeds = [
    { 
      pair: 'NEAR/USD', 
      price: '$4.23', 
      change: '+2.4%', 
      providers: ['Chainlink', 'Pyth', 'Band', 'DIA', 'API3'],
      lastUpdate: '5s ago',
      deviation: '0.02%'
    },
    { 
      pair: 'BTC/USD', 
      price: '$43,245', 
      change: '+1.8%', 
      providers: ['Chainlink', 'Pyth', 'Band', 'Chronicle', 'API3'],
      lastUpdate: '3s ago',
      deviation: '0.05%'
    },
    { 
      pair: 'ETH/USD', 
      price: '$2,456', 
      change: '-0.3%', 
      providers: ['Chainlink', 'Pyth', 'Band', 'DIA'],
      lastUpdate: '4s ago',
      deviation: '0.08%'
    },
    { 
      pair: 'USDC/USD', 
      price: '$1.0001', 
      change: '+0.0%', 
      providers: ['Chainlink', 'Chronicle', 'Band'],
      lastUpdate: '2s ago',
      deviation: '0.01%'
    },
    { 
      pair: 'USDT/USD', 
      price: '$0.9998', 
      change: '-0.0%', 
      providers: ['Chainlink', 'Pyth', 'Band'],
      lastUpdate: '6s ago',
      deviation: '0.03%'
    },
    { 
      pair: 'AVAX/USD', 
      price: '$35.67', 
      change: '+3.2%', 
      providers: ['Chainlink', 'API3', 'DIA'],
      lastUpdate: '8s ago',
      deviation: '0.12%'
    }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Active Data Feeds</h2>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500" suppressHydrationWarning={true}>
            Live Updates Every 5s
          </span>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-6">
        {feeds.map((feed, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-900">{feed.pair}</h3>
              <span className="text-xs text-gray-500" suppressHydrationWarning={true}>{feed.lastUpdate}</span>
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <div className="text-2xl font-bold text-gray-900">{feed.price}</div>
              <div className={`flex items-center space-x-1 ${feed.change.startsWith('+') ? 'text-green-600' : feed.change.startsWith('-') && feed.change !== '-0.0%' ? 'text-red-600' : 'text-gray-600'}`}>
                <i className={`ri-arrow-${feed.change.startsWith('+') ? 'up' : feed.change.startsWith('-') && feed.change !== '-0.0%' ? 'down' : 'right'}-line text-sm`}></i>
                <span className="font-medium">{feed.change}</span>
              </div>
            </div>
            
            <div className="mb-3">
              <div className="text-xs text-gray-500 mb-2">Oracle Providers ({feed.providers.length})</div>
              <div className="flex flex-wrap gap-1">
                {feed.providers.map((provider, idx) => (
                  <span key={idx} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                    {provider}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Deviation: {feed.deviation}</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-600">Consensus OK</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-gray-900">24</div>
            <div className="text-sm text-gray-600">Active Pairs</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">1,247</div>
            <div className="text-sm text-gray-600">Updates Today</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">99.9%</div>
            <div className="text-sm text-gray-600">Uptime</div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

export default function NearBlocksIntegration() {
  const explorerFeatures = [
    {
      title: 'Multi-Entity URLs',
      description: 'Direct links to accounts, transactions, blocks, contracts, and tokens',
      icon: 'ri-link',
      status: 'active',
      examples: ['nearblocks.io/address/aurora', 'nearblocks.io/txns/8tCvB...xyz123', 'nearblocks.io/blocks/12345']
    },
    {
      title: 'Visual Status Badges',
      description: 'Real-time status indicators for all NEAR entities with color-coded health',
      icon: 'ri-shield-check-line',
      status: 'active',
      examples: ['Success/Failed transactions', 'Active/Inactive accounts', 'Online/Offline validators']
    },
    {
      title: 'Smart Contract Tracking',
      description: 'Track NEAR smart contract interactions and function calls with detailed analytics',
      icon: 'ri-stack-line',
      status: 'active',
      examples: ['Contract function calls', 'Gas usage optimization', 'Cross-contract calls']
    },
    {
      title: 'Widget Support',
      description: 'Embeddable widgets for real-time NEAR blockchain data in external applications',
      icon: 'ri-dashboard-3-line',
      status: 'active',
      examples: ['Account balance widgets', 'Transaction status widgets', 'Network health widgets']
    }
  ];

  const liveData = {
    accounts: {
      total: '1,856,423',
      active: '892,156',
      newToday: '+2,134'
    },
    transactions: {
      total: '78,234,567',
      tps: '1,847',
      volume24h: '$8.7M'
    },
    blocks: {
      total: '89,456,234',
      height: '103,456,789',
      finalityTime: '2.1s'
    },
    contracts: {
      total: '45,678',
      deployed: '38,912',
      calls24h: '567K'
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">NearBlocks Integration</h2>
            <p className="text-gray-600 text-sm mt-1">Real-time NEAR blockchain data with advanced visualization features</p>
          </div>
          <a 
            href="https://nearblocks.io/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 whitespace-nowrap cursor-pointer flex items-center space-x-2"
          >
            <span>Open NearBlocks</span>
            <i className="ri-external-link-line"></i>
          </a>
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Integration Features</h3>
            <div className="space-y-4">
              {explorerFeatures.map((feature, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <i className={`${feature.icon} text-green-600`}></i>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900">{feature.title}</h4>
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{feature.description}</p>
                      <div className="text-xs text-gray-500">
                        {feature.examples.map((example, idx) => (
                          <div key={idx} className="font-mono bg-gray-100 px-2 py-1 rounded mb-1">
                            {example}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Live Network Data</h3>
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <i className="ri-user-line text-green-600 mr-2"></i>
                  Accounts
                </h4>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <div className="text-lg font-bold text-gray-900">{liveData.accounts.total}</div>
                    <div className="text-gray-600">Total Accounts</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600">{liveData.accounts.active}</div>
                    <div className="text-gray-600">Active</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">{liveData.accounts.newToday}</div>
                    <div className="text-gray-600">New Today</div>
                  </div>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <i className="ri-exchange-line text-green-600 mr-2"></i>
                  Transactions
                </h4>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <div className="text-lg font-bold text-gray-900">{liveData.transactions.total}</div>
                    <div className="text-gray-600">Total</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600">{liveData.transactions.tps}</div>
                    <div className="text-gray-600">Current TPS</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">{liveData.transactions.volume24h}</div>
                    <div className="text-gray-600">24h Volume</div>
                  </div>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <i className="ri-box-3-line text-purple-600 mr-2"></i>
                  Blocks
                </h4>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <div className="text-lg font-bold text-gray-900">{liveData.blocks.total}</div>
                    <div className="text-gray-600">Total Blocks</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-purple-600">{liveData.blocks.height}</div>
                    <div className="text-gray-600">Block Height</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">{liveData.blocks.finalityTime}</div>
                    <div className="text-gray-600">Finality Time</div>
                  </div>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <i className="ri-file-code-line text-orange-600 mr-2"></i>
                  Smart Contracts
                </h4>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <div className="text-lg font-bold text-gray-900">{liveData.contracts.total}</div>
                    <div className="text-gray-600">Total</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-orange-600">{liveData.contracts.deployed}</div>
                    <div className="text-gray-600">Deployed</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">{liveData.contracts.calls24h}</div>
                    <div className="text-gray-600">Calls 24h</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Quick Access Links</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <a href="https://nearblocks.io/address" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center space-x-2 bg-white p-3 rounded-lg hover:shadow-md cursor-pointer">
              <i className="ri-user-line text-green-600"></i>
              <span className="text-sm font-medium">Accounts</span>
            </a>
            <a href="https://nearblocks.io/txns" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center space-x-2 bg-white p-3 rounded-lg hover:shadow-md cursor-pointer">
              <i className="ri-exchange-line text-green-600"></i>
              <span className="text-sm font-medium">Transactions</span>
            </a>
            <a href="https://nearblocks.io/blocks" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center space-x-2 bg-white p-3 rounded-lg hover:shadow-md cursor-pointer">
              <i className="ri-box-3-line text-purple-600"></i>
              <span className="text-sm font-medium">Blocks</span>
            </a>
            <a href="https://nearblocks.io/contracts" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center space-x-2 bg-white p-3 rounded-lg hover:shadow-md cursor-pointer">
              <i className="ri-file-code-line text-orange-600"></i>
              <span className="text-sm font-medium">Contracts</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

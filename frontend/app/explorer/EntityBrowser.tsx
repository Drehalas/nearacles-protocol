
'use client';

export default function EntityBrowser() {
  const entities = [
    {
      type: 'Account',
      id: 'oracle.near',
      name: 'Oracle Provider Main',
      balance: '15,234.567 NEAR',
      status: 'active',
      lastActivity: '2 minutes ago',
      icon: 'ri-user-line'
    },
    {
      type: 'Contract',
      id: 'pricefeed.near',
      name: 'PriceFeed Contract',
      calls: '45,672',
      status: 'active',
      lastActivity: '42 seconds ago',
      icon: 'ri-file-code-line'
    },
    {
      type: 'Token',
      id: 'oracle-token.near',
      name: 'Oracle Token (ORC)',
      supply: '1,000,000',
      status: 'active',
      lastActivity: '3 minutes ago',
      icon: 'ri-coins-line'
    },
    {
      type: 'Validator',
      id: 'validator.near',
      name: 'Oracle Validator Node',
      stake: '892,456 NEAR',
      status: 'active',
      lastActivity: '15 seconds ago',
      icon: 'ri-shield-line'
    },
    {
      type: 'Account',
      id: 'treasury.near',
      name: 'System Treasury',
      balance: '892,456.123 NEAR',
      status: 'active',
      lastActivity: '5 minutes ago',
      icon: 'ri-safe-line'
    },
    {
      type: 'Contract',
      id: 'storage.near',
      name: 'Storage Contract',
      size: '2.4 MB',
      status: 'encrypted',
      lastActivity: '1 hour ago',
      icon: 'ri-file-shield-2-line'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-700 bg-green-100';
      case 'inactive': return 'text-gray-700 bg-gray-100';
      case 'encrypted': return 'text-blue-700 bg-blue-100';
      case 'warning': return 'text-yellow-700 bg-yellow-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getEntityColor = (type: string) => {
    switch (type) {
      case 'Account': return 'text-blue-600 bg-blue-100';
      case 'Contract': return 'text-green-600 bg-green-100';
      case 'Token': return 'text-orange-600 bg-orange-100';
      case 'Validator': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Entity Browser</h3>
        <p className="text-gray-600 text-sm mt-1">Browse all NEAR entities with multi-entity URL support</p>
      </div>
      
      <div className="p-6">
        <div className="space-y-3 mb-6">
          {entities.map((entity, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getEntityColor(entity.type)}`}>
                    <i className={`${entity.icon}`}></i>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">{entity.name}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(entity.status)}`}>
                        {entity.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 font-mono">{entity.id}</div>
                  </div>
                </div>
                <button className="text-green-600 hover:text-green-800 cursor-pointer">
                  <i className="ri-external-link-line"></i>
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">
                    {entity.type === 'Account' || entity.type === 'Validator' ? 'Balance/Stake:' :
                     entity.type === 'Contract' ? 'Calls:' :
                     entity.type === 'Token' ? 'Supply:' :
                     'Size:'}
                  </span>
                  <span className="font-medium text-gray-900 ml-2">
                    {entity.balance || entity.calls || entity.supply || entity.size || entity.stake}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Last Activity:</span>
                  <span className="font-medium text-gray-900 ml-2">{entity.lastActivity}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="border-t border-gray-200 pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-blue-600">1.86M</div>
              <div className="text-sm text-gray-600">Accounts</div>
            </div>
            <div>
              <div className="text-xl font-bold text-green-600">45K</div>
              <div className="text-sm text-gray-600">Contracts</div>
            </div>
            <div>
              <div className="text-xl font-bold text-orange-600">23K</div>
              <div className="text-sm text-gray-600">Tokens</div>
            </div>
            <div>
              <div className="text-xl font-bold text-purple-600">389</div>
              <div className="text-sm text-gray-600">Validators</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

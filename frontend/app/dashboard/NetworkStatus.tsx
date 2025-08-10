'use client';

export default function NetworkStatus() {
  const validators = [
    { name: 'Validator 1', status: 'Active', stake: '1.2M NEAR', uptime: '99.95%', rewards: '145 NEAR' },
    { name: 'Validator 2', status: 'Active', stake: '980K NEAR', uptime: '99.89%', rewards: '132 NEAR' },
    { name: 'Validator 3', status: 'Active', stake: '1.5M NEAR', uptime: '99.98%', rewards: '178 NEAR' },
    { name: 'Validator 4', status: 'Active', stake: '750K NEAR', uptime: '99.92%', rewards: '98 NEAR' },
    { name: 'Validator 5', status: 'Syncing', stake: '890K NEAR', uptime: '99.87%', rewards: '124 NEAR' }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">NEAR Network Status</h2>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-600">All Systems Operational</span>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-500 border-b border-gray-200 pb-2">
          <span>Validator</span>
          <span>Status</span>
          <span>Uptime</span>
          <span>Rewards</span>
        </div>
        
        {validators.map((validator, index) => (
          <div key={index} className="grid grid-cols-4 gap-4 text-sm items-center py-2">
            <div className="font-medium text-gray-900">{validator.name}</div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${validator.status === 'Active' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className={validator.status === 'Active' ? 'text-green-600' : 'text-yellow-600'}>
                {validator.status}
              </span>
            </div>
            <span className="text-gray-600">{validator.uptime}</span>
            <span className="font-medium text-gray-900">{validator.rewards}</span>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-green-50 rounded-lg">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-green-600">Block #47,892,156</div>
            <div className="text-sm text-green-700">Latest Block</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">1.2s</div>
            <div className="text-sm text-green-700">Block Time</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">0.8s</div>
            <div className="text-sm text-green-700">Finality</div>
          </div>
        </div>
      </div>
    </div>
  );
}
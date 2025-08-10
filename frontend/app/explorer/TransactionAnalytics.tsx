'use client';

export default function TransactionAnalytics() {
  const transactionTypes = [
    { type: 'HCS Message', count: 145672, percentage: 42.1, color: 'bg-blue-600' },
    { type: 'Crypto Transfer', count: 98543, percentage: 28.5, color: 'bg-green-600' },
    { type: 'Smart Contract', count: 54321, percentage: 15.7, color: 'bg-purple-600' },
    { type: 'Token Transfer', count: 32187, percentage: 9.3, color: 'bg-orange-600' },
    { type: 'File Operation', count: 15234, percentage: 4.4, color: 'bg-pink-600' }
  ];

  const recentTransactions = [
    {
      id: '0.0.123456-1699123456-789',
      type: 'HCS Message',
      account: '0.0.987654',
      amount: '0.00001 ℏ',
      status: 'Success',
      timestamp: '2 seconds ago',
      fee: '0.00000001 ℏ'
    },
    {
      id: '0.0.123456-1699123455-788',
      type: 'Crypto Transfer',
      account: '0.0.555666',
      amount: '100.5 ℏ',
      status: 'Success',
      timestamp: '15 seconds ago',
      fee: '0.00000001 ℏ'
    },
    {
      id: '0.0.123456-1699123454-787',
      type: 'Smart Contract',
      account: '0.0.444555',
      amount: '0.001 ℏ',
      status: 'Success',
      timestamp: '28 seconds ago',
      fee: '0.00000005 ℏ'
    },
    {
      id: '0.0.123456-1699123453-786',
      type: 'Token Transfer',
      account: '0.0.333444',
      amount: '500 USDC',
      status: 'Success',
      timestamp: '45 seconds ago',
      fee: '0.00000001 ℏ'
    }
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Transaction Analytics</h3>
        <p className="text-gray-600 text-sm mt-1">Real-time transaction patterns and success rates</p>
      </div>
      
      <div className="p-6">
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-4">Transaction Types (24h)</h4>
          <div className="space-y-3">
            {transactionTypes.map((tx, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${tx.color}`}></div>
                  <span className="text-sm text-gray-900">{tx.type}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-900">{tx.count.toLocaleString()}</span>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${tx.color}`} 
                      style={{width: `${tx.percentage}%`}}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500 w-12 text-right">{tx.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-4">Recent Transactions</h4>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {recentTransactions.map((tx, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">{tx.type}</span>
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  </div>
                  <span className="text-xs text-gray-500">{tx.timestamp}</span>
                </div>
                <div className="text-xs font-mono text-gray-600 mb-2">{tx.id}</div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">From:</span>
                    <span className="font-mono text-blue-600">{tx.account}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{tx.amount}</span>
                    <span className="text-gray-500">(fee: {tx.fee})</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">99.97%</div>
            <div className="text-sm text-green-700">Success Rate</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">3,247</div>
            <div className="text-sm text-blue-700">Current TPS</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">4.2s</div>
            <div className="text-sm text-purple-700">Avg Finality</div>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

export default function CostTracking() {
  const monthlyCosts = [
    { month: 'Jan', consensus: 234, queries: 156, storage: 89, total: 479 },
    { month: 'Feb', consensus: 267, queries: 178, storage: 92, total: 537 },
    { month: 'Mar', consensus: 289, queries: 198, storage: 95, total: 582 },
    { month: 'Apr', consensus: 312, queries: 221, storage: 98, total: 631 },
    { month: 'May', consensus: 356, queries: 243, storage: 102, total: 701 },
    { month: 'Jun', consensus: 387, queries: 267, storage: 105, total: 759 }
  ];

  const costBreakdown = [
    { service: 'HCS Messages', cost: 387.45, percentage: 51.0, color: 'bg-blue-600' },
    { service: 'Oracle Queries', cost: 267.23, percentage: 35.2, color: 'bg-green-600' },
    { service: 'File Storage', cost: 104.87, percentage: 13.8, color: 'bg-purple-600' }
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Cost Tracking</h3>
        <p className="text-gray-600 text-sm mt-1">Monthly spending analysis and cost optimization</p>
      </div>
      
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">Monthly Cost Trend</h4>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">$759.55</div>
              <div className="text-sm text-green-600">+8.3% from last month</div>
            </div>
          </div>
          <div className="flex items-end space-x-2 h-32 bg-gray-50 rounded-lg p-4">
            {monthlyCosts.map((data, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div 
                  className="w-full bg-gradient-to-t from-blue-600 to-purple-600 rounded-sm min-h-1"
                  style={{height: `${(data.total / 800) * 100}px`}}
                ></div>
                <span className="text-xs text-gray-500 mt-2">{data.month}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-4">Cost Breakdown (June 2024)</h4>
          <div className="space-y-3">
            {costBreakdown.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                  <span className="text-sm text-gray-900">{item.service}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-900">${item.cost}</span>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${item.color}`} 
                      style={{width: `${item.percentage}%`}}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500 w-12 text-right">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <h5 className="font-medium text-green-900 mb-2">Cost Savings</h5>
            <div className="text-2xl font-bold text-green-600">$127.43</div>
            <div className="text-sm text-green-700">Saved this month through optimization</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <h5 className="font-medium text-blue-900 mb-2">Projected Monthly</h5>
            <div className="text-2xl font-bold text-blue-600">$823.67</div>
            <div className="text-sm text-blue-700">Based on current usage trends</div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <i className="ri-lightbulb-line text-yellow-600 mt-1"></i>
            <div>
              <h5 className="font-medium text-yellow-900">Cost Optimization Tips</h5>
              <ul className="text-sm text-yellow-800 mt-2 space-y-1">
                <li>• Enable message batching to reduce HCS costs by up to 30%</li>
                <li>• Use chunking for large messages to optimize storage fees</li>
                <li>• Consider oracle data caching to reduce query frequency</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
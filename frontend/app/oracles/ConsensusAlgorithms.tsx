'use client';

import { useState } from 'react';

export default function ConsensusAlgorithms() {
  const [activeAlgorithm, setActiveAlgorithm] = useState('weighted');

  const algorithms = [
    {
      id: 'weighted',
      name: 'Weighted Average',
      description: 'Uses provider reliability scores to weight data points',
      accuracy: '99.9%',
      latency: '0.6s',
      active: true
    },
    {
      id: 'median',
      name: 'Median Consensus',
      description: 'Statistical median with outlier resistance',
      accuracy: '99.7%',
      latency: '0.8s',
      active: true
    },
    {
      id: 'majority',
      name: 'Majority Vote',
      description: 'Democratic consensus with confidence weighting',
      accuracy: '99.8%',
      latency: '0.7s',
      active: false
    },
    {
      id: 'confidence',
      name: 'Confidence Weighted',
      description: 'Dynamic weighting based on historical accuracy',
      accuracy: '99.6%',
      latency: '0.9s',
      active: true
    }
  ];

  const outlierFilters = [
    { name: '3-Sigma Rule', threshold: '3σ', description: 'Statistical outlier detection', active: true },
    { name: 'Deviation Filter', threshold: '30%', description: 'Price deviation threshold', active: true },
    { name: 'Z-Score Filter', threshold: '2.5σ', description: 'Normalized score filtering', active: false },
    { name: 'IQR Method', threshold: '1.5×IQR', description: 'Interquartile range based', active: false }
  ];

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Consensus Algorithms</h2>
          <button className="text-sm text-green-600 hover:text-green-700 font-medium cursor-pointer">
            Configure
          </button>
        </div>
        
        <div className="space-y-4">
          {algorithms.map((algo) => (
            <div 
              key={algo.id} 
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                activeAlgorithm === algo.id 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setActiveAlgorithm(algo.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{algo.name}</h3>
                <div className="flex items-center space-x-2">
                  {algo.active && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                  <span className="text-xs text-green-600 font-medium">{algo.accuracy}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">{algo.description}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Latency: {algo.latency}</span>
                <span className={`px-2 py-1 rounded-full ${
                  algo.active 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {algo.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Current Configuration</h4>
          <p className="text-sm text-blue-800">
            Primary: Weighted Average | Fallback: Median Consensus | 
            Outlier Detection: 3-Sigma + 30% Deviation
          </p>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Outlier Filtering</h2>
          <button className="text-sm text-green-600 hover:text-green-700 font-medium cursor-pointer">
            Settings
          </button>
        </div>
        
        <div className="space-y-4">
          {outlierFilters.map((filter, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-1">
                  <h3 className="font-semibold text-gray-900">{filter.name}</h3>
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    {filter.threshold}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{filter.description}</p>
              </div>
              <div className="ml-4">
                <button 
                  className={`w-12 h-6 rounded-full transition-colors ${
                    filter.active ? 'bg-green-500' : 'bg-gray-300'
                  } relative cursor-pointer`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                    filter.active ? 'translate-x-7' : 'translate-x-1'
                  } absolute top-1`}></div>
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="p-3 bg-red-50 rounded-lg text-center">
            <div className="text-lg font-bold text-red-600">42</div>
            <div className="text-sm text-red-700">Outliers Detected</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg text-center">
            <div className="text-lg font-bold text-green-600">99.2%</div>
            <div className="text-sm text-green-700">Data Quality</div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-start space-x-3">
            <i className="ri-warning-line text-yellow-600 text-lg mt-0.5"></i>
            <div>
              <h4 className="font-medium text-yellow-900 mb-1">Filter Sensitivity</h4>
              <p className="text-sm text-yellow-800">
                Current settings may filter out legitimate price movements during high volatility periods. Consider adjusting thresholds for crypto assets.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
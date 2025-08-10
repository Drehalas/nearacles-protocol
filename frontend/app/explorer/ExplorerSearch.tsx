
'use client';

import { useState } from 'react';

export default function ExplorerSearch() {
  const [searchType, setSearchType] = useState('account');
  const [searchValue, setSearchValue] = useState('');

  const searchTypes = [
    { id: 'account', label: 'Account ID', placeholder: 'aurora.near', icon: 'ri-user-line' },
    { id: 'transaction', label: 'Transaction Hash', placeholder: '8tCvB5xHyKjH4wZ...', icon: 'ri-exchange-line' },
    { id: 'block', label: 'Block Height', placeholder: '103456789', icon: 'ri-box-3-line' },
    { id: 'contract', label: 'Contract ID', placeholder: 'contract.near', icon: 'ri-file-code-line' },
    { id: 'token', label: 'Token Contract', placeholder: 'token.near', icon: 'ri-coins-line' },
    { id: 'validator', label: 'Validator', placeholder: 'validator.near', icon: 'ri-shield-line' }
  ];

  const recentSearches = [
    { type: 'account', value: 'oracle.near', label: 'Oracle Provider Account' },
    { type: 'transaction', value: '8tCvB5xHyKjH4wZ9P2qA1mX7nR6eS3vT4uY5', label: 'Recent Oracle Transaction' },
    { type: 'block', value: '103456789', label: 'Latest Block' },
    { type: 'contract', value: 'pricefeed.near', label: 'PriceFeed Contract' }
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 mb-8">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">NearBlocks Explorer Search</h2>
        <p className="text-gray-600 text-sm mt-1">Search accounts, transactions, blocks, contracts, tokens, and validators</p>
      </div>
      
      <div className="p-6">
        <div className="flex flex-wrap gap-2 mb-6">
          {searchTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSearchType(type.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                searchType === type.id 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <i className={type.icon}></i>
              <span>{type.label}</span>
            </button>
          ))}
        </div>
        
        <div className="relative mb-6">
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={searchTypes.find(t => t.id === searchType)?.placeholder}
            className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <i className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl ${
            searchTypes.find(t => t.id === searchType)?.icon
          }`}></i>
          <button className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium cursor-pointer whitespace-nowrap">
            <i className="ri-search-line mr-2"></i>
            Search
          </button>
        </div>
        
        <div>
          <h3 className="font-medium text-gray-900 mb-4">Recent Searches</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentSearches.map((search, index) => (
              <button
                key={index}
                onClick={() => {
                  setSearchType(search.type);
                  setSearchValue(search.value);
                }}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer text-left"
              >
                <div className="flex items-center space-x-3">
                  <i className={`${searchTypes.find(t => t.id === search.type)?.icon} text-gray-400`}></i>
                  <div>
                    <div className="font-medium text-gray-900">{search.label}</div>
                    <div className="text-sm text-gray-500 font-mono">{search.value}</div>
                  </div>
                </div>
                <i className="ri-external-link-line text-gray-400"></i>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

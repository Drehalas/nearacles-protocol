/**
 * Simple NEAR testnet configuration for frontend
 */

export const TESTNET_CONFIG = {
  // NEAR Network Configuration
  network: {
    networkId: process.env.NEXT_PUBLIC_NEAR_NETWORK_ID || 'testnet',
    nodeUrl: process.env.NEXT_PUBLIC_NEAR_NODE_URL || 'https://rpc.testnet.near.org',
    walletUrl: process.env.NEXT_PUBLIC_NEAR_WALLET_URL || 'https://testnet.mynearwallet.com',
    explorerUrl: 'https://explorer.testnet.near.org',
    helperUrl: process.env.NEXT_PUBLIC_NEAR_HELPER_URL || 'https://helper.testnet.near.org',
  },

  // Contract Configuration
  contracts: {
    oracleIntent: process.env.NEXT_PUBLIC_ORACLE_CONTRACT_ID || 'oracle.nearacles.testnet',
    verifier: process.env.NEXT_PUBLIC_VERIFIER_CONTRACT_ID || 'verifier.nearacles.testnet',
    intentManager: process.env.NEXT_PUBLIC_INTENT_MANAGER_CONTRACT_ID || 'intent-manager.nearacles.testnet',
  },

  // API Configuration
  api: {
    websocketUrl: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8080',
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001',
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '5000'),
  },

  // Feature Flags
  features: {
    advancedAnalytics: process.env.NEXT_PUBLIC_FEATURE_ADVANCED_ANALYTICS === 'true',
    aiInsights: process.env.NEXT_PUBLIC_FEATURE_AI_INSIGHTS === 'true',
    aiIntentOptimization: process.env.NEXT_PUBLIC_FEATURE_AI_INTENT_OPTIMIZATION === 'true',
    aiRiskAssessment: process.env.NEXT_PUBLIC_FEATURE_AI_RISK_ASSESSMENT === 'true',
    realTimeUpdates: process.env.NEXT_PUBLIC_FEATURE_REAL_TIME_UPDATES === 'true',
    debugMode: process.env.NEXT_PUBLIC_FEATURE_DEBUG_MODE === 'true',
    performanceMonitoring: process.env.NEXT_PUBLIC_FEATURE_PERFORMANCE_MONITORING === 'true',
    cachingEnabled: process.env.NEXT_PUBLIC_FEATURE_CACHING_ENABLED === 'true',
    enhancedSecurity: process.env.NEXT_PUBLIC_FEATURE_ENHANCED_SECURITY === 'true',
    rateLimiting: process.env.NEXT_PUBLIC_FEATURE_RATE_LIMITING === 'true',
    experimentalSolvers: process.env.NEXT_PUBLIC_FEATURE_EXPERIMENTAL_SOLVERS === 'true',
    mockData: process.env.NEXT_PUBLIC_FEATURE_MOCK_DATA === 'true',
    stressTesting: process.env.NEXT_PUBLIC_FEATURE_STRESS_TESTING === 'true',
  },

  // Deployment Configuration
  deployment: {
    environment: process.env.NEXT_PUBLIC_DEPLOYMENT_ENV || 'development',
    showDebugInfo: process.env.NEXT_PUBLIC_SHOW_DEBUG_INFO === 'true',
    enableConsoleLogs: process.env.NEXT_PUBLIC_ENABLE_CONSOLE_LOGS === 'true',
  },

  // Transaction Defaults
  transaction: {
    gas: '300000000000000',
    deposit: '1000000000000000000000000', // 1 NEAR
  },
};
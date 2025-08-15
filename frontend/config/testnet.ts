/**
 * NEAR Oracle Intent Protocol - Testnet Configuration
 * Configuration for connecting frontend to NEAR testnet infrastructure
 */

export const TESTNET_CONFIG = {
  // NEAR Network Configuration
  network: {
    networkId: 'testnet',
    nodeUrl: 'https://rpc.testnet.near.org',
    walletUrl: 'https://wallet.testnet.near.org',
    helperUrl: 'https://helper.testnet.near.org',
    explorerUrl: 'https://explorer.testnet.near.org',
  },

  // Contract Addresses (to be updated after deployment)
  contracts: {
    oracleIntent: process.env.NEXT_PUBLIC_ORACLE_CONTRACT_ID || 'oracle-intent.nearacles.testnet',
    // Future contracts can be added here
  },

  // API Endpoints
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001',
    websocketUrl: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8080',
    metricsUrl: process.env.NEXT_PUBLIC_METRICS_URL || 'http://localhost:9090',
  },

  // Default Transaction Settings
  transaction: {
    gas: '300000000000000', // 300 TGas
    attachedDeposit: '1000000000000000000000000', // 1 NEAR for intents
  },

  // Intent Configuration
  intent: {
    defaultRequiredSources: 3,
    defaultConfidenceThreshold: 0.8,
    defaultDeadlineMinutes: 60,
    maxDeadlineHours: 168, // 1 week
    minDeadlineMinutes: 5,
  },

  // Solver Configuration
  solver: {
    registrationDeposit: '2000000000000000000000000', // 2 NEAR
    specializations: [
      'financial',
      'technology', 
      'news',
      'scientific',
      'general'
    ],
  },

  // UI Configuration
  ui: {
    theme: 'testnet', // Can be used for testnet-specific styling
    showTestnetBanner: true,
    enableDebugMode: true,
    refreshInterval: 30000, // 30 seconds
  },

  // Feature Flags for Testnet
  features: {
    enableChallenges: true,
    enableRewards: true,
    enableMetrics: true,
    enableRealTimeUpdates: true,
    enableAuction: false, // Disable auction for initial testnet
  },

  // Monitoring Configuration
  monitoring: {
    enableAnalytics: true,
    enableErrorTracking: true,
    sampleRate: 1.0, // 100% sampling for testnet
  },
};

// Helper function to get contract account ID with fallback
export function getContractAccountId(): string {
  return TESTNET_CONFIG.contracts.oracleIntent;
}

// Helper function to check if we're in testnet mode
export function isTestnetMode(): boolean {
  return TESTNET_CONFIG.network.networkId === 'testnet';
}

// Helper function to get gas amount for contract calls
export function getTransactionGas(): string {
  return TESTNET_CONFIG.transaction.gas;
}

// Helper function to get default intent deposit
export function getDefaultIntentDeposit(): string {
  return TESTNET_CONFIG.transaction.attachedDeposit;
}
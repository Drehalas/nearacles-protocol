/**
 * Simple NEAR testnet configuration for frontend
 */

export const TESTNET_CONFIG = {
  // NEAR Network Configuration
  network: {
    networkId: 'testnet',
    nodeUrl: 'https://rpc.testnet.near.org',
    walletUrl: 'https://wallet.testnet.near.org',
    explorerUrl: 'https://explorer.testnet.near.org',
  },

  // Contract Configuration
  contracts: {
    oracleIntent: process.env.NEXT_PUBLIC_ORACLE_CONTRACT_ID || 'oracle.nearacles.testnet',
  },

  // API Configuration
  api: {
    websocketUrl: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8080',
  },

  // Transaction Defaults
  transaction: {
    gas: '300000000000000',
    deposit: '1000000000000000000000000', // 1 NEAR
  },
};
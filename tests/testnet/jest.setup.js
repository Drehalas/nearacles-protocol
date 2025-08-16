/**
 * Jest setup for testnet tests
 * Configures global test environment and utilities
 */

// Increase timeout for all tests
jest.setTimeout(300000); // 5 minutes

// Set up global test helpers
global.console = {
  ...console,
  // Suppress verbose logs during tests unless in verbose mode
  log: process.env.VERBOSE === 'true' ? console.log : () => {},
  info: process.env.VERBOSE === 'true' ? console.info : () => {},
  warn: console.warn,
  error: console.error,
};

// Global error handler for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Global uncaught exception handler
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Set default environment variables for tests
if (!process.env.NEAR_NETWORK_ID) {
  process.env.NEAR_NETWORK_ID = 'sandbox';
}

if (!process.env.WEBSOCKET_URL) {
  process.env.WEBSOCKET_URL = 'ws://localhost:8080';
}

console.log('🧪 Jest testnet environment initialized');
console.log(`Network: ${process.env.NEAR_NETWORK_ID}`);
console.log(`WebSocket: ${process.env.WEBSOCKET_URL}`);
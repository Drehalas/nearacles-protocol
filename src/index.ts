/**
 * Nearacles Oracle Protocol
 * 
 * Main entry point for the oracle system
 */

export * from './types/oracle.js';
export * from './services/oracle.js';
export * from './services/credibility.js';
export * from './services/refutation.js';
export * from './services/openai.js';
export * from './utils/source-validation.js';

// Re-export main service for convenience
export { OracleService as Oracle } from './services/oracle.js';
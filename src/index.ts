/**
 * Nearacles Protocol - NEAR Intent-Based Oracle System
 *
 * Main entry point for the intent-based oracle system
 */

// Core Oracle Services
export * from './types/oracle.js';
export * from './services/oracle.js';
export * from './services/credibility.js';
export * from './services/refutation.js';
export * from './services/openai.js';
export * from './utils/source-validation.js';

// NEAR Intent Integration
export * from './types/near-intent.js';
export * from './services/near-signing.js';
export * from './services/intent-broadcaster.js';
export * from './services/near-oracle-integration.js';
export * from './services/oracle-solver-node.js';

// Examples and Demos
export * from './examples/intent-oracle-demo.js';

// Main services for convenience
export { OracleService as Oracle } from './services/oracle.js';
export { IntentBroadcaster as IntentOracle } from './services/intent-broadcaster.js';
export { NEAROracleIntegration as NEAROracle } from './services/near-oracle-integration.js';
export { OracleSolverNode as SolverNode } from './services/oracle-solver-node.js';

#!/usr/bin/env node

/**
 * Logging Setup Script for NEAR Oracle Intent Protocol
 * Initializes centralized logging for testnet deployment
 */

import { initializeLogger, LogLevel, LoggerConfig } from '../src/utils/logger';
import { mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';

// Configuration
const environment = (process.env.NODE_ENV || 'testnet') as 'development' | 'testnet' | 'production';
const serviceName = process.env.SERVICE_NAME || 'nearacles-protocol';

// Determine log level based on environment
const getLogLevel = (): LogLevel => {
  const envLevel = process.env.LOG_LEVEL?.toUpperCase();
  
  switch (envLevel) {
    case 'DEBUG': return LogLevel.DEBUG;
    case 'INFO': return LogLevel.INFO;
    case 'WARN': return LogLevel.WARN;
    case 'ERROR': return LogLevel.ERROR;
    case 'FATAL': return LogLevel.FATAL;
    default:
      // Default levels by environment
      switch (environment) {
        case 'development': return LogLevel.DEBUG;
        case 'testnet': return LogLevel.INFO;
        case 'production': return LogLevel.WARN;
        default: return LogLevel.INFO;
      }
  }
};

// Setup log directory
const setupLogDirectory = (): string => {
  const logDir = resolve(__dirname, '..', 'logs');
  
  if (!existsSync(logDir)) {
    mkdirSync(logDir, { recursive: true });
    console.log(`📁 Created log directory: ${logDir}`);
  }
  
  return logDir;
};

// Main setup function
async function setupLogging(): Promise<void> {
  console.log('📝 Setting up centralized logging system...');
  console.log(`Environment: ${environment}`);
  console.log(`Service: ${serviceName}`);
  
  const logDir = setupLogDirectory();
  const logFile = resolve(logDir, `${serviceName}-${environment}.log`);
  
  const config: LoggerConfig = {
    service_name: serviceName,
    environment,
    min_level: getLogLevel(),
    enable_console: true,
    enable_file: process.env.ENABLE_FILE_LOGGING !== 'false',
    enable_remote: process.env.ENABLE_REMOTE_LOGGING === 'true',
    file_path: logFile,
    remote_endpoint: process.env.REMOTE_LOG_ENDPOINT,
    max_log_size: parseInt(process.env.MAX_LOG_SIZE || '100000000'), // 100MB
    retention_days: parseInt(process.env.LOG_RETENTION_DAYS || '30'),
  };

  console.log(`Configuration:`);
  console.log(`- Log Level: ${LogLevel[config.min_level]}`);
  console.log(`- Console Logging: ${config.enable_console}`);
  console.log(`- File Logging: ${config.enable_file}`);
  console.log(`- Remote Logging: ${config.enable_remote}`);
  console.log(`- Log File: ${config.file_path}`);
  
  if (config.remote_endpoint) {
    console.log(`- Remote Endpoint: ${config.remote_endpoint}`);
  }

  // Initialize logger
  const logger = initializeLogger(config);
  
  // Test logging
  console.log('\n🧪 Testing logging system...');
  
  logger.debug('Debug message - testing debug level');
  logger.info('Info message - logging system initialized successfully');
  logger.warn('Warning message - this is a test warning');
  
  // Test error logging
  try {
    throw new Error('Test error for logging system');
  } catch (error) {
    logger.error('Error message - test error logging', error as Error, {
      test_data: { key: 'value' },
      timestamp: new Date().toISOString(),
    });
  }

  // Test performance logging
  const start = Date.now();
  await new Promise(resolve => setTimeout(resolve, 100));
  const duration = Date.now() - start;
  
  logger.info('Performance test completed', {
    operation: 'test_delay',
    duration_ms: duration,
    expected_ms: 100,
  });

  console.log('✅ Logging system test completed');
  
  // Show log file location
  if (config.enable_file) {
    console.log(`\n📄 Log file location: ${config.file_path}`);
    console.log(`   Tail logs: tail -f ${config.file_path}`);
  }

  // Environment-specific setup
  if (environment === 'testnet') {
    setupTestnetLogging(logger);
  }

  console.log('\n🎉 Logging setup completed successfully!');
  
  // Keep process alive for a moment to ensure logs are flushed
  setTimeout(() => {
    logger.flush().then(() => {
      console.log('📤 Logs flushed successfully');
      process.exit(0);
    }).catch((error) => {
      console.error('❌ Failed to flush logs:', error);
      process.exit(1);
    });
  }, 1000);
}

function setupTestnetLogging(logger: any): void {
  console.log('\n🧪 Setting up testnet-specific logging features...');
  
  // Log testnet-specific information
  logger.info('Testnet logging configured', {
    features: {
      debug_mode: true,
      performance_tracking: true,
      error_tracking: true,
      user_actions: true,
    },
    configuration: {
      buffer_size: 100,
      flush_interval: '5s',
      retention: '30 days',
    },
  });

  // Setup performance monitoring
  if (typeof performance !== 'undefined') {
    logger.info('Performance monitoring available', {
      timing_api: 'supported',
      high_resolution_time: performance.timeOrigin !== undefined,
    });
  }

  console.log('✅ Testnet logging features configured');
}

// Environment variable generation
function generateEnvironmentTemplate(): void {
  const template = `# Logging Configuration for NEAR Oracle Intent Protocol
# Add these to your .env file

# Basic Configuration
SERVICE_NAME=${serviceName}
LOG_LEVEL=INFO

# File Logging
ENABLE_FILE_LOGGING=true
MAX_LOG_SIZE=100000000
LOG_RETENTION_DAYS=30

# Remote Logging (optional)
ENABLE_REMOTE_LOGGING=false
REMOTE_LOG_ENDPOINT=https://your-log-collector.com/api/logs

# Development/Debug
DEBUG_LOGGING=false
VERBOSE_ERRORS=true
`;

  console.log('\n📋 Environment Variables Template:');
  console.log('=====================================');
  console.log(template);
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'setup':
      setupLogging().catch(error => {
        console.error('❌ Failed to setup logging:', error);
        process.exit(1);
      });
      break;
    case 'env':
      generateEnvironmentTemplate();
      break;
    case 'test':
      setupLogging().catch(error => {
        console.error('❌ Logging test failed:', error);
        process.exit(1);
      });
      break;
    default:
      console.log('Usage: npx tsx scripts/setup-logging.ts <command>');
      console.log('');
      console.log('Commands:');
      console.log('  setup  - Initialize logging system');
      console.log('  env    - Show environment variables template');
      console.log('  test   - Test logging system');
      console.log('');
      console.log('Environment Variables:');
      console.log('  NODE_ENV         - Environment (development/testnet/production)');
      console.log('  SERVICE_NAME     - Service name for logs');
      console.log('  LOG_LEVEL        - Minimum log level (DEBUG/INFO/WARN/ERROR/FATAL)');
      console.log('  ENABLE_FILE_LOGGING - Enable file logging (true/false)');
      console.log('  ENABLE_REMOTE_LOGGING - Enable remote logging (true/false)');
      console.log('  REMOTE_LOG_ENDPOINT - Remote logging endpoint URL');
      process.exit(1);
  }
}
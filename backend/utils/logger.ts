/**
 * Centralized Logging System for NEAR Oracle Intent Protocol
 * Basic error tracking and logging for testnet deployment
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  metadata?: Record<string, any>;
  error?: Error;
  request_id?: string;
  user_id?: string;
  session_id?: string;
}

export interface LoggerConfig {
  service_name: string;
  environment: 'development' | 'testnet' | 'production';
  min_level: LogLevel;
  enable_console: boolean;
  enable_file: boolean;
  enable_remote: boolean;
  file_path?: string;
  remote_endpoint?: string;
  max_log_size?: number;
  retention_days?: number;
}

export class Logger {
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private flushInterval?: NodeJS.Timeout;

  constructor(config: LoggerConfig) {
    this.config = config;
    this.setupFlushInterval();
  }

  /**
   * Log a debug message
   */
  debug(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  /**
   * Log an info message
   */
  info(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  /**
   * Log a warning message
   */
  warn(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, { ...metadata, error });
  }

  /**
   * Log a fatal error message
   */
  fatal(message: string, error?: Error, metadata?: Record<string, any>): void {
    this.log(LogLevel.FATAL, message, { ...metadata, error });
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, metadata?: Record<string, any>): void {
    // Check if level meets minimum threshold
    if (level < this.config.min_level) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.config.service_name,
      metadata,
      request_id: this.getRequestId(),
      user_id: this.getUserId(),
      session_id: this.getSessionId(),
    };

    // Extract error if present
    if (metadata?.error instanceof Error) {
      entry.error = metadata.error;
      delete metadata.error;
    }

    // Console output
    if (this.config.enable_console) {
      this.logToConsole(entry);
    }

    // Add to buffer for file/remote logging
    if (this.config.enable_file || this.config.enable_remote) {
      this.logBuffer.push(entry);
    }
  }

  /**
   * Log to console with appropriate formatting
   */
  private logToConsole(entry: LogEntry): void {
    const levelStr = LogLevel[entry.level];
    const timestamp = entry.timestamp;
    const service = entry.service;
    
    let output = `[${timestamp}] [${service}] [${levelStr}] ${entry.message}`;
    
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      output += ` | ${JSON.stringify(entry.metadata)}`;
    }

    if (entry.error) {
      output += `\n${entry.error.stack}`;
    }

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(output);
        break;
      case LogLevel.INFO:
        console.info(output);
        break;
      case LogLevel.WARN:
        console.warn(output);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(output);
        break;
    }
  }

  /**
   * Flush logs to file and/or remote endpoint
   */
  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) {
      return;
    }

    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    try {
      // File logging
      if (this.config.enable_file && this.config.file_path) {
        await this.writeLogsToFile(logsToFlush);
      }

      // Remote logging
      if (this.config.enable_remote && this.config.remote_endpoint) {
        await this.sendLogsToRemote(logsToFlush);
      }
    } catch (error) {
      console.error('Failed to flush logs:', error);
      // Put logs back in buffer for retry
      this.logBuffer.unshift(...logsToFlush);
    }
  }

  /**
   * Write logs to file
   */
  private async writeLogsToFile(logs: LogEntry[]): Promise<void> {
    if (typeof globalThis !== 'undefined' && 'window' in globalThis) {
      // Browser environment - skip file logging
      return;
    }

    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      const logContent = logs.map(log => JSON.stringify(log)).join('\n') + '\n';
      
      // Ensure directory exists
      const dir = path.dirname(this.config.file_path!);
      await fs.mkdir(dir, { recursive: true });
      
      // Append to log file
      await fs.appendFile(this.config.file_path!, logContent);
    } catch (error) {
      console.error('Failed to write logs to file:', error);
    }
  }

  /**
   * Send logs to remote endpoint
   */
  private async sendLogsToRemote(logs: LogEntry[]): Promise<void> {
    try {
      const response = await fetch(this.config.remote_endpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service: this.config.service_name,
          environment: this.config.environment,
          logs,
        }),
      });

      if (!response.ok) {
        throw new Error(`Remote logging failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to send logs to remote endpoint:', error);
      throw error;
    }
  }

  /**
   * Setup flush interval
   */
  private setupFlushInterval(): void {
    if (this.config.enable_file || this.config.enable_remote) {
      this.flushInterval = setInterval(() => {
        this.flushLogs().catch(error => {
          console.error('Log flush interval error:', error);
        });
      }, 5000); // Flush every 5 seconds
    }
  }

  /**
   * Get request ID from context (if available)
   */
  private getRequestId(): string | undefined {
    // In a real implementation, this would get the request ID from context
    // For now, return undefined
    return undefined;
  }

  /**
   * Get user ID from context (if available)
   */
  private getUserId(): string | undefined {
    // In a real implementation, this would get the user ID from context
    // For now, return undefined
    return undefined;
  }

  /**
   * Get session ID from context (if available)
   */
  private getSessionId(): string | undefined {
    // In a real implementation, this would get the session ID from context
    // For now, return undefined
    return undefined;
  }

  /**
   * Force flush all pending logs
   */
  async flush(): Promise<void> {
    await this.flushLogs();
  }

  /**
   * Close logger and cleanup resources
   */
  async close(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = undefined;
    }

    // Flush remaining logs
    await this.flushLogs();
  }

  /**
   * Update logger configuration
   */
  updateConfig(updates: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Get current log statistics
   */
  getStats(): { buffered_logs: number; service: string; environment: string } {
    return {
      buffered_logs: this.logBuffer.length,
      service: this.config.service_name,
      environment: this.config.environment,
    };
  }
}

// Error tracking utilities
export class ErrorTracker {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Track an error with context
   */
  trackError(error: Error, context?: {
    user_action?: string;
    component?: string;
    additional_data?: Record<string, any>;
  }): void {
    this.logger.error('Error tracked', error, {
      error_type: error.name,
      error_message: error.message,
      stack_trace: error.stack,
      context,
    });
  }

  /**
   * Track a handled exception
   */
  trackHandledException(
    message: string, 
    error: Error, 
    severity: 'low' | 'medium' | 'high' = 'medium'
  ): void {
    this.logger.warn(`Handled exception (${severity}): ${message}`, {
      error: error,
      severity,
      handled: true,
    });
  }

  /**
   * Track performance issue
   */
  trackPerformanceIssue(
    operation: string, 
    duration: number, 
    threshold: number,
    metadata?: Record<string, any>
  ): void {
    if (duration > threshold) {
      this.logger.warn(`Performance issue detected`, {
        operation,
        duration_ms: duration,
        threshold_ms: threshold,
        slowness_factor: duration / threshold,
        ...metadata,
      });
    }
  }

  /**
   * Track user action
   */
  trackUserAction(
    action: string, 
    success: boolean, 
    metadata?: Record<string, any>
  ): void {
    this.logger.info(`User action: ${action}`, {
      action,
      success,
      ...metadata,
    });
  }
}

// Global logger instances
let globalLogger: Logger;
let globalErrorTracker: ErrorTracker;

/**
 * Initialize global logger
 */
export function initializeLogger(config: LoggerConfig): Logger {
  globalLogger = new Logger(config);
  globalErrorTracker = new ErrorTracker(globalLogger);
  
  // Setup global error handlers
  if (typeof globalThis !== 'undefined' && 'window' in globalThis) {
    // Browser environment
    const window = (globalThis as any).window;
    window.addEventListener('error', (event: any) => {
      globalErrorTracker.trackError(event.error, {
        user_action: 'page_error',
        component: 'global',
        additional_data: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    window.addEventListener('unhandledrejection', (event: any) => {
      globalErrorTracker.trackError(new Error(event.reason), {
        user_action: 'unhandled_rejection',
        component: 'global',
      });
    });
  } else {
    // Node.js environment
    process.on('uncaughtException', (error) => {
      globalErrorTracker.trackError(error, {
        user_action: 'uncaught_exception',
        component: 'process',
      });
    });

    process.on('unhandledRejection', (reason, promise) => {
      globalErrorTracker.trackError(new Error(String(reason)), {
        user_action: 'unhandled_rejection',
        component: 'process',
        additional_data: { promise: String(promise) },
      });
    });
  }

  return globalLogger;
}

/**
 * Get global logger instance
 */
export function getLogger(): Logger {
  if (!globalLogger) {
    throw new Error('Logger not initialized. Call initializeLogger() first.');
  }
  return globalLogger;
}

/**
 * Get global error tracker instance
 */
export function getErrorTracker(): ErrorTracker {
  if (!globalErrorTracker) {
    throw new Error('Error tracker not initialized. Call initializeLogger() first.');
  }
  return globalErrorTracker;
}

/**
 * Simple health monitoring utilities
 */
export class HealthMonitor {
  private logger: Logger;
  private healthChecks: Map<string, () => Promise<boolean>> = new Map();
  private lastHealthStatus: Map<string, { status: boolean; timestamp: number }> = new Map();

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Register a health check function
   */
  registerHealthCheck(name: string, checkFn: () => Promise<boolean>): void {
    this.healthChecks.set(name, checkFn);
  }

  /**
   * Run all health checks and return status
   */
  async checkHealth(): Promise<{ 
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, { status: boolean; timestamp: number; error?: string }>;
    timestamp: number;
  }> {
    const results: Record<string, { status: boolean; timestamp: number; error?: string }> = {};
    let overallHealthy = true;

    for (const [name, checkFn] of this.healthChecks) {
      try {
        const status = await checkFn();
        const timestamp = Date.now();
        
        results[name] = { status, timestamp };
        this.lastHealthStatus.set(name, { status, timestamp });
        
        if (!status) overallHealthy = false;
        
        this.logger.debug(`Health check ${name}: ${status ? 'PASS' : 'FAIL'}`);
      } catch (error) {
        const timestamp = Date.now();
        results[name] = { 
          status: false, 
          timestamp,
          error: error instanceof Error ? error.message : String(error)
        };
        
        this.lastHealthStatus.set(name, { status: false, timestamp });
        overallHealthy = false;
        
        this.logger.warn(`Health check ${name} failed with error`, { error });
      }
    }

    const overallStatus = overallHealthy ? 'healthy' : 'unhealthy';
    
    this.logger.info(`Health check completed: ${overallStatus}`, {
      total_checks: this.healthChecks.size,
      passing: Object.values(results).filter(r => r.status).length,
    });

    return {
      status: overallStatus,
      checks: results,
      timestamp: Date.now(),
    };
  }

  /**
   * Get simple health status
   */
  getSimpleStatus(): { status: string; timestamp: number } {
    const allHealthy = Array.from(this.lastHealthStatus.values())
      .every(check => check.status);
    
    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: Date.now(),
    };
  }
}

/**
 * Create health monitor instance
 */
export function createHealthMonitor(config?: { service_name?: string }): HealthMonitor {
  const logger = globalLogger || initializeLogger({
    service_name: config?.service_name || 'health-monitor',
    environment: 'testnet',
    min_level: LogLevel.INFO,
    enable_console: true,
    enable_file: false,
    enable_remote: false,
  });

  return new HealthMonitor(logger);
}
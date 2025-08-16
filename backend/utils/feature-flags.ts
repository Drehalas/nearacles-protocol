/**
 * Feature Flags System for NEAR Oracle Intent Protocol
 * Simple feature toggle system for testnet deployment
 */

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  environment: 'development' | 'testnet' | 'mainnet' | 'all';
  rollout_percentage?: number;
  dependencies?: string[];
  metadata?: Record<string, any>;
}

export interface FeatureFlagConfig {
  environment: string;
  user_id?: string;
  user_type?: 'solver' | 'user' | 'admin';
  override_enabled?: boolean;
}

export class FeatureFlagService {
  private flags: Map<string, FeatureFlag> = new Map();
  private config: FeatureFlagConfig;
  private overrides: Map<string, boolean> = new Map();

  constructor(config: FeatureFlagConfig) {
    this.config = config;
    this.initializeDefaultFlags();
  }

  /**
   * Initialize default feature flags for testnet
   */
  private initializeDefaultFlags(): void {
    const defaultFlags: FeatureFlag[] = [
      // AI Features
      {
        key: 'ai_insights',
        name: 'AI Market Insights',
        description: 'Enable AI-powered market analysis and insights',
        enabled: true,
        environment: 'all',
        rollout_percentage: 100,
      },
      {
        key: 'ai_intent_optimization',
        name: 'AI Intent Optimization',
        description: 'Enable AI-powered intent optimization recommendations',
        enabled: true,
        environment: 'testnet',
        rollout_percentage: 90,
      },
      {
        key: 'ai_risk_assessment',
        name: 'AI Risk Assessment',
        description: 'Enable AI-powered risk assessment for intents',
        enabled: true,
        environment: 'all',
        rollout_percentage: 100,
      },
      
      // Frontend Features
      {
        key: 'advanced_analytics',
        name: 'Advanced Analytics Dashboard',
        description: 'Show advanced analytics and metrics in the frontend',
        enabled: false,
        environment: 'testnet',
        rollout_percentage: 25,
      },
      {
        key: 'real_time_updates',
        name: 'Real-time Updates',
        description: 'Enable real-time WebSocket updates in frontend',
        enabled: true,
        environment: 'all',
        rollout_percentage: 100,
      },
      {
        key: 'debug_mode',
        name: 'Debug Mode',
        description: 'Show debugging information and logs',
        enabled: true,
        environment: 'development',
        rollout_percentage: 100,
      },
      
      // Performance Features
      {
        key: 'performance_monitoring',
        name: 'Performance Monitoring',
        description: 'Enable performance monitoring and metrics collection',
        enabled: true,
        environment: 'testnet',
        rollout_percentage: 100,
      },
      {
        key: 'caching_enabled',
        name: 'Response Caching',
        description: 'Enable caching for API responses and market data',
        enabled: true,
        environment: 'all',
        rollout_percentage: 100,
      },
      
      // Security Features
      {
        key: 'enhanced_security',
        name: 'Enhanced Security Checks',
        description: 'Enable additional security validations and checks',
        enabled: true,
        environment: 'testnet',
        rollout_percentage: 100,
      },
      {
        key: 'rate_limiting',
        name: 'Rate Limiting',
        description: 'Enable rate limiting for API requests',
        enabled: true,
        environment: 'all',
        rollout_percentage: 100,
      },
      
      // Experimental Features
      {
        key: 'experimental_solvers',
        name: 'Experimental Solver Types',
        description: 'Enable experimental solver implementations',
        enabled: false,
        environment: 'testnet',
        rollout_percentage: 10,
        dependencies: ['enhanced_security'],
      },
      {
        key: 'multi_chain_support',
        name: 'Multi-chain Support',
        description: 'Enable multi-chain intent processing (experimental)',
        enabled: false,
        environment: 'development',
        rollout_percentage: 0,
      },
      
      // Testing Features
      {
        key: 'mock_data',
        name: 'Mock Data Mode',
        description: 'Use mock data instead of real market data',
        enabled: false,
        environment: 'development',
        rollout_percentage: 0,
      },
      {
        key: 'stress_testing',
        name: 'Stress Testing Mode',
        description: 'Enable stress testing endpoints and features',
        enabled: false,
        environment: 'testnet',
        rollout_percentage: 0,
      },
    ];

    defaultFlags.forEach(flag => {
      this.flags.set(flag.key, flag);
    });
  }

  /**
   * Check if a feature flag is enabled
   */
  isEnabled(flagKey: string): boolean {
    // Check for override first
    if (this.overrides.has(flagKey)) {
      return this.overrides.get(flagKey)!;
    }

    const flag = this.flags.get(flagKey);
    if (!flag) {
      console.warn(`Feature flag not found: ${flagKey}`);
      return false;
    }

    // Environment check
    if (flag.environment !== 'all' && flag.environment !== this.config.environment) {
      return false;
    }

    // Check dependencies
    if (flag.dependencies) {
      for (const dependency of flag.dependencies) {
        if (!this.isEnabled(dependency)) {
          return false;
        }
      }
    }

    // Rollout percentage check
    if (flag.rollout_percentage !== undefined && flag.rollout_percentage < 100) {
      const hash = this.hashString(flagKey + (this.config.user_id || 'default'));
      const bucket = hash % 100;
      if (bucket >= flag.rollout_percentage) {
        return false;
      }
    }

    return flag.enabled;
  }

  /**
   * Set a feature flag override (for testing/admin purposes)
   */
  setOverride(flagKey: string, enabled: boolean): void {
    if (!this.config.override_enabled) {
      console.warn('Feature flag overrides are not enabled');
      return;
    }

    this.overrides.set(flagKey, enabled);
    console.log(`Feature flag override set: ${flagKey} = ${enabled}`);
  }

  /**
   * Remove a feature flag override
   */
  removeOverride(flagKey: string): void {
    this.overrides.delete(flagKey);
    console.log(`Feature flag override removed: ${flagKey}`);
  }

  /**
   * Get all enabled feature flags
   */
  getEnabledFlags(): string[] {
    return Array.from(this.flags.keys()).filter(key => this.isEnabled(key));
  }

  /**
   * Get feature flag details
   */
  getFlag(flagKey: string): FeatureFlag | undefined {
    return this.flags.get(flagKey);
  }

  /**
   * Get all feature flags with their current status
   */
  getAllFlags(): Array<FeatureFlag & { current_status: boolean }> {
    return Array.from(this.flags.values()).map(flag => ({
      ...flag,
      current_status: this.isEnabled(flag.key),
    }));
  }

  /**
   * Update feature flag configuration
   */
  updateFlag(flagKey: string, updates: Partial<FeatureFlag>): boolean {
    const flag = this.flags.get(flagKey);
    if (!flag) {
      return false;
    }

    this.flags.set(flagKey, { ...flag, ...updates });
    console.log(`Feature flag updated: ${flagKey}`);
    return true;
  }

  /**
   * Add a new feature flag
   */
  addFlag(flag: FeatureFlag): void {
    this.flags.set(flag.key, flag);
    console.log(`Feature flag added: ${flag.key}`);
  }

  /**
   * Remove a feature flag
   */
  removeFlag(flagKey: string): boolean {
    const removed = this.flags.delete(flagKey);
    if (removed) {
      this.overrides.delete(flagKey);
      console.log(`Feature flag removed: ${flagKey}`);
    }
    return removed;
  }

  /**
   * Check multiple flags at once
   */
  checkFlags(flagKeys: string[]): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    flagKeys.forEach(key => {
      result[key] = this.isEnabled(key);
    });
    return result;
  }

  /**
   * Get feature flags for environment variables export
   */
  getEnvironmentVariables(): Record<string, string> {
    const envVars: Record<string, string> = {};
    
    Array.from(this.flags.keys()).forEach(key => {
      const envKey = `NEXT_PUBLIC_FEATURE_${key.toUpperCase()}`;
      envVars[envKey] = this.isEnabled(key) ? 'true' : 'false';
    });

    return envVars;
  }

  /**
   * Simple string hash function for rollout percentage
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Reset all feature flags to default state
   */
  reset(): void {
    this.overrides.clear();
    this.flags.clear();
    this.initializeDefaultFlags();
    console.log('Feature flags reset to default state');
  }
}

// Singleton instance for global use
let featureFlagService: FeatureFlagService;

/**
 * Initialize the global feature flag service
 */
export function initializeFeatureFlags(config: FeatureFlagConfig): FeatureFlagService {
  featureFlagService = new FeatureFlagService(config);
  return featureFlagService;
}

/**
 * Get the global feature flag service instance
 */
export function getFeatureFlags(): FeatureFlagService {
  if (!featureFlagService) {
    throw new Error('Feature flags not initialized. Call initializeFeatureFlags() first.');
  }
  return featureFlagService;
}

/**
 * Convenience function to check if a feature is enabled
 */
export function isFeatureEnabled(flagKey: string): boolean {
  return getFeatureFlags().isEnabled(flagKey);
}
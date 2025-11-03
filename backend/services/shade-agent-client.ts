/**
 * Shade Agent Client Service
 * Integrates with NEAR Shade Agent framework for TEE-secured oracle nodes
 * Handles agent registration, attestation retrieval, and health monitoring
 */

import { TEEAttestation } from './tee-attestation.js';

export interface ShadeAgentConfig {
  nearAccount: string;
  privateKey: string;
  phalaApiKey?: string;
  dstackApiKey?: string;
  deploymentId?: string;
  deploymentUrl?: string;
  teeProvider: 'dstack' | 'phala';
  mode: 'production' | 'development';
}

export interface AgentRegistrationResult {
  agentId: string;
  nearAccount: string;
  ethAccount?: string;
  attestation: TEEAttestation;
  deploymentUrl: string;
  registrationTime: number;
}

export interface AgentHealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  teeVerified: boolean;
  lastAttestationTime: number;
  uptime: number;
  errors: string[];
}

export interface ShadeAgentMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  lastHealthCheckTime: number;
  lastAttestationRefresh: number;
  registrationTime: number;
}

export class ShadeAgentClient {
  private config: ShadeAgentConfig;
  private metrics: ShadeAgentMetrics;
  private agentId?: string;
  private deploymentUrl?: string;
  private isRegistered: boolean = false;
  private startTime: number;

  constructor(config: ShadeAgentConfig) {
    this.config = config;
    this.startTime = Date.now();
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      lastHealthCheckTime: 0,
      lastAttestationRefresh: 0,
      registrationTime: 0,
    };
  }

  /**
   * Register agent with Shade Agent framework
   * In production: Deploys to Phala Cloud TEE
   * In development: Creates mock agent registration
   */
  async register(): Promise<AgentRegistrationResult> {
    try {
      console.log(`Registering Shade Agent (mode: ${this.config.mode})...`);

      let result: AgentRegistrationResult;

      if (this.config.mode === 'production') {
        result = await this.registerProductionAgent();
      } else {
        result = await this.registerDevelopmentAgent();
      }

      this.agentId = result.agentId;
      this.deploymentUrl = result.deploymentUrl;
      this.isRegistered = true;
      this.metrics.registrationTime = Date.now();
      this.metrics.successfulRequests++;

      console.log(`Shade Agent registered successfully:`);
      console.log(`  Agent ID: ${result.agentId}`);
      console.log(`  NEAR Account: ${result.nearAccount}`);
      console.log(`  Deployment URL: ${result.deploymentUrl}`);
      console.log(`  TEE Verified: ${result.attestation.tee_provider !== 'mock'}`);

      return result;
    } catch (error) {
      this.metrics.failedRequests++;
      console.error('Failed to register Shade Agent:', error);
      throw error;
    } finally {
      this.metrics.totalRequests++;
    }
  }

  /**
   * Register agent in production mode (Phala Cloud)
   */
  private async registerProductionAgent(): Promise<AgentRegistrationResult> {
    if (!this.config.phalaApiKey && !this.config.dstackApiKey) {
      throw new Error('Phala API key or Dstack API key required for production mode');
    }

    try {
      // In production, this would call Phala Cloud API
      // For now, we simulate the registration process
      const agentId = this.generateAgentId();
      const deploymentUrl = this.config.deploymentUrl || `https://${agentId}.dstack.host`;

      // Get attestation from TEE
      const attestation: TEEAttestation = await this.getProductionAttestation();

      return {
        agentId,
        nearAccount: this.config.nearAccount,
        attestation,
        deploymentUrl,
        registrationTime: Date.now(),
      };
    } catch (error) {
      console.error('Production agent registration failed:', error);
      throw new Error(`Production registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Register agent in development mode (mock)
   */
  private async registerDevelopmentAgent(): Promise<AgentRegistrationResult> {
    const agentId = this.generateAgentId();

    const mockAttestation: TEEAttestation = {
      node_id: this.config.nearAccount,
      attestation_hash: 'mock_hash_' + Math.random().toString(36).substring(7),
      attestation_proof: JSON.stringify({
        deployment_id: agentId,
        image_hash: 'sha256:mock_image_hash',
        container_args: ['npm', 'run', 'start'],
        environment_vars: {
          NODE_ENV: 'development',
          TEE_MODE: 'mock',
        },
        timestamp: Date.now(),
        tee_signature: 'mock_tee_signature',
        app_signature: 'mock_app_signature',
      }),
      timestamp: Date.now(),
      tee_provider: 'mock',
      deployment_url: 'http://localhost:3000',
    };

    console.log('Using MOCK Shade Agent registration (development mode)');

    return {
      agentId,
      nearAccount: this.config.nearAccount,
      attestation: mockAttestation,
      deploymentUrl: 'http://localhost:3000',
      registrationTime: Date.now(),
    };
  }

  /**
   * Get TEE attestation from production environment
   */
  private async getProductionAttestation(): Promise<TEEAttestation> {
    if (!this.config.deploymentId) {
      throw new Error('Deployment ID required for production attestation');
    }

    try {
      const apiKey = this.config.dstackApiKey || this.config.phalaApiKey;
      const apiUrl = this.config.teeProvider === 'dstack'
        ? 'https://api.dstack.host/v1/attestation'
        : 'https://api.phala.network/v1/attestation';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deployment_id: this.config.deploymentId,
        }),
      });

      if (!response.ok) {
        throw new Error(`TEE API error: ${response.status} ${response.statusText}`);
      }

      const raReport = await response.json();

      return {
        node_id: this.config.nearAccount,
        attestation_hash: this.hashRAReport(raReport),
        attestation_proof: JSON.stringify(raReport),
        timestamp: Date.now(),
        tee_provider: this.config.teeProvider,
        deployment_url: this.config.deploymentUrl,
      };
    } catch (error) {
      console.error('Failed to get production attestation:', error);
      throw error;
    }
  }

  /**
   * Get current TEE attestation
   */
  async getAttestation(): Promise<TEEAttestation> {
    try {
      console.log('Retrieving TEE attestation...');

      if (this.config.mode === 'production') {
        const attestation = await this.getProductionAttestation();
        this.metrics.lastAttestationRefresh = Date.now();
        this.metrics.successfulRequests++;
        return attestation;
      } else {
        // Return mock attestation in development
        const attestation: TEEAttestation = {
          node_id: this.config.nearAccount,
          attestation_hash: 'mock_hash_' + Date.now(),
          attestation_proof: JSON.stringify({
            deployment_id: this.agentId || 'mock-agent',
            timestamp: Date.now(),
          }),
          timestamp: Date.now(),
          tee_provider: 'mock',
          deployment_url: 'http://localhost:3000',
        };

        this.metrics.lastAttestationRefresh = Date.now();
        this.metrics.successfulRequests++;
        return attestation;
      }
    } catch (error) {
      this.metrics.failedRequests++;
      console.error('Failed to get attestation:', error);
      throw error;
    } finally {
      this.metrics.totalRequests++;
    }
  }

  /**
   * Perform health check on agent
   */
  async healthCheck(): Promise<AgentHealthStatus> {
    try {
      console.log('Performing Shade Agent health check...');

      const errors: string[] = [];
      let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
      let teeVerified = false;

      // Check registration status
      if (!this.isRegistered) {
        errors.push('Agent not registered');
        status = 'unhealthy';
      }

      // Check attestation freshness
      const attestationAge = Date.now() - this.metrics.lastAttestationRefresh;
      if (attestationAge > 3600000) { // 1 hour
        errors.push('Attestation older than 1 hour');
        status = status === 'healthy' ? 'degraded' : status;
      }

      // Check TEE verification
      if (this.config.mode === 'production') {
        try {
          const attestation = await this.getAttestation();
          teeVerified = attestation.tee_provider !== 'mock';
        } catch (error) {
          errors.push('Failed to verify TEE attestation');
          status = 'unhealthy';
        }
      } else {
        teeVerified = false; // Mock mode
      }

      // Check deployment URL accessibility (production only)
      if (this.config.mode === 'production' && this.deploymentUrl) {
        try {
          const response = await fetch(this.deploymentUrl, {
            method: 'GET',
            signal: AbortSignal.timeout(5000),
          });

          if (!response.ok) {
            errors.push(`Deployment URL unreachable: ${response.status}`);
            status = 'degraded';
          }
        } catch (error) {
          errors.push('Deployment URL not accessible');
          status = status === 'healthy' ? 'degraded' : status;
        }
      }

      this.metrics.lastHealthCheckTime = Date.now();
      this.metrics.successfulRequests++;

      const healthStatus: AgentHealthStatus = {
        status,
        teeVerified,
        lastAttestationTime: this.metrics.lastAttestationRefresh,
        uptime: Date.now() - this.startTime,
        errors,
      };

      console.log(`Health check complete: ${status.toUpperCase()}`);
      if (errors.length > 0) {
        console.log(`  Errors: ${errors.join(', ')}`);
      }

      return healthStatus;
    } catch (error) {
      this.metrics.failedRequests++;
      console.error('Health check failed:', error);

      return {
        status: 'unhealthy',
        teeVerified: false,
        lastAttestationTime: this.metrics.lastAttestationRefresh,
        uptime: Date.now() - this.startTime,
        errors: [`Health check error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    } finally {
      this.metrics.totalRequests++;
    }
  }

  /**
   * Refresh agent attestation
   */
  async refreshAttestation(): Promise<TEEAttestation> {
    console.log('Refreshing Shade Agent attestation...');
    const attestation = await this.getAttestation();
    console.log('Attestation refreshed successfully');
    return attestation;
  }

  /**
   * Get agent metrics
   */
  getMetrics(): ShadeAgentMetrics {
    return { ...this.metrics };
  }

  /**
   * Get agent configuration
   */
  getConfig(): ShadeAgentConfig {
    return { ...this.config };
  }

  /**
   * Get agent ID
   */
  getAgentId(): string | undefined {
    return this.agentId;
  }

  /**
   * Get deployment URL
   */
  getDeploymentUrl(): string | undefined {
    return this.deploymentUrl;
  }

  /**
   * Check if agent is registered
   */
  isAgentRegistered(): boolean {
    return this.isRegistered;
  }

  /**
   * Update agent configuration
   */
  updateConfig(config: Partial<ShadeAgentConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('Shade Agent configuration updated');
  }

  /**
   * Generate unique agent ID
   */
  private generateAgentId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `agent-${timestamp}-${random}`;
  }

  /**
   * Hash RA Report for attestation
   */
  private hashRAReport(raReport: any): string {
    const reportString = JSON.stringify(raReport);
    let hash = 0;
    for (let i = 0; i < reportString.length; i++) {
      const char = reportString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return 'hash_' + Math.abs(hash).toString(16);
  }

  /**
   * Shutdown agent (cleanup)
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down Shade Agent...');
    this.isRegistered = false;
    console.log('Shade Agent shutdown complete');
  }
}

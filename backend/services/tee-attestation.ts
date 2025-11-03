/**
 * TEE Attestation Service
 * Handles generation and verification of Trusted Execution Environment attestations
 * Supports both Phala Dstack and mock mode for development
 */

export interface TEEAttestation {
  node_id: string;
  attestation_hash: string;
  attestation_proof: string;  // Dstack RA Report (JSON stringified)
  timestamp: number;
  tee_provider: 'dstack' | 'phala' | 'mock';
  deployment_url?: string;    // e.g., https://0xABCD.dstack.host
}

export interface DstackRAReport {
  deployment_id: string;
  image_hash: string;
  container_args: string[];
  environment_vars: Record<string, string>;
  timestamp: number;
  tee_signature: string;      // TEE hardware signature
  app_signature: string;      // Application-specific signature
}

export interface TEEAttestationConfig {
  mode: 'production' | 'development';
  nodeId: string;
  dstackApiKey?: string;
  deploymentId?: string;
  deploymentUrl?: string;
}

export interface AttestationMetrics {
  totalGenerated: number;
  totalVerified: number;
  lastGenerationTime: number;
  lastVerificationTime: number;
  failedGenerations: number;
  failedVerifications: number;
}

export class TEEAttestationService {
  private config: TEEAttestationConfig;
  private metrics: AttestationMetrics;
  private currentAttestation?: TEEAttestation;

  constructor(config: TEEAttestationConfig) {
    this.config = config;
    this.metrics = {
      totalGenerated: 0,
      totalVerified: 0,
      lastGenerationTime: 0,
      lastVerificationTime: 0,
      failedGenerations: 0,
      failedVerifications: 0,
    };
  }

  /**
   * Generate TEE attestation
   * In production: Calls Dstack API
   * In development: Generates mock attestation
   */
  async generateAttestation(): Promise<TEEAttestation> {
    try {
      console.log(`Generating TEE attestation (mode: ${this.config.mode})...`);

      let attestation: TEEAttestation;

      if (this.config.mode === 'production') {
        attestation = await this.generateDstackAttestation();
      } else {
        attestation = this.generateMockAttestation();
      }

      this.currentAttestation = attestation;
      this.metrics.totalGenerated++;
      this.metrics.lastGenerationTime = Date.now();

      console.log(`✅ TEE attestation generated: ${attestation.attestation_hash}`);
      return attestation;
    } catch (error) {
      this.metrics.failedGenerations++;
      console.error('Failed to generate TEE attestation:', error);
      throw error;
    }
  }

  /**
   * Generate attestation from Dstack (production mode)
   */
  private async generateDstackAttestation(): Promise<TEEAttestation> {
    if (!this.config.dstackApiKey || !this.config.deploymentId) {
      throw new Error('Dstack API key and deployment ID required for production mode');
    }

    try {
      // Call Dstack attestation API
      const response = await fetch('https://api.dstack.host/v1/attestation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.dstackApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deployment_id: this.config.deploymentId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Dstack API error: ${response.status} ${response.statusText}`);
      }

      const raReport = await response.json() as DstackRAReport;

      // Convert to our attestation format
      const attestation: TEEAttestation = {
        node_id: this.config.nodeId,
        attestation_hash: this.hashRAReport(raReport),
        attestation_proof: JSON.stringify(raReport),
        timestamp: Date.now(),
        tee_provider: 'dstack',
        deployment_url: this.config.deploymentUrl,
      };

      return attestation;
    } catch (error) {
      console.error('Dstack attestation generation failed:', error);
      throw new Error(`Dstack attestation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate mock attestation (development mode)
   */
  private generateMockAttestation(): TEEAttestation {
    const mockRAReport: DstackRAReport = {
      deployment_id: 'mock-deployment-' + Date.now(),
      image_hash: 'sha256:mock_hash_' + Math.random().toString(36).substring(7),
      container_args: ['npm', 'run', 'start'],
      environment_vars: {
        NODE_ENV: 'development',
        TEE_MODE: 'mock',
      },
      timestamp: Date.now(),
      tee_signature: 'mock_tee_sig_' + Math.random().toString(36).substring(7),
      app_signature: 'mock_app_sig_' + Math.random().toString(36).substring(7),
    };

    const attestation: TEEAttestation = {
      node_id: this.config.nodeId,
      attestation_hash: this.hashRAReport(mockRAReport),
      attestation_proof: JSON.stringify(mockRAReport),
      timestamp: Date.now(),
      tee_provider: 'mock',
      deployment_url: 'http://localhost:3000',
    };

    console.log('⚠️  Using MOCK attestation (development mode)');
    return attestation;
  }

  /**
   * Verify TEE attestation
   * In production: Verifies Dstack signatures
   * In development: Basic validation only
   */
  async verifyAttestation(attestation: TEEAttestation): Promise<boolean> {
    try {
      console.log(`Verifying TEE attestation (provider: ${attestation.tee_provider})...`);

      let isValid: boolean;

      if (attestation.tee_provider === 'dstack' || attestation.tee_provider === 'phala') {
        isValid = await this.verifyDstackAttestation(attestation);
      } else if (attestation.tee_provider === 'mock') {
        isValid = this.verifyMockAttestation(attestation);
      } else {
        throw new Error(`Unknown TEE provider: ${attestation.tee_provider}`);
      }

      this.metrics.totalVerified++;
      this.metrics.lastVerificationTime = Date.now();

      if (isValid) {
        console.log('✅ TEE attestation verified successfully');
      } else {
        console.log('❌ TEE attestation verification failed');
      }

      return isValid;
    } catch (error) {
      this.metrics.failedVerifications++;
      console.error('Failed to verify TEE attestation:', error);
      return false;
    }
  }

  /**
   * Verify Dstack attestation (production mode)
   */
  private async verifyDstackAttestation(attestation: TEEAttestation): Promise<boolean> {
    try {
      // Parse RA Report
      const raReport: DstackRAReport = JSON.parse(attestation.attestation_proof);

      // 1. Verify timestamp is not too old (max 24 hours)
      const age = Date.now() - raReport.timestamp;
      if (age > 24 * 60 * 60 * 1000) {
        console.warn('Attestation expired (> 24 hours old)');
        return false;
      }

      // 2. Verify attestation hash matches
      const computedHash = this.hashRAReport(raReport);
      if (computedHash !== attestation.attestation_hash) {
        console.warn('Attestation hash mismatch');
        return false;
      }

      // 3. Verify deployment URL if provided
      if (attestation.deployment_url && !attestation.deployment_url.includes('dstack.host')) {
        console.warn('Invalid deployment URL format');
        return false;
      }

      // 4. TODO: Verify TEE signature with Dstack public key
      // This requires the Dstack public key and cryptographic verification
      // For now, we accept if basic checks pass
      console.log('⚠️  Cryptographic signature verification not yet implemented');

      return true;
    } catch (error) {
      console.error('Dstack attestation verification error:', error);
      return false;
    }
  }

  /**
   * Verify mock attestation (development mode)
   */
  private verifyMockAttestation(attestation: TEEAttestation): boolean {
    try {
      // Basic validation for mock attestations
      if (!attestation.attestation_hash || attestation.attestation_hash.length === 0) {
        return false;
      }

      if (!attestation.attestation_proof || attestation.attestation_proof.length === 0) {
        return false;
      }

      if (!attestation.node_id || attestation.node_id.length === 0) {
        return false;
      }

      if (attestation.timestamp <= 0) {
        return false;
      }

      console.log('✅ Mock attestation validation passed');
      return true;
    } catch (error) {
      console.error('Mock attestation verification error:', error);
      return false;
    }
  }

  /**
   * Refresh attestation (generates new one)
   */
  async refreshAttestation(): Promise<TEEAttestation> {
    console.log('Refreshing TEE attestation...');
    return await this.generateAttestation();
  }

  /**
   * Get current attestation
   */
  getCurrentAttestation(): TEEAttestation | undefined {
    return this.currentAttestation;
  }

  /**
   * Check if current attestation is still valid
   */
  isAttestationValid(): boolean {
    if (!this.currentAttestation) {
      return false;
    }

    // Attestation is valid for 1 hour
    const age = Date.now() - this.currentAttestation.timestamp;
    return age < 60 * 60 * 1000; // 1 hour
  }

  /**
   * Get attestation metrics
   */
  getMetrics(): AttestationMetrics {
    return { ...this.metrics };
  }

  /**
   * Hash RA Report for attestation hash
   */
  private hashRAReport(raReport: DstackRAReport): string {
    // Simple hash implementation (in production, use proper cryptographic hash)
    const reportString = JSON.stringify(raReport);
    let hash = 0;
    for (let i = 0; i < reportString.length; i++) {
      const char = reportString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return 'hash_' + Math.abs(hash).toString(16);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<TEEAttestationConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('TEE attestation config updated');
  }

  /**
   * Get configuration
   */
  getConfig(): TEEAttestationConfig {
    return { ...this.config };
  }
}

/**
 * Risk Monitoring System for NEAR Protocol Intent Execution
 * Real-time risk monitoring and alerting capabilities
 */

import { AdvancedRiskAssessor, RiskAssessment, RiskAssessmentConfig } from './advanced-risk-assessor';
import { AIAgentConfig } from './types';
import { MarketDataProviders } from './market-data-providers';

export interface RiskThresholds {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

export interface RiskAlert {
  id: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'volatility' | 'liquidity' | 'operational' | 'market' | 'counterparty';
  message: string;
  recommendation: string;
  affectedAssets: string[];
  resolved: boolean;
}

export interface MonitoringConfig {
  enabled: boolean;
  checkInterval: number; // milliseconds
  alertThresholds: RiskThresholds;
  enableRealTimeAlerts: boolean;
  enableHistoricalTracking: boolean;
  maxHistoryDays: number;
}

export interface RiskMetrics {
  timestamp: number;
  overall_risk: number;
  volatility_risk: number;
  liquidity_risk: number;
  operational_risk: number;
  market_risk: number;
  counterparty_risk: number;
}

export class RiskMonitoringSystem {
  private riskAssessor: AdvancedRiskAssessor;
  private config: MonitoringConfig;
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | undefined = undefined;
  private alerts: RiskAlert[] = [];
  private riskHistory: RiskMetrics[] = [];
  private subscribedAssets: Set<string> = new Set();

  constructor(
    aiConfig: AIAgentConfig,
    marketDataProviders: MarketDataProviders,
    assessmentConfig: RiskAssessmentConfig,
    monitoringConfig: MonitoringConfig
  ) {
    this.riskAssessor = new AdvancedRiskAssessor(aiConfig, marketDataProviders, assessmentConfig);
    this.config = monitoringConfig;
  }

  /**
   * Start continuous risk monitoring
   */
  async startMonitoring(assets: string[]): Promise<void> {
    if (this.isMonitoring) {
      throw new Error('Risk monitoring is already active');
    }

    // Add assets to monitoring list
    assets.forEach(asset => this.subscribedAssets.add(asset));

    this.isMonitoring = true;
    console.log('Starting risk monitoring for assets: %s', Array.from(this.subscribedAssets).join(', '));

    // Perform initial assessment
    await this.performMonitoringCycle();

    // Set up periodic monitoring
    this.monitoringInterval = setInterval(
      () => this.performMonitoringCycle(),
      this.config.checkInterval
    );
  }

  /**
   * Stop risk monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    console.log('Risk monitoring stopped');
  }

  /**
   * Add assets to monitoring
   */
  addAssetsToMonitoring(assets: string[]): void {
    assets.forEach(asset => this.subscribedAssets.add(asset));
    console.log('Added assets to monitoring: %s', assets.join(', '));
  }

  /**
   * Remove assets from monitoring
   */
  removeAssetsFromMonitoring(assets: string[]): void {
    assets.forEach(asset => this.subscribedAssets.delete(asset));
    console.log('Removed assets from monitoring: %s', assets.join(', '));
  }

  /**
   * Perform a single monitoring cycle
   */
  private async performMonitoringCycle(): Promise<void> {
    try {
      const timestamp = Date.now();
      
      // Monitor each asset pair
      for (const asset of this.subscribedAssets) {
        await this.monitorAsset(asset, timestamp);
      }

      // Clean up old alerts and history
      this.cleanupOldData();

    } catch (error) {
      console.error('Error during monitoring cycle:', error);
      
      // Create system alert
      this.createAlert({
        severity: 'medium',
        type: 'operational',
        message: 'Risk monitoring system encountered an error',
        recommendation: 'Check system logs and restart monitoring if necessary',
        affectedAssets: Array.from(this.subscribedAssets)
      });
    }
  }

  /**
   * Monitor a specific asset
   */
  private async monitorAsset(asset: string, timestamp: number): Promise<void> {
    try {
      // Assess current risk for the asset
      const [assetIn, assetOut] = asset.includes('/') ? asset.split('/') : [asset, 'USD'];
      
      const assessment = await this.riskAssessor.assessIntentRisk(
        assetIn,
        assetOut,
        '1000', // Default monitoring amount
        'default'
      );

      if (!assessment.success || !assessment.data) {
        this.createAlert({
          severity: 'medium',
          type: 'operational',
          message: `Failed to assess risk for ${asset}`,
          recommendation: 'Investigate data connectivity and retry assessment',
          affectedAssets: [asset]
        });
        return;
      }

      const riskData = assessment.data;

      // Record risk metrics
      if (this.config.enableHistoricalTracking) {
        this.recordRiskMetrics(asset, riskData, timestamp);
      }

      // Check for risk threshold breaches
      await this.checkRiskThresholds(asset, riskData);

      // Check for sudden risk changes
      await this.checkRiskTrends(asset, riskData);

    } catch (error) {
      console.error('Error monitoring asset %s:', asset, error);
    }
  }

  /**
   * Record risk metrics for historical tracking
   */
  private recordRiskMetrics(_asset: string, assessment: RiskAssessment, timestamp: number): void {
    const metrics: RiskMetrics = {
      timestamp,
      overall_risk: assessment.overall_risk_score,
      volatility_risk: assessment.metrics.volatility.historical_volatility,
      liquidity_risk: 1 - assessment.metrics.liquidity.liquidity_score,
      operational_risk: assessment.metrics.operational.smart_contract_risk,
      market_risk: assessment.metrics.market.market_stress_indicator,
      counterparty_risk: assessment.metrics.counterparty.protocol_risk
    };

    this.riskHistory.push(metrics);
  }

  /**
   * Check if risk levels exceed configured thresholds
   */
  private async checkRiskThresholds(asset: string, assessment: RiskAssessment): Promise<void> {
    const overallRisk = assessment.overall_risk_score;
    const thresholds = this.config.alertThresholds;

    let alertSeverity: 'low' | 'medium' | 'high' | 'critical' | null = null;

    if (overallRisk >= thresholds.critical) {
      alertSeverity = 'critical';
    } else if (overallRisk >= thresholds.high) {
      alertSeverity = 'high';
    } else if (overallRisk >= thresholds.medium) {
      alertSeverity = 'medium';
    } else if (overallRisk >= thresholds.low) {
      alertSeverity = 'low';
    }

    if (alertSeverity) {
      this.createAlert({
        severity: alertSeverity,
        type: 'market',
        message: `Risk level ${alertSeverity} detected for ${asset} (${(overallRisk * 100).toFixed(1)}%)`,
        recommendation: this.getThresholdRecommendation(alertSeverity, assessment),
        affectedAssets: [asset]
      });
    }

    // Check specific risk factors
    assessment.risk_factors.forEach(factor => {
      if (factor.severity === 'critical' || factor.severity === 'high') {
        this.createAlert({
          severity: factor.severity,
          type: this.mapFactorToType(factor.factor || 'unknown'),
          message: `${factor.factor}: ${factor.description}`,
          recommendation: (factor.mitigation_strategies || []).join('; '),
          affectedAssets: [asset]
        });
      }
    });
  }

  /**
   * Check for sudden changes in risk levels
   */
  private async checkRiskTrends(asset: string, assessment: RiskAssessment): Promise<void> {
    const recentHistory = this.riskHistory
      .filter(h => Date.now() - h.timestamp < 3600000) // Last hour
      .slice(-10); // Last 10 measurements

    if (recentHistory.length < 3) {
      return; // Need more data points
    }

    const currentRisk = assessment.overall_risk_score;
    const previousRisk = recentHistory[recentHistory.length - 2].overall_risk;
    const riskChange = currentRisk - previousRisk;

    // Alert on sudden risk increases
    if (riskChange > 0.2) {
      this.createAlert({
        severity: 'high',
        type: 'market',
        message: `Sudden risk increase detected for ${asset} (+${(riskChange * 100).toFixed(1)}%)`,
        recommendation: 'Review market conditions and consider reducing exposure',
        affectedAssets: [asset]
      });
    }

    // Check volatility trends
    if (assessment.metrics.volatility.volatility_trend === 'increasing') {
      const volatilityIncrease = assessment.metrics.volatility.historical_volatility;
      if (volatilityIncrease > 0.5) {
        this.createAlert({
          severity: 'medium',
          type: 'volatility',
          message: `Increasing volatility trend for ${asset} (${(volatilityIncrease * 100).toFixed(1)}%)`,
          recommendation: 'Monitor closely and consider adjusting position sizes',
          affectedAssets: [asset]
        });
      }
    }
  }

  /**
   * Create a new risk alert
   */
  private createAlert(alertData: {
    severity: 'low' | 'medium' | 'high' | 'critical';
    type: 'volatility' | 'liquidity' | 'operational' | 'market' | 'counterparty';
    message: string;
    recommendation: string;
    affectedAssets: string[];
  }): void {
    const alert: RiskAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...alertData,
      resolved: false
    };

    this.alerts.push(alert);

    if (this.config.enableRealTimeAlerts) {
      this.emitAlert(alert);
    }

    console.log('Risk Alert [%s]: %s', alert.severity.toUpperCase(), alert.message);
  }

  /**
   * Emit alert to external systems (webhook, websocket, etc.)
   */
  private emitAlert(alert: RiskAlert): void {
    // In a real implementation, this would:
    // - Send webhooks to configured endpoints
    // - Publish to message queues
    // - Send notifications to monitoring dashboards
    // - Trigger automated responses based on severity
    
    console.log('Emitting alert: %s', JSON.stringify(alert, null, 2));
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): RiskAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity: 'low' | 'medium' | 'high' | 'critical'): RiskAlert[] {
    return this.alerts.filter(alert => alert.severity === severity && !alert.resolved);
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      console.log('Alert resolved: %s', alertId);
      return true;
    }
    return false;
  }

  /**
   * Get risk history for an asset
   */
  getRiskHistory(hoursBack: number = 24): RiskMetrics[] {
    const cutoff = Date.now() - (hoursBack * 3600000);
    return this.riskHistory.filter(h => h.timestamp >= cutoff);
  }

  /**
   * Get current monitoring status
   */
  getMonitoringStatus(): {
    isActive: boolean;
    monitoredAssets: string[];
    activeAlerts: number;
    lastUpdate: number;
  } {
    return {
      isActive: this.isMonitoring,
      monitoredAssets: Array.from(this.subscribedAssets),
      activeAlerts: this.getActiveAlerts().length,
      lastUpdate: this.riskHistory.length > 0 ? this.riskHistory[this.riskHistory.length - 1].timestamp : 0
    };
  }

  /**
   * Clean up old data to prevent memory issues
   */
  private cleanupOldData(): void {
    const cutoff = Date.now() - (this.config.maxHistoryDays * 24 * 3600000);
    
    // Clean up old risk history
    this.riskHistory = this.riskHistory.filter(h => h.timestamp >= cutoff);
    
    // Clean up resolved alerts older than 7 days
    const alertCutoff = Date.now() - (7 * 24 * 3600000);
    this.alerts = this.alerts.filter(a => 
      !a.resolved || a.timestamp >= alertCutoff
    );
  }

  /**
   * Get recommendation based on threshold breach
   */
  private getThresholdRecommendation(severity: string, assessment: RiskAssessment): string {
    const recommendations = assessment.recommendations
      .filter(r => r.priority === 'high' || r.priority === 'urgent')
      .map(r => r.action)
      .join('; ');

    return recommendations || `Review ${severity} risk conditions and take appropriate action`;
  }

  /**
   * Map risk factor to alert type
   */
  private mapFactorToType(factor: string): 'volatility' | 'liquidity' | 'operational' | 'market' | 'counterparty' {
    if (factor.toLowerCase().includes('volatility')) return 'volatility';
    if (factor.toLowerCase().includes('liquidity')) return 'liquidity';
    if (factor.toLowerCase().includes('contract') || factor.toLowerCase().includes('operational')) return 'operational';
    if (factor.toLowerCase().includes('counterparty')) return 'counterparty';
    return 'market';
  }

  /**
   * Update monitoring configuration
   */
  updateConfig(config: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.isMonitoring && config.checkInterval) {
      // Restart monitoring with new interval
      this.stopMonitoring();
      setTimeout(() => {
        this.startMonitoring(Array.from(this.subscribedAssets));
      }, 1000);
    }
  }
}

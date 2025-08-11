/**
 * Execution Engine for NEAR Protocol Intent System
 * Handles the actual execution of optimized intent strategies
 */

import { OptimizationResult, ExecutionRoute, SplitOrder } from './intent-optimizer';
import { AdvancedRiskAssessor } from './advanced-risk-assessor';

export interface ExecutionConfig {
  enableDryRun: boolean;
  enableFailover: boolean;
  maxRetries: number;
  retryDelayMs: number;
  timeoutMs: number;
  confirmationBlocks: number;
}

export interface ExecutionStatus {
  id: string;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  currentStep: string;
  estimatedCompletion: number; // timestamp
  gasUsed: string;
  actualOutput: string;
  errors: ExecutionError[];
  startTime: number;
  endTime?: number;
}

export interface ExecutionError {
  code: string;
  message: string;
  step: string;
  timestamp: number;
  recoverable: boolean;
}

export interface ExecutionResult {
  success: boolean;
  executionId: string;
  status: ExecutionStatus;
  finalOutput?: string;
  actualRoute?: ExecutionRoute;
  performanceMetrics: {
    executionTime: number;
    gasEfficiency: number;
    slippageRealized: number;
    priceImpact: number;
  };
  error?: ExecutionError;
}

export class ExecutionEngine {
  private riskAssessor: AdvancedRiskAssessor;
  private config: ExecutionConfig;
  private activeExecutions: Map<string, ExecutionStatus> = new Map();
  private executionHistory: Map<string, ExecutionResult> = new Map();

  constructor(
    riskAssessor: AdvancedRiskAssessor,
    config: ExecutionConfig
  ) {
    this.riskAssessor = riskAssessor;
    this.config = config;
  }

  /**
   * Execute an optimized intent with full monitoring and failover
   */
  async executeIntent(
    optimizationResult: OptimizationResult
  ): Promise<ExecutionResult> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Create execution status
      const status: ExecutionStatus = {
        id: executionId,
        status: 'pending',
        progress: 0,
        currentStep: 'Initializing',
        estimatedCompletion: Date.now() + optimizationResult.optimal_route.executionTime * 1000,
        gasUsed: '0',
        actualOutput: '0',
        errors: [],
        startTime: Date.now()
      };

      this.activeExecutions.set(executionId, status);

      // Pre-execution validation
      await this.validateExecution(optimizationResult, status);

      // Risk assessment
      await this.performPreExecutionRiskCheck(optimizationResult, status);

      // Execute based on strategy
      let result: ExecutionResult;
      
      if (optimizationResult.execution_strategy.timing === 'split') {
        result = await this.executeSplitOrders(
          executionId,
          optimizationResult.execution_strategy.split_orders!,
          status
        );
      } else if (optimizationResult.execution_strategy.timing === 'delayed') {
        result = await this.executeDelayedOrder(
          executionId,
          optimizationResult.optimal_route,
          optimizationResult.execution_strategy.conditions || [],
          status
        );
      } else {
        result = await this.executeImmediateOrder(
          executionId,
          optimizationResult.optimal_route,
          status
        );
      }

      // Store execution result
      this.executionHistory.set(executionId, result);
      this.activeExecutions.delete(executionId);

      return result;

    } catch (error) {
      const errorResult: ExecutionResult = {
        success: false,
        executionId,
        status: this.activeExecutions.get(executionId) || {
          id: executionId,
          status: 'failed',
          progress: 0,
          currentStep: 'Error',
          estimatedCompletion: Date.now(),
          gasUsed: '0',
          actualOutput: '0',
          errors: [],
          startTime: Date.now(),
          endTime: Date.now()
        },
        performanceMetrics: {
          executionTime: 0,
          gasEfficiency: 0,
          slippageRealized: 0,
          priceImpact: 0
        },
        error: {
          code: 'EXECUTION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown execution error',
          step: 'Execution',
          timestamp: Date.now(),
          recoverable: false
        }
      };

      this.executionHistory.set(executionId, errorResult);
      this.activeExecutions.delete(executionId);

      return errorResult;
    }
  }

  /**
   * Validate execution parameters and conditions
   */
  private async validateExecution(
    optimizationResult: OptimizationResult,
    status: ExecutionStatus
  ): Promise<void> {
    this.updateStatus(status, 5, 'Validating execution parameters');

    // Validate route
    if (!optimizationResult.optimal_route || !optimizationResult.optimal_route.path.length) {
      throw new Error('Invalid execution route');
    }

    // Validate risk levels
    if (optimizationResult.risk_assessment.overall_risk > 0.8) {
      throw new Error('Risk level too high for execution');
    }

    // Validate slippage tolerance
    const maxSlippage = this.config.enableDryRun ? 1.0 : 0.1; // 10% max in production
    if (optimizationResult.optimal_route.expectedSlippage > maxSlippage) {
      throw new Error(`Slippage tolerance exceeded: ${optimizationResult.optimal_route.expectedSlippage}`);
    }

    this.updateStatus(status, 10, 'Validation completed');
  }

  /**
   * Perform pre-execution risk assessment
   */
  private async performPreExecutionRiskCheck(
    optimizationResult: OptimizationResult,
    status: ExecutionStatus
  ): Promise<void> {
    this.updateStatus(status, 15, 'Performing risk assessment');

    const riskAssessment = await this.riskAssessor.assessIntentRisk();
    const riskData = riskAssessment;
    
    // Check if risk has increased since optimization
    if (riskData.overall_risk > optimizationResult.risk_assessment.overall_risk * 1.2) {
      this.addError(status, {
        code: 'RISK_INCREASE_DETECTED',
        message: 'Risk has increased significantly since optimization',
        step: 'Risk Assessment',
        timestamp: Date.now(),
        recoverable: true
      });

      // If risk is critical, abort
      if (riskData.overall_risk > 0.9) {
        throw new Error('Critical risk level detected, aborting execution');
      }
    }

    this.updateStatus(status, 20, 'Risk assessment completed');
  }

  /**
   * Execute immediate order
   */
  private async executeImmediateOrder(
    executionId: string,
    route: ExecutionRoute,
    status: ExecutionStatus
  ): Promise<ExecutionResult> {
    this.updateStatus(status, 25, 'Starting immediate execution');

    const startTime = Date.now();
    let totalGasUsed = 0;
    let actualOutput = '0';

    try {
      // Execute each step in the route
      for (let i = 0; i < route.path.length - 1; i++) {
        const fromAsset = route.path[i];
        const toAsset = route.path[i + 1];
        const dex = route.dexes[i];
        
        this.updateStatus(
          status, 
          25 + (i / (route.path.length - 1)) * 60,
          `Executing swap ${fromAsset} → ${toAsset} on ${dex}`
        );

        const stepResult = await this.executeSwapStep(route);
        totalGasUsed += parseFloat(stepResult.gasUsed);
        actualOutput = stepResult.output;

        // Add small delay between steps
        if (i < route.path.length - 2) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      this.updateStatus(status, 90, 'Finalizing execution');

      // Wait for confirmations
      await this.waitForConfirmations(status);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Calculate performance metrics
      const performanceMetrics = this.calculatePerformanceMetrics(
        route,
        totalGasUsed,
        actualOutput,
        executionTime
      );

      status.status = 'completed';
      status.progress = 100;
      status.currentStep = 'Completed';
      status.endTime = endTime;
      status.gasUsed = totalGasUsed.toString();
      status.actualOutput = actualOutput;

      return {
        success: true,
        executionId,
        status,
        finalOutput: actualOutput,
        actualRoute: route,
        performanceMetrics
      };

    } catch (error) {
      status.status = 'failed';
      status.endTime = Date.now();

      const executionError: ExecutionError = {
        code: 'SWAP_EXECUTION_FAILED',
        message: error instanceof Error ? error.message : 'Swap execution failed',
        step: status.currentStep,
        timestamp: Date.now(),
        recoverable: this.isRecoverableError(error)
      };

      this.addError(status, executionError);

      return {
        success: false,
        executionId,
        status,
        performanceMetrics: {
          executionTime: Date.now() - startTime,
          gasEfficiency: 0,
          slippageRealized: 0,
          priceImpact: 0
        },
        error: executionError
      };
    }
  }

  /**
   * Execute split orders with coordination
   */
  private async executeSplitOrders(
    executionId: string,
    splitOrders: SplitOrder[],
    status: ExecutionStatus
  ): Promise<ExecutionResult> {
    this.updateStatus(status, 25, 'Starting split order execution');

    const startTime = Date.now();
    const results: Array<{ success: boolean; output: string; gasUsed: number }> = [];
    let totalGasUsed = 0;
    let totalOutput = 0;

    try {
      // Execute split orders with delays
      for (let i = 0; i < splitOrders.length; i++) {
        const splitOrder = splitOrders[i];
        
        this.updateStatus(
          status,
          25 + (i / splitOrders.length) * 60,
          `Executing split order ${i + 1}/${splitOrders.length}`
        );

        // Wait for delay if not first order
        if (splitOrder.delay > 0) {
          await new Promise(resolve => setTimeout(resolve, splitOrder.delay));
        }

        // Check conditions before execution
        const conditionsMet = await this.checkExecutionConditions(splitOrder.conditions);
        if (!conditionsMet) {
          this.addError(status, {
            code: 'CONDITIONS_NOT_MET',
            message: `Conditions not met for split order ${i + 1}`,
            step: `Split Order ${i + 1}`,
            timestamp: Date.now(),
            recoverable: true
          });
          continue;
        }

        // Execute this split
        const splitResult = await this.executeSingleSplit(splitOrder);
        results.push(splitResult);
        
        if (splitResult.success) {
          totalGasUsed += splitResult.gasUsed;
          totalOutput += parseFloat(splitResult.output);
        }
      }

      this.updateStatus(status, 90, 'Finalizing split execution');

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Calculate combined performance metrics
      const route = splitOrders[0].route; // Use first route as template
      const performanceMetrics = this.calculatePerformanceMetrics(
        route,
        totalGasUsed,
        totalOutput.toString(),
        executionTime
      );

      const successfulSplits = results.filter(r => r.success).length;
      const overallSuccess = successfulSplits > splitOrders.length / 2; // More than half successful

      status.status = overallSuccess ? 'completed' : 'failed';
      status.progress = 100;
      status.currentStep = `Completed (${successfulSplits}/${splitOrders.length} successful)`;
      status.endTime = endTime;
      status.gasUsed = totalGasUsed.toString();
      status.actualOutput = totalOutput.toString();

      return {
        success: overallSuccess,
        executionId,
        status,
        finalOutput: totalOutput.toString(),
        actualRoute: route,
        performanceMetrics
      };

    } catch (error) {
      status.status = 'failed';
      status.endTime = Date.now();

      const executionError: ExecutionError = {
        code: 'SPLIT_EXECUTION_FAILED',
        message: error instanceof Error ? error.message : 'Split execution failed',
        step: status.currentStep,
        timestamp: Date.now(),
        recoverable: false
      };

      this.addError(status, executionError);

      return {
        success: false,
        executionId,
        status,
        performanceMetrics: {
          executionTime: Date.now() - startTime,
          gasEfficiency: 0,
          slippageRealized: 0,
          priceImpact: 0
        },
        error: executionError
      };
    }
  }

  /**
   * Execute delayed order with condition monitoring
   */
  private async executeDelayedOrder(
    executionId: string,
    route: ExecutionRoute,
    conditions: any[],
    status: ExecutionStatus
  ): Promise<ExecutionResult> {
    this.updateStatus(status, 25, 'Monitoring conditions for delayed execution');

    const startTime = Date.now();
    const maxWaitTime = 3600000; // 1 hour max wait
    const checkInterval = 30000; // Check every 30 seconds

    try {
      // Monitor conditions
      let conditionsMet = false;
      let elapsedTime = 0;

      while (!conditionsMet && elapsedTime < maxWaitTime) {
        conditionsMet = await this.checkExecutionConditions(conditions);
        
        if (!conditionsMet) {
          const progress = 25 + (elapsedTime / maxWaitTime) * 40;
          this.updateStatus(status, progress, 'Waiting for execution conditions');
          
          await new Promise(resolve => setTimeout(resolve, checkInterval));
          elapsedTime += checkInterval;
        }
      }

      if (!conditionsMet) {
        throw new Error('Execution conditions not met within timeout period');
      }

      this.updateStatus(status, 65, 'Conditions met, starting execution');

      // Execute the order immediately now that conditions are met
      return await this.executeImmediateOrder(executionId, route, status);

    } catch (error) {
      status.status = 'failed';
      status.endTime = Date.now();

      const executionError: ExecutionError = {
        code: 'DELAYED_EXECUTION_FAILED',
        message: error instanceof Error ? error.message : 'Delayed execution failed',
        step: status.currentStep,
        timestamp: Date.now(),
        recoverable: false
      };

      this.addError(status, executionError);

      return {
        success: false,
        executionId,
        status,
        performanceMetrics: {
          executionTime: Date.now() - startTime,
          gasEfficiency: 0,
          slippageRealized: 0,
          priceImpact: 0
        },
        error: executionError
      };
    }
  }

  /**
   * Execute a single swap step
   */
  private async executeSwapStep(
    route: ExecutionRoute
  ): Promise<{ output: string; gasUsed: string }> {
    // In a real implementation, this would:
    // 1. Connect to the specific DEX contract
    // 2. Prepare the swap transaction
    // 3. Execute the swap with proper slippage protection
    // 4. Monitor transaction confirmation
    // 5. Return actual output and gas used

    // Simulated execution for demonstration
    const estimatedOutput = parseFloat(route.estimatedOutput);
    const slippageVariation = (Math.random() - 0.5) * 0.02; // ±1% random slippage
    const actualOutput = estimatedOutput * (1 + slippageVariation);
    
    const estimatedGas = parseFloat(route.estimatedGas);
    const gasVariation = (Math.random() - 0.5) * 0.1; // ±5% gas variation
    const actualGas = estimatedGas * (1 + gasVariation);

    // Simulate execution time
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));

    return {
      output: actualOutput.toString(),
      gasUsed: actualGas.toString()
    };
  }

  /**
   * Execute a single split order
   */
  private async executeSingleSplit(splitOrder: SplitOrder): Promise<{
    success: boolean;
    output: string;
    gasUsed: number;
  }> {
    try {
      const result = await this.executeSwapStep(
        splitOrder.route
      );

      return {
        success: true,
        output: result.output,
        gasUsed: parseFloat(result.gasUsed)
      };
    } catch (error) {
      return {
        success: false,
        output: '0',
        gasUsed: 0
      };
    }
  }

  /**
   * Check if execution conditions are met
   */
  private async checkExecutionConditions(conditions: any[]): Promise<boolean> {
    for (const condition of conditions) {
      const conditionMet = await this.evaluateCondition(condition);
      if (!conditionMet) {
        return false;
      }
    }
    return true;
  }

  /**
   * Evaluate a single execution condition
   */
  private async evaluateCondition(condition: any): Promise<boolean> {
    // In a real implementation, this would fetch current market data
    // and evaluate the condition against real-time values
    
    // Simulated condition evaluation
    const randomValue = Math.random();
    
    switch (condition.type) {
      case 'price':
        return randomValue > 0.7; // 70% chance condition is met
      case 'liquidity':
        return randomValue > 0.8; // 80% chance condition is met
      case 'volatility':
        return randomValue > 0.6; // 60% chance condition is met
      case 'time':
        return true; // Time conditions are usually met
      default:
        return true;
    }
  }

  /**
   * Wait for transaction confirmations
   */
  private async waitForConfirmations(status: ExecutionStatus): Promise<void> {    
    for (let i = 0; i < this.config.confirmationBlocks; i++) {
      const progress = 90 + (i / this.config.confirmationBlocks) * 10;
      this.updateStatus(status, progress, `Waiting for confirmation ${i + 1}/${this.config.confirmationBlocks}`);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(
    expectedRoute: ExecutionRoute,
    actualGasUsed: number,
    actualOutput: string,
    executionTime: number
  ) {
    const expectedGas = parseFloat(expectedRoute.estimatedGas);
    const expectedOutput = parseFloat(expectedRoute.estimatedOutput);
    const actualOutputNum = parseFloat(actualOutput);

    const gasEfficiency = expectedGas > 0 ? (expectedGas / actualGasUsed) * 100 : 100;
    const slippageRealized = Math.abs((actualOutputNum - expectedOutput) / expectedOutput) * 100;
    const priceImpact = slippageRealized; // Simplified
    
    return {
      executionTime,
      gasEfficiency: Math.min(gasEfficiency, 100), // Cap at 100%
      slippageRealized,
      priceImpact
    };
  }

  /**
   * Utility functions
   */
  private updateStatus(status: ExecutionStatus, progress: number, step: string): void {
    status.progress = Math.min(progress, 100);
    status.currentStep = step;
    status.status = progress >= 100 ? 'completed' : 'executing';
  }

  private addError(status: ExecutionStatus, error: ExecutionError): void {
    status.errors.push(error);
  }

  private isRecoverableError(error: unknown): boolean {
    if (error instanceof Error) {
      const recoverableErrors = ['SLIPPAGE_EXCEEDED', 'INSUFFICIENT_LIQUIDITY', 'NETWORK_CONGESTION'];
      return recoverableErrors.some(code => error.message.includes(code));
    }
    return false;
  }

  /**
   * Public methods for monitoring and control
   */
  getExecutionStatus(executionId: string): ExecutionStatus | null {
    return this.activeExecutions.get(executionId) || null;
  }

  getExecutionHistory(executionId: string): ExecutionResult | null {
    return this.executionHistory.get(executionId) || null;
  }

  getAllActiveExecutions(): ExecutionStatus[] {
    return Array.from(this.activeExecutions.values());
  }

  cancelExecution(executionId: string): boolean {
    const status = this.activeExecutions.get(executionId);
    if (status && (status.status === 'pending' || status.status === 'executing')) {
      status.status = 'cancelled';
      status.endTime = Date.now();
      this.activeExecutions.delete(executionId);
      return true;
    }
    return false;
  }

  updateConfig(config: Partial<ExecutionConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

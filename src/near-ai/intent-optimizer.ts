/**
 * Intent Optimizer for NEAR Protocol Intent System
 * Provides intelligent optimization for intent execution strategies
 */

import { MarketDataProviders } from './market-data-providers';

export interface OptimizationConfig {
  enableRouteOptimization: boolean;
  enableGasOptimization: boolean;
  enableTimingOptimization: boolean;
  enableSlippageOptimization: boolean;
  enableArbitrageDetection: boolean;
  maxSlippage: number; // percentage
  maxGasPrice: string; // in NEAR
  executionTimeLimit: number; // seconds
  minProfitThreshold: number; // percentage
}

export interface ExecutionRoute {
  id: string;
  path: string[];
  dexes: string[];
  estimatedOutput: string;
  estimatedGas: string;
  expectedSlippage: number;
  executionTime: number;
  confidence: number;
  fees: {
    protocol_fee: string;
    gas_fee: string;
    slippage_cost: string;
    total_cost: string;
  };
}

export interface OptimizationResult {
  optimal_route: ExecutionRoute;
  alternative_routes: ExecutionRoute[];
  arbitrage_opportunities: ArbitrageOpportunity[];
  optimization_metrics: {
    gas_savings: string;
    slippage_reduction: number;
    time_optimization: number;
    profit_enhancement: number;
  };
  execution_strategy: {
    timing: 'immediate' | 'delayed' | 'split';
    split_orders?: SplitOrder[];
    conditions?: ExecutionCondition[];
  };
  risk_assessment: {
    overall_risk: number;
    execution_risk: number;
    market_risk: number;
    recommendations: string[];
  };
}

export interface ArbitrageOpportunity {
  id: string;
  asset_pair: string;
  buy_venue: string;
  sell_venue: string;
  buy_price: string;
  sell_price: string;
  profit_percentage: number;
  profit_amount: string;
  required_capital: string;
  execution_complexity: 'low' | 'medium' | 'high';
  time_sensitivity: number; // seconds
  confidence: number;
}

export interface SplitOrder {
  order_id: string;
  amount: string;
  delay: number; // milliseconds
  route: ExecutionRoute;
  conditions: ExecutionCondition[];
}

export interface ExecutionCondition {
  type: 'price' | 'time' | 'liquidity' | 'volatility';
  operator: '>' | '<' | '=' | '>=' | '<=';
  value: string;
  description: string;
}

export class IntentOptimizer {
  private marketDataProviders: MarketDataProviders;
  private optimizationConfig: OptimizationConfig;
  private dexRegistry: Map<string, DexInfo> = new Map();

  constructor(
    marketDataProviders: MarketDataProviders,
    optimizationConfig: OptimizationConfig
  ) {
    this.marketDataProviders = marketDataProviders;
    this.optimizationConfig = optimizationConfig;
    this.initializeDexRegistry();
  }

  /**
   * Optimize intent execution strategy
   */
  async optimizeIntentExecution(
    assetIn: string,
    assetOut: string,
    amountIn: string,
    userPreferences?: {
      priority: 'speed' | 'cost' | 'security' | 'balanced';
      maxSlippage?: number;
      maxExecutionTime?: number;
    }
  ): Promise<{
    success: boolean;
    data?: OptimizationResult;
    error?: { code: string; message: string };
  }> {
    try {
      // Fetch market data for both assets
      const marketData = await this.marketDataProviders.fetchMarketData(`${assetIn}/${assetOut}`);
      
      // Discover all possible execution routes
      const allRoutes = await this.discoverExecutionRoutes(assetIn, assetOut, amountIn);
      
      // Evaluate and rank routes based on optimization criteria
      const rankedRoutes = await this.evaluateRoutes(allRoutes, userPreferences);
      
      // Detect arbitrage opportunities
      const arbitrageOpportunities = this.optimizationConfig.enableArbitrageDetection
        ? await this.detectArbitrageOpportunities(assetIn, assetOut, amountIn)
        : [];
      
      // Perform risk assessment for the optimal route
      const riskAssessment = await this.assessExecutionRisk(rankedRoutes[0]);
      
      // Optimize execution strategy (timing, splitting, conditions)
      const executionStrategy = await this.optimizeExecutionStrategy(
        rankedRoutes[0],
        marketData
      );
      
      // Calculate optimization metrics
      const optimizationMetrics = this.calculateOptimizationMetrics(
        rankedRoutes[0],
        rankedRoutes,
        arbitrageOpportunities
      );

      const result: OptimizationResult = {
        optimal_route: rankedRoutes[0],
        alternative_routes: rankedRoutes.slice(1, 5), // Top 5 alternatives
        arbitrage_opportunities: arbitrageOpportunities,
        optimization_metrics: optimizationMetrics,
        execution_strategy: executionStrategy,
        risk_assessment: riskAssessment
      };

      return {
        success: true,
        data: result
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'OPTIMIZATION_FAILED',
          message: `Failed to optimize intent execution: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      };
    }
  }

  /**
   * Discover all possible execution routes
   */
  private async discoverExecutionRoutes(
    assetIn: string,
    assetOut: string,
    amountIn: string
  ): Promise<ExecutionRoute[]> {
    const routes: ExecutionRoute[] = [];
    const amountNum = parseFloat(amountIn);

    // Direct routes (single hop)
    for (const [dexName, dexInfo] of this.dexRegistry) {
      if (dexInfo.supportedPairs.includes(`${assetIn}/${assetOut}`)) {
        const route = await this.createDirectRoute(dexName, assetIn, assetOut, amountNum);
        if (route) routes.push(route);
      }
    }

    // Multi-hop routes (through intermediate assets)
    const intermediateAssets = ['USDC', 'USDT', 'NEAR', 'ETH', 'BTC'];
    
    for (const intermediate of intermediateAssets) {
      if (intermediate === assetIn || intermediate === assetOut) continue;
      
      const multiHopRoute = await this.createMultiHopRoute(
        assetIn,
        intermediate,
        assetOut,
        amountNum
      );
      if (multiHopRoute) routes.push(multiHopRoute);
    }

    // Complex routes (multiple intermediates for better pricing)
    if (routes.length < 3) {
      const complexRoutes = await this.discoverComplexRoutes(assetIn, assetOut, amountNum);
      routes.push(...complexRoutes);
    }

    return routes;
  }

  /**
   * Create a direct trading route
   */
  private async createDirectRoute(
    dexName: string,
    assetIn: string,
    assetOut: string,
    amountIn: number
  ): Promise<ExecutionRoute | null> {
    try {
      const dexInfo = this.dexRegistry.get(dexName);
      if (!dexInfo) return null;

      const marketData = await this.marketDataProviders.fetchMarketData(`${assetIn}/${assetOut}`);
      const price = parseFloat(marketData.price);
      
      const estimatedOutput = (amountIn * price * (1 - dexInfo.fee)).toString();
      const estimatedGas = this.estimateGasCost(dexName, 1); // Single hop
      const expectedSlippage = this.calculateExpectedSlippage(amountIn, marketData.liquidity_score);
      
      return {
        id: `direct_${dexName}_${Date.now()}`,
        path: [assetIn, assetOut],
        dexes: [dexName],
        estimatedOutput,
        estimatedGas: estimatedGas.toString(),
        expectedSlippage,
        executionTime: dexInfo.averageExecutionTime,
        confidence: 0.9,
        fees: {
          protocol_fee: (amountIn * dexInfo.fee).toString(),
          gas_fee: estimatedGas.toString(),
          slippage_cost: (amountIn * expectedSlippage).toString(),
          total_cost: (amountIn * (dexInfo.fee + expectedSlippage) + estimatedGas).toString()
        }
      };
    } catch (error) {
      console.error(`Error creating direct route for ${dexName}:`, error);
      return null;
    }
  }

  /**
   * Create a multi-hop trading route
   */
  private async createMultiHopRoute(
    assetIn: string,
    intermediate: string,
    assetOut: string,
    amountIn: number
  ): Promise<ExecutionRoute | null> {
    try {
      // Find best DEX for first hop
      const firstHopDex = await this.findBestDexForPair(`${assetIn}/${intermediate}`);
      if (!firstHopDex) return null;

      // Find best DEX for second hop
      const secondHopDex = await this.findBestDexForPair(`${intermediate}/${assetOut}`);
      if (!secondHopDex) return null;

      // Calculate first hop
      const firstHopData = await this.marketDataProviders.fetchMarketData(`${assetIn}/${intermediate}`);
      const firstHopPrice = parseFloat(firstHopData.price);
      const firstHopOutput = amountIn * firstHopPrice * (1 - firstHopDex.fee);

      // Calculate second hop
      const secondHopData = await this.marketDataProviders.fetchMarketData(`${intermediate}/${assetOut}`);
      const secondHopPrice = parseFloat(secondHopData.price);
      const finalOutput = firstHopOutput * secondHopPrice * (1 - secondHopDex.fee);

      const estimatedGas = this.estimateGasCost(firstHopDex.name, 2) + this.estimateGasCost(secondHopDex.name, 2);
      const expectedSlippage = this.calculateExpectedSlippage(amountIn, firstHopData.liquidity_score) +
                              this.calculateExpectedSlippage(firstHopOutput, secondHopData.liquidity_score);

      return {
        id: `multihop_${firstHopDex.name}_${secondHopDex.name}_${Date.now()}`,
        path: [assetIn, intermediate, assetOut],
        dexes: [firstHopDex.name, secondHopDex.name],
        estimatedOutput: finalOutput.toString(),
        estimatedGas: estimatedGas.toString(),
        expectedSlippage,
        executionTime: firstHopDex.averageExecutionTime + secondHopDex.averageExecutionTime + 5, // +5s for coordination
        confidence: 0.75, // Lower confidence for multi-hop
        fees: {
          protocol_fee: (amountIn * firstHopDex.fee + firstHopOutput * secondHopDex.fee).toString(),
          gas_fee: estimatedGas.toString(),
          slippage_cost: (amountIn * expectedSlippage).toString(),
          total_cost: (amountIn * (firstHopDex.fee + expectedSlippage) + firstHopOutput * secondHopDex.fee + estimatedGas).toString()
        }
      };
    } catch (error) {
      console.error(`Error creating multi-hop route:`, error);
      return null;
    }
  }

  /**
   * Discover complex routes with multiple paths
   */
  private async discoverComplexRoutes(
    assetIn: string,
    assetOut: string,
    amountIn: number
  ): Promise<ExecutionRoute[]> {
    const complexRoutes: ExecutionRoute[] = [];
    
    // For complex route discovery, we would implement:
    // 1. Graph-based pathfinding algorithms
    // 2. Dynamic programming for optimal path selection
    // 3. Parallel route execution strategies
    // 4. Cross-DEX arbitrage routes
    
    // Simplified implementation for demonstration
    const pathVariations = [
      [assetIn, 'USDC', 'NEAR', assetOut],
      [assetIn, 'ETH', 'USDT', assetOut],
      [assetIn, 'BTC', 'USDC', assetOut]
    ];

    for (const path of pathVariations) {
      if (path.length === 4) {
        const route = await this.createComplexRoute(path, amountIn);
        if (route) complexRoutes.push(route);
      }
    }

    return complexRoutes;
  }

  /**
   * Create a complex multi-step route
   */
  private async createComplexRoute(path: string[], amountIn: number): Promise<ExecutionRoute | null> {
    try {
      let currentAmount = amountIn;
      const dexes: string[] = [];
      let totalGas = 0;
      let totalSlippage = 0;
      let totalExecutionTime = 0;
      let totalFees = 0;

      // Calculate each hop
      for (let i = 0; i < path.length - 1; i++) {
        const assetFrom = path[i];
        const assetTo = path[i + 1];
        
        const dex = await this.findBestDexForPair(`${assetFrom}/${assetTo}`);
        if (!dex) return null;

        const marketData = await this.marketDataProviders.fetchMarketData(`${assetFrom}/${assetTo}`);
        const price = parseFloat(marketData.price);
        
        currentAmount = currentAmount * price * (1 - dex.fee);
        totalGas += this.estimateGasCost(dex.name, path.length - 1);
        totalSlippage += this.calculateExpectedSlippage(currentAmount, marketData.liquidity_score);
        totalExecutionTime += dex.averageExecutionTime;
        totalFees += currentAmount * dex.fee;
        
        dexes.push(dex.name);
      }

      return {
        id: `complex_${path.join('_')}_${Date.now()}`,
        path,
        dexes,
        estimatedOutput: currentAmount.toString(),
        estimatedGas: totalGas.toString(),
        expectedSlippage: totalSlippage,
        executionTime: totalExecutionTime + (path.length - 2) * 3, // +3s per additional hop
        confidence: Math.max(0.5, 1 - (path.length - 2) * 0.1), // Lower confidence for longer paths
        fees: {
          protocol_fee: totalFees.toString(),
          gas_fee: totalGas.toString(),
          slippage_cost: (amountIn * totalSlippage).toString(),
          total_cost: (totalFees + totalGas + amountIn * totalSlippage).toString()
        }
      };
    } catch (error) {
      console.error(`Error creating complex route:`, error);
      return null;
    }
  }

  /**
   * Evaluate and rank routes based on optimization criteria
   */
  private async evaluateRoutes(
    routes: ExecutionRoute[],
    userPreferences?: {
      priority: 'speed' | 'cost' | 'security' | 'balanced';
      maxSlippage?: number;
      maxExecutionTime?: number;
    }
  ): Promise<ExecutionRoute[]> {
    const priority = userPreferences?.priority || 'balanced';
    
    // Filter routes based on user constraints
    let filteredRoutes = routes.filter(route => {
      if (userPreferences?.maxSlippage && route.expectedSlippage > userPreferences.maxSlippage) {
        return false;
      }
      if (userPreferences?.maxExecutionTime && route.executionTime > userPreferences.maxExecutionTime) {
        return false;
      }
      return true;
    });

    // Score routes based on priority
    const scoredRoutes = filteredRoutes.map(route => {
      let score = 0;
      
      switch (priority) {
        case 'speed':
          score = this.calculateSpeedScore(route);
          break;
        case 'cost':
          score = this.calculateCostScore(route);
          break;
        case 'security':
          score = this.calculateSecurityScore(route);
          break;
        case 'balanced':
        default:
          score = this.calculateBalancedScore(route);
          break;
      }
      
      return { route, score };
    });

    // Sort by score (higher is better)
    scoredRoutes.sort((a, b) => b.score - a.score);
    
    return scoredRoutes.map(item => item.route);
  }

  /**
   * Calculate speed-optimized score
   */
  private calculateSpeedScore(route: ExecutionRoute): number {
    const timeWeight = 0.6;
    const confidenceWeight = 0.3;
    const simplicityWeight = 0.1;
    
    const timeScore = Math.max(0, 1 - route.executionTime / 300); // Normalize to 5 minutes max
    const confidenceScore = route.confidence;
    const simplicityScore = Math.max(0, 1 - route.path.length / 5); // Prefer shorter paths
    
    return timeWeight * timeScore + confidenceWeight * confidenceScore + simplicityWeight * simplicityScore;
  }

  /**
   * Calculate cost-optimized score
   */
  private calculateCostScore(route: ExecutionRoute): number {
    const outputWeight = 0.5;
    const feesWeight = 0.3;
    const slippageWeight = 0.2;
    
    const output = parseFloat(route.estimatedOutput);
    const totalCost = parseFloat(route.fees.total_cost);
    
    // Normalize scores (higher output = better, lower costs = better)
    const outputScore = Math.min(1, output / 10000); // Normalize based on expected output range
    const feesScore = Math.max(0, 1 - totalCost / 1000); // Normalize based on expected cost range
    const slippageScore = Math.max(0, 1 - route.expectedSlippage / 0.05); // Normalize to 5% max slippage
    
    return outputWeight * outputScore + feesWeight * feesScore + slippageWeight * slippageScore;
  }

  /**
   * Calculate security-optimized score
   */
  private calculateSecurityScore(route: ExecutionRoute): number {
    const confidenceWeight = 0.4;
    const simplicityWeight = 0.3;
    const dexReputationWeight = 0.3;
    
    const confidenceScore = route.confidence;
    const simplicityScore = Math.max(0, 1 - route.path.length / 5);
    
    // Calculate DEX reputation score (simplified)
    const dexReputationScore = route.dexes.reduce((sum, dex) => {
      const dexInfo = this.dexRegistry.get(dex);
      return sum + (dexInfo?.reputation || 0.5);
    }, 0) / route.dexes.length;
    
    return confidenceWeight * confidenceScore + simplicityWeight * simplicityScore + dexReputationWeight * dexReputationScore;
  }

  /**
   * Calculate balanced score
   */
  private calculateBalancedScore(route: ExecutionRoute): number {
    const speedScore = this.calculateSpeedScore(route);
    const costScore = this.calculateCostScore(route);
    const securityScore = this.calculateSecurityScore(route);
    
    return (speedScore + costScore + securityScore) / 3;
  }

  /**
   * Detect arbitrage opportunities
   */
  private async detectArbitrageOpportunities(
    assetIn: string,
    assetOut: string,
    amountIn: string
  ): Promise<ArbitrageOpportunity[]> {
    const opportunities: ArbitrageOpportunity[] = [];
    const amountNum = parseFloat(amountIn);
    
    // Check prices across all DEXes
    const dexPrices: Map<string, { buy: number; sell: number; liquidity: number }> = new Map();
    
    for (const [dexName, dexInfo] of this.dexRegistry) {
      try {
        const marketData = await this.marketDataProviders.fetchMarketData(`${assetIn}/${assetOut}`);
        const price = parseFloat(marketData.price);
        
        dexPrices.set(dexName, {
          buy: price * (1 + dexInfo.fee),
          sell: price * (1 - dexInfo.fee),
          liquidity: marketData.liquidity_score
        });
      } catch (error) {
        console.error(`Error fetching price for ${dexName}:`, error);
      }
    }

    // Find arbitrage opportunities
    for (const [buyDex, buyData] of dexPrices) {
      for (const [sellDex, sellData] of dexPrices) {
        if (buyDex === sellDex) continue;
        
        const profit = sellData.sell - buyData.buy;
        const profitPercentage = (profit / buyData.buy) * 100;
        
        if (profitPercentage > this.optimizationConfig.minProfitThreshold) {
          opportunities.push({
            id: `arb_${buyDex}_${sellDex}_${Date.now()}`,
            asset_pair: `${assetIn}/${assetOut}`,
            buy_venue: buyDex,
            sell_venue: sellDex,
            buy_price: buyData.buy.toString(),
            sell_price: sellData.sell.toString(),
            profit_percentage: profitPercentage,
            profit_amount: (amountNum * profit).toString(),
            required_capital: (amountNum * buyData.buy).toString(),
            execution_complexity: this.assessArbitrageComplexity(buyDex, sellDex),
            time_sensitivity: Math.max(30, 300 - profitPercentage * 50), // Higher profit = more time sensitive
            confidence: Math.min(buyData.liquidity, sellData.liquidity)
          });
        }
      }
    }

    // Sort by profit percentage
    opportunities.sort((a, b) => b.profit_percentage - a.profit_percentage);
    
    return opportunities.slice(0, 5); // Return top 5 opportunities
  }

  /**
   * Assess execution risk for a route
   */
  private async assessExecutionRisk(route: ExecutionRoute): Promise<{
    overall_risk: number;
    execution_risk: number;
    market_risk: number;
    recommendations: string[];
  }> {
    const recommendations: string[] = [];
    
    // Execution risk based on route complexity
    const executionRisk = Math.min(0.9, route.path.length * 0.15 + (1 - route.confidence) * 0.5);
    
    // Market risk based on slippage and volatility
    const marketRisk = Math.min(0.9, route.expectedSlippage * 10 + (route.executionTime / 3600) * 0.2);
    
    // Overall risk
    const overallRisk = (executionRisk + marketRisk) / 2;
    
    // Generate recommendations
    if (executionRisk > 0.5) {
      recommendations.push('Consider simpler execution path with fewer hops');
    }
    if (marketRisk > 0.5) {
      recommendations.push('Monitor market volatility before execution');
    }
    if (route.expectedSlippage > 0.03) {
      recommendations.push('Split order into smaller chunks to reduce slippage');
    }
    if (route.executionTime > 300) {
      recommendations.push('Consider faster execution route if time-sensitive');
    }

    return {
      overall_risk: overallRisk,
      execution_risk: executionRisk,
      market_risk: marketRisk,
      recommendations
    };
  }

  /**
   * Optimize execution strategy
   */
  private async optimizeExecutionStrategy(
    route: ExecutionRoute,
    marketData: any
  ): Promise<{
    timing: 'immediate' | 'delayed' | 'split';
    split_orders?: SplitOrder[];
    conditions?: ExecutionCondition[];
  }> {
    const amountIn = parseFloat(route.estimatedOutput) / parseFloat(route.path[route.path.length - 1]);
    
    // Determine optimal timing strategy
    let timing: 'immediate' | 'delayed' | 'split' = 'immediate';
    let splitOrders: SplitOrder[] | undefined;
    let conditions: ExecutionCondition[] | undefined;

    // If slippage is high, consider splitting
    if (route.expectedSlippage > 0.02 || amountIn > 10000) {
      timing = 'split';
      splitOrders = this.createSplitOrders(route, amountIn);
    }
    
    // If market is volatile, add conditions
    if (marketData.volatility_24h > 0.05) {
      conditions = [
        {
          type: 'volatility',
          operator: '<',
          value: '0.03',
          description: 'Execute only if volatility is below 3%'
        }
      ];
    }

    return {
      timing,
      ...(splitOrders && { split_orders: splitOrders }),
      ...(conditions && { conditions })
    };
  }

  /**
   * Create split orders for large transactions
   */
  private createSplitOrders(route: ExecutionRoute, totalAmount: number): SplitOrder[] {
    const numSplits = Math.min(5, Math.ceil(totalAmount / 5000)); // Max 5 splits
    const amountPerSplit = totalAmount / numSplits;
    const baseDelay = 60000; // 1 minute between splits
    
    const splitOrders: SplitOrder[] = [];
    
    for (let i = 0; i < numSplits; i++) {
      splitOrders.push({
        order_id: `split_${i + 1}_${Date.now()}`,
        amount: amountPerSplit.toString(),
        delay: i * baseDelay,
        route: { ...route, estimatedOutput: (parseFloat(route.estimatedOutput) / numSplits).toString() },
        conditions: [
          {
            type: 'liquidity',
            operator: '>',
            value: '0.3',
            description: 'Ensure sufficient liquidity before execution'
          }
        ]
      });
    }
    
    return splitOrders;
  }

  /**
   * Calculate optimization metrics
   */
  private calculateOptimizationMetrics(
    optimalRoute: ExecutionRoute,
    allRoutes: ExecutionRoute[],
    arbitrageOpportunities: ArbitrageOpportunity[]
  ) {
    // Compare optimal route against alternatives
    const worstRoute = allRoutes[allRoutes.length - 1];
    
    const gasSavings = worstRoute 
      ? (parseFloat(worstRoute.estimatedGas) - parseFloat(optimalRoute.estimatedGas)).toString()
      : '0';
    
    const slippageReduction = worstRoute 
      ? worstRoute.expectedSlippage - optimalRoute.expectedSlippage
      : 0;
    
    const timeOptimization = worstRoute 
      ? worstRoute.executionTime - optimalRoute.executionTime
      : 0;
    
    const maxArbitrageProfit = arbitrageOpportunities.length > 0 
      ? arbitrageOpportunities[0].profit_percentage
      : 0;

    return {
      gas_savings: gasSavings,
      slippage_reduction: slippageReduction,
      time_optimization: timeOptimization,
      profit_enhancement: maxArbitrageProfit
    };
  }

  /**
   * Utility functions
   */
  private async findBestDexForPair(pair: string): Promise<DexInfo | null> {
    let bestDex: DexInfo | null = null;
    let bestScore = 0;
    
    for (const [, dexInfo] of this.dexRegistry) {
      if (dexInfo.supportedPairs.includes(pair)) {
        const score = dexInfo.reputation * (1 - dexInfo.fee) * dexInfo.liquidity;
        if (score > bestScore) {
          bestScore = score;
          bestDex = dexInfo;
        }
      }
    }
    
    return bestDex;
  }

  private estimateGasCost(dexName: string, complexity: number): number {
    const baseCost = 0.001; // Base gas cost in NEAR
    const dexMultiplier = this.dexRegistry.get(dexName)?.gasMultiplier || 1;
    return baseCost * dexMultiplier * complexity;
  }

  private calculateExpectedSlippage(amount: number, liquidityScore: number): number {
    const baseSlippage = 0.001; // 0.1% base slippage
    const liquidityImpact = Math.max(0, (1 - liquidityScore) * 0.02); // Up to 2% additional
    const sizeImpact = Math.min(amount / 100000 * 0.01, 0.03); // Up to 3% for very large orders
    
    return baseSlippage + liquidityImpact + sizeImpact;
  }

  private assessArbitrageComplexity(buyDex: string, sellDex: string): 'low' | 'medium' | 'high' {
    const buyDexInfo = this.dexRegistry.get(buyDex);
    const sellDexInfo = this.dexRegistry.get(sellDex);
    
    if (!buyDexInfo || !sellDexInfo) return 'high';
    
    const avgExecutionTime = (buyDexInfo.averageExecutionTime + sellDexInfo.averageExecutionTime) / 2;
    
    if (avgExecutionTime < 30) return 'low';
    if (avgExecutionTime < 120) return 'medium';
    return 'high';
  }

  private initializeDexRegistry(): void {
    // Initialize with known DEXes (in a real implementation, this would be dynamic)
    this.dexRegistry.set('ref-finance', {
      name: 'ref-finance',
      reputation: 0.9,
      fee: 0.003,
      liquidity: 0.8,
      gasMultiplier: 1.0,
      averageExecutionTime: 15,
      supportedPairs: ['NEAR/USD', 'NEAR/USDC', 'ETH/USD', 'BTC/USD', 'NEAR/ETH']
    });

    this.dexRegistry.set('jumbo-exchange', {
      name: 'jumbo-exchange',
      reputation: 0.85,
      fee: 0.0025,
      liquidity: 0.7,
      gasMultiplier: 1.1,
      averageExecutionTime: 20,
      supportedPairs: ['NEAR/USD', 'NEAR/USDT', 'ETH/USDC']
    });

    this.dexRegistry.set('spin-dex', {
      name: 'spin-dex',
      reputation: 0.8,
      fee: 0.004,
      liquidity: 0.6,
      gasMultiplier: 0.9,
      averageExecutionTime: 25,
      supportedPairs: ['NEAR/USD', 'BTC/USD', 'ETH/USD']
    });
  }

  /**
   * Update optimization configuration
   */
  updateOptimizationConfig(config: Partial<OptimizationConfig>): void {
    this.optimizationConfig = { ...this.optimizationConfig, ...config };
  }
}

interface DexInfo {
  name: string;
  reputation: number; // 0-1 scale
  fee: number; // percentage
  liquidity: number; // 0-1 scale
  gasMultiplier: number;
  averageExecutionTime: number; // seconds
  supportedPairs: string[];
}
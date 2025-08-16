/**
 * Jest Test Setup
 * Global test configuration and mocks
 */

// Mock NEAR API dependencies that might not work on all platforms
jest.mock('near-api-js', () => ({
  connect: jest.fn(),
  keyStores: {
    InMemoryKeyStore: jest.fn(),
  },
  KeyPair: {
    fromString: jest.fn(),
  },
  utils: {
    format: {
      parseNearAmount: jest.fn((amount: string) => amount),
      formatNearAmount: jest.fn((amount: string) => amount),
    },
  },
}));

// Mock WebSocket for testing
jest.mock('ws', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    send: jest.fn(),
    close: jest.fn(),
    readyState: 1,
  }));
});

// Mock axios for HTTP requests
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn().mockResolvedValue({ 
      ok: true,
      status: 200,
      data: { 
        success: true, 
        data: { price: '1.25', timestamp: Date.now(), liquidity_score: 0.8 } 
      } 
    }),
    post: jest.fn().mockResolvedValue({ 
      ok: true,
      status: 200,
      data: { success: true, data: {} } 
    }),
    put: jest.fn(),
    delete: jest.fn(),
  })),
  get: jest.fn().mockResolvedValue({ 
    ok: true,
    status: 200,
    data: { price: '1.25', timestamp: Date.now(), liquidity_score: 0.8 } 
  }),
  post: jest.fn().mockResolvedValue({ 
    ok: true,
    status: 200,
    data: { success: true, data: {} } 
  }),
  put: jest.fn(),
  delete: jest.fn(),
}));

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    completions: {
      create: jest.fn().mockResolvedValue({
        choices: [{ text: 'mocked response' }],
      }),
    },
  }));
});

// Mock fetch for global use
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: jest.fn().mockResolvedValue({
    success: true,
    data: {
      price: '1.25',
      timestamp: Date.now(),
      liquidity_score: 0.8,
      volume_24h: '1000000',
      price_change_24h: 0.05,
      price_change_7d: 0.1,
      volatility: 0.3
    }
  })
}) as jest.Mock;

// Set up global test timeout
jest.setTimeout(30000);

// Global test environment setup
beforeAll(() => {
  // Set up any global test environment
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  // Clean up after tests
});

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Export any test utilities
export const mockNearConnection = {
  account: jest.fn().mockReturnValue({
    functionCall: jest.fn().mockResolvedValue({ success: true, data: 'mock_tx_hash' }),
    viewFunction: jest.fn().mockResolvedValue({ success: true, data: {} }),
    getAccountBalance: jest.fn().mockResolvedValue('1000000000000000000000000'),
  }),
};

export const mockMarketData = {
  price: '1.25',
  timestamp: Date.now(),
  liquidity_score: 0.8,
  volume_24h: '1000000',
  volatility_24h: 0.05,
};

export const createMockAIConfig = () => ({
  model: {
    name: 'test-model',
    provider: 'near-ai',
    version: '1.0.0',
    capabilities: ['test'],
    max_tokens: 4096,
  },
  temperature: 0.7,
  max_tokens: 4096,
  context_window: 8192,
  enable_reasoning: true,
  enable_memory: true,
  risk_tolerance: 'moderate',
});

export const createMockOracleConfig = () => ({
  coingecko: {
    rateLimitMs: 100,
  },
  chainlink: {
    feeds: {
      'NEAR_USD': '0x123...',
      'ETH_USD': '0x456...',
    },
    updateInterval: 60,
  },
});

// Mock the entire NEAR Intent modules to return success
jest.mock('../backend/near-intent/solver-bus', () => {
  return {
    SolverBus: jest.fn().mockImplementation(() => ({
      publishIntent: jest.fn().mockResolvedValue({ success: true, data: 'mock_intent_id' }),
      waitForQuotes: jest.fn().mockResolvedValue({ 
        success: true, 
        data: [
          {
            solver_id: 'test_solver',
            intent_id: 'test_intent',
            amount_out: '1000',
            fee: '0.01',
            gas_estimate: '0.001',
            execution_time_estimate: 30,
            confidence_score: 0.9,
            signature: 'mock_signature',
            expires_at: Date.now() + 300000
          }
        ]
      }),
      getSolvers: jest.fn().mockResolvedValue({ success: true, data: [] }),
      connect: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn(),
    }))
  };
});

jest.mock('../backend/near-intent/verifier-contract', () => {
  return {
    VerifierContract: jest.fn().mockImplementation(() => ({
      submitIntent: jest.fn().mockResolvedValue({ success: true, data: 'mock_tx_hash' }),
      executeIntent: jest.fn().mockResolvedValue({ success: true, data: 'mock_tx_hash' }),
      registerUser: jest.fn().mockResolvedValue({ success: true, data: 'mock_user_id' }),
    }))
  };
});

jest.mock('../backend/near-intent/asset-manager', () => {
  return {
    AssetManager: jest.fn().mockImplementation(() => ({
      validateAssets: jest.fn().mockResolvedValue({ success: true, data: true }),
      getAssetInfo: jest.fn().mockResolvedValue({ 
        success: true, 
        data: { 
          token_id: 'NEAR', 
          decimals: 24, 
          symbol: 'NEAR', 
          name: 'NEAR Token' 
        } 
      }),
      parseAmount: jest.fn().mockReturnValue('10000000000000000000000000'), // 10 NEAR
    }))
  };
});

// Mock MarketAnalyzer and AdvancedMarketAnalyzer
jest.mock('../backend/near-ai/market-analyzer', () => ({
  MarketAnalyzer: jest.fn().mockImplementation(() => ({
    analyze: jest.fn().mockResolvedValue({
      success: true,
      data: {
        asset_pair: 'NEAR/USD',
        current_price: 5.0,
        trend_direction: 'bullish',
        volatility: 0.2,
        liquidity: 0.8,
        sentiment: 'positive',
        recommended_action: 'buy',
        confidence: 0.9,
        timestamp: Date.now(),
      },
      metadata: {
        model_used: 'test-model',
        tokens_consumed: 100,
        processing_time: 50,
        confidence: 0.9,
      },
    }),
  })),
}));

jest.mock('../backend/near-ai/advanced-market-analyzer', () => ({
  AdvancedMarketAnalyzer: jest.fn().mockImplementation(() => {
    let analysisConfig = {
      enableMLPredictions: true,
      enablePatternRecognition: true,
      enableSentimentAnalysis: true,
      enableOnChainAnalysis: true,
      predictionHorizon: 60,
      confidenceThreshold: 0.7,
    };

    return {
      performAdvancedAnalysis: jest.fn().mockImplementation(() => Promise.resolve({
        success: true,
        data: {
          marketAnalysis: {
            asset_pair: 'NEAR/USD',
            current_price: 5.0,
            trend_direction: 'bullish',
            volatility: 0.2,
            liquidity: 0.8,
            sentiment: 'positive',
            recommended_action: 'buy',
            confidence: 0.9,
            timestamp: Date.now(),
          },
          patterns: analysisConfig.enablePatternRecognition ? [] : undefined,
          mlPrediction: analysisConfig.enableMLPredictions ? {
            predicted_price: 5.5,
            confidence: 0.85,
            prediction_horizon: 60,
            factors: [],
          } : undefined,
          onChainMetrics: analysisConfig.enableOnChainAnalysis ? {
            tvl: '100000000',
            volume_24h: '5000000',
            active_addresses: 10000,
            transaction_count: 50000,
            average_transaction_size: '100',
          } : undefined,
          riskFactors: [],
          opportunities: [],
        },
        metadata: {
          model_used: 'test-model',
          tokens_consumed: 500,
          processing_time: 100,
          confidence: 0.9,
        },
      })),
      updateAnalysisConfig: jest.fn().mockImplementation((newConfig) => {
        analysisConfig = { ...analysisConfig, ...newConfig };
      }),
    };
  }),
}));

// Mock IntentRequest 
jest.mock('../backend/near-intent/intent-request', () => ({
  IntentRequest: {
    fromParams: jest.fn().mockResolvedValue({
      success: true,
      data: {
        id: 'mock_intent_id',
        user_id: 'test_user',
        amount_in: '10000000000000000000000000', // 10 NEAR
        asset_in: 'NEAR',
        asset_out: 'USDC',
        slippage_tolerance: 1.0,
        created_at: Date.now(),
        expires_at: Date.now() + 300000,
        status: 'pending',
      },
    }),
  },
}));

// Mock QuoteManager
jest.mock('../backend/near-intent/quote-manager', () => ({
  QuoteManager: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(undefined), // Added initialize method
    requestQuotes: jest.fn().mockResolvedValue({
      success: true,
      data: [{
        quote: {
          solver_id: 'mock_solver',
          intent_id: 'mock_intent_id',
          amount_out: '1000000000000000000000000',
          fee: '1000000000000000000000',
          gas_estimate: '100000000000000',
          execution_time_estimate: 5,
          confidence_score: 0.9,
          signature: 'mock_signature',
          expires_at: Date.now() + 60000,
        },
        score: 90,
        reasoning: 'Mock reasoning',
        risk_factors: [],
        opportunities: [],
        recommendation: 'accept',
        confidence: 0.9,
        pros: [],
        cons: [],
        riskLevel: 'low',
      }],
    }),
    getBestQuote: jest.fn().mockImplementation((quotes) => quotes[0]),
  })),
}));
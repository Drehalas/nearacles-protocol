"use strict";
/**
 * Jest Test Setup
 * Global test configuration and mocks
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockOracleConfig = exports.createMockAIConfig = exports.mockMarketData = exports.mockNearConnection = void 0;
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
            parseNearAmount: jest.fn((amount) => amount),
            formatNearAmount: jest.fn((amount) => amount),
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
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
    })),
    get: jest.fn(),
    post: jest.fn(),
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
exports.mockNearConnection = {
    account: jest.fn().mockReturnValue({
        functionCall: jest.fn(),
        viewFunction: jest.fn(),
        getAccountBalance: jest.fn(),
    }),
};
exports.mockMarketData = {
    price: '1.25',
    timestamp: Date.now(),
    liquidity_score: 0.8,
    volume_24h: '1000000',
    volatility_24h: 0.05,
};
const createMockAIConfig = () => ({
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
exports.createMockAIConfig = createMockAIConfig;
const createMockOracleConfig = () => ({
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
exports.createMockOracleConfig = createMockOracleConfig;
//# sourceMappingURL=setup.js.map
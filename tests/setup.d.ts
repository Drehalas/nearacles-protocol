/**
 * Jest Test Setup
 * Global test configuration and mocks
 */
export declare const mockNearConnection: {
    account: jest.Mock<any, any, any>;
};
export declare const mockMarketData: {
    price: string;
    timestamp: number;
    liquidity_score: number;
    volume_24h: string;
    volatility_24h: number;
};
export declare const createMockAIConfig: () => {
    model: {
        name: string;
        provider: string;
        version: string;
        capabilities: string[];
        max_tokens: number;
    };
    temperature: number;
    max_tokens: number;
    context_window: number;
    enable_reasoning: boolean;
    enable_memory: boolean;
    risk_tolerance: string;
};
export declare const createMockOracleConfig: () => {
    coingecko: {
        rateLimitMs: number;
    };
    chainlink: {
        feeds: {
            NEAR_USD: string;
            ETH_USD: string;
        };
        updateInterval: number;
    };
};
//# sourceMappingURL=setup.d.ts.map
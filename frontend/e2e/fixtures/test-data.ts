/**
 * Test fixtures and data for Nearacles E2E tests
 */

// Mock Swagger document for testing
export const mockSwaggerDoc = {
  swagger: "2.0",
  info: {
    title: "Nearacles API",
    version: "1.0.0",
    description: "Test API for Nearacles Oracle Protocol"
  },
  host: "localhost:3000",
  basePath: "/api",
  schemes: ["http", "https"],
  paths: {
    "/oracle/query": {
      get: {
        summary: "Query Oracle",
        description: "Query the oracle for information",
        parameters: [
          {
            name: "query",
            in: "query",
            description: "The query string",
            required: true,
            type: "string"
          }
        ],
        responses: {
          "200": {
            description: "Successful response",
            schema: {
              type: "object",
              properties: {
                result: { type: "string" },
                confidence: { type: "number" },
                sources: {
                  type: "array",
                  items: { type: "string" }
                }
              }
            }
          },
          "400": {
            description: "Bad request"
          },
          "500": {
            description: "Internal server error"
          }
        }
      },
      post: {
        summary: "Submit Query",
        description: "Submit a new query to the oracle",
        parameters: [
          {
            name: "body",
            in: "body",
            required: true,
            schema: {
              type: "object",
              properties: {
                query: { type: "string" },
                context: { type: "string" }
              }
            }
          }
        ],
        responses: {
          "201": {
            description: "Query submitted successfully"
          }
        }
      }
    },
    "/credibility/check": {
      post: {
        summary: "Check Credibility",
        description: "Check the credibility of information",
        parameters: [
          {
            name: "body",
            in: "body",
            required: true,
            schema: {
              type: "object",
              properties: {
                content: { type: "string" },
                source: { type: "string" }
              }
            }
          }
        ],
        responses: {
          "200": {
            description: "Credibility score",
            schema: {
              type: "object",
              properties: {
                score: { type: "number" },
                factors: {
                  type: "array",
                  items: { type: "string" }
                }
              }
            }
          }
        }
      }
    }
  },
  definitions: {
    Error: {
      type: "object",
      properties: {
        code: { type: "integer" },
        message: { type: "string" }
      }
    }
  }
};

// Test viewport configurations
export const viewports = {
  mobile: {
    iPhone12: { width: 390, height: 844 },
    iPhoneSE: { width: 375, height: 667 },
    pixel5: { width: 393, height: 851 },
    galaxyS8: { width: 360, height: 740 }
  },
  tablet: {
    iPad: { width: 768, height: 1024 },
    iPadPro: { width: 1024, height: 1366 },
    surface: { width: 912, height: 1368 }
  },
  desktop: {
    laptop: { width: 1366, height: 768 },
    desktop: { width: 1920, height: 1080 },
    large: { width: 2560, height: 1440 },
    ultrawide: { width: 3440, height: 1440 }
  }
};

// Browser configurations for cross-browser testing
export const browsers = {
  chromium: {
    name: 'chromium',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  },
  firefox: {
    name: 'firefox',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/120.0'
  },
  webkit: {
    name: 'webkit',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
  }
};

// Test user data
export const testUsers = {
  admin: {
    email: 'admin@nearacles.com',
    password: 'AdminPassword123!',
    role: 'admin'
  },
  user: {
    email: 'user@nearacles.com',
    password: 'UserPassword123!',
    role: 'user'
  },
  guest: {
    email: 'guest@nearacles.com',
    password: 'GuestPassword123!',
    role: 'guest'
  }
};

// API response templates
export const apiResponses = {
  oracleQuery: {
    success: {
      result: "The information you requested has been processed successfully.",
      confidence: 0.95,
      sources: [
        "https://example.com/source1",
        "https://example.com/source2"
      ],
      timestamp: "2024-01-01T00:00:00Z"
    },
    error: {
      code: 400,
      message: "Invalid query parameters"
    }
  },
  credibilityCheck: {
    high: {
      score: 0.9,
      factors: [
        "Verified source",
        "Multiple confirmations",
        "Recent information"
      ]
    },
    low: {
      score: 0.3,
      factors: [
        "Unverified source",
        "Single confirmation",
        "Outdated information"
      ]
    }
  }
};

// Error scenarios for testing
export const errorScenarios = {
  network: {
    timeout: { delay: 30000 },
    serverError: { status: 500, message: "Internal Server Error" },
    notFound: { status: 404, message: "Not Found" },
    unauthorized: { status: 401, message: "Unauthorized" },
    forbidden: { status: 403, message: "Forbidden" }
  },
  client: {
    invalidJson: '{ invalid json }',
    emptyResponse: '',
    malformedSwagger: {
      swagger: "invalid",
      info: null,
      paths: "not an object"
    }
  }
};

// Performance benchmarks
export const performanceBenchmarks = {
  pageLoad: {
    excellent: 1000,
    good: 2500,
    acceptable: 4000,
    poor: 6000
  },
  firstContentfulPaint: {
    excellent: 1000,
    good: 1800,
    acceptable: 3000,
    poor: 4000
  },
  largestContentfulPaint: {
    excellent: 2500,
    good: 4000,
    acceptable: 6000,
    poor: 8000
  },
  cumulativeLayoutShift: {
    excellent: 0.1,
    good: 0.25,
    poor: 0.25
  }
};

// Accessibility test configurations
export const accessibilityConfig = {
  rules: {
    'color-contrast': { enabled: true },
    'keyboard-navigation': { enabled: true },
    'aria-labels': { enabled: true },
    'heading-order': { enabled: true },
    'landmark-roles': { enabled: true }
  },
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
  exclude: [
    '.swagger-ui .highlight-code', // Third-party syntax highlighting
    '.swagger-ui .model-example'   // Generated content
  ]
};

// Security test patterns
export const securityPatterns = {
  xss: [
    '<script>alert("xss")</script>',
    'javascript:alert("xss")',
    '"><script>alert("xss")</script>',
    '<img src=x onerror=alert("xss")>',
    'eval("alert(\'xss\')")'
  ],
  sqlInjection: [
    "'; DROP TABLE users; --",
    "' OR '1'='1",
    "1' UNION SELECT * FROM users --"
  ],
  pathTraversal: [
    '../../../etc/passwd',
    '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
    '/etc/shadow'
  ]
};

// Load testing configurations
export const loadTestConfig = {
  concurrentUsers: [1, 3, 5, 10],
  requestsPerSecond: [1, 5, 10, 20],
  testDuration: 30000, // 30 seconds
  rampUpTime: 5000     // 5 seconds
};

// Visual regression test configurations
export const visualConfig = {
  threshold: 0.3,
  animations: 'disabled',
  fullPage: true,
  clip: { x: 0, y: 0, width: 1200, height: 800 },
  mask: [
    '.timestamp',
    '.random-id',
    '.dynamic-content'
  ]
};

// Test environment configurations
export const environments = {
  development: {
    baseURL: 'http://localhost:3000',
    timeout: 30000,
    retries: 0
  },
  staging: {
    baseURL: 'https://staging.nearacles.com',
    timeout: 60000,
    retries: 2
  },
  production: {
    baseURL: 'https://nearacles.com',
    timeout: 60000,
    retries: 3
  }
};

export default {
  mockSwaggerDoc,
  viewports,
  browsers,
  testUsers,
  apiResponses,
  errorScenarios,
  performanceBenchmarks,
  accessibilityConfig,
  securityPatterns,
  loadTestConfig,
  visualConfig,
  environments
};

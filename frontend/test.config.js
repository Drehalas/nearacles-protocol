/**
 * Test configuration for Nearacles Frontend E2E tests
 */

const config = {
  // Environment settings
  environment: process.env.NODE_ENV || 'test',
  
  // Base URLs for different environments
  baseUrls: {
    development: 'http://localhost:3000',
    test: 'http://localhost:3000',
    staging: 'https://staging.nearacles.com',
    production: 'https://nearacles.com'
  },
  
  // Performance thresholds
  performance: {
    pageLoad: {
      excellent: 1000,
      good: 2500,
      acceptable: 4000,
      timeout: 10000
    },
    firstContentfulPaint: {
      excellent: 1000,
      good: 1800,
      acceptable: 3000,
      timeout: 5000
    },
    largestContentfulPaint: {
      excellent: 2500,
      good: 4000,
      acceptable: 6000,
      timeout: 8000
    },
    cumulativeLayoutShift: {
      excellent: 0.1,
      good: 0.25,
      poor: 0.4
    }
  },
  
  // Browser configurations
  browsers: {
    chromium: {
      channel: 'chrome',
      headless: process.env.CI ? true : false,
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-extensions'
      ]
    },
    firefox: {
      headless: process.env.CI ? true : false,
      firefoxUserPrefs: {
        'media.navigator.streams.fake': true,
        'media.navigator.permission.disabled': true
      }
    },
    webkit: {
      headless: process.env.CI ? true : false
    }
  },
  
  // Viewport configurations
  viewports: {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1920, height: 1080 },
    ultrawide: { width: 2560, height: 1440 }
  },
  
  // Test timeouts
  timeouts: {
    test: 30000,
    action: 10000,
    navigation: 15000,
    expect: 5000
  },
  
  // Retry configuration
  retries: {
    development: 0,
    ci: 2,
    production: 3
  },
  
  // Screenshot and video settings
  media: {
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true,
      quality: 90
    },
    video: {
      mode: 'retain-on-failure',
      size: { width: 1280, height: 720 }
    },
    trace: {
      mode: 'on-first-retry',
      snapshots: true,
      screenshots: true,
      sources: true
    }
  },
  
  // Accessibility testing
  accessibility: {
    standard: 'WCAG21AA',
    includedImpacts: ['minor', 'moderate', 'serious', 'critical'],
    rules: {
      'color-contrast': { enabled: true },
      'keyboard-navigation': { enabled: true },
      'aria-labels': { enabled: true },
      'heading-order': { enabled: true },
      'landmark-roles': { enabled: true },
      'focus-management': { enabled: true }
    },
    excludeSelectors: [
      '.swagger-ui .highlight-code',
      '.swagger-ui .model-example',
      '[data-test-ignore-a11y]'
    ]
  },
  
  // Security testing
  security: {
    xssPatterns: [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      '"><script>alert("xss")</script>',
      '<img src=x onerror=alert("xss")>',
      'eval("alert(\'xss\')")'
    ],
    sqlInjectionPatterns: [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "1' UNION SELECT * FROM users --"
    ],
    headers: {
      required: [
        'X-Content-Type-Options',
        'X-Frame-Options',
        'X-XSS-Protection'
      ],
      forbidden: [
        'Server',
        'X-Powered-By'
      ]
    }
  },
  
  // Load testing
  load: {
    concurrentUsers: [1, 3, 5, 10],
    duration: 30000,
    rampUp: 5000,
    requestsPerSecond: [1, 5, 10, 20]
  },
  
  // Visual regression
  visual: {
    threshold: 0.3,
    updateSnapshots: process.env.UPDATE_SNAPSHOTS === 'true',
    animations: 'disabled',
    clip: { x: 0, y: 0, width: 1200, height: 800 },
    mask: [
      '.timestamp',
      '.random-id',
      '.dynamic-content',
      '[data-test-mask]'
    ]
  },
  
  // API testing
  api: {
    swagger: {
      url: '/swagger.json',
      timeout: 5000,
      validateSchema: true
    },
    endpoints: {
      health: '/health',
      status: '/status'
    },
    responseTimeThreshold: 2000
  },
  
  // Monitoring and reporting
  monitoring: {
    collectMetrics: true,
    reportToFile: true,
    reportPath: './test-results/metrics.json',
    enableConsoleCapture: true,
    enableNetworkCapture: true,
    enablePerformanceCapture: true
  },
  
  // Feature flags
  features: {
    darkMode: true,
    accessibilityMode: true,
    debugMode: process.env.NODE_ENV === 'development',
    performanceMonitoring: true,
    errorTracking: true
  },
  
  // Test data
  testData: {
    useMockData: process.env.NODE_ENV === 'test',
    mockDelay: 200,
    errorRate: 0.1
  },
  
  // Parallel execution
  parallel: {
    workers: process.env.CI ? 1 : 4,
    fullyParallel: true,
    forbidOnly: !!process.env.CI
  }
};

module.exports = config;

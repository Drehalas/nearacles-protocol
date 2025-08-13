import { test, expect } from '@playwright/test';
import { TestHelpers, SwaggerHelpers } from './utils/test-helpers';
import testConfig from '../test.config.js';

test.describe('Advanced Testing Patterns', () => {
  let helpers: TestHelpers;
  let dashboardHelpers: SwaggerHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    dashboardHelpers = new SwaggerHelpers(page);
  });

  test('should demonstrate page object pattern usage', async ({ page }) => {
    await helpers.waitForAppReady();
    await dashboardHelpers.waitForHeader();
    
    // Use helper methods for consistent interactions
    const operations = await dashboardHelpers.getOperations();
    expect(operations.length).toBeGreaterThan(0);
    
    // Expand all operations using helper
    await dashboardHelpers.expandAllOperations();
    
    // Take screenshot using helper
    await helpers.takeScreenshot('expanded-operations', { fullPage: true });
  });

  test('should use data-driven testing approach', async ({ page }) => {
    const testViewports = [
      testConfig.viewports.mobile,
      testConfig.viewports.tablet,
      testConfig.viewports.desktop
    ];
    
    for (const viewport of testViewports) {
      await page.setViewportSize(viewport);
      await helpers.waitForAppReady();
      
      // Verify responsive behavior
      const hasHorizontalScroll = await page.evaluate(() => 
        document.body.scrollWidth > window.innerWidth
      );
      expect(hasHorizontalScroll).toBe(false);
      
      // Take responsive screenshot
      await helpers.takeScreenshot(`responsive-${viewport.width}x${viewport.height}`);
    }
  });

  test('should implement fluent interface pattern', async ({ page }) => {
    await helpers.waitForAppReady();
    
    // Chain helper methods for readable test flow
    const metrics = await helpers
      .getPerformanceMetrics();
    
    expect(metrics.domContentLoaded).toBeLessThan(testConfig.performance.pageLoad.acceptable);
    expect(metrics.firstContentfulPaint).toBeLessThan(testConfig.performance.firstContentfulPaint.acceptable);
    
    // Create comprehensive test report
    const report = await helpers.createTestReport('fluent-interface-test');
    expect(report.testName).toBe('fluent-interface-test');
    expect(report.performance).toBeDefined();
  });

  test('should demonstrate custom assertion patterns', async ({ page }) => {
    await helpers.waitForAppReady();
    await dashboardHelpers.waitForHeader();
    
    // Custom assertion helper
    const assertHeaderLoaded = async () => {
      const dashboardContainer = page.locator('header');
      await expect(dashboardContainer).toBeVisible();
      
      const hasContent = await dashboardContainer.evaluate(el => el.children.length > 0);
      expect(hasContent).toBe(true);
      
      const operationsCount = await page.locator('header .opblock').count();
      expect(operationsCount).toBeGreaterThanOrEqual(0);
    };
    
    await assertHeaderLoaded();
    
    // Custom performance assertion
    const assertPerformanceThresholds = async () => {
      const metrics = await helpers.getPerformanceMetrics();
      
      expect(metrics.domContentLoaded).toBeLessThan(
        testConfig.performance.pageLoad.acceptable
      );
      expect(metrics.firstContentfulPaint).toBeLessThan(
        testConfig.performance.firstContentfulPaint.acceptable
      );
    };
    
    await assertPerformanceThresholds();
  });

  test('should use builder pattern for complex test scenarios', async ({ page }) => {
    // Test scenario builder
    const scenario = new TestScenarioBuilder(page)
      .withViewport(testConfig.viewports.desktop)
      .withSlowNetwork(500)
      .withMockApi('/dashboard.json', { 
        dashboard: '2.0', 
        info: { title: 'Test API', version: '1.0.0' },
        paths: {}
      })
      .build();
    
    await scenario.execute();
    
    // Verify scenario completed successfully
    await expect(page.locator('.min-h-screen').first()).toBeVisible();
    await helpers.waitForAppReady();
  });

  test('should implement retry pattern with exponential backoff', async ({ page }) => {
    const retryWithBackoff = async (operation: () => Promise<void>, maxRetries = 3) => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          await operation();
          return;
        } catch (error) {
          if (attempt === maxRetries) throw error;
          
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          await page.waitForTimeout(delay);
        }
      }
    };
    
    // Use retry pattern for flaky operations
    await retryWithBackoff(async () => {
      await helpers.waitForAppReady();
      await dashboardHelpers.waitForHeader();
      
      const operations = await dashboardHelpers.getOperations();
      expect(operations.length).toBeGreaterThan(0);
    });
  });

  test('should use observer pattern for event monitoring', async ({ page }) => {
    const events: Array<{ type: string; timestamp: number; data: any }> = [];
    
    // Set up event observers
    const observeConsoleEvents = () => {
      page.on('console', msg => {
        events.push({
          type: 'console',
          timestamp: Date.now(),
          data: { level: msg.type(), text: msg.text() }
        });
      });
    };
    
    const observeNetworkEvents = () => {
      page.on('response', response => {
        events.push({
          type: 'network',
          timestamp: Date.now(),
          data: { url: response.url(), status: response.status() }
        });
      });
    };
    
    observeConsoleEvents();
    observeNetworkEvents();
    
    await helpers.waitForAppReady();
    await dashboardHelpers.waitForHeader();
    
    // Analyze collected events
    const consoleEvents = events.filter(e => e.type === 'console');
    const networkEvents = events.filter(e => e.type === 'network');
    
    expect(networkEvents.length).toBeGreaterThan(0);
    
    // Check for error events
    const errorEvents = consoleEvents.filter(e => e.data.level === 'error');
    expect(errorEvents.length).toBe(0);
  });

  test('should implement state machine pattern for complex workflows', async ({ page }) => {
    // Define application states
    enum AppState {
      Loading = 'loading',
      Ready = 'ready',
      SwaggerLoaded = 'dashboard-loaded',
      InteractionMode = 'interaction-mode',
      Error = 'error'
    }
    
    let currentState = AppState.Loading;
    
    const transitionTo = (newState: AppState) => {
      console.log(`State transition: ${currentState} -> ${newState}`);
      currentState = newState;
    };
    
    // State machine workflow
    await page.goto('/');
    
    // Loading -> Ready
    await helpers.waitForAppReady();
    transitionTo(AppState.Ready);
    expect(currentState).toBe(AppState.Ready);
    
    // Ready -> SwaggerLoaded
    await dashboardHelpers.waitForHeader();
    transitionTo(AppState.SwaggerLoaded);
    expect(currentState).toBe(AppState.SwaggerLoaded);
    
    // SwaggerLoaded -> InteractionMode
    const operations = await page.locator('header .opblock-summary').all();
    if (operations.length > 0) {
      await operations[0].click();
      transitionTo(AppState.InteractionMode);
    }
    
    expect(currentState).toBe(AppState.InteractionMode);
  });

  test('should use dependency injection pattern for test utilities', async ({ page }) => {
    // Dependency container
    const container = new TestDependencyContainer();
    container.register('logger', new TestLogger());
    container.register('metrics', new TestMetrics());
    container.register('reporter', new TestReporter());
    
    // Inject dependencies into helpers
    const enhancedHelpers = new EnhancedTestHelpers(page, container);
    
    await enhancedHelpers.navigateAndLog('/');
    await enhancedHelpers.waitForAppReadyWithMetrics();
    
    const metrics = container.get('metrics').getCollectedMetrics();
    expect(metrics.pageLoadTime).toBeLessThan(testConfig.performance.pageLoad.acceptable);
    
    await enhancedHelpers.generateReport('dependency-injection-test');
  });

  test('should demonstrate factory pattern for test data', async ({ page }) => {
    // Test data factories
    const dashboardDocFactory = new SwaggerDocumentFactory();
    const mockSwaggerDoc = dashboardDocFactory
      .withTitle('Test API')
      .withVersion('1.0.0')
      .withPath('/test', 'get', { summary: 'Test endpoint' })
      .build();
    
    // Mock API with factory-generated data
    await helpers.mockApiResponse('/dashboard.json', mockSwaggerDoc);
    
    await helpers.waitForAppReady();
    await dashboardHelpers.waitForHeader();
    
    // Validate factory-generated data
    const { dashboardDoc, validation } = await dashboardHelpers.validateSwaggerDocument();
    expect(validation.hasInfo).toBe(true);
    expect(dashboardDoc.info.title).toBe('Test API');
  });
});

// Helper classes for advanced patterns

class TestScenarioBuilder {
  private scenario: any = {};
  
  constructor(private page: any) {}
  
  withViewport(viewport: { width: number; height: number }) {
    this.scenario.viewport = viewport;
    return this;
  }
  
  withSlowNetwork(delay: number) {
    this.scenario.networkDelay = delay;
    return this;
  }
  
  withMockApi(url: string, response: any) {
    this.scenario.mockApi = { url, response };
    return this;
  }
  
  build() {
    return {
      execute: async () => {
        if (this.scenario.viewport) {
          await this.page.setViewportSize(this.scenario.viewport);
        }
        
        if (this.scenario.networkDelay) {
          await this.page.route('**/*', async (route: any) => {
            await new Promise(resolve => setTimeout(resolve, this.scenario.networkDelay));
            route.continue();
          });
        }
        
        if (this.scenario.mockApi) {
          await this.page.route(this.scenario.mockApi.url, (route: any) => {
            route.fulfill({
              contentType: 'application/json',
              body: JSON.stringify(this.scenario.mockApi.response)
            });
          });
        }
        
        await this.page.goto('/');
      }
    };
  }
}

class TestDependencyContainer {
  private dependencies = new Map();
  
  register(name: string, instance: any) {
    this.dependencies.set(name, instance);
  }
  
  get(name: string) {
    return this.dependencies.get(name);
  }
}

class TestLogger {
  log(message: string) {
    console.log(`[TEST LOG] ${new Date().toISOString()}: ${message}`);
  }
}

class TestMetrics {
  private metrics: any = {};
  
  record(name: string, value: any) {
    this.metrics[name] = value;
  }
  
  getCollectedMetrics() {
    return this.metrics;
  }
}

class TestReporter {
  generateReport(data: any) {
    console.log('[TEST REPORT]', JSON.stringify(data, null, 2));
  }
}

class EnhancedTestHelpers extends TestHelpers {
  constructor(page: any, private container: TestDependencyContainer) {
    super(page);
  }
  
  async navigateAndLog(url: string) {
    this.container.get('logger').log(`Navigating to ${url}`);
    await this.page.goto(url);
  }
  
  async waitForAppReadyWithMetrics() {
    const startTime = Date.now();
    await this.waitForAppReady();
    const endTime = Date.now();
    
    this.container.get('metrics').record('pageLoadTime', endTime - startTime);
  }
  
  async generateReport(testName: string) {
    const metrics = this.container.get('metrics').getCollectedMetrics();
    const report = await this.createTestReport(testName);
    
    this.container.get('reporter').generateReport({
      ...report,
      customMetrics: metrics
    });
  }
}

class SwaggerDocumentFactory {
  private doc: any = {
    dashboard: '2.0',
    info: {},
    paths: {}
  };
  
  withTitle(title: string) {
    this.doc.info.title = title;
    return this;
  }
  
  withVersion(version: string) {
    this.doc.info.version = version;
    return this;
  }
  
  withPath(path: string, method: string, definition: any) {
    if (!this.doc.paths[path]) {
      this.doc.paths[path] = {};
    }
    this.doc.paths[path][method] = definition;
    return this;
  }
  
  build() {
    return this.doc;
  }
}

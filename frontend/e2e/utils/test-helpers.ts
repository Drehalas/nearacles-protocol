import { Page, Locator, expect } from '@playwright/test';

/**
 * Test helper utilities for Nearacles E2E tests
 */

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for the application to be fully loaded and ready
   */
  async waitForAppReady(timeout = 15000): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    // For Next.js app, wait for main content instead of React root
    await this.page.waitForSelector('header', { timeout });
    await this.page.waitForSelector('main, .min-h-screen', { timeout });
  }

  /**
   * Wait for Header to be fully loaded
   */
  async waitForHeader(timeout = 20000): Promise<void> {
    await this.page.waitForSelector('header', { timeout });
    
    // Wait for dashboard content to load
    await this.page.waitForFunction(() => {
      const dashboardContainer = document.querySelector('header');
      return dashboardContainer && dashboardContainer.children.length > 0;
    }, { timeout });
  }

  /**
   * Take a screenshot with consistent naming
   */
  async takeScreenshot(name: string, options?: { fullPage?: boolean; clip?: any }): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.png`;
    
    await this.page.screenshot({
      path: `test-results/screenshots/${filename}`,
      fullPage: options?.fullPage || false,
      clip: options?.clip,
    });
  }

  /**
   * Check for console errors and return them
   */
  async getConsoleErrors(): Promise<string[]> {
    return new Promise((resolve) => {
      const errors: string[] = [];
      
      this.page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      this.page.on('pageerror', (exception) => {
        errors.push(exception.message);
      });

      setTimeout(() => resolve(errors), 1000);
    });
  }

  /**
   * Simulate slow network conditions
   */
  async simulateSlowNetwork(): Promise<void> {
    await this.page.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 200));
      route.continue();
    });
  }

  /**
   * Simulate network failure for specific resources
   */
  async simulateNetworkFailure(urlPattern: string): Promise<void> {
    await this.page.route(urlPattern, (route) => {
      route.abort('failed');
    });
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(): Promise<any> {
    return await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paintEntries = performance.getEntriesByType('paint');
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: paintEntries.find(entry => entry.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
        resourceCount: performance.getEntriesByType('resource').length,
      };
    });
  }

  /**
   * Scroll element into view safely
   */
  async scrollToElement(selector: string): Promise<void> {
    const element = this.page.locator(selector);
    await element.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(500); // Allow scroll to complete
  }

  /**
   * Click element with retry logic
   */
  async clickWithRetry(selector: string, maxRetries = 3): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await this.page.locator(selector).click();
        return;
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await this.page.waitForTimeout(1000);
      }
    }
  }

  /**
   * Wait for element to be stable (not moving)
   */
  async waitForElementStable(selector: string, timeout = 5000): Promise<void> {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible', timeout });
    
    // Wait for element position to stabilize
    let previousBox = await element.boundingBox();
    await this.page.waitForTimeout(100);
    
    for (let i = 0; i < 10; i++) {
      const currentBox = await element.boundingBox();
      if (JSON.stringify(previousBox) === JSON.stringify(currentBox)) {
        return;
      }
      previousBox = currentBox;
      await this.page.waitForTimeout(100);
    }
  }

  /**
   * Fill form field with validation
   */
  async fillField(selector: string, value: string, shouldValidate = true): Promise<void> {
    const field = this.page.locator(selector);
    await field.fill(value);
    
    if (shouldValidate) {
      const actualValue = await field.inputValue();
      expect(actualValue).toBe(value);
    }
  }

  /**
   * Generate test data
   */
  generateTestData() {
    return {
      email: `test.${Date.now()}@example.com`,
      password: 'TestPassword123!',
      username: `testuser${Date.now()}`,
      randomString: Math.random().toString(36).substring(7),
      randomNumber: Math.floor(Math.random() * 1000),
    };
  }

  /**
   * Mock API responses
   */
  async mockApiResponse(urlPattern: string, responseData: any, status = 200): Promise<void> {
    await this.page.route(urlPattern, (route) => {
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(responseData),
      });
    });
  }

  /**
   * Test accessibility for an element
   */
  async checkElementAccessibility(selector: string): Promise<void> {
    const element = this.page.locator(selector);
    
    // Check if element is focusable
    await element.focus();
    const isFocused = await element.evaluate(el => document.activeElement === el);
    
    if (isFocused) {
      // Check focus visibility
      const focusOutline = await element.evaluate(el => 
        window.getComputedStyle(el).outline
      );
      expect(focusOutline).not.toBe('none');
    }
  }

  /**
   * Measure layout shift
   */
  async measureLayoutShift(): Promise<number> {
    return await this.page.evaluate(() => {
      return new Promise((resolve) => {
        let totalShift = 0;
        
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
              totalShift += (entry as any).value;
            }
          }
          
          setTimeout(() => resolve(totalShift), 2000);
        }).observe({ entryTypes: ['layout-shift'] });
      });
    });
  }

  /**
   * Wait for animations to complete
   */
  async waitForAnimations(): Promise<void> {
    await this.page.waitForFunction(() => {
      const elements = document.querySelectorAll('*');
      for (const element of elements) {
        const computedStyle = window.getComputedStyle(element);
        if (computedStyle.animationName !== 'none' || computedStyle.transitionProperty !== 'none') {
          return false;
        }
      }
      return true;
    });
  }

  /**
   * Test responsive behavior
   */
  async testResponsiveBreakpoints(breakpoints = [320, 768, 1024, 1440]): Promise<void> {
    for (const width of breakpoints) {
      await this.page.setViewportSize({ width, height: 800 });
      await this.page.waitForTimeout(500);
      
      // Verify no horizontal scroll
      const hasHorizontalScroll = await this.page.evaluate(() => 
        document.body.scrollWidth > window.innerWidth
      );
      expect(hasHorizontalScroll).toBe(false);
      
      // Verify app is still visible
      await expect(this.page.locator('.min-h-screen, header')).toBeVisible();
    }
  }

  /**
   * Create test report data
   */
  async createTestReport(testName: string): Promise<any> {
    const metrics = await this.getPerformanceMetrics();
    const errors = await this.getConsoleErrors();
    
    return {
      testName,
      timestamp: new Date().toISOString(),
      url: this.page.url(),
      viewport: await this.page.viewportSize(),
      userAgent: await this.page.evaluate(() => navigator.userAgent),
      performance: metrics,
      errors,
      screenshot: await this.page.screenshot({ encoding: 'base64' }),
    };
  }
}

/**
 * Swagger-specific test helpers
 */
export class SwaggerHelpers extends TestHelpers {
  /**
   * Expand all API operations
   */
  async expandAllOperations(): Promise<void> {
    const operations = await this.page.locator('header .opblock-summary').all();
    
    for (const operation of operations) {
      await operation.click();
      await this.page.waitForTimeout(200);
    }
  }

  /**
   * Get list of available operations
   */
  async getOperations(): Promise<string[]> {
    await this.waitForHeader();
    
    return await this.page.evaluate(() => {
      const operations = document.querySelectorAll('header .opblock-summary');
      return Array.from(operations).map(op => op.textContent?.trim() || '');
    });
  }

  /**
   * Try out an API operation if possible
   */
  async tryOperation(operationIndex = 0): Promise<boolean> {
    const operations = await this.page.locator('header .opblock').all();
    
    if (operations.length <= operationIndex) {
      return false;
    }

    const operation = operations[operationIndex];
    
    // Expand operation
    await operation.locator('.opblock-summary').click();
    await this.page.waitForTimeout(1000);
    
    // Look for "Try it out" button
    const tryButton = operation.locator('button:has-text("Try it out")');
    
    if (await tryButton.count() > 0) {
      await tryButton.click();
      await this.page.waitForTimeout(500);
      
      // Look for execute button
      const executeButton = operation.locator('button:has-text("Execute")');
      
      if (await executeButton.count() > 0) {
        await executeButton.click();
        await this.page.waitForTimeout(2000);
        return true;
      }
    }
    
    return false;
  }

  /**
   * Validate dashboard document structure
   */
  async validateSwaggerDocument(): Promise<any> {
    const response = await this.page.request.get('/dashboard.json');
    const dashboardDoc = await response.json();
    
    const validation = {
      hasSwaggerVersion: !!(dashboardDoc.dashboard || dashboardDoc.openapi),
      hasInfo: !!dashboardDoc.info,
      hasPaths: !!dashboardDoc.paths,
      pathCount: dashboardDoc.paths ? Object.keys(dashboardDoc.paths).length : 0,
    };
    
    return { dashboardDoc, validation };
  }
}

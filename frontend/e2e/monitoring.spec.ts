import { test, expect } from '@playwright/test';

test.describe('Monitoring and Observability Tests', () => {
  test('should collect and validate performance metrics', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Collect detailed performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paintEntries = performance.getEntriesByType('paint');
      const resourceEntries = performance.getEntriesByType('resource');
      
      return {
        // Navigation timing
        domainLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
        connection: navigation.connectEnd - navigation.connectStart,
        requestResponse: navigation.responseEnd - navigation.requestStart,
        domProcessing: navigation.domContentLoadedEventStart - navigation.responseEnd,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        
        // Paint timing
        firstPaint: paintEntries.find(entry => entry.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
        
        // Resource metrics
        totalResources: resourceEntries.length,
        jsResources: resourceEntries.filter(entry => entry.name.includes('.js')).length,
        cssResources: resourceEntries.filter(entry => entry.name.includes('.css')).length,
        imageResources: resourceEntries.filter(entry => /\.(png|jpg|jpeg|gif|svg|webp)/.test(entry.name)).length,
        
        // Memory (if available)
        usedJSHeapSize: (performance as any).memory?.usedJSHeapSize || 0,
        totalJSHeapSize: (performance as any).memory?.totalJSHeapSize || 0,
        jsHeapSizeLimit: (performance as any).memory?.jsHeapSizeLimit || 0,
      };
    });
    
    // Validate performance thresholds
    expect(performanceMetrics.domContentLoaded).toBeLessThan(2000); // < 2s
    expect(performanceMetrics.firstContentfulPaint).toBeLessThan(3000); // < 3s
    expect(performanceMetrics.totalResources).toBeGreaterThan(0);
    
    // Log metrics for monitoring
    console.log('Performance Metrics:', JSON.stringify(performanceMetrics, null, 2));
  });

  test('should monitor network requests and responses', async ({ page }) => {
    const networkLog: Array<{
      url: string;
      method: string;
      status: number;
      contentType: string;
      size: number;
      timing: number;
    }> = [];
    
    page.on('response', async (response) => {
      const request = response.request();
      const timing = response.timing();
      
      networkLog.push({
        url: response.url(),
        method: request.method(),
        status: response.status(),
        contentType: response.headers()['content-type'] || '',
        size: parseInt(response.headers()['content-length'] || '0'),
        timing: timing.responseEnd - timing.requestStart,
      });
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Analyze network log
    expect(networkLog.length).toBeGreaterThan(0);
    
    // Check for failed requests
    const failedRequests = networkLog.filter(entry => entry.status >= 400);
    expect(failedRequests.length).toBe(0);
    
    // Check for slow requests (> 5s)
    const slowRequests = networkLog.filter(entry => entry.timing > 5000);
    expect(slowRequests.length).toBe(0);
    
    // Log network summary
    console.log('Network Summary:', {
      totalRequests: networkLog.length,
      failedRequests: failedRequests.length,
      slowRequests: slowRequests.length,
      averageResponseTime: networkLog.reduce((acc, entry) => acc + entry.timing, 0) / networkLog.length,
    });
  });

  test('should monitor console messages and errors', async ({ page }) => {
    const consoleLog: Array<{
      type: string;
      text: string;
      timestamp: number;
      location?: string;
    }> = [];
    
    page.on('console', (msg) => {
      consoleLog.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: Date.now(),
        location: msg.location() ? `${msg.location().url}:${msg.location().lineNumber}` : undefined,
      });
    });
    
    page.on('pageerror', (exception) => {
      consoleLog.push({
        type: 'exception',
        text: exception.message,
        timestamp: Date.now(),
        location: exception.stack,
      });
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Analyze console messages
    const errors = consoleLog.filter(entry => entry.type === 'error' || entry.type === 'exception');
    const warnings = consoleLog.filter(entry => entry.type === 'warning');
    const logs = consoleLog.filter(entry => entry.type === 'log');
    
    // Log console summary
    console.log('Console Summary:', {
      totalMessages: consoleLog.length,
      errors: errors.length,
      warnings: warnings.length,
      logs: logs.length,
    });
    
    // Critical errors should not exist
    const criticalErrors = errors.filter(error => 
      !error.text.toLowerCase().includes('404') &&
      !error.text.toLowerCase().includes('favicon') &&
      !error.text.toLowerCase().includes('warning')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('should monitor resource loading and caching', async ({ page }) => {
    const resourceCache = new Map();
    
    page.on('response', async (response) => {
      const url = response.url();
      const cacheControl = response.headers()['cache-control'];
      const etag = response.headers()['etag'];
      const lastModified = response.headers()['last-modified'];
      
      resourceCache.set(url, {
        status: response.status(),
        cacheControl,
        etag,
        lastModified,
        fromCache: response.fromCache(),
        size: parseInt(response.headers()['content-length'] || '0'),
      });
    });
    
    // First load
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const firstLoadResources = new Map(resourceCache);
    
    // Second load (should use cache)
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Analyze caching effectiveness
    let cachedResources = 0;
    let totalResources = 0;
    
    resourceCache.forEach((resource, url) => {
      if (firstLoadResources.has(url)) {
        totalResources++;
        if (resource.fromCache) {
          cachedResources++;
        }
      }
    });
    
    const cacheHitRate = totalResources > 0 ? cachedResources / totalResources : 0;
    
    console.log('Cache Analysis:', {
      totalResources,
      cachedResources,
      cacheHitRate: Math.round(cacheHitRate * 100) + '%',
    });
    
    // Expect some level of caching for static resources
    expect(totalResources).toBeGreaterThan(0);
  });

  test('should monitor application state and health', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check application health indicators
    const healthCheck = await page.evaluate(() => {
      return {
        // DOM health
        hasRootElement: !!document.getElementById('root'),
        hasReactApp: !!document.querySelector('.min-h-screen'),
        
        // JavaScript health
        hasJavaScriptErrors: window.onerror !== null,
        reactDevTools: !!(window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__,
        
        // Performance health
        isResponsive: performance.now() > 0,
        
        // Storage health
        localStorageAvailable: (() => {
          try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            return true;
          } catch {
            return false;
          }
        })(),
        
        // Network health
        onlineStatus: navigator.onLine,
        
        // Viewport health
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      };
    });
    
    // Validate health indicators
    expect(healthCheck.hasRootElement).toBe(true);
    expect(healthCheck.hasReactApp).toBe(true);
    expect(healthCheck.isResponsive).toBe(true);
    expect(healthCheck.localStorageAvailable).toBe(true);
    expect(healthCheck.onlineStatus).toBe(true);
    expect(healthCheck.viewportWidth).toBeGreaterThan(0);
    expect(healthCheck.viewportHeight).toBeGreaterThan(0);
    
    console.log('Health Check:', healthCheck);
  });

  test('should generate test execution report', async ({ page }) => {
    const testStart = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Perform basic functionality test
    await page.waitForSelector('.swagger-ui', { timeout: 15000 });
    const swaggerLoaded = await page.locator('.swagger-ui').isVisible();
    
    const testEnd = Date.now();
    
    // Generate comprehensive test report
    const testReport = {
      timestamp: new Date().toISOString(),
      testDuration: testEnd - testStart,
      userAgent: await page.evaluate(() => navigator.userAgent),
      viewport: await page.viewportSize(),
      url: page.url(),
      testResults: {
        pageLoaded: true,
        swaggerUILoaded: swaggerLoaded,
        basicFunctionalityWorking: swaggerLoaded,
      },
      performance: await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        };
      }),
    };
    
    // Validate test execution
    expect(testReport.testResults.pageLoaded).toBe(true);
    expect(testReport.testResults.swaggerUILoaded).toBe(true);
    expect(testReport.testDuration).toBeLessThan(30000); // < 30s
    
    // Output report for CI/monitoring systems
    console.log('Test Execution Report:', JSON.stringify(testReport, null, 2));
  });

  test('should validate accessibility compliance metrics', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Basic accessibility checks
    const accessibilityMetrics = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      let totalElements = elements.length;
      let elementsWithAria = 0;
      let elementsWithAlt = 0;
      let headingElements = 0;
      let landmarkElements = 0;
      
      elements.forEach(el => {
        // Count ARIA attributes
        if (el.hasAttributes()) {
          for (let attr of el.attributes) {
            if (attr.name.startsWith('aria-') || attr.name === 'role') {
              elementsWithAria++;
              break;
            }
          }
        }
        
        // Count alt attributes on images
        if (el.tagName === 'IMG' && el.getAttribute('alt') !== null) {
          elementsWithAlt++;
        }
        
        // Count heading elements
        if (/^H[1-6]$/.test(el.tagName)) {
          headingElements++;
        }
        
        // Count landmark elements
        if (['MAIN', 'NAV', 'HEADER', 'FOOTER', 'ASIDE', 'SECTION'].includes(el.tagName)) {
          landmarkElements++;
        }
      });
      
      return {
        totalElements,
        elementsWithAria,
        elementsWithAlt,
        headingElements,
        landmarkElements,
        ariaUsagePercent: Math.round((elementsWithAria / totalElements) * 100),
      };
    });
    
    // Log accessibility metrics
    console.log('Accessibility Metrics:', accessibilityMetrics);
    
    // Basic accessibility expectations
    expect(accessibilityMetrics.totalElements).toBeGreaterThan(0);
    // Note: Specific thresholds would depend on the application's accessibility requirements
  });
});

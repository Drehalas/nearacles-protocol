import { test, expect } from '@playwright/test';

test.describe('Integration Tests - Component and Service Integration', () => {
  test('should integrate React components properly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test React component hierarchy
    const componentStructure = await page.evaluate(() => {
      const root = document.querySelector('#root');
      const app = document.querySelector('.min-h-screen');
      const swaggerUI = document.querySelector('.swagger-ui');
      
      return {
        hasRoot: !!root,
        hasApp: !!app,
        hasSwaggerUI: !!swaggerUI,
        rootChildren: root?.children.length || 0,
        appParent: app?.parentElement?.id || '',
        swaggerUIParent: swaggerUI?.parentElement?.className || '',
      };
    });
    
    // Validate component integration
    expect(componentStructure.hasRoot).toBe(true);
    expect(componentStructure.hasApp).toBe(true);
    expect(componentStructure.hasSwaggerUI).toBe(true);
    expect(componentStructure.appParent).toBe('root');
    expect(componentStructure.rootChildren).toBeGreaterThan(0);
  });

  test('should integrate external libraries correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test external library integration
    const libraryIntegration = await page.evaluate(() => {
      return {
        react: !!(window as any).React || !!document.querySelector('[data-reactroot]'),
        swaggerUI: !!document.querySelector('.swagger-ui'),
        swaggerUILibrary: !!(window as any).SwaggerUIBundle || document.querySelectorAll('script[src*="swagger"]').length > 0,
      };
    });
    
    // Swagger UI should be properly integrated
    expect(libraryIntegration.swaggerUI).toBe(true);
    
    // React should be available (either global or bundled)
    const hasReactIndicators = await page.locator('[data-reactroot], .App').count();
    expect(hasReactIndicators).toBeGreaterThan(0);
  });

  test('should integrate CSS modules and styling', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test CSS integration
    const stylingIntegration = await page.evaluate(() => {
      const body = document.body;
      const app = document.querySelector('.min-h-screen');
      const swaggerUI = document.querySelector('.swagger-ui');
      
      return {
        bodyFont: window.getComputedStyle(body).fontFamily,
        appStyles: app ? window.getComputedStyle(app).display : '',
        swaggerUIStyles: swaggerUI ? window.getComputedStyle(swaggerUI).display : '',
        cssRules: document.styleSheets.length,
      };
    });
    
    // Verify styling is applied
    expect(stylingIntegration.bodyFont).toContain('sans-serif');
    expect(stylingIntegration.cssRules).toBeGreaterThan(0);
    expect(stylingIntegration.appStyles).not.toBe('none');
  });

  test('should integrate with browser APIs correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test browser API integration
    const apiIntegration = await page.evaluate(() => {
      return {
        localStorage: typeof localStorage !== 'undefined',
        sessionStorage: typeof sessionStorage !== 'undefined',
        fetch: typeof fetch !== 'undefined',
        console: typeof console !== 'undefined',
        performance: typeof performance !== 'undefined',
        history: typeof history !== 'undefined',
        location: typeof location !== 'undefined',
      };
    });
    
    // All modern browser APIs should be available
    Object.values(apiIntegration).forEach(apiAvailable => {
      expect(apiAvailable).toBe(true);
    });
  });

  test('should handle data flow between components', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.swagger-ui', { timeout: 15000 });
    
    // Test component data flow by interacting with SwaggerUI
    const operationsBefore = await page.locator('.swagger-ui .opblock').count();
    
    // Interact with components to test data flow
    const operations = await page.locator('.swagger-ui .opblock-summary').all();
    
    if (operations.length > 0) {
      // Expand an operation (tests component state changes)
      await operations[0].click();
      await page.waitForTimeout(1000);
      
      // Check if component state updated
      const operationBody = page.locator('.swagger-ui .opblock-body').first();
      const isExpanded = await operationBody.isVisible();
      
      expect(isExpanded).toBe(true);
      
      // Collapse it back (test bidirectional data flow)
      await operations[0].click();
      await page.waitForTimeout(500);
    }
    
    // Verify component remains functional after interactions
    await expect(page.locator('.swagger-ui')).toBeVisible();
  });

  test('should integrate error boundaries and error handling', async ({ page }) => {
    await page.goto('/');
    
    const jsErrors: string[] = [];
    const reactErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('React') || text.includes('component')) {
          reactErrors.push(text);
        } else {
          jsErrors.push(text);
        }
      }
    });
    
    page.on('pageerror', exception => {
      jsErrors.push(exception.message);
    });
    
    await page.waitForLoadState('networkidle');
    
    // Trigger potential error scenarios
    await page.evaluate(() => {
      // Test invalid operations that should be handled gracefully
      try {
        (window as any).nonExistentFunction?.();
      } catch (e) {
        // Should be caught by error boundaries
      }
    });
    
    await page.waitForTimeout(1000);
    
    // Application should handle errors gracefully
    await expect(page.locator('.min-h-screen')).toBeVisible();
    
    // Critical React errors should not occur
    const criticalReactErrors = reactErrors.filter(error => 
      error.includes('Uncaught') || error.includes('Cannot read')
    );
    expect(criticalReactErrors).toHaveLength(0);
  });

  test('should integrate with development vs production builds', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check build characteristics
    const buildInfo = await page.evaluate(() => {
      return {
        isDevelopment: process?.env?.NODE_ENV === 'development' || !!(window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__,
        hasSourceMaps: document.querySelectorAll('script[src*=".map"]').length > 0,
        isMinified: document.querySelector('script')?.textContent?.includes('\n') === false,
        hasDevTools: !!(window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__,
        bundleCount: document.querySelectorAll('script[src*=".js"]').length,
      };
    });
    
    // Verify appropriate build characteristics
    expect(buildInfo.bundleCount).toBeGreaterThan(0);
    
    // Log build info for debugging
    console.log('Build Integration Info:', buildInfo);
  });

  test('should integrate responsive design with functionality', async ({ page }) => {
    const viewports = [
      { width: 320, height: 568, name: 'Mobile Small' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1200, height: 800, name: 'Desktop' },
      { width: 1920, height: 1080, name: 'Large Desktop' },
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Verify functionality at each viewport
      await expect(page.locator('.min-h-screen')).toBeVisible();
      
      // Check if SwaggerUI adapts to viewport
      await page.waitForSelector('.swagger-ui', { timeout: 10000 });
      const swaggerContainer = page.locator('.swagger-ui');
      await expect(swaggerContainer).toBeVisible();
      
      // Verify no horizontal overflow
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth;
      });
      expect(hasHorizontalScroll).toBe(false);
    }
  });

  test('should integrate with browser navigation and routing', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test browser navigation integration
    const currentUrl = page.url();
    
    // Navigate to different fragments/hashes
    await page.goto('/#test');
    await page.waitForTimeout(500);
    expect(page.url()).toContain('#test');
    
    // Test browser back
    await page.goBack();
    await page.waitForTimeout(500);
    
    // Test browser forward
    await page.goForward();
    await page.waitForTimeout(500);
    
    // App should remain functional throughout navigation
    await expect(page.locator('.min-h-screen')).toBeVisible();
  });

  test('should integrate performance monitoring', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test performance monitoring integration
    const performanceData = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const resources = performance.getEntriesByType('resource');
      
      return {
        navigationTiming: {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        },
        resourceCount: resources.length,
        memoryUsage: (performance as any).memory ? {
          used: (performance as any).memory.usedJSHeapSize,
          total: (performance as any).memory.totalJSHeapSize,
        } : null,
      };
    });
    
    // Validate performance integration
    expect(performanceData.navigationTiming.domContentLoaded).toBeGreaterThan(0);
    expect(performanceData.resourceCount).toBeGreaterThan(0);
    
    // Log performance data
    console.log('Performance Integration:', performanceData);
  });
});

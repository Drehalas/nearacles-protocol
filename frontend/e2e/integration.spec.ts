import { test, expect } from '@playwright/test';

test.describe('Integration Tests - Component and Service Integration', () => {
  test('should integrate React components properly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test React component hierarchy
    const componentStructure = await page.evaluate(() => {
      const root = document.querySelector('#root');
      const app = document.querySelector('.min-h-screen');
      const dashboardUI = document.querySelector('header');
      
      return {
        hasRoot: !!root,
        hasApp: !!app,
        hasHeader: !!dashboardUI,
        rootChildren: root?.children.length || 0,
        appParent: app?.parentElement?.id || '',
        dashboardUIParent: dashboardUI?.parentElement?.className || '',
      };
    });
    
    // Validate component integration
    expect(componentStructure.hasRoot).toBe(true);
    expect(componentStructure.hasApp).toBe(true);
    expect(componentStructure.hasHeader).toBe(true);
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
        dashboardUI: !!document.querySelector('header'),
        dashboardUILibrary: !!(window as any).HeaderBundle || document.querySelectorAll('script[src*="dashboard"]').length > 0,
      };
    });
    
    // Dashboard UI should be properly integrated
    expect(libraryIntegration.dashboardUI).toBe(true);
    
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
      const dashboardUI = document.querySelector('header');
      
      return {
        bodyFont: window.getComputedStyle(body).fontFamily,
        appStyles: app ? window.getComputedStyle(app).display : '',
        dashboardUIStyles: dashboardUI ? window.getComputedStyle(dashboardUI).display : '',
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
    await page.waitForSelector('header', { timeout: 15000 });
    
    // Test component data flow by interacting with Header
    const operations = await page.locator('header .opblock-summary').all();
    
    if (operations.length > 0) {
      // Expand an operation (tests component state changes)
      await operations[0].click();
      await page.waitForTimeout(1000);
      
      // Check if component state updated
      const operationBody = page.locator('header .opblock-body').first();
      const isExpanded = await operationBody.isVisible();
      
      expect(isExpanded).toBe(true);
      
      // Collapse it back (test bidirectional data flow)
      await operations[0].click();
      await page.waitForTimeout(500);
      const isCollapsed = await operationBody.isHidden();
      expect(isCollapsed).toBe(true);
    }
    
    // Verify component remains functional after interactions
    await expect(page.locator('header')).toBeVisible();
  });

  test('should integrate error boundaries and error handling', async ({ page }) => {
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
    
    await page.goto('/');
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
    await expect(page.locator('.min-h-screen').first()).toBeVisible();
    
    // Critical React errors should not occur
    const criticalReactErrors = reactErrors.filter(error => 
      error.includes('Uncaught') || error.includes('Cannot read')
    );
    expect(criticalReactErrors).toHaveLength(0);
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
    await expect(page.locator('.min-h-screen').first()).toBeVisible();
  });
});
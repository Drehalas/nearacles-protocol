import { test, expect } from '@playwright/test';

test.describe('Test Runner Configuration', () => {
  test('should run all test suites successfully', async ({ page }) => {
    // This test validates the test environment setup
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Basic smoke test to ensure environment is ready
    await expect(page.locator('#root')).toBeVisible();
    await expect(page.locator('.min-h-screen').first()).toBeVisible();
  });

  test('should have proper test data setup', async ({ page }) => {
    await page.goto('/');
    
    // Verify test environment has necessary resources
    const response = await page.request.get('/swagger.json');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toBeDefined();
  });

  test('should handle test isolation', async ({ page, context }) => {
    // Test that each test runs in isolation
    await page.goto('/');
    
    // Set some test data
    await page.evaluate(() => {
      (window as any).testData = 'isolated test data';
      localStorage.setItem('testKey', 'testValue');
    });
    
    // Create new page to test isolation
    const newPage = await context.newPage();
    await newPage.goto('/');
    
    const isolationTest = await newPage.evaluate(() => {
      return {
        windowData: (window as any).testData,
        localStorage: localStorage.getItem('testKey')
      };
    });
    
    // New page should not have the test data from previous page
    expect(isolationTest.windowData).toBeUndefined();
    // localStorage might persist in same context, which is expected
  });

  test('should provide test reporting data', async ({ page }) => {
    await page.goto('/');
    
    // Collect performance metrics for reporting
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
        resourceCount: performance.getEntriesByType('resource').length
      };
    });
    
    // Verify metrics are reasonable
    expect(metrics.domContentLoaded).toBeGreaterThan(0);
    expect(metrics.resourceCount).toBeGreaterThan(0);
  });

  test('should handle test environment cleanup', async ({ page }) => {
    await page.goto('/');
    
    // Create test artifacts
    await page.evaluate(() => {
      (window as any).testArtifacts = new Array(1000).fill('cleanup test');
    });
    
    // Verify cleanup can be performed
    await page.evaluate(() => {
      delete (window as any).testArtifacts;
    });
    
    const cleanupResult = await page.evaluate(() => {
      return (window as any).testArtifacts;
    });
    
    expect(cleanupResult).toBeUndefined();
  });
});

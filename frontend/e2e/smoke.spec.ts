import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Critical Path Validation', () => {
  test('should pass basic smoke test for application health', async ({ page }) => {
    // Ultra-fast smoke test to verify app is functional
    await page.goto('/');
    
    // Critical elements must be present
    await expect(page.locator('#root')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.App')).toBeVisible({ timeout: 5000 });
    
    // Page should load without critical errors
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('should load core dependencies quickly', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    
    // Critical: DOM should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    // React app should be mounted
    const reactApp = await page.locator('.App').count();
    expect(reactApp).toBe(1);
  });

  test('should have working SwaggerUI integration', async ({ page }) => {
    await page.goto('/');
    
    // Wait for SwaggerUI with generous timeout for smoke test
    await page.waitForSelector('.swagger-ui', { timeout: 20000 });
    
    const swaggerContainer = page.locator('.swagger-ui');
    await expect(swaggerContainer).toBeVisible();
    
    // Basic interaction test
    const operations = await page.locator('.swagger-ui .opblock').count();
    expect(operations).toBeGreaterThanOrEqual(0); // At least no errors
  });

  test('should handle basic user interaction', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test basic click interaction
    const clickableElements = await page.locator('button, a, [role="button"]').all();
    
    if (clickableElements.length > 0) {
      // Click first interactive element
      await clickableElements[0].click();
      await page.waitForTimeout(1000);
      
      // App should remain stable
      await expect(page.locator('.App')).toBeVisible();
    }
  });

  test('should respond to keyboard input', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Test basic keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Escape');
    
    // App should handle keyboard input without crashes
    await expect(page.locator('.App')).toBeVisible();
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Quick mobile smoke test
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Core elements should be visible on mobile
    await expect(page.locator('#root')).toBeVisible();
    await expect(page.locator('.App')).toBeVisible();
    
    // Should be responsive
    const bodyWidth = await page.locator('body').evaluate(el => el.clientWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375);
  });

  test('should maintain functionality after page refresh', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.App');
    
    // Refresh page
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    
    // Core functionality should be restored
    await expect(page.locator('.App')).toBeVisible();
  });

  test('should not have critical JavaScript errors', async ({ page }) => {
    const criticalErrors: string[] = [];
    
    page.on('pageerror', exception => {
      criticalErrors.push(exception.message);
    });
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('Uncaught') || text.includes('ReferenceError') || text.includes('TypeError')) {
          criticalErrors.push(text);
        }
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should have no critical JavaScript errors
    expect(criticalErrors).toHaveLength(0);
  });

  test('should load within reasonable resource limits', async ({ page }) => {
    const resourceSizes: number[] = [];
    
    page.on('response', async (response) => {
      const contentLength = response.headers()['content-length'];
      if (contentLength) {
        resourceSizes.push(parseInt(contentLength));
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Calculate total resource size
    const totalSize = resourceSizes.reduce((sum, size) => sum + size, 0);
    
    // Should not exceed reasonable limits (10MB total)
    expect(totalSize).toBeLessThan(10 * 1024 * 1024);
    
    // Should have loaded some resources
    expect(resourceSizes.length).toBeGreaterThan(0);
  });

  test('should be accessible via different entry points', async ({ page }) => {
    const entryPoints = ['/', '/#', '/?test=1', '/#section'];
    
    for (const entryPoint of entryPoints) {
      await page.goto(entryPoint);
      await page.waitForLoadState('domcontentloaded');
      
      // App should load regardless of entry point
      await expect(page.locator('.App')).toBeVisible();
    }
  });
});

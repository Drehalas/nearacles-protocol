import { test, expect } from '@playwright/test';

test.describe('Error Handling Tests', () => {
  test('should handle JavaScript errors gracefully', async ({ page }) => {
    const jsErrors: string[] = [];
    
    page.on('pageerror', exception => {
      jsErrors.push(exception.message);
    });
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should not have any unhandled JavaScript errors
    const criticalErrors = jsErrors.filter(error => 
      !error.toLowerCase().includes('warning') &&
      !error.toLowerCase().includes('404') &&
      !error.toLowerCase().includes('favicon')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('should handle missing resources gracefully', async ({ page }) => {
    // Intercept and fail CSS request
    await page.route('**/main.css', route => {
      route.abort('failed');
    });
    
    await page.goto('/');
    
    // App should still load even without CSS
    await expect(page.locator('#root')).toBeVisible();
    await expect(page.locator('.min-h-screen')).toBeVisible();
  });

  test('should handle network connectivity issues', async ({ page, context }) => {
    // Simulate offline mode
    await context.setOffline(true);
    
    const networkErrors: string[] = [];
    page.on('response', response => {
      if (!response.ok()) {
        networkErrors.push(`${response.status()}: ${response.url()}`);
      }
    });
    
    await page.goto('/');
    
    // Should handle offline gracefully
    await expect(page.locator('#root')).toBeVisible();
    
    // Restore connectivity
    await context.setOffline(false);
  });

  test('should handle browser resize and orientation changes', async ({ page }) => {
    await page.goto('/');
    
    // Test various viewport sizes
    const viewports = [
      { width: 1920, height: 1080 },
      { width: 768, height: 1024 },
      { width: 375, height: 667 },
      { width: 320, height: 568 },
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);
      
      // App should remain functional at all sizes
      await expect(page.locator('.min-h-screen')).toBeVisible();
    }
  });

  test('should handle rapid user interactions', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.swagger-ui', { timeout: 10000 });
    
    // Test rapid clicks on expandable elements
    const expandableElements = await page.locator('.swagger-ui .opblock-summary').all();
    
    if (expandableElements.length > 0) {
      // Rapidly click elements
      for (let i = 0; i < Math.min(3, expandableElements.length); i++) {
        for (let j = 0; j < 5; j++) {
          await expandableElements[i].click();
          await page.waitForTimeout(50);
        }
      }
      
      // App should remain stable
      await expect(page.locator('.min-h-screen')).toBeVisible();
    }
  });

  test('should handle invalid URLs and routes', async ({ page }) => {
    // Test non-existent routes
    const invalidUrls = [
      '/non-existent-page',
      '/admin',
      '/api/invalid',
      '/../',
      '/null',
      '/undefined'
    ];
    
    for (const url of invalidUrls) {
      await page.goto(url, { waitUntil: 'networkidle' });
      
      // Should still show the app (SPA behavior)
      await expect(page.locator('#root')).toBeVisible();
    }
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to different hash or query params
    await page.goto('/#section1');
    await page.goto('/?param=test');
    
    // Test browser back
    await page.goBack();
    await expect(page.locator('.min-h-screen')).toBeVisible();
    
    await page.goBack();
    await expect(page.locator('.min-h-screen')).toBeVisible();
    
    // Test browser forward
    await page.goForward();
    await expect(page.locator('.min-h-screen')).toBeVisible();
  });

  test('should handle page refresh at any time', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.swagger-ui', { timeout: 10000 });
    
    // Refresh multiple times during different states
    for (let i = 0; i < 3; i++) {
      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('.min-h-screen')).toBeVisible();
      await page.waitForTimeout(1000);
    }
  });

  test('should handle browser storage issues', async ({ page, context }) => {
    // Clear all storage
    await context.clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    await page.goto('/');
    
    // App should work without stored data
    await expect(page.locator('.min-h-screen')).toBeVisible();
  });

  test('should handle memory pressure gracefully', async ({ page }) => {
    await page.goto('/');
    
    // Create memory pressure by generating large objects
    await page.evaluate(() => {
      const largeArray = new Array(100000).fill('test string data');
      (window as any).testData = largeArray;
    });
    
    // App should remain responsive
    await expect(page.locator('.min-h-screen')).toBeVisible();
    
    // Cleanup
    await page.evaluate(() => {
      delete (window as any).testData;
    });
  });
});

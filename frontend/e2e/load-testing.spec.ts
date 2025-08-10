import { test, expect } from '@playwright/test';

test.describe('Load Testing', () => {
  test('should handle multiple concurrent users', async ({ browser }) => {
    const userCount = 5;
    const contexts = [];
    const pages = [];
    
    // Create multiple browser contexts (simulating different users)
    for (let i = 0; i < userCount; i++) {
      const context = await browser.newContext();
      const page = await context.newPage();
      contexts.push(context);
      pages.push(page);
    }
    
    // All users navigate to the app simultaneously
    const loadPromises = pages.map(page => 
      page.goto('/').then(() => page.waitForLoadState('networkidle'))
    );
    
    const startTime = Date.now();
    await Promise.all(loadPromises);
    const endTime = Date.now();
    
    // All pages should load within reasonable time even with concurrent users
    expect(endTime - startTime).toBeLessThan(10000);
    
    // Verify all pages loaded successfully
    for (const page of pages) {
      await expect(page.locator('.App')).toBeVisible();
    }
    
    // Cleanup
    for (const context of contexts) {
      await context.close();
    }
  });

  test('should handle rapid page interactions', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.swagger-ui', { timeout: 15000 });
    
    const operations = await page.locator('.swagger-ui .opblock-summary').all();
    
    if (operations.length > 0) {
      const startTime = Date.now();
      
      // Rapidly interact with multiple elements
      for (let i = 0; i < Math.min(10, operations.length); i++) {
        await operations[i % operations.length].click();
        await page.waitForTimeout(100);
      }
      
      const endTime = Date.now();
      
      // Should handle rapid interactions smoothly
      expect(endTime - startTime).toBeLessThan(5000);
      
      // App should remain stable
      await expect(page.locator('.App')).toBeVisible();
    }
  });

  test('should handle memory intensive operations', async ({ page }) => {
    await page.goto('/');
    
    // Simulate memory-intensive operations
    const memoryTest = await page.evaluate(() => {
      const startTime = performance.now();
      const largeArray = [];
      
      // Create large amount of data
      for (let i = 0; i < 100000; i++) {
        largeArray.push({
          id: i,
          data: `test data string ${i}`,
          timestamp: Date.now(),
        });
      }
      
      // Process the data
      const processed = largeArray.map(item => ({
        ...item,
        processed: true,
        hash: item.id * 31
      }));
      
      const endTime = performance.now();
      
      // Cleanup
      largeArray.length = 0;
      processed.length = 0;
      
      return endTime - startTime;
    });
    
    // Should complete memory operations reasonably quickly
    expect(memoryTest).toBeLessThan(5000);
    
    // App should remain responsive
    await expect(page.locator('.App')).toBeVisible();
  });

  test('should handle continuous scrolling', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const startTime = Date.now();
    
    // Continuous scrolling for 10 seconds
    const scrollInterval = setInterval(async () => {
      await page.evaluate(() => {
        window.scrollBy(0, 100);
      });
    }, 100);
    
    // Wait for 5 seconds of scrolling
    await page.waitForTimeout(5000);
    clearInterval(scrollInterval);
    
    const endTime = Date.now();
    
    // Should handle continuous scrolling smoothly
    expect(endTime - startTime).toBeGreaterThan(4000);
    expect(endTime - startTime).toBeLessThan(7000);
    
    // App should remain functional
    await expect(page.locator('.App')).toBeVisible();
  });

  test('should handle rapid resize operations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const viewports = [
      { width: 1920, height: 1080 },
      { width: 768, height: 1024 },
      { width: 375, height: 667 },
      { width: 1440, height: 900 },
      { width: 320, height: 568 },
    ];
    
    const startTime = Date.now();
    
    // Rapidly change viewport sizes
    for (let i = 0; i < 20; i++) {
      const viewport = viewports[i % viewports.length];
      await page.setViewportSize(viewport);
      await page.waitForTimeout(50);
    }
    
    const endTime = Date.now();
    
    // Should handle rapid resizing
    expect(endTime - startTime).toBeLessThan(3000);
    
    // App should remain stable after resizing
    await expect(page.locator('.App')).toBeVisible();
  });

  test('should maintain performance with large DOM', async ({ page }) => {
    await page.goto('/');
    
    // Add many elements to the DOM
    await page.evaluate(() => {
      const container = document.createElement('div');
      container.style.display = 'none'; // Hidden to not affect visual tests
      
      for (let i = 0; i < 1000; i++) {
        const element = document.createElement('div');
        element.innerHTML = `<span>Item ${i}</span><p>Description for item ${i}</p>`;
        container.appendChild(element);
      }
      
      document.body.appendChild(container);
    });
    
    // Test interactions with large DOM
    const startTime = Date.now();
    
    await page.evaluate(() => {
      // Query DOM multiple times
      for (let i = 0; i < 100; i++) {
        document.querySelectorAll('div');
        document.querySelectorAll('span');
      }
    });
    
    const endTime = Date.now();
    
    // Should handle DOM queries efficiently even with large DOM
    expect(endTime - startTime).toBeLessThan(2000);
    
    // Original app should still be functional
    await expect(page.locator('.App')).toBeVisible();
  });

  test('should handle network throttling', async ({ page, context }) => {
    // Simulate slow network
    await context.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 200));
      route.continue();
    });
    
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const endTime = Date.now();
    
    // Should handle slow network gracefully
    expect(endTime - startTime).toBeGreaterThan(1000);
    
    // App should still load completely
    await expect(page.locator('.App')).toBeVisible();
  });

  test('should handle browser tab switching simulation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Simulate tab becoming hidden/visible
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => {
        // Simulate tab hidden
        Object.defineProperty(document, 'hidden', { value: true, configurable: true });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      
      await page.waitForTimeout(100);
      
      await page.evaluate(() => {
        // Simulate tab visible
        Object.defineProperty(document, 'hidden', { value: false, configurable: true });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      
      await page.waitForTimeout(100);
    }
    
    // App should remain stable after visibility changes
    await expect(page.locator('.App')).toBeVisible();
  });

  test('should handle stress testing of API calls', async ({ page }) => {
    await page.goto('/');
    
    // Make multiple concurrent API calls
    const apiCalls = Array.from({ length: 10 }, () => 
      page.request.get('/swagger.json')
    );
    
    const startTime = Date.now();
    const responses = await Promise.all(apiCalls);
    const endTime = Date.now();
    
    // All API calls should succeed
    responses.forEach(response => {
      expect(response.status()).toBe(200);
    });
    
    // Should complete within reasonable time
    expect(endTime - startTime).toBeLessThan(5000);
    
    // App should remain functional
    await expect(page.locator('.App')).toBeVisible();
  });
});

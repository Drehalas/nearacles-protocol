import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should load main page within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should have good Core Web Vitals', async ({ page }) => {
    await page.goto('/');
    
    // Measure First Contentful Paint (FCP)
    const fcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
          if (fcpEntry) {
            resolve(fcpEntry.startTime);
          }
        }).observe({ entryTypes: ['paint'] });
      });
    });
    
    // FCP should be under 2 seconds
    expect(fcp).toBeLessThan(2000);
  });

  test('should not have memory leaks', async ({ page }) => {
    await page.goto('/');
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // Perform some interactions
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Get memory usage after interactions
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // Memory growth should be reasonable (less than 50MB)
    const memoryGrowth = finalMemory - initialMemory;
    expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024);
  });

  test('should handle multiple rapid clicks', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('header', { timeout: 10000 });
    
    const clickableElements = await page.locator('button, a[href]').all();
    
    if (clickableElements.length > 0) {
      const startTime = Date.now();
      
      // Rapidly click multiple elements
      for (let i = 0; i < Math.min(5, clickableElements.length); i++) {
        await clickableElements[i].click();
        await page.waitForTimeout(100);
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Should handle rapid clicks within reasonable time
      expect(totalTime).toBeLessThan(2000);
    }
  });

  test('should optimize resource loading', async ({ page }) => {
    const resourceSizes: { [key: string]: number } = {};
    
    page.on('response', async (response) => {
      const url = response.url();
      const contentLength = response.headers()['content-length'];
      
      if (contentLength) {
        resourceSizes[url] = parseInt(contentLength);
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if main bundle is reasonable size (less than 5MB)
    const jsFiles = Object.keys(resourceSizes).filter(url => url.endsWith('.js'));
    const totalJSSize = jsFiles.reduce((total, url) => total + (resourceSizes[url] || 0), 0);
    
    expect(totalJSSize).toBeLessThan(5 * 1024 * 1024);
  });

  test('should have efficient rendering', async ({ page }) => {
    await page.goto('/');
    
    // Measure layout shifts
    const layoutShifts = await page.evaluate(() => {
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
    
    // Cumulative Layout Shift should be minimal
    expect(layoutShifts).toBeLessThan(0.1);
  });
});

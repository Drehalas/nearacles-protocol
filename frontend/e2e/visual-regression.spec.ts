import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test('should match main page screenshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for SwaggerUI to fully load
    await page.waitForSelector('.swagger-ui', { timeout: 15000 });
    
    // Take screenshot of the entire page
    await expect(page).toHaveScreenshot('main-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should match SwaggerUI component screenshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.swagger-ui', { timeout: 15000 });
    
    // Screenshot just the SwaggerUI component
    const swaggerContainer = page.locator('.swagger-ui');
    await expect(swaggerContainer).toHaveScreenshot('swagger-ui-component.png', {
      animations: 'disabled',
    });
  });

  test('should match mobile view screenshots', async ({ page }) => {
    // Test iPhone view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('mobile-iphone.png', {
      fullPage: true,
      animations: 'disabled',
    });
    
    // Test Android view
    await page.setViewportSize({ width: 360, height: 640 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('mobile-android.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should match tablet view screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('tablet-view.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should match expanded swagger operations', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.swagger-ui .opblock', { timeout: 15000 });
    
    // Expand first operation if available
    const firstOperation = page.locator('.swagger-ui .opblock').first();
    if (await firstOperation.count() > 0) {
      await firstOperation.locator('.opblock-summary').click();
      await page.waitForTimeout(1000);
      
      await expect(firstOperation).toHaveScreenshot('swagger-expanded-operation.png', {
        animations: 'disabled',
      });
    }
  });

  test('should match dark mode if supported', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('dark-mode.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should match high contrast mode', async ({ page }) => {
    await page.emulateMedia({ 
      colorScheme: 'dark',
      forcedColors: 'active' 
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('high-contrast.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should match different zoom levels', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test 150% zoom
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.evaluate(() => {
      document.body.style.zoom = '1.5';
    });
    
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('zoom-150.png', {
      animations: 'disabled',
    });
    
    // Reset zoom
    await page.evaluate(() => {
      document.body.style.zoom = '1';
    });
  });

  test('should match loading states', async ({ page }) => {
    // Intercept and delay swagger.json to capture loading state
    await page.route('**/swagger.json', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      route.continue();
    });
    
    await page.goto('/');
    
    // Capture loading state if visible
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('loading-state.png', {
      animations: 'disabled',
    });
  });

  test('should handle screenshot consistency across test runs', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Disable animations and transitions for consistent screenshots
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `
    });
    
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('consistent-view.png', {
      animations: 'disabled',
      clip: { x: 0, y: 0, width: 1200, height: 800 },
    });
  });

  test('should match error state screenshots', async ({ page }) => {
    // Force swagger.json to fail
    await page.route('**/swagger.json', route => {
      route.abort('failed');
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('error-state.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});

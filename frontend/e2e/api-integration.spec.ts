import { test, expect } from '@playwright/test';

test.describe('API Integration Tests', () => {
  test('should load swagger.json successfully', async ({ page, request }) => {
    // Test direct API call
    const response = await request.get('/swagger.json');
    expect(response.status()).toBe(200);
    
    const swaggerData = await response.json();
    expect(swaggerData).toBeDefined();
    expect(swaggerData.swagger || swaggerData.openapi).toBeDefined();
  });

  test('should handle API network failures gracefully', async ({ page }) => {
    // Intercept and fail swagger.json request
    await page.route('**/swagger.json', route => {
      route.abort('failed');
    });
    
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('/');
    
    // App should still load even if swagger.json fails
    await expect(page.locator('.App')).toBeVisible();
    
    // Should handle the error gracefully (no unhandled promise rejections)
    const criticalErrors = consoleErrors.filter(error => 
      error.includes('Uncaught') || error.includes('Unhandled')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('should handle slow API responses', async ({ page }) => {
    // Intercept and delay swagger.json request
    await page.route('**/swagger.json', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      route.continue();
    });
    
    const startTime = Date.now();
    await page.goto('/');
    
    // Should show loading state or handle delay gracefully
    await page.waitForLoadState('networkidle');
    const endTime = Date.now();
    
    // Should eventually load despite delay
    await expect(page.locator('.App')).toBeVisible();
    expect(endTime - startTime).toBeGreaterThan(2000);
  });

  test('should handle malformed API responses', async ({ page }) => {
    // Intercept and return malformed JSON
    await page.route('**/swagger.json', route => {
      route.fulfill({
        contentType: 'application/json',
        body: '{ invalid json }',
        status: 200
      });
    });
    
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('/');
    
    // App should still be accessible
    await expect(page.locator('.App')).toBeVisible();
    
    // Should handle JSON parsing errors
    const hasJsonError = consoleErrors.some(error => 
      error.toLowerCase().includes('json') || error.toLowerCase().includes('parse')
    );
    expect(hasJsonError).toBe(true);
  });

  test('should respect CORS policies', async ({ page }) => {
    // Monitor for CORS errors
    const corsErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().toLowerCase().includes('cors')) {
        corsErrors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should not have CORS errors for same-origin requests
    expect(corsErrors).toHaveLength(0);
  });

  test('should handle API authentication if required', async ({ page }) => {
    // Check if any API calls require authentication
    const authRequests: string[] = [];
    
    page.on('response', response => {
      if (response.status() === 401 || response.status() === 403) {
        authRequests.push(response.url());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // For now, no auth should be required for swagger.json
    expect(authRequests).toHaveLength(0);
  });

  test('should validate API response schemas', async ({ page, request }) => {
    const response = await request.get('/swagger.json');
    const swaggerData = await response.json();
    
    // Validate swagger/OpenAPI structure
    if (swaggerData.swagger) {
      expect(swaggerData.swagger).toMatch(/^2\./);
      expect(swaggerData.info).toBeDefined();
      expect(swaggerData.paths).toBeDefined();
    } else if (swaggerData.openapi) {
      expect(swaggerData.openapi).toMatch(/^3\./);
      expect(swaggerData.info).toBeDefined();
      expect(swaggerData.paths).toBeDefined();
    }
  });

  test('should handle concurrent API requests', async ({ page }) => {
    // Make multiple concurrent requests to the same endpoint
    const promises = Array.from({ length: 5 }, () => 
      page.request.get('/swagger.json')
    );
    
    const responses = await Promise.all(promises);
    
    // All requests should succeed
    responses.forEach(response => {
      expect(response.status()).toBe(200);
    });
  });
});

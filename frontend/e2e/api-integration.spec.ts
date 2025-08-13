import { test, expect } from '@playwright/test';

test.describe('API Integration Tests', () => {
  test('should load Next.js API routes successfully', async ({ page, request }) => {
    // Test if the app loads (which indicates API integration works)
    await page.goto('/');
    await expect(page.locator('text=Nearacles')).toBeVisible();
    
    // Check if any API calls in the background are successful
    const responses: any[] = [];
    page.on('response', response => {
      if (response.url().includes('/_next/') && response.status() >= 400) {
        responses.push({
          url: response.url(),
          status: response.status()
        });
      }
    });
    
    await page.waitForLoadState('networkidle');
    
    // If there are API calls, they should be successful
    responses.forEach(response => {
      expect(response.status).toBeLessThan(500);
    });
  });

  test('should handle API network failures gracefully', async ({ page }) => {
    // Intercept and fail potential API requests
    await page.route('**/api/**', route => {
      route.abort('failed');
    });
    
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('/');
    
    // App should still load even if API calls fail
    await expect(page.locator('text=Nearacles')).toBeVisible();
    
    // Should handle the error gracefully (no unhandled promise rejections)
    const criticalErrors = consoleErrors.filter(error => 
      error.includes('Uncaught') || error.includes('Unhandled')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('should handle slow API responses', async ({ page }) => {
    // Intercept and delay API requests
    await page.route('**/api/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      route.continue();
    });
    
    const startTime = Date.now();
    await page.goto('/');
    
    // Should show loading state or handle delay gracefully
    await page.waitForLoadState('networkidle');
    const endTime = Date.now();
    
    // Should eventually load despite delay
    await expect(page.locator('text=Nearacles')).toBeVisible();
  });

  test('should handle malformed API responses', async ({ page }) => {
    // Intercept and return malformed JSON
    await page.route('**/dashboard.json', route => {
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
    await expect(page.locator('.min-h-screen').first()).toBeVisible();
    
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
    
    // For now, no auth should be required for dashboard.json
    expect(authRequests).toHaveLength(0);
  });

  test('should validate API response schemas', async ({ page, request }) => {
    const response = await request.get('/dashboard.json');
    const dashboardData = await response.json();
    
    // Validate dashboard/OpenAPI structure
    if (dashboardData.dashboard) {
      expect(dashboardData.dashboard).toMatch(/^2\./);
      expect(dashboardData.info).toBeDefined();
      expect(dashboardData.paths).toBeDefined();
    } else if (dashboardData.openapi) {
      expect(dashboardData.openapi).toMatch(/^3\./);
      expect(dashboardData.info).toBeDefined();
      expect(dashboardData.paths).toBeDefined();
    }
  });

  test('should handle concurrent API requests', async ({ page }) => {
    // Make multiple concurrent requests to the same endpoint
    const promises = Array.from({ length: 5 }, () => 
      page.request.get('/dashboard.json')
    );
    
    const responses = await Promise.all(promises);
    
    // All requests should succeed
    responses.forEach(response => {
      expect(response.status()).toBe(200);
    });
  });
});

import { test, expect } from '@playwright/test';

test.describe('SwaggerUI Component Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should render SwaggerUI component', async ({ page }) => {
    // Wait for SwaggerUI to load
    await page.waitForSelector('.swagger-ui', { timeout: 10000 });
    
    const swaggerContainer = page.locator('.swagger-ui');
    await expect(swaggerContainer).toBeVisible();
  });

  test('should load swagger documentation', async ({ page }) => {
    // Wait for the swagger content to load
    await page.waitForSelector('.swagger-ui .info', { timeout: 15000 });
    
    // Check if the info section is present
    const infoSection = page.locator('.swagger-ui .info');
    await expect(infoSection).toBeVisible();
  });

  test('should display API endpoints', async ({ page }) => {
    // Wait for operations to load
    await page.waitForSelector('.swagger-ui .opblock', { timeout: 15000 });
    
    // Check if API operations are displayed
    const operations = page.locator('.swagger-ui .opblock');
    await expect(operations.first()).toBeVisible();
  });

  test('should allow expanding/collapsing operations', async ({ page }) => {
    // Wait for operations to load
    await page.waitForSelector('.swagger-ui .opblock', { timeout: 15000 });
    
    const firstOperation = page.locator('.swagger-ui .opblock').first();
    await expect(firstOperation).toBeVisible();
    
    // Click to expand the operation
    const operationHeader = firstOperation.locator('.opblock-summary');
    await operationHeader.click();
    
    // Check if operation details are visible
    const operationDetails = firstOperation.locator('.opblock-body');
    await expect(operationDetails).toBeVisible();
  });

  test('should have proper swagger styling', async ({ page }) => {
    // Wait for SwaggerUI to load
    await page.waitForSelector('.swagger-ui', { timeout: 10000 });
    
    // Check if swagger-ui.css is applied
    const swaggerContainer = page.locator('.swagger-ui');
    const backgroundColor = await swaggerContainer.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    
    // SwaggerUI should have a distinct background color
    expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('should load swagger.json successfully', async ({ page }) => {
    // Intercept the swagger.json request
    const swaggerJsonPromise = page.waitForResponse('**/swagger.json');
    
    await page.goto('/');
    
    const swaggerJsonResponse = await swaggerJsonPromise;
    expect(swaggerJsonResponse.status()).toBe(200);
    
    const swaggerData = await swaggerJsonResponse.json();
    expect(swaggerData).toBeDefined();
    expect(swaggerData.swagger || swaggerData.openapi).toBeDefined();
  });

  test('should handle swagger loading errors gracefully', async ({ page }) => {
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    page.on('response', response => {
      if (!response.ok()) {
        networkErrors.push(`${response.status()}: ${response.url()}`);
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filter out expected swagger-related warnings
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('swagger') && 
      !error.includes('404') &&
      !error.toLowerCase().includes('warning')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    // Test on mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForSelector('.swagger-ui', { timeout: 10000 });
    
    const swaggerContainer = page.locator('.swagger-ui');
    await expect(swaggerContainer).toBeVisible();
    
    // Test on tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(swaggerContainer).toBeVisible();
    
    // Test on desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(swaggerContainer).toBeVisible();
  });
});

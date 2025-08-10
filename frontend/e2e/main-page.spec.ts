import { test, expect } from '@playwright/test';

test.describe('Main Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the main page successfully', async ({ page }) => {
    // Check if the page loads without errors
    await expect(page).toHaveTitle(/Nearacles/);
    
    // Check if the root element is present
    const rootElement = page.locator('#root');
    await expect(rootElement).toBeVisible();
  });

  test('should render the App component', async ({ page }) => {
    // Check if the App component is rendered
    const appElement = page.locator('.App');
    await expect(appElement).toBeVisible();
  });

  test('should have proper meta tags', async ({ page }) => {
    // Check charset
    const charset = page.locator('meta[charset="UTF-8"]');
    await expect(charset).toHaveCount(1);
    
    // Check viewport
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', 'width=device-width, initial-scale=1.0');
  });

  test('should load CSS styles', async ({ page }) => {
    // Check if main.css is loaded
    const response = await page.goto('/styles/main.css');
    expect(response?.status()).toBe(200);
    
    // Go back to main page
    await page.goto('/');
    
    // Check if styles are applied
    const bodyElement = page.locator('body');
    const fontFamily = await bodyElement.evaluate(el => 
      window.getComputedStyle(el).fontFamily
    );
    expect(fontFamily).toContain('sans-serif');
  });

  test('should not have console errors on load', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    expect(consoleErrors).toHaveLength(0);
  });

  test('should be responsive', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('#root')).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('#root')).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('#root')).toBeVisible();
  });
});

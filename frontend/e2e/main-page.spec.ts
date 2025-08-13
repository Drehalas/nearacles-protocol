import { test, expect } from '@playwright/test';

test.describe('Main Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the main page successfully', async ({ page }) => {
    // Check if the page loads without errors
    await expect(page).toHaveTitle(/Nearacles/);
    
    // Check if the main content is present
    const mainContent = page.locator('div.min-h-screen');
    await expect(mainContent).toBeVisible();
  });

  test('should render the main components', async ({ page }) => {
    // Check if main components are rendered
    await expect(page.locator('text=Nearacles')).toBeVisible();
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('should have proper meta tags', async ({ page }) => {
    // Check charset
    const charset = page.locator('meta[charset="UTF-8"]');
    await expect(charset).toHaveCount(1);
    
    // Check viewport
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', 'width=device-width, initial-scale=1');
  });

  test('should load CSS styles', async ({ page }) => {
    await page.goto('/');
    
    // Check if Tailwind CSS classes are working (Next.js uses built-in CSS)
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
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
    await expect(page.locator('div.min-h-screen').first()).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('div.min-h-screen').first()).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('div.min-h-screen').first()).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

test.describe('Basic Application Tests', () => {
  test('should load the application successfully', async ({ page }) => {
    await page.goto('/');
    
    // Core elements should be present
    await expect(page.locator('div.min-h-screen').first()).toBeVisible();
    await expect(page.locator('text=Nearacles').first()).toBeVisible();
    
    // Page should have a valid title
    const title = await page.title();
    expect(title).toContain('Nearacles');
  });

  test('should have functional navigation', async ({ page }) => {
    await page.goto('/');
    
    // Navigation should be visible
    await expect(page.locator('nav a:has-text("Dashboard")')).toBeVisible();
    await expect(page.locator('nav a:has-text("Oracle Network")')).toBeVisible();
    await expect(page.locator('nav a:has-text("Analytics")')).toBeVisible();
    await expect(page.locator('nav a:has-text("Explorer")')).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    await expect(page.locator('div.min-h-screen').first()).toBeVisible();
    await expect(page.locator('text=Nearacles').first()).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('div.min-h-screen').first()).toBeVisible();
  });

  test('should handle page interactions', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Page should remain functional
    await expect(page.locator('div.min-h-screen').first()).toBeVisible();
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
    
    // Filter out expected errors (like missing external resources)
    const realErrors = criticalErrors.filter(error => 
      !error.includes('readdy.ai') && 
      !error.includes('Failed to fetch') &&
      !error.includes('ERR_INTERNET_DISCONNECTED')
    );
    
    expect(realErrors).toHaveLength(0);
  });
});
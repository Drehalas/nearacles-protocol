import { test, expect } from '@playwright/test';

test.describe('Dashboard Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should render main navigation', async ({ page }) => {
    // Check for main navigation elements
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Oracle Network')).toBeVisible();
    await expect(page.locator('text=Analytics')).toBeVisible();
    await expect(page.locator('text=Explorer')).toBeVisible();
  });

  test('should navigate to dashboard', async ({ page }) => {
    // Navigate to dashboard
    await page.click('text=Dashboard');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should navigate to oracles section', async ({ page }) => {
    // Navigate to oracles
    await page.click('text=Oracle Network');
    await expect(page).toHaveURL(/.*oracles/);
  });

  test('should navigate to analytics', async ({ page }) => {
    // Navigate to analytics
    await page.click('text=Analytics');
    await expect(page).toHaveURL(/.*analytics/);
  });

  test('should navigate to explorer', async ({ page }) => {
    // Navigate to explorer
    await page.click('text=Explorer');
    await expect(page).toHaveURL(/.*explorer/);
  });

  test('should have responsive navigation', async ({ page }) => {
    // Test on mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Navigation should be visible or accessible via menu
    const nearaclesTitle = page.locator('text=Nearacles');
    await expect(nearaclesTitle).toBeVisible();
    
    // Test on tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(nearaclesTitle).toBeVisible();
    
    // Test on desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(nearaclesTitle).toBeVisible();
  });
});

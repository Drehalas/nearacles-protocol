import { test, expect } from '@playwright/test';

test.describe('Dashboard Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should render main navigation', async ({ page }) => {
    // Check for header and branding
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('text=Nearacles')).toBeVisible();
    
    // Check for main navigation elements (actual links from Header.tsx)
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Oracles')).toBeVisible();
    await expect(page.locator('text=Analytics')).toBeVisible();
    await expect(page.locator('text=Explorer')).toBeVisible();
    await expect(page.locator('text=Connect Wallet')).toBeVisible();
  });

  test('should navigate to dashboard v1', async ({ page }) => {
    // Navigate to dashboard
    await page.click('text=Dashboard');
    await expect(page).toHaveURL(/.*v1\/dashboard/);
    await expect(page.locator('text=Oracle Network Dashboard')).toBeVisible();
  });

  test('should navigate to oracles v1', async ({ page }) => {
    // Navigate to oracles
    await page.click('text=Oracles');
    await expect(page).toHaveURL(/.*v1\/oracles/);
  });

  test('should navigate to analytics v1', async ({ page }) => {
    // Navigate to analytics
    await page.click('text=Analytics');
    await expect(page).toHaveURL(/.*v1\/analytics/);
  });

  test('should navigate to explorer v1', async ({ page }) => {
    // Navigate to explorer
    await page.click('text=Explorer');
    await expect(page).toHaveURL(/.*v1\/explorer/);
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

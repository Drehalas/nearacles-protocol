import { test, expect } from '@playwright/test';

test.describe('User Workflow Tests', () => {
  test('should complete full user journey through the application', async ({ page }) => {
    // Step 1: Initial landing
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify landing page loads
    await expect(page.locator('div.min-h-screen')).toBeVisible();
    await expect(page.locator('text=Nearacles')).toBeVisible();
    
    // Step 2: Wait for main navigation to load
    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Oracle Network')).toBeVisible();
    
    // Step 3: Explore navigation options
    const navLinks = await page.locator('a[href*="/dashboard"], a[href*="/oracles"], a[href*="/analytics"], a[href*="/explorer"]').all();
    
    if (operations.length > 0) {
      // Expand first API operation
      await operations[0].locator('.opblock-summary').click();
      await page.waitForTimeout(1000);
      
      // Verify operation details are shown
      const operationBody = operations[0].locator('.opblock-body');
      await expect(operationBody).toBeVisible();
      
      // Step 4: Try the API if "Try it out" button exists
      const tryItButton = operationBody.locator('button:has-text("Try it out")');
      if (await tryItButton.count() > 0) {
        await tryItButton.click();
        await page.waitForTimeout(500);
        
        // Execute the request if execute button exists
        const executeButton = operationBody.locator('button:has-text("Execute")');
        if (await executeButton.count() > 0) {
          await executeButton.click();
          await page.waitForTimeout(2000);
          
          // Verify response section appears
          const responseSection = operationBody.locator('.responses-wrapper');
          await expect(responseSection).toBeVisible();
        }
      }
    }
    
    // Step 5: Navigate through different sections
    const infoSection = page.locator('.swagger-ui .info');
    if (await infoSection.count() > 0) {
      await infoSection.scrollIntoViewIfNeeded();
      await expect(infoSection).toBeVisible();
    }
  });

  test('should handle typical API exploration workflow', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.swagger-ui', { timeout: 15000 });
    
    // User workflow: Explore API endpoints systematically
    const endpointSections = await page.locator('.swagger-ui .opblock').all();
    
    for (let i = 0; i < Math.min(3, endpointSections.length); i++) {
      const section = endpointSections[i];
      
      // Open endpoint
      await section.locator('.opblock-summary').click();
      await page.waitForTimeout(500);
      
      // Check parameters if any
      const parametersSection = section.locator('.parameters-container');
      if (await parametersSection.count() > 0) {
        await expect(parametersSection).toBeVisible();
      }
      
      // Check responses section
      const responsesSection = section.locator('.responses-wrapper');
      if (await responsesSection.count() > 0) {
        await expect(responsesSection).toBeVisible();
      }
      
      // Close endpoint
      await section.locator('.opblock-summary').click();
      await page.waitForTimeout(300);
    }
  });

  test('should support keyboard navigation workflow', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Start keyboard navigation
    await page.keyboard.press('Tab');
    
    // Navigate through focusable elements
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);
      
      // Verify focus is visible
      const focusedElement = page.locator(':focus');
      if (await focusedElement.count() > 0) {
        const isVisible = await focusedElement.isVisible();
        expect(isVisible).toBe(true);
      }
    }
    
    // Test Enter key interaction
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    // Test Escape key
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    // App should remain functional
    await expect(page.locator('.min-h-screen')).toBeVisible();
  });

  test('should handle search and filter workflow', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.swagger-ui', { timeout: 15000 });
    
    // Look for search/filter functionality
    const searchInput = page.locator('input[placeholder*="filter"], input[placeholder*="search"]');
    
    if (await searchInput.count() > 0) {
      // Test search functionality
      await searchInput.first().fill('GET');
      await page.waitForTimeout(1000);
      
      // Verify filtering works
      const visibleOperations = await page.locator('.swagger-ui .opblock:visible').count();
      expect(visibleOperations).toBeGreaterThan(0);
      
      // Clear search
      await searchInput.first().clear();
      await page.waitForTimeout(1000);
    }
  });

  test('should support mobile user workflow', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Mobile-specific workflow
    await page.waitForSelector('.swagger-ui', { timeout: 15000 });
    
    // Test touch interactions
    const operations = await page.locator('.swagger-ui .opblock-summary').all();
    
    if (operations.length > 0) {
      // Tap to expand
      await operations[0].tap();
      await page.waitForTimeout(1000);
      
      // Verify expansion works on mobile
      const operationBody = page.locator('.swagger-ui .opblock-body').first();
      await expect(operationBody).toBeVisible();
      
      // Scroll within mobile view
      await page.evaluate(() => {
        window.scrollTo(0, 200);
      });
      
      await page.waitForTimeout(500);
      
      // App should remain functional on mobile
      await expect(page.locator('.min-h-screen')).toBeVisible();
    }
  });

  test('should handle copy-paste workflow', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.swagger-ui', { timeout: 15000 });
    
    // Look for copyable content (URLs, code examples, etc.)
    const codeBlocks = await page.locator('code, pre').all();
    
    if (codeBlocks.length > 0) {
      const firstCodeBlock = codeBlocks[0];
      
      // Select all text in code block
      await firstCodeBlock.click();
      await page.keyboard.press('Control+A');
      
      // Copy text
      await page.keyboard.press('Control+C');
      
      // Verify copy operation doesn't break the app
      await expect(page.locator('.min-h-screen')).toBeVisible();
    }
  });

  test('should support browser history navigation workflow', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to different states/fragments
    await page.goto('/#operations');
    await page.waitForTimeout(500);
    
    await page.goto('/?tag=default');
    await page.waitForTimeout(500);
    
    // Use browser back button
    await page.goBack();
    await page.waitForTimeout(500);
    await expect(page.locator('.min-h-screen')).toBeVisible();
    
    // Use browser forward button
    await page.goForward();
    await page.waitForTimeout(500);
    await expect(page.locator('.min-h-screen')).toBeVisible();
    
    // Direct navigation
    await page.goto('/');
    await expect(page.locator('.min-h-screen')).toBeVisible();
  });

  test('should handle refresh and reload workflow', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.swagger-ui', { timeout: 15000 });
    
    // Interact with the app
    const operations = await page.locator('.swagger-ui .opblock-summary').all();
    if (operations.length > 0) {
      await operations[0].click();
      await page.waitForTimeout(1000);
    }
    
    // Hard refresh
    await page.reload({ waitUntil: 'networkidle' });
    
    // Verify app loads correctly after refresh
    await expect(page.locator('.min-h-screen')).toBeVisible();
    await page.waitForSelector('.swagger-ui', { timeout: 15000 });
    
    // Soft refresh (F5)
    await page.keyboard.press('F5');
    await page.waitForLoadState('networkidle');
    
    // Verify app still works
    await expect(page.locator('.min-h-screen')).toBeVisible();
  });

  test('should handle multi-tab workflow simulation', async ({ browser }) => {
    const context = await browser.newContext();
    
    // Open multiple tabs
    const page1 = await context.newPage();
    const page2 = await context.newPage();
    
    // Load app in both tabs
    await Promise.all([
      page1.goto('/'),
      page2.goto('/')
    ]);
    
    await Promise.all([
      page1.waitForLoadState('networkidle'),
      page2.waitForLoadState('networkidle')
    ]);
    
    // Verify both tabs work independently
    await expect(page1.locator('.min-h-screen')).toBeVisible();
    await expect(page2.locator('.min-h-screen')).toBeVisible();
    
    // Interact with one tab
    await page1.waitForSelector('.swagger-ui', { timeout: 15000 });
    const operations1 = await page1.locator('.swagger-ui .opblock-summary').all();
    if (operations1.length > 0) {
      await operations1[0].click();
    }
    
    // Other tab should remain unaffected
    await expect(page2.locator('.min-h-screen')).toBeVisible();
    
    await context.close();
  });

  test('should handle accessibility workflow', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Screen reader simulation workflow
    await page.keyboard.press('Tab');
    
    // Navigate using screen reader keys
    const screenReaderKeys = ['ArrowDown', 'ArrowUp', 'Home', 'End'];
    
    for (const key of screenReaderKeys) {
      await page.keyboard.press(key);
      await page.waitForTimeout(300);
      
      // App should remain stable during screen reader navigation
      await expect(page.locator('.min-h-screen')).toBeVisible();
    }
    
    // Test skip links if present
    const skipLinks = await page.locator('a[href^="#"]').all();
    if (skipLinks.length > 0) {
      await skipLinks[0].click();
      await page.waitForTimeout(500);
    }
  });
});

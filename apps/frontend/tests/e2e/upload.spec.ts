import { test, expect } from '@playwright/test';

test.describe('Document Management', () => {
  test('should upload a PDF and track processing status', async ({ page }) => {
    // 1. Login (Mocked or using Test Account)
    await page.goto('/login');
    // Note: In a real test, we would handle the OAuth flow or use a test session
    // For now, we assume the user is logged in or we mock the session
    
    await page.goto('/documents');
    
    // 2. Upload File
    // Assuming there's an input[type="file"] or a button that opens it
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('button:has-text("Upload")');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles('./tests/fixtures/sample.pdf');

    // 3. Verify Upload Success
    await expect(page.locator('text=Upload successful')).toBeVisible();

    // 4. Verify Document appears in list with 'uploaded' status
    await expect(page.locator('.document-card')).toContainText('sample.pdf');
    await expect(page.locator('.status-badge')).toContainText('uploaded');

    // 5. Wait for processing (polling or websocket check)
    // We expect it to eventually reach 'indexed'
    await expect(page.locator('.status-badge')).toContainText('indexed', { timeout: 30000 });
  });

  test('should submit a YouTube URL and extract transcript', async ({ page }) => {
    await page.goto('/documents');
    
    // 1. Open YouTube upload modal
    await page.click('button:has-text("Add YouTube")');
    
    // 2. Fill URL
    await page.fill('input[placeholder*="youtube.com"]', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await page.click('button:has-text("Submit")');

    // 3. Verify success message
    await expect(page.locator('text=YouTube link added')).toBeVisible();

    // 4. Verify processing
    await expect(page.locator('.status-badge')).toContainText('indexed', { timeout: 60000 });
  });

  test('should filter documents by type and tags', async ({ page }) => {
    await page.goto('/documents');

    // 1. Open Filter Popover
    await page.click('button:has-text("Filters")');

    // 2. Select a type filter (e.g. youtube)
    await page.click('button:has-text("youtube")');

    // 3. Verify that the Vault view updates (look for 'Filtered View' heading)
    await expect(page.locator('h2:has-text("Filtered View")')).toBeVisible();

    // 4. Clear filters
    await page.click('button:has-text("Clear All Filters")');

    // 5. Verify that 'All Documents' heading returns
    await expect(page.locator('h2:has-text("All Documents")')).toBeVisible();
  });
});


import { test, expect } from '@playwright/test';

test.describe('PromptBox Main Layout and UI Elements', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the main page (localhost:5173) before each test
    await page.goto('http://localhost:5173/');
  });

  test('should render sidebar successfully and show filter categories', async ({ page }) => {
    // Verify that "Tüm Promptlar" and "Keşfet (Topluluk)" sections exist in the sidebar
    await expect(page.getByText('Tüm Promptlar')).toBeVisible();
    await expect(page.getByText('Keşfet (Topluluk)')).toBeVisible();

    // Verify that the login button is visible for unauthenticated users in the sidebar
    const loginPrompt = page.getByRole('button', { name: /Giriş/i }).first();
    await expect(loginPrompt).toBeVisible();
  });

  test('search bar should be visible and usable', async ({ page }) => {
    // Find the search input field by its placeholder
    const searchInput = page.getByPlaceholder('İlgili Klasörde Başlık veya içerik ara...');

    // Check if the search input is visible on the screen
    await expect(searchInput).toBeVisible();

    // Verify that we can type into the input field
    await searchInput.fill('React');
    await expect(searchInput).toHaveValue('React');
  });

});

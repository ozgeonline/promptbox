import { test, expect } from '@playwright/test';

test('Uygulama açılıyor mu ve giriş butonu var mı?', async ({ page }) => {
  // 1. Geliştirme sunucunuza (localhost) gidin
  await page.goto('http://localhost:5173/');

  // 2. Sayfa başlığında (title) PromptBox geçiyor mu kontrol et
  await expect(page).toHaveTitle(/PromptBox/i);

  // const loginButton = page.locator('button', { hasText: 'Giriş Yap' });

  // 3. Ekranda "Giriş Yap" butonunu bul
  const loginButton = page.getByRole('button', { name: 'Giriş Yap', exact: true });
  await expect(loginButton).toBeVisible();

  // 4. Butona tıklatın
  await loginButton.click();
});

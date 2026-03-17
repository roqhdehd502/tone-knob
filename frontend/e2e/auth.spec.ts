import { test, expect } from '@playwright/test';

test.describe('인증 플로우', () => {
  test('로그인 페이지가 로드되어야 한다', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"], input[name="email"], input[placeholder*="이메일"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('회원가입 페이지가 로드되어야 한다', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('비로그인 시 프로필 접근하면 로그인으로 리다이렉트되어야 한다', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForURL(/login/);
    expect(page.url()).toContain('login');
  });
});

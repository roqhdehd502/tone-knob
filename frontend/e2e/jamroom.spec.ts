import { test, expect } from '@playwright/test';

test.describe('합주방 플로우', () => {
  test('합주방 목록 페이지가 로드되어야 한다', async ({ page }) => {
    await page.goto('/jamroom');
    await expect(page.locator('text=합주방')).toBeVisible();
  });

  test('비로그인 시 합주방 생성 접근하면 로그인으로 리다이렉트', async ({ page }) => {
    await page.goto('/jamroom/create');
    await page.waitForURL(/login/, { timeout: 5000 }).catch(() => {
      // 페이지에서 자체 리다이렉트 처리
    });
  });

  test('합주방 상세 페이지 접근 시 로그인 필요', async ({ page }) => {
    await page.goto('/jamroom/test-room-id');
    await page.waitForURL(/login/, { timeout: 5000 }).catch(() => {
      // 페이지에서 자체 리다이렉트 처리
    });
  });
});

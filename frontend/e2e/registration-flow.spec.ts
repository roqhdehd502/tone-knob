import { expect, test } from "@playwright/test";

// MSA 백엔드(Gateway → auth-svc → Supabase Postgres)까지 실제로 왕복하는 통합 테스트.
// playwright.config.ts의 webServer가 `npm run dev:services`로 전체 백엔드를 띄운 뒤 실행된다.
test.describe("회원가입 → 로그인 통합 플로우", () => {
  test("회원가입 후 자동 로그인되어 홈으로 이동해야 한다", async ({ page }) => {
    const unique = Date.now();
    const email = `e2e-${unique}@example.com`;
    const username = `e2e${unique}`;
    const password = "password1234";

    await page.goto("/register");
    await page.fill("#email", email);
    await page.fill("#username", username);
    await page.fill("#password", password);
    await page.fill("#confirmPassword", password);
    await page.click('button[type="submit"]');

    // 회원가입 성공 시 auth-svc가 토큰을 발급하고 홈으로 리다이렉트된다
    await page.waitForURL("http://localhost:5173/", { timeout: 15000 });

    // 로그아웃 후 동일 계정으로 재로그인까지 왕복 확인
    await page.goto("/login");
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL("http://localhost:5173/", { timeout: 15000 });

    await page.goto("/profile");
    await expect(page.locator(`text=${username}`).first()).toBeVisible({ timeout: 10000 });
  });
});

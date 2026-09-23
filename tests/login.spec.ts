import { test, expect } from '@playwright/test';
test('TC-1 - Verify user can login with valid credentials', async ({ page }) => {
    await page.goto('https://demo-fairpriceroofs.abhiwandemos.com/homeowner/signin');
    await page.locator('[id="email"]').fill('blackeye112001@gmail.com');
    await page.locator('[id="password"]').fill('Abhiwan@1234');
    await page.locator('[type="submit"]').click();
    await expect(page).not.toHaveURL('https://demo-fairpriceroofs.abhiwandemos.com/homeowner/signin');

})
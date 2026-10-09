import { createBdd } from 'playwright-bdd';

const { Given, When, Then } = createBdd();

Given('I am on the login page', async ({ page }) => {
  await page.goto('https://demo-fairpriceroofs.abhiwandemos.com/homeowner/signin');
});

When('I enter valid email and password', async ({ page }) => {
  await page.locator('[id="email"]').fill('blackeye112001@gmail.com');
  await page.locator('[id="password"]').fill('Abhiwan@1234');
});

When('I click the login button', async ({ page }) => {
  await page.locator('[type="submit"]').click();
});

Then('I should be logged in successfully', async ({ page }) => {
  const { expect } = await import('@playwright/test');
  await expect(page).not.toHaveURL('https://demo-fairpriceroofs.abhiwandemos.com/homeowner/signin');
});
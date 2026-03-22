import { expect, test } from '@playwright/test';

test('login entry point is visible in the storefront', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
});

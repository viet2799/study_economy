import { expect, test } from '@playwright/test';

test('happy path checkout flow', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: /Next.js base for catalog, cart, checkout and auth/i })
  ).toBeVisible();

  await page.getByRole('button', { name: 'Add to cart' }).first().click();

  await page.getByRole('button', { name: 'Cart', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Summary' })).toBeVisible();
  await expect(page.getByText(/items/i)).toBeVisible();

  await page.getByRole('button', { name: 'Checkout' }).click();
  await expect(page.getByRole('button', { name: 'Place order' })).toBeVisible();
});

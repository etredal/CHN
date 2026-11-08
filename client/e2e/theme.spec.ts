import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Theme changes fade over 200ms; measure the settled colours.
const noTransitions = (page: Page) =>
  page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' });

const bg = (page: Page, selector: string) =>
  page.locator(selector).first().evaluate(el => getComputedStyle(el).backgroundColor);

// Run with the computer in dark mode: the app's own setting must win.
test.use({ colorScheme: 'dark' });

test('theme button cycles light → sepia → dark, independent of the OS setting', async ({ page }) => {
  // Ensure the app is served at localhost:5174 (e.g. `npx vite preview --port 5174`)
  await page.goto('http://localhost:5174');
  await noTransitions(page);
  const button = page.locator('button[title^="Current Theme"]');
  const card = '.grid > div'; // a story card

  // Default is light, even though the OS prefers dark.
  await expect(button).toHaveAttribute('title', /light/);
  const light = { page: await bg(page, '#root > div'), card: await bg(page, card) };
  expect(light.card).toBe('rgb(255, 255, 255)');

  await button.click();
  await expect(button).toHaveAttribute('title', /sepia/);
  const sepia = { page: await bg(page, '#root > div'), card: await bg(page, card) };
  expect(sepia.page).not.toBe(light.page);
  expect(sepia.card).not.toBe(light.card);

  await button.click();
  await expect(button).toHaveAttribute('title', /dark/);
  const dark = { page: await bg(page, '#root > div'), card: await bg(page, card) };
  expect(dark.page).not.toBe(sepia.page);
  expect(dark.card).not.toBe(light.card);

  // The choice survives a reload.
  await page.reload();
  await noTransitions(page);
  await expect(page.locator('button[title^="Current Theme"]')).toHaveAttribute('title', /dark/);
  expect(await bg(page, '#root > div')).toBe(dark.page);

  // And back to light.
  await page.locator('button[title^="Current Theme"]').click();
  await expect(page.locator('button[title^="Current Theme"]')).toHaveAttribute('title', /light/);
  expect(await bg(page, card)).toBe('rgb(255, 255, 255)');
});

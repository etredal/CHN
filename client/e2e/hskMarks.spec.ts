import { test, expect } from '@playwright/test';
import { hsk5Hometown as story } from '../src/data/hsk5_hometown';
import levels from '../src/utils/hskLevels.json' with { type: 'json' };

const hsk6 = new Set((levels as Record<string, string>)['6'].split(' '));

test('HSK 5 and HSK 6 words are underlined, labelled, and can be hidden', async ({ page }) => {
  // Ensure the app is served at localhost:5174 (e.g. `npx vite preview --port 5174`)
  await page.goto('http://localhost:5174');
  await page.getByText(story.title.cn).first().click();

  const text = page.locator('.story-sentence');
  const legend = page.getByTestId('hsk-legend');
  await expect(legend).toBeVisible();
  await expect(text.locator('.word-token.hsk-5').first()).toBeVisible();
  await expect(text.locator('.word-token.hsk-6').first()).toBeVisible();

  // Only words on the list are marked, at their own level.
  for (const el of await text.locator('.word-token.hsk-6').all()) {
    expect(hsk6.has(await el.innerText())).toBe(true);
  }

  // The word popup shows the level.
  const word = text.locator('.word-token.hsk-6').first();
  const wordText = await word.innerText();
  await word.click();
  const drawer = page.getByRole('dialog', { name: wordText });
  await expect(drawer.getByText('HSK 6', { exact: true })).toBeVisible();
  await page.mouse.click(5, 5); // backdrop closes the drawer

  // Reading settings turn the marks (and the legend) off.
  await page.locator('button[title="Reading Settings"]').click();
  await page.getByText('标出 HSK 5–6 词').locator('..').getByRole('button').click();
  await expect(text.locator('.hsk-5, .hsk-6')).toHaveCount(0);
  await expect(legend).toBeHidden();

  // The choice is remembered.
  await page.reload();
  await page.getByText(story.title.cn).first().click();
  await expect(page.locator('.story-sentence .word-token').first()).toBeVisible();
  await expect(page.locator('.story-sentence .hsk-5, .story-sentence .hsk-6')).toHaveCount(0);
});

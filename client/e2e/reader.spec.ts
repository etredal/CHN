import { test, expect } from '@playwright/test';

test.use({ launchOptions: { args: ['--autoplay-policy=no-user-gesture-required'] } });

test('story reads as continuous text with a reading highlight and no tone colours', async ({ page }) => {
  // Ensure the app is served at localhost:5174 (e.g. `npx vite preview --port 5174`)
  await page.goto('http://localhost:5174');
  await page.getByText('进入阅读').first().click();

  // Sentences flow inline inside paragraphs; no per-sentence controls.
  const firstSentence = page.locator('.story-sentence').first();
  await expect(firstSentence).toHaveCSS('display', 'inline');
  await expect(page.locator('button[title="Play from this sentence"]')).toHaveCount(0);

  // One ink colour for all story words (no tone colours), and no setting for it.
  const colours = await page.locator('.story-sentence .word-token').evaluateAll(els =>
    [...new Set(els.map(el => getComputedStyle(el).color))]);
  expect(colours).toHaveLength(1);
  await page.locator('button[title="Reading Settings"]').click();
  await expect(page.getByText('声调颜色')).toHaveCount(0);
  await page.locator('button[title="Reading Settings"]').click();

  // Nothing is highlighted before listening starts...
  await expect(page.locator('.story-sentence.is-active')).toHaveCount(0);

  // ...then the sentence being read and the word being spoken are.
  await page.locator('button[title="Play"]').click();
  await expect(page.locator('.story-sentence.is-active')).toHaveCount(1);
  await expect(page.locator('.word-token.is-spoken')).toHaveCount(1);
  await page.locator('button[title="Pause"]').click();
});

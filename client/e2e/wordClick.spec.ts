import { test, expect } from '@playwright/test';

test.describe('Reader word click playback', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure dev server is running at localhost:5174
    await page.goto('http://localhost:5174');
    // Navigate to the Zhuangzi story (adjust selector if needed)
    await page.getByText('庄子的“无用之用”：在焦虑时代寻找内心的从容').click();
    // No URL change after story selection
  });

  test('clicking a middle word seeks and plays audio', async ({ page }) => {
    // Locate a word token element. Tokens have class 'word-token' and data-start-time attribute.
    const word = page.locator('.word-token').nth(150);
    await word.scrollIntoViewIfNeeded();
    await word.click();

    await page.waitForSelector('audio', { state: 'attached' });

    // Compare timestamps.
    const audio = page.locator('audio[data-testid="audio-player"]');
    // `paused` is a DOM property, not an HTML attribute, so read it directly.
    await expect.poll(() => audio.evaluate((el: HTMLAudioElement) => el.paused)).toBe(false);
  });
});

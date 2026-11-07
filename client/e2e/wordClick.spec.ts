import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { hsk6ZhuangziOak } from '../src/data/hsk6_zhuangzi_oak';

// Punctuation tokens aren't rendered as .word-token, so map DOM index -> token.
const PUNCT = /^[，。！？；：“”‘’（）《》、—….,!?;:'"()[\]]+$/;
const spokenTokens = hsk6ZhuangziOak.sections
  .flatMap(sec => sec.paragraphs)
  .flatMap(p => p.sentences)
  .flatMap(s => s.tokens)
  .filter(t => !PUNCT.test(t.text));

const WORD_INDEX = 150;

declare global {
  interface Window {
    __plays: { src: string; at: number; rate: number; story: boolean }[];
    __pauses: { at: number; story: boolean }[];
  }
}

// Record every media play()/pause() so we can see what was heard and where.
async function instrumentAudio(page: Page) {
  await page.addInitScript(() => {
    window.__plays = [];
    window.__pauses = [];
    const isStory = (el: HTMLMediaElement) => el.dataset.testid === 'audio-player';
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
      window.__plays.push({ src: this.src, at: this.currentTime, rate: this.playbackRate, story: isStory(this) });
      return play.call(this);
    };
    const pause = HTMLMediaElement.prototype.pause;
    HTMLMediaElement.prototype.pause = function (this: HTMLMediaElement) {
      window.__pauses.push({ at: this.currentTime, story: isStory(this) });
      return pause.call(this);
    };
  });
}

const storyAudio = (page: Page) => page.locator('audio[data-testid="audio-player"]');

test.describe('Reader word lookup', () => {
  test.beforeEach(async ({ page }) => {
    await instrumentAudio(page);
    // Ensure the app is served at localhost:5174 (e.g. `npx vite preview --port 5174`)
    await page.goto('http://localhost:5174');
    await page.getByText(hsk6ZhuangziOak.title.cn).click();
  });

  test('clicking a word while the story plays pauses it and shows the definition', async ({ page }) => {
    await page.locator('button[title="Play"]').click();
    await expect.poll(() => storyAudio(page).evaluate((el: HTMLAudioElement) => el.currentTime)).toBeGreaterThan(1);

    const word = page.locator('.word-token').nth(WORD_INDEX);
    await word.scrollIntoViewIfNeeded();
    const before = await storyAudio(page).evaluate((el: HTMLAudioElement) => el.currentTime);
    await word.click();

    await expect.poll(() => storyAudio(page).evaluate((el: HTMLAudioElement) => el.paused)).toBe(true);
    // Position is kept, not moved to the clicked word.
    const after = await storyAudio(page).evaluate((el: HTMLAudioElement) => el.currentTime);
    expect(Math.abs(after - before)).toBeLessThan(1);
    await expect(page.getByText('标准发音')).toBeVisible();
  });

  for (const [label, rate] of [['标准发音', 1], ['慢速 (0.6x)', 0.6]] as const) {
    test(`"${label}" plays just that word from the story recording`, async ({ page }) => {
      const token = spokenTokens[WORD_INDEX];
      const word = page.locator('.word-token').nth(WORD_INDEX);
      await word.scrollIntoViewIfNeeded();
      await expect(word).toHaveText(token.text);
      await word.click();

      await page.getByRole('button', { name: label }).click();

      // A separate element plays the clip, starting at the word's onset.
      await expect.poll(() => page.evaluate(() => window.__plays.filter(p => !p.story).length)).toBe(1);
      const clip = await page.evaluate(() => window.__plays.find(p => !p.story)!);
      expect(clip.src).toContain('audio/hsk6_zhuangzi_oak.mp3');
      expect(clip.at).toBeCloseTo(token.startTime!, 2);
      expect(clip.rate).toBe(rate);

      // ...and stops at the end of the word.
      await expect.poll(() => page.evaluate(() => window.__pauses.filter(p => !p.story).length)).toBeGreaterThan(0);
      const stoppedAt = await page.evaluate(() => window.__pauses.filter(p => !p.story)[0].at);
      expect(stoppedAt).toBeGreaterThanOrEqual(token.endTime! - 0.05);
      expect(stoppedAt).toBeLessThan(token.endTime! + 0.15);

      // The story itself never started.
      expect(await page.evaluate(() => window.__plays.filter(p => p.story).length)).toBe(0);
    });
  }

  test('a word saved from a story keeps its clip for the vocab list', async ({ page }) => {
    const token = spokenTokens[WORD_INDEX];
    const word = page.locator('.word-token').nth(WORD_INDEX);
    await word.scrollIntoViewIfNeeded();
    await word.click();
    await page.locator('button[title="Save to Flashcards"]').first().click();
    await page.mouse.click(5, 5); // backdrop closes the drawer
    await page.getByText('返回文库').click();
    await page.getByRole('button', { name: /生词本/ }).first().click();

    await page.locator('button[title="Speak Word"]').first().click();
    await expect.poll(() => page.evaluate(() => window.__plays.filter(p => !p.story).length)).toBe(1);
    const clip = await page.evaluate(() => window.__plays.find(p => !p.story)!);
    expect(clip.at).toBeCloseTo(token.startTime!, 2);
  });
});

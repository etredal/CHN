import { test, expect } from '@playwright/test';

test.describe('Global pinyin toggle', () => {
  test('one switch shows and hides pinyin over Chinese text everywhere', async ({ page }) => {
    // Ensure the app is served at localhost:5174 (e.g. `npx vite preview --port 5174`)
    await page.goto('http://localhost:5174');
    await expect(page.locator('rt')).toHaveCount(0);

    // Header toggle: library titles and summaries get pinyin.
    await page.locator('button[title="Show pinyin"]').click();
    await expect(page.locator('h2 ruby').first()).toBeVisible();

    // The reader shares the setting: story text, title, section headings.
    await page.getByText('进入阅读').first().click();
    await expect(page.locator('button[title="Hide pinyin"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.word-token rt').first()).toBeVisible();
    await expect(page.locator('h1 ruby').first()).toBeVisible();

    // Pinyin sits below its character.
    const ruby = page.locator('.word-token ruby').first();
    const base = await ruby.evaluate(el => {
      const r = document.createRange();
      r.selectNodeContents(el.firstChild!);
      return r.getBoundingClientRect();
    });
    const rt = await ruby.locator('rt').boundingBox();
    expect(rt!.y).toBeGreaterThan(base.y + base.height / 2);

    // In-context readings: 登上了 is "le", not the isolated "liǎo".
    // (Text content includes the pinyin, so find the word by its title.)
    const le = page.locator('.word-token[title^="了 ("]').first();
    await expect(le.locator('rt')).toHaveText('le');
    // Non-Chinese text gets no pinyin.
    await expect(page.locator('.word-token', { hasText: 'Z282' }).locator('rt')).toHaveCount(0);

    // Quiz and grammar follow it too.
    await page.locator('button').filter({ hasText: /^随堂测验/ }).click();
    await expect(page.locator('h4 ruby').first()).toBeVisible();

    // Turning it off in the reading settings menu turns it off everywhere.
    await page.locator('button').filter({ hasText: /^正文/ }).click();
    await page.locator('button[title="Reading Settings"]').click();
    await page.getByRole('button', { name: '隐藏', exact: true }).click();
    await expect(page.locator('rt')).toHaveCount(0);
    await expect(page.locator('button[title="Show pinyin"]')).toHaveAttribute('aria-pressed', 'false');

    // And the choice is remembered.
    await page.locator('button[title="Show pinyin"]').click();
    await page.reload();
    await page.getByText('进入阅读').first().click();
    await expect(page.locator('.word-token rt').first()).toBeVisible();
  });

  test('flashcard fronts never show pinyin (it is the answer)', async ({ page }) => {
    await page.goto('http://localhost:5174');
    await page.locator('button[title="Show pinyin"]').click();
    await page.getByText('进入阅读').first().click();
    await page.locator('.word-token').nth(12).click();
    await page.locator('button[title="Save to Flashcards"]').click();
    await page.mouse.click(5, 5);
    await page.getByText('返回文库').click();
    await page.getByRole('button', { name: /生词本/ }).first().click();
    await page.getByRole('button', { name: /复习|Review/ }).first().click();
    await expect(page.locator('h2').first()).toBeVisible();
    await expect(page.locator('h2 rt')).toHaveCount(0);
  });

  test('a saved "above" setting from before is migrated and still shows pinyin', async ({ page }) => {
    await page.goto('http://localhost:5174');
    await page.evaluate(() =>
      localStorage.setItem('duchinese_reader_settings', JSON.stringify({ pinyinMode: 'above' })));
    await page.reload();
    await expect(page.locator('button[title="Hide pinyin"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('h2 rt').first()).toBeVisible();
  });

  test('with pinyin off, no page shows any pinyin', async ({ page }) => {
    // Any tone-marked vowel means pinyin is on screen (English has none).
    const TONE_MARKS = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/;
    const pinyinOnScreen = async () => {
      const text = await page.locator('body').innerText();
      const titles = await page.locator('[title]').evaluateAll(els => els.map(e => e.getAttribute('title')).join(' '));
      return TONE_MARKS.test(text) || TONE_MARKS.test(titles);
    };

    await page.goto('http://localhost:5174');
    expect(await pinyinOnScreen()).toBe(false); // library

    await page.getByText('进入阅读').first().click();
    expect(await pinyinOnScreen()).toBe(false); // story text, title, tooltips
    for (const tab of [/^语法点/, /^随堂测验/, /^重点生词/]) {
      await page.locator('button').filter({ hasText: tab }).click();
      expect(await pinyinOnScreen()).toBe(false);
    }

    // Save a key-vocab word, then check the vocab list.
    await page.locator('button').filter({ hasText: /^重点生词/ }).click();
    await page.locator('div.cursor-pointer').filter({ hasText: /HSK/ }).first().click();
    await page.locator('button[title="Save to Flashcards"]').click();
    await page.mouse.click(5, 5);
    await page.getByText('返回文库').click();
    await page.getByRole('button', { name: /生词本/ }).first().click();
    expect(await pinyinOnScreen()).toBe(false);

    // Switching it on brings the pinyin lines back.
    await page.locator('button[title="Show pinyin"]').click();
    expect(await pinyinOnScreen()).toBe(true);
  });
});


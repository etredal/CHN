import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { hsk5NightTrain as story } from '../src/data/hsk5_night_train';

// English words on screen, ignoring level names like "HSK 5".
async function englishOnScreen(page: Page): Promise<string[]> {
  const text = await page.locator('body').innerText();
  return [...new Set(text.split('\n').map(l => l.trim()))]
    .filter(l => /[A-Za-z]{3,}/.test(l.replace(/HSK|SM-2|Anki/g, '')));
}

test.describe('English on demand', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure the app is served at localhost:5174 (e.g. `npx vite preview --port 5174`)
    await page.goto('http://localhost:5174');
  });

  test('library shows no English; clicking a summary reveals it without opening the story', async ({ page }) => {
    expect(await englishOnScreen(page)).toEqual([]);

    await page.getByText(story.summary.cn).click();
    await expect(page.getByText(story.summary.en)).toBeVisible();
    await expect(page.getByText('进入阅读').first()).toBeVisible(); // still on the library

    await page.getByText(story.summary.cn).click(); // toggles back off
    await expect(page.getByText(story.summary.en)).toHaveCount(0);

    // The title still opens the story.
    await page.getByText(story.title.cn).click();
    await expect(page.locator('button[title="Reading Settings"]')).toBeVisible();
  });

  test('reader text, grammar, quiz and drawer reveal English on click', async ({ page }) => {
    await page.getByText('进入阅读').first().click();
    expect(await englishOnScreen(page)).toEqual([]);

    // Title and section heading.
    await page.locator('main h1').getByText(story.title.cn).click();
    await expect(page.getByText(story.title.en)).toBeVisible();
    const section = story.sections[0].partTitle;
    await page.getByText(section.cn).click();
    await expect(page.getByText(section.en)).toBeVisible();

    // Grammar: the pattern reveals its explanation; examples their translation.
    await page.locator('button').filter({ hasText: /^语法点/ }).click();
    expect(await englishOnScreen(page)).toEqual([]);
    const g = story.grammarNotes[0];
    await page.getByText(g.pattern).click();
    await expect(page.getByText(g.explanation)).toBeVisible();
    await page.getByText(g.exampleFromStory).click();
    await expect(page.getByText(g.exampleFromStoryEn!)).toBeVisible();
    await page.getByText(g.additionalExamples[1]).click();
    await expect(page.getByText(g.additionalExamplesEn![1])).toBeVisible();

    // Quiz: the question reveals itself and its options; options still select.
    await page.locator('button').filter({ hasText: /^随堂测验/ }).click();
    expect(await englishOnScreen(page)).toEqual([]);
    const q = story.quiz[0];
    await page.getByText(q.question).click();
    await expect(page.getByText(q.questionEn!)).toBeVisible();
    for (const opt of q.optionsEn!) await expect(page.getByText(opt)).toBeVisible();
    const option = page.locator('div.cursor-pointer').filter({ hasText: q.options[1] });
    await option.click();
    await expect(option).toHaveClass(/border-amber-500/);

    // Drawer: the context sentence reveals its translation.
    await page.locator('button').filter({ hasText: /^正文/ }).click();
    await page.locator('.word-token').nth(3).click();
    const sentence = story.sections[0].paragraphs[0].sentences[0];
    await expect(page.getByText(sentence.en)).toHaveCount(0);
    const drawer = page.locator('div.fixed.inset-0.z-50');
    await drawer.locator('.translatable').filter({ hasText: sentence.cn }).click();
    await expect(page.getByText(sentence.en)).toBeVisible();
  });

  test('vocab list hides meanings until the word is clicked', async ({ page }) => {
    await page.getByText('进入阅读').first().click();
    await page.locator('button').filter({ hasText: /^重点生词/ }).click();
    const v = story.targetVocabulary[0];
    await expect(page.getByText(v.definitions[0])).toHaveCount(0); // not on the card
    await page.locator('div.cursor-pointer').filter({ hasText: v.word }).first().click();
    await page.locator('button[title="Save to Flashcards"]').click();
    await page.mouse.click(5, 5);
    await page.getByText('返回文库').click();
    await page.getByRole('button', { name: /生词本/ }).first().click();

    await expect(page.getByText('共收藏 1 个单词', { exact: false })).toBeVisible();
    expect(await englishOnScreen(page)).toEqual([]);
    await page.locator('.translatable').filter({ hasText: v.word }).click();
    await expect(page.getByText(v.definitions.join(', '))).toBeVisible();
  });
});

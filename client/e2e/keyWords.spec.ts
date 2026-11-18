import { test, expect } from '@playwright/test';
import { hsk6School611 as story } from '../src/data/hsk6_school_611';

test('the key-words tab lists each word with its example, shown again in the popup', async ({ page }) => {
  // Ensure the app is served at localhost:5174 (e.g. `npx vite preview --port 5174`)
  await page.goto('http://localhost:5174');
  await page.getByText(story.title.cn).first().click();
  await page.getByText(/重点生词/).first().click();

  const words = story.targetVocabulary;
  expect(words.length).toBeGreaterThan(10);
  await expect(page.getByTestId('key-word-example')).toHaveCount(words.length);

  // A word added from the story: its example is the story sentence it comes from.
  const added = words[words.length - 1];
  const sentences = story.sections.flatMap(s => s.paragraphs).flatMap(p => p.sentences);
  expect(sentences.some(s => s.cn === added.exampleSentence.cn)).toBe(true);

  await page.getByTestId('key-word-example').filter({ hasText: added.exampleSentence.cn }).first().click();
  const drawer = page.getByRole('dialog', { name: added.word });
  await expect(drawer.getByText('语境例句')).toBeVisible();
  await expect(drawer.getByText(added.exampleSentence.cn)).toBeVisible();
  await expect(drawer.getByText(added.hsk, { exact: true })).toBeVisible();
});

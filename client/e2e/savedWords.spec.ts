import { test, expect } from '@playwright/test';
import { hsk5NightTrain as story } from '../src/data/hsk5_night_train';

// A word that appears more than once in the story, so we can check that every
// occurrence is marked, not just the one that was clicked.
const counts = new Map<string, number>();
for (const tok of story.sections.flatMap(s => s.paragraphs).flatMap(p => p.sentences).flatMap(s => s.tokens)) {
  if (/\p{Script=Han}{2,}/u.test(tok.text)) counts.set(tok.text, (counts.get(tok.text) ?? 0) + 1);
}
const [WORD, TIMES] = [...counts].find(([, n]) => n >= 2)!;

test('words saved to the vocab list are marked everywhere in the story', async ({ page }) => {
  // Ensure the app is served at localhost:5174 (e.g. `npx vite preview --port 5174`)
  await page.goto('http://localhost:5174');
  await page.getByText(story.title.cn).click();

  const occurrences = page.locator('.story-sentence .word-token', { hasText: new RegExp(`^${WORD}$`) });
  const saved = page.locator('.story-sentence .word-token.is-saved');
  await expect(occurrences.first()).toBeVisible();
  const onPage = await occurrences.count();
  expect(onPage).toBeGreaterThan(0);
  expect(onPage).toBeLessThanOrEqual(TIMES);
  await expect(saved).toHaveCount(0);

  // Save it from the word drawer: every occurrence is marked at once.
  await occurrences.first().click();
  await page.locator('button[title="Save to Flashcards"]').first().click();
  await expect(saved).toHaveCount(onPage);
  await expect(occurrences.first()).toHaveAttribute('title', /已在生词本/);

  // Still marked after leaving and reopening the story.
  await page.mouse.click(5, 5); // backdrop closes the drawer
  await page.getByText('返回文库').click();
  await page.getByText(story.title.cn).click();
  await expect(saved).toHaveCount(onPage);

  // Removing it clears the marks.
  await occurrences.first().click();
  await page.locator('button[title="Remove from Flashcards"]').first().click();
  await expect(saved).toHaveCount(0);
});

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { hsk5Hometown as story } from '../src/data/hsk5_hometown';

// A phone: narrow, touch screen.
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

// Drag a finger across the story text by (dx, dy).
async function swipe(page: Page, dx: number, dy: number) {
  const article = page.locator('article.story-text');
  await article.locator('p').first().scrollIntoViewIfNeeded();
  const box = (await article.locator('p').first().boundingBox())!;
  const x0 = box.x + box.width / 2 - dx / 2;
  const y0 = box.y + Math.min(box.height / 2, 120) - dy / 2;
  const cdp = await page.context().newCDPSession(page);
  const point = (x: number, y: number) => [{ x, y, id: 1 }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: point(x0, y0) });
  for (let i = 1; i <= 5; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: point(x0 + (dx * i) / 5, y0 + (dy * i) / 5) });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

test('on a phone, pages turn with a swipe or the floating page pill', async ({ page }) => {
  // Ensure the app is served at localhost:5174 (e.g. `npx vite preview --port 5174`)
  await page.goto('http://localhost:5174');
  await page.getByText(story.title.cn).first().click();

  const pill = page.getByTestId('floating-pager');
  await expect(pill).toBeVisible();
  const total = Number((await pill.innerText()).match(/\/\s*(\d+)/)![1]);
  expect(total).toBeGreaterThanOrEqual(3);
  await expect(pill).toContainText(`1 / ${total}`);

  // Swipe left: next page. Swipe right: back again.
  await swipe(page, -200, 10);
  await expect(pill).toContainText(`2 / ${total}`);
  await swipe(page, 200, -10);
  await expect(pill).toContainText(`1 / ${total}`);

  // A mostly vertical drag is scrolling, not a page turn.
  await swipe(page, -80, -250);
  await expect(pill).toContainText(`1 / ${total}`);
  // Let the drag's momentum scrolling finish.
  await expect.poll(async () => {
    const a = await page.evaluate(() => window.scrollY);
    await page.waitForTimeout(150);
    return a === await page.evaluate(() => window.scrollY);
  }).toBe(true);

  // The pill's own buttons turn pages too, and the new page starts at the top.
  await page.evaluate(() => window.scrollTo(0, 800));
  await pill.getByRole('button', { name: '下一页' }).click();
  await expect(pill).toContainText(`2 / ${total}`);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(50);
  await expect(pill.getByRole('button', { name: '上一页' })).toBeEnabled();
});

test('the floating page pill is only for phones', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.goto('http://localhost:5174');
  await page.getByText(story.title.cn).first().click();
  await expect(page.locator('article.story-text')).toBeVisible();
  await expect(page.getByTestId('floating-pager')).toBeHidden();
});

# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\wordClick.spec.ts >> Reader word click playback >> clicking a middle word seeks and plays audio
- Location: e2e\wordClick.spec.ts:12:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5174/
Call log:
  - navigating to "http://localhost:5174/", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Reader word click playback', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     // Ensure dev server is running at localhost:5174
> 6  |     await page.goto('http://localhost:5174');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5174/
  7  |     // Navigate to the Zhuangzi story (adjust selector if needed)
  8  |     await page.getByText('庄子的“无用之用”：在焦虑时代寻找内心的从容').click();
  9  |     // No URL change after story selection
  10 |   });
  11 | 
  12 |   test('clicking a middle word seeks and plays audio', async ({ page }) => {
  13 |     // Locate a word token element. Tokens have class 'word-token' and data-start-time attribute.
  14 |     const word = page.locator('.word-token').nth(150);
  15 |     await word.scrollIntoViewIfNeeded();
  16 |     await word.click();
  17 | 
  18 |     await page.waitForSelector('audio', { state: 'attached' });
  19 | 
  20 |     // Compare timestamps.
  21 |     const audio = page.locator('audio[data-testid="audio-player"]');
  22 |     await expect(audio).toHaveAttribute('paused', 'false');
  23 |   });
  24 | });
  25 | 
```
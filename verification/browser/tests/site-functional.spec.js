const { test, expect } = require('@playwright/test');

test('desktop: core calculator sections load without page errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/index.html');
  await expect(page.locator('#tax-center')).toBeAttached();
  await expect(page.locator('#mortgageForm')).toBeVisible();
  await expect(page.locator('#land-efficiency-tool')).toBeAttached();
  expect(errors).toEqual([]);
});

test('mortgage: real form submission populates results and 12-row schedule', async ({ page }) => {
  await page.goto('/index.html');
  await page.locator('#mortgageForm button[type="submit"]').click();
  await expect(page.locator('#mortgageResults')).toHaveAttribute('data-user-calculated', '1');
  await expect(page.locator('#mortgageMonthly')).not.toHaveText('—');
  await expect(page.locator('#mortgageSchedule tr')).toHaveCount(12);
});

test('land efficiency: calculator accepts the baseline inputs and renders outputs', async ({ page }) => {
  await page.goto('/index.html');
  await page.locator('#le-calc').click();
  await expect(page.locator('#land-efficiency-tool')).toHaveAttribute('data-calculated', '1');
  await expect(page.locator('#le-out-saleable')).not.toBeEmpty();
});

test('tax: tax selector is populated and calculation action is present', async ({ page }) => {
  await page.goto('/index.html');
  await expect(page.locator('#tax-menu')).toBeVisible();
  await expect(page.locator('#tax-menu button').first()).toBeVisible();
  await expect(page.locator('#tax-calc')).toBeVisible();
});

test('mobile: calculator sections remain within viewport width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/index.html');
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 2);
});

test('print: browser can render a non-empty A4 PDF artifact', async ({ page }) => {
  await page.goto('/index.html');
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  expect(pdf.length).toBeGreaterThan(5000);
});

test('tax: all fourteen promised tools are present in the selector', async ({ page }) => {
  await page.goto('/index.html');
  const buttons = page.locator('#tax-menu button');
  await expect(buttons).toHaveCount(14);
  await expect(buttons.filter({ hasText: '租金扣繳' })).toHaveCount(1);
  await expect(buttons.filter({ hasText: '執行業務所得' })).toHaveCount(1);
});

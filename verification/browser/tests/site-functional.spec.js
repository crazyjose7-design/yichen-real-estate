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

test('rent withholding: Simpany-style fields calculate tax and supplementary premium', async ({ page }) => {
  await page.goto('/index.html');
  await page.locator('#tax-menu button').filter({ hasText: '租金扣繳' }).click();
  await page.locator('#tax-extra-rentAmount').fill('30000');
  await page.locator('#tax-calc').click();
  await expect(page.locator('#tax-amount')).toHaveText('NT$ 3,633');
  await expect(page.locator('#tax-detail')).toContainText('租金扣繳：NT$ 3,000');
  await expect(page.locator('#tax-detail')).toContainText('二代健保補充保費：NT$ 633');
});

test('professional income: 9A shows payer deductions and annual net income', async ({ page }) => {
  await page.goto('/index.html');
  await page.locator('#tax-menu button').filter({ hasText: '執行業務所得' }).click();
  await page.locator('#tax-extra-proGross').fill('50000');
  await page.locator('#tax-fields details summary').click();
  await page.locator('#tax-extra-proAnnual').fill('300000');
  await page.locator('#tax-extra-proFeeRate').fill('30');
  await page.locator('#tax-calc').click();
  await expect(page.locator('#tax-amount')).toHaveText('NT$ 6,055');
  await expect(page.locator('#tax-detail')).toContainText('代扣所得稅：NT$ 5,000');
  await expect(page.locator('#tax-detail')).toContainText('代扣二代健保：NT$ 1,055');
  await expect(page.locator('#tax-detail')).toContainText('計入所得淨額：NT$ 210,000');
});

test('professional income: net-receipt mode grosses up to the requested take-home amount', async ({ page }) => {
  await page.goto('/index.html');
  await page.locator('#tax-menu button').filter({ hasText: '執行業務所得' }).click();
  await page.locator('input[name="tax-extra-proAmountMode"][value="net"]').check();
  await page.locator('#tax-extra-proGross').fill('30000');
  await page.locator('#tax-calc').click();
  await expect(page.locator('#tax-detail')).toContainText('實際支付金額：NT$ 30,000');
});

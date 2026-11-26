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
  await page.locator('#tax-extra-proFeeVerified').check();
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

test('land efficiency print: three pages when optional official verification is blank', async ({ page }) => {
  await page.addInitScript(() => { window.print = () => { document.body.dataset.printInvoked = '1'; }; });
  await page.goto('/index.html');
  await page.locator('#le-print').click();
  await expect(page.locator('body')).toHaveAttribute('data-print-invoked', '1');
  await expect(page.locator('#yichen-print-root .print-page')).toHaveCount(3);
  await expect(page.locator('#yichen-print-root')).toContainText('一、基地與法規條件');
  await expect(page.locator('#yichen-print-root')).toContainText('二、土地成本與市場銷售條件');
  await expect(page.locator('#yichen-print-root')).toContainText('三、試算結果');
});

test('land efficiency print: optional official verification becomes its own fourth page', async ({ page }) => {
  await page.addInitScript(() => { window.print = () => { document.body.dataset.printInvoked = '1'; }; });
  await page.goto('/index.html');
  await page.locator('#le-plan-name').fill('測試都市計畫');
  await page.locator('#le-print').click();
  await expect(page.locator('body')).toHaveAttribute('data-print-invoked', '1');
  await expect(page.locator('#yichen-print-root .print-page')).toHaveCount(4);
  await expect(page.locator('#yichen-print-root')).toContainText('二、官方查核');
  await expect(page.locator('#yichen-print-root')).toContainText('四、試算結果');
});

test('full-site print: requested main sections have separate pages and culture is expanded', async ({ page }) => {
  await page.addInitScript(() => { window.print = () => { document.body.dataset.printInvoked = '1'; }; });
  await page.goto('/index.html');
  await page.locator('#site-print').click();
  await expect(page.locator('body')).toHaveAttribute('data-print-invoked', '1');
  const pages = page.locator('#yichen-print-root .print-page');
  await expect(pages).toHaveCount(6);
  await expect(pages.nth(0)).toContainText('人物首頁');
  await expect(pages.nth(1)).toContainText('關於億辰');
  await expect(pages.nth(2)).toContainText('企業徽章與文化');
  await expect(pages.nth(3)).toContainText('專業服務');
  await expect(pages.nth(4)).toContainText('服務流程');
  await expect(pages.nth(5)).toContainText('市場觀點與 OUR BELIEF');
  await expect(pages.nth(2)).toContainText('中央橫樑');
  await expect(pages.nth(5)).toContainText('OUR BELIEF');
});

test('mortgage print: one isolated page includes six results and the first twelve periods', async ({ page }) => {
  await page.addInitScript(() => { window.print = () => { document.body.dataset.printInvoked = '1'; }; });
  await page.goto('/index.html');
  await page.locator('#mortgageForm button[type="submit"]').click();
  await page.locator('#mortgage-print').click();
  await expect(page.locator('body')).toHaveAttribute('data-print-invoked', '1');
  const printed = page.locator('#yichen-print-root .print-page');
  await expect(printed).toHaveCount(1);
  await expect(printed).toContainText('寬限期後首期月付金');
  await expect(printed).toContainText('寬限期每月利息');
  await expect(printed).toContainText('總利息');
  await expect(printed).toContainText('總還款金額');
  await expect(printed).toContainText('貸款成數');
  await expect(printed).toContainText('預估首期還款日');
  await expect(printed).toContainText('前 12 期還款明細');
  await expect(printed.locator('#mortgageSchedule tr')).toHaveCount(12);
});

test('tax print: only the currently calculated rent-withholding tool is printed', async ({ page }) => {
  await page.addInitScript(() => { window.print = () => { document.body.dataset.printInvoked = '1'; }; });
  await page.goto('/index.html');
  await page.locator('#tax-menu button').filter({ hasText: '租金扣繳' }).click();
  await page.locator('#tax-extra-rentAmount').fill('30000');
  await page.locator('#tax-calc').click();
  await page.locator('#tax-print').click();
  await expect(page.locator('body')).toHaveAttribute('data-print-invoked', '1');
  const printed = page.locator('#yichen-print-root .print-page');
  await expect(printed).toHaveCount(1);
  await expect(printed).toContainText('租金扣繳計算機');
  await expect(printed).toContainText('租金扣繳：NT$ 3,000');
  await expect(printed).not.toContainText('房貸試算');
});

test('site print excludes stale extra-tax results after the user edits inputs', async ({ page }) => {
  await page.addInitScript(() => { window.print = () => { document.body.dataset.printInvoked = '1'; }; });
  await page.goto('/index.html');
  await page.locator('#tax-menu button').filter({ hasText: '租金扣繳' }).click();
  await page.locator('#tax-extra-rentAmount').fill('30000');
  await page.locator('#tax-calc').click();
  await page.locator('#tax-extra-rentAmount').fill('40000');
  await page.locator('#site-print').click();
  await expect(page.locator('body')).toHaveAttribute('data-print-invoked', '1');
  await expect(page.locator('#yichen-print-root')).not.toContainText('租金扣繳計算機');
});

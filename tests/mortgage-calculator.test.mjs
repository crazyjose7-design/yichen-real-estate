import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../workbench/modules/mortgage-calculator.js', import.meta.url), 'utf8');

function runCase(input) {
  const elements = new Map();
  const make = (id, value = '') => {
    const el = { id, value: String(value), textContent: '—', innerHTML: '', dataset: {},
      addEventListener(type, fn) { (this.handlers ??= {})[type] = fn; },
      reportValidity() { return true; } };
    elements.set(id, el); return el;
  };
  const form = make('mortgageForm');
  const defaults = {
    mortgageLoan: input.loan, mortgagePrice: input.price ?? input.loan + (input.down ?? 0),
    mortgageDown: input.down ?? 0, mortgageYears: input.years, mortgageRate: input.rate,
    mortgageRate2: input.rate2 ?? '', mortgageRateChangeMonth: input.changeMonth ?? '',
    mortgageGrace: input.graceYears ?? 0, mortgageMethod: input.method ?? 'annuity'
  };
  for (const [id, value] of Object.entries(defaults)) make(id, value);
  for (const id of ['mortgageMonthly','mortgageGracePay','mortgageInterest','mortgageTotal','mortgageLtv','mortgageFirstDate','mortgageCalcNote','mortgageSchedule']) make(id);
  const document = { getElementById(id) { return elements.get(id) ?? null; } };
  const context = { document, Intl, Math, Number, Date, String, alert(message) { throw new Error(message); } };
  vm.runInNewContext(source, context);
  const result = () => Object.fromEntries(['mortgageMonthly','mortgageGracePay','mortgageInterest','mortgageTotal','mortgageLtv'].map(id => [id, elements.get(id).textContent]));
  return { result, elements };
}

// Independent reference implementation: monthly interest rounded to whole currency units,
// annuity payment recalculated from remaining balance/remaining periods after each rate change.
function reference(input) {
  const principal = input.loan * 10000;
  const months = input.years * 12;
  const grace = (input.graceYears ?? 0) * 12;
  const method = input.method ?? 'annuity';
  let balance = principal, interestTotal = 0, paidTotal = 0, firstPayment = 0, gracePayment = 0;
  for (let i = 1; i <= months; i++) {
    const annualRate = input.rate2 != null && i >= input.changeMonth ? input.rate2 : input.rate;
    const mr = annualRate / 1200;
    const interest = Math.round(balance * mr);
    let payment = 0, amortized = 0;
    if (i <= grace) {
      payment = interest;
      gracePayment = grace ? Math.round(principal * mr) : 0;
    } else if (method === 'annuity') {
      const remaining = months - i + 1;
      payment = Math.round(mr === 0 ? balance / remaining : balance * mr / (1 - Math.pow(1 + mr, -remaining)));
      if (i === months) payment = Math.round(balance + interest);
      amortized = Math.min(balance, Math.max(0, payment - interest));
    } else {
      amortized = i === months ? balance : Math.min(balance, Math.round(principal / (months - grace)));
      payment = amortized + interest;
    }
    if (i > grace && i === grace + 1) firstPayment = payment;
    balance = Math.max(0, balance - amortized);
    interestTotal += interest; paidTotal += payment;
  }
  return { firstPayment, gracePayment, interestTotal, paidTotal, ltv: principal / ((input.price ?? input.loan + (input.down ?? 0)) * 10000) * 100 };
}
const money = n => 'NT$ ' + Math.round(n).toLocaleString('zh-TW');

const cases = [
  { id: 'MORT-ANN-001', loan: 800, down: 200, price: 1000, years: 30, rate: 2.5, method: 'annuity', graceYears: 0 },
  { id: 'MORT-ANN-002', loan: 1200, down: 300, price: 1500, years: 20, rate: 3.25, method: 'annuity', graceYears: 0 },
  { id: 'MORT-PRI-001', loan: 800, down: 200, price: 1000, years: 20, rate: 2.5, method: 'principal', graceYears: 0 },
  { id: 'MORT-ZERO-001', loan: 800, down: 200, price: 1000, years: 20, rate: 0, method: 'annuity', graceYears: 0 },
  { id: 'MORT-ZERO-002', loan: 800, down: 200, price: 1000, years: 20, rate: 0, method: 'principal', graceYears: 0 },
  { id: 'MORT-GRACE-001', loan: 800, down: 200, price: 1000, years: 20, rate: 6, method: 'annuity', graceYears: 1 },
  { id: 'MORT-STEP-001', loan: 800, down: 200, price: 1000, years: 20, rate: 2, rate2: 3, changeMonth: 61, method: 'annuity', graceYears: 0 },
  { id: 'MORT-LONG-001', loan: 2000, down: 500, price: 2500, years: 40, rate: 2.1, method: 'principal', graceYears: 2 }
];

for (const input of cases) {
  test(input.id + ' matches independently calculated full amortization totals', () => {
    const actual = runCase(input).result();
    const expected = reference(input);
    assert.equal(actual.mortgageMonthly, money(expected.firstPayment));
    assert.equal(actual.mortgageGracePay, input.graceYears ? money(expected.gracePayment) : '無寬限期');
    assert.equal(actual.mortgageInterest, money(expected.interestTotal));
    assert.equal(actual.mortgageTotal, money(expected.paidTotal));
    assert.equal(actual.mortgageLtv, expected.ltv.toFixed(1) + '%');
  });
}

test('MORT-VALID-001 rejects an invalid rate-change month', () => {
  const { elements } = runCase({ loan: 800, down: 200, price: 1000, years: 20, rate: 2, rate2: 3, changeMonth: 0, method: 'annuity' });
  assert.equal(elements.get('mortgageMonthly').textContent, '—');
});

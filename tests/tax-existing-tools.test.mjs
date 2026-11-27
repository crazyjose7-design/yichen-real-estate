import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Load the production calculator definitions without its DOM event wiring.
const source = fs.readFileSync(new URL('../workbench/modules/tax-engine.js', import.meta.url), 'utf8');
const marker = 'const quickFieldIds={';
if (!source.includes(marker)) throw new Error('Tax engine extraction marker changed; update this test harness deliberately.');
const instrumented = source.replace(marker, 'globalThis.__yichenTaxDefs = defs; return; ' + marker);
const context = { Intl, Math, Number, Object, Error, Date, String, Array, document: { getElementById() { return {}; } } };
vm.runInNewContext(instrumented, context);
const defs = context.__yichenTaxDefs;
const base = {
  house: {
    assetType:'房屋及土地', acqDate:'2020-01-01', saleDate:'2026-01-02', mode:'買賣取得',
    costBasis:6000000, inheritHouseValue:0, inheritLandValue:0, inheritCpiFactor:0,
    costBasisVerified:'是', acqFee:100000, improve:0, feeMode:'有憑證：輸入實際金額',
    sale:10000000, saleVerified:'是', transferFee:100000, landGain:0, landGainVerified:'是',
    loss:0, lossVerified:'不適用', resident:'是', predecessorDate:'', predecessorResidenceQualified:'不適用',
    spouseGiftRule:'不適用', shareControl:'不適用', shareLots:'單一批次／已按先進先出整理',
    shareTransition:'已確認不符合', assetRatio:0, listed:'不適用', special:'否', self:'否',
    selfHouseholdRegistered:'不適用', selfActualResidence:'不適用', selfNoRentBusiness:'不適用',
    selfResidenceYears:0, selfNoRentYears:0, selfUsedBefore6Years:'不適用', repurchase:'否',
    repurchaseType:'不適用', repurchaseDate:'', repurchasePrice:0, taxPaid:0,
    repurchaseSelf:'否', repurchaseHolder:'否'
  },
  old: { acqDate:'2010-01-01',regimeVerified:'是',sale:2000000,cost:1000000,costVerified:'是',
    fee:100000,otherPropertyIncome:0,priorLoss:0,baseIncome:0,baseIncomeVerified:'是',year:'115年度（2026）' },
  vat: { sales:1050000,purchase:210000,priorCredit:0,priorCreditVerified:'不適用',
    dataVerified:'是',vatType:'一般加值型營業人（5%）' },
  deed: { base:10000000,exchangeDiff:0,baseVerified:'是',hasPriorDeedCredit:'否',
    priorDeedCredit:0,priorDeedCreditVerified:'不適用',kind:'買賣',exemption:'不適用（已確認不符合免徵）' },
  stamp: { base:1000000,copies:2,kind:'不動產典賣／讓受／分割契據',
    documentVerified:'是',exemption:'不適用（已確認應稅）' },
  houseTax: { taxYear:'115年度（2026年5月開徵）',city:'高雄市',ownerType:'自然人',
    base:10000000,baseVerified:'是',smallHouseLimit:100000,smallHouseLimitVerified:'是',
    smallHouseCount:1,smallHouseExemptSelected:'不適用',shareNum:1,shareDen:1,
    ownerRelation:'本人／配偶／直系親屬所有或合法使用權人',
    kind:'一般自住（本人配偶未成年子女全國3戶內）',units:1,singleValueQualified:'不適用',
    singleValueLimit:0,singleValueLimitVerified:'不適用',householdRegistered:'是',
    noRentBusiness:'是',actualResidence:'是',builderStartDate:'',forceMajeureMonths:0,
    forceMajeureVerified:'不適用',packageRentStandard:'不適用',
    packageRentStandardVerified:'不適用',packageReductionVerified:'不適用',
    rate:0,rateVerified:'不適用',exemptionVerified:'不適用' },
  landTax: { city:'高雄市',base:1000000,baseVerified:'是',start:500000,kind:'一般用地',
    selfAreaWithinLimit:'不適用',startVerified:'是',specialApproved:'不適用',publicUse:'不適用' },
  rent: { rentalType:'一般住宅出租',qualificationVerified:'不適用',dataVerified:'是',
    sales:30000,rentalMonths:12,depositPrincipal:0,depositRate:0,depositDays:0,
    expense:43,baseIncome:0,baseIncomeVerified:'是',year:'115年度（2026）' },
  estate: { eventDate:'2026-01-01',decedentResident:'境內經常居住者',serviceDeath:'否',
    base:50000000,estateInfoVerified:'是',gift2Years:0,gift2YearsVerified:'不適用',
    deductionsVerified:'是',spouse:0,children:0,childYears:0,parents:0,disabled:0,
    siblings:0,siblingYears:0,funeral:1380000,other:0,credit:0,creditVerified:'不適用' },
  gift: { eventDate:'2026-01-01',donorResident:'境內經常居住者',base:30000000,
    annualGiftVerified:'是',deduct:0,deductionsVerified:'是',credit:0,creditVerified:'不適用' },
  corp: { base:500000,taxableIncomeVerified:'是' }
};
const expected = {
  house: 760000,
  old: 65300,
  vat: 40000,
  deed: 600000,
  stamp: 2000,
  houseTax: 120000,
  landTax: 12500,
  rent: 10260,
  estate: 3529000,
  gift: 2756000,
  corp: 100000
};
for (const [key, amount] of Object.entries(expected)) {
  test('TAX-' + key.toUpperCase() + '-BASE-001 independent expected value', () => {
    assert.ok(defs[key], 'missing production calculator ' + key);
    const [actual, explanation] = defs[key].calc({ ...base[key] });
    assert.equal(actual, amount, key + ' expected NT$' + amount + '; got ' + actual + '; ' + explanation);
    assert.ok(typeof explanation === 'string' && explanation.length > 0);
  });
}

test('TAX-VAT-EDGE-001 rejects unverified input instead of guessing', () => {
  const [actual, explanation] = defs.vat.calc({ ...base.vat, dataVerified:'否' });
  assert.equal(actual, null);
  assert.match(explanation, /核實/);
});
test('TAX-HOUSETAX-EDGE-001 rejects unverified municipal rate for non-owner-occupied category', () => {
  const [actual, explanation] = defs.houseTax.calc({ ...base.houseTax, kind:'其他非自住住家', rate:3.6, rateVerified:'否' });
  assert.equal(actual, null);
  assert.match(explanation, /尚未確認|官方資料/);
});
test('TAX-LANDTAX-EDGE-001 refuses unverified progressive starting point', () => {
  const [actual, explanation] = defs.landTax.calc({ ...base.landTax, startVerified:'否' });
  assert.equal(actual, null);
  assert.match(explanation, /累進起點地價/);
});


// 115年度遺產及贈與稅：依財政部114年11月27日公告建立獨立邊界案例。
// Expected values below are independently calculated from the published brackets,
// not copied from the production calculator's explanation text.
const estateCase = (taxableNet, overrides={}) => ({
  ...base.estate,
  base: taxableNet + 13330000 + 1380000,
  ...overrides
});
const giftCase = (gross, overrides={}) => ({
  ...base.gift,
  base: gross,
  ...overrides
});

test('TAX-ESTATE-115-BOUNDARY-001: 10% bracket ceiling', () => {
  const [actual] = defs.estate.calc(estateCase(56210000));
  assert.equal(actual, 5621000);
});
test('TAX-ESTATE-115-BOUNDARY-002: 15% bracket ceiling', () => {
  const [actual] = defs.estate.calc(estateCase(112420000));
  assert.equal(actual, 14052500);
});
test('TAX-ESTATE-115-BOUNDARY-003: upper bracket starts immediately above 112.42m', () => {
  const [actual] = defs.estate.calc(estateCase(112420001));
  assert.ok(Math.abs(actual - 14052500.2) < 1e-6);
});
test('TAX-ESTATE-115-EXCEPTION-001: qualified public-service death doubles exemption', () => {
  const [actual] = defs.estate.calc({
    ...base.estate,
    base: 30000000,
    serviceDeath:'是',
    funeral:1380000
  });
  assert.equal(actual, 196000);
});
test('TAX-GIFT-115-BOUNDARY-001: annual exemption is 2.44m per donor', () => {
  const [atExemption] = defs.gift.calc(giftCase(2440000));
  const [aboveExemption] = defs.gift.calc(giftCase(2440001));
  assert.equal(atExemption, 0);
  assert.ok(Math.abs(aboveExemption - 0.1) < 1e-9);
});
test('TAX-GIFT-115-BOUNDARY-002: 10% bracket ceiling after annual exemption', () => {
  const [actual] = defs.gift.calc(giftCase(30550000));
  assert.equal(actual, 2811000);
});
test('TAX-GIFT-115-BOUNDARY-003: 15% bracket ceiling after annual exemption', () => {
  const [actual] = defs.gift.calc(giftCase(58650000));
  assert.equal(actual, 7026000);
});
test('TAX-GIFT-115-BOUNDARY-004: upper bracket starts immediately above 56.21m net', () => {
  const [actual] = defs.gift.calc(giftCase(58650001));
  assert.ok(Math.abs(actual - 7026000.2) < 1e-6);
});
test('TAX-GIFT-115-ABNORMAL-001: refuses unverified annual donor aggregation', () => {
  const [actual, explanation] = defs.gift.calc(giftCase(30000000,{annualGiftVerified:'否'}));
  assert.equal(actual, null);
  assert.match(explanation,/全年贈與總額/);
});


const landCase = (overrides={}) => ({
  previousDate:'2020-01-01', currentValue:180, priorValue:100, cpi:'100|100',
  area:100, landType:'都市土地', selfUseApproved:'否／未核准（只計一般用地）',
  shareNumerator:1, shareDenominator:1, deductibleCosts:0, priorLandTaxCredit:0,
  ...overrides
});
test('TAX-LAND-BASE-001 independent no-gain floor', () => {
  const [actual] = defs.land.calc(landCase({currentValue:100}));
  assert.equal(actual,0);
});
test('TAX-LAND-BOUNDARY-001 independent first bracket expected value', () => {
  const [actual] = defs.land.calc(landCase());
  assert.equal(actual,1600);
});
test('TAX-LAND-BOUNDARY-002 independent second bracket expected value', () => {
  const [actual] = defs.land.calc(landCase({currentValue:250}));
  assert.equal(actual,3500);
});
test('TAX-LAND-BOUNDARY-003 independent third bracket expected value', () => {
  const [actual] = defs.land.calc(landCase({currentValue:350}));
  assert.equal(actual,7000);
});
test('TAX-LAND-ABNORMAL-001 rejects invalid transferred share', () => {
  const [actual, explanation] = defs.land.calc(landCase({shareNumerator:2,shareDenominator:1}));
  assert.equal(actual,null);
  assert.match(explanation,/持分/);
});

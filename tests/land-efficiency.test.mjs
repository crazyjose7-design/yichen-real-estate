import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../workbench/modules/land-efficiency.js', import.meta.url), 'utf8');
const marker = 'function reset(){';
if (!source.includes(marker)) throw new Error('Land calculator extraction marker changed; update this harness deliberately.');
const instrumented = source.replace(marker, 'globalThis.__yichenLandCalculate = calculate; return; ' + marker);

function createCalculator(overrides = {}) {
  const defaults = {
    'le-unit':'ping','le-area':'100','le-basefar':'200','le-bonus':'0','le-official-reward':'0',
    'le-volume-transfer':'0','le-eff':'1.3','le-custom-eff':'1.3','le-landprice':'8000',
    'le-saleprice':'60','le-landratio':'35','le-custom-ratio':'','le-parking-count':'',
    'le-parking-price':'','le-urban-renewal':'0','le-oldbuilding':'0','le-parking-bonus':'0',
    'le-rail-bonus':'0','le-open-space-bonus':'0','le-urban-renewal-custom':'',
    'le-oldbuilding-custom':'','le-parking-bonus-custom':'','le-rail-bonus-custom':'',
    'le-open-space-bonus-custom':'','le-rail-distance':'none','le-build-cost':'0',
    'le-soft-cost':'0','le-finance-cost':'0','le-tax-market-cost':'0','le-profit-target':'0',
    'le-soft-cost-mode':'amount','le-finance-cost-mode':'amount','le-tax-market-cost-mode':'amount',
    'le-profit-target-mode':'amount','le-zone':'住宅區','le-method':'一般新建'
  };
  const values = { ...defaults, ...overrides };
  const elements = new Map();
  for (const [id, value] of Object.entries(values)) elements.set(id, { id, value:String(value), textContent:'', hidden:false, dataset:{} });
  const document = { getElementById(id) { if (!elements.has(id)) elements.set(id,{id,value:'',textContent:'',hidden:false,dataset:{}}); return elements.get(id); } };
  const context = { document, Intl, Math, Number, String, Object, Array, Error };
  vm.runInNewContext(instrumented, context);
  return { calculate: context.__yichenLandCalculate, elements };
}
const text = (elements,id) => elements.get(id).textContent;

test('LAND-BASE-001 independently checks buildable, saleable area, land allocation and revenue', () => {
  const { calculate, elements } = createCalculator();
  assert.equal(calculate(), true);
  assert.equal(text(elements,'le-out-area'), '100.00 坪');
  assert.equal(text(elements,'le-out-base'), '200.00 坪');
  assert.equal(text(elements,'le-out-totalfa'), '200.00 坪');
  assert.equal(text(elements,'le-out-saleable'), '260.00 坪');
  assert.equal(text(elements,'le-out-cost'), '30.77 萬');
  assert.equal(text(elements,'le-out-landunit'), '80.00 萬／坪');
  assert.equal(text(elements,'le-out-revenue'), '15,600.00 萬');
  assert.equal(text(elements,'le-out-cap'), '5,460.00 萬');
  assert.equal(text(elements,'le-out-residual'), '15,600.00 萬');
});

test('LAND-UNIT-001 square metres convert to ping independently', () => {
  const { calculate, elements } = createCalculator({ 'le-unit':'sqm', 'le-area':'330.5785' });
  assert.equal(calculate(), true);
  assert.ok(Math.abs(parseFloat(text(elements,'le-out-area')) - 100) < 0.01);
  assert.equal(text(elements,'le-out-base'), '200.00 坪');
});

test('LAND-REWARD-001 scenario reward changes floor area but is labelled as assumption', () => {
  const { calculate, elements } = createCalculator({ 'le-bonus':'20' });
  assert.equal(calculate(), true);
  assert.equal(text(elements,'le-out-totalfa'), '240.00 坪');
  assert.equal(text(elements,'le-out-saleable'), '312.00 坪');
  assert.match(text(elements,'le-alert'), /情境假設/);
});

test('LAND-CUSTOM-001 custom reward without a percentage is rejected, not treated as zero', () => {
  const { calculate, elements } = createCalculator({ 'le-urban-renewal':'custom', 'le-urban-renewal-custom':'' });
  assert.equal(calculate(), false);
  assert.match(text(elements,'le-alert'), /請填入/);
});

test('LAND-BOUNDARY-001 negative land price is rejected', () => {
  const { calculate, elements } = createCalculator({ 'le-landprice':'-1' });
  assert.equal(calculate(), false);
  assert.match(text(elements,'le-alert'), /輸入資料有誤/);
});

test('LAND-PARK-001 parking revenue is included only when both count and price exist', () => {
  const { calculate, elements } = createCalculator({ 'le-parking-count':'10', 'le-parking-price':'200' });
  assert.equal(calculate(), true);
  assert.equal(text(elements,'le-out-revenue'), '17,600.00 萬');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));

test('REG-CENTRAL-001 current urban renewal reward rule index covers all 21 articles', () => {
  const d = read('regulations/national/urban-renewal-building-volume-reward-regulations.json');
  const articles = new Set(d.extracted_rules.map(x => Number(x.article.match(/\d+/)?.[0])));
  assert.equal(d.source.provision.includes('第1至21條'), true);
  assert.equal(d.extracted_rules.length, 21);
  assert.deepEqual([...articles].sort((a,b)=>a-b), Array.from({length:21},(_,i)=>i+1));
  assert.ok(d.extracted_rules.every(x => x.status === 'in_review'));
  assert.equal(d.application_policy.auto_apply, false);
});

test('REG-CITY-001 matrix counts match all 22 city files and keep unverified data disabled', () => {
  const dir = path.join(root, 'regulations/cities');
  const files = fs.readdirSync(dir).filter(x => /^\d{2}-.+\.json$/.test(x));
  const matrix = read('regulations/city-review-matrix.json');
  assert.equal(files.length, 22);
  let total = 0;
  for (const file of files) {
    const d = read('regulations/cities/' + file);
    total += d.local_regulations.length;
    assert.equal(d.status, 'unverified', file);
    assert.deepEqual(d.official_parameters, [], file);
    assert.equal(d.application_policy.auto_apply, false, file);
  }
  assert.equal(matrix.summary.city_files, 22);
  assert.equal(matrix.summary.source_records, total);
  assert.equal(matrix.summary.verified_official_parameters, 0);
  assert.equal(matrix.summary.auto_apply_enabled, false);
});

test('REG-LOCAL-001 newly discovered Taichung and Kaohsiung reward rules are registered but not enabled', () => {
  const taichung = read('regulations/cities/04-taichung.json');
  const kaohsiung = read('regulations/cities/06-kaohsiung.json');
  assert.ok(taichung.local_regulations.some(x => x.id === 'taichung-urban-renewal-volume-reward-rules'));
  assert.ok(kaohsiung.local_regulations.some(x => x.id === 'kaohsiung-urban-renewal-volume-reward-rules'));
  assert.ok(kaohsiung.local_regulations.some(x => x.id === 'kaohsiung-urban-renewal-designated-public-facilities'));
  assert.ok(taichung.local_regulations.every(x => x.status === 'in_review'));
  assert.ok(kaohsiung.local_regulations.every(x => x.status === 'in_review'));
});

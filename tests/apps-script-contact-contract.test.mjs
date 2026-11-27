import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../backend/google-apps-script/Code.gs', import.meta.url), 'utf8');

test('Apps Script contact receiver is valid JavaScript syntax', () => {
  assert.doesNotThrow(() => new Function(source));
});

test('Apps Script receiver requires configured recipient and validates contact payload', () => {
  assert.match(source, /RECIPIENT_EMAIL_NOT_CONFIGURED/);
  assert.match(source, /REQUIRED_FIELD_MISSING/);
  assert.match(source, /INVALID_EMAIL/);
  assert.match(source, /INVALID_PHONE/);
});

test('LINE notification uses configured official-account user/group ID, not visitor LINE ID', () => {
  assert.match(source, /LINE_CHANNEL_ACCESS_TOKEN/);
  assert.match(source, /LINE_TO_ID/);
  assert.match(source, /api\.line\.me\/v2\/bot\/message\/push/);
  assert.doesNotMatch(source, /to:\s*data\.lineId/);
});

test('delivery audit records request ID and per-channel status', () => {
  assert.match(source, /CONTACT_ACCEPTED/);
  assert.match(source, /emailSent/);
  assert.match(source, /lineStatus/);
  assert.match(source, /appendLead_/);
});

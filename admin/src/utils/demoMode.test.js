import test from 'node:test';
import assert from 'node:assert/strict';

import { buildDemoUser, isDemoModeAvailable, readDemoSession } from './demoMode.js';

test('demo auth is disabled for admin sign-in', () => {
  assert.equal(isDemoModeAvailable(), false);
  assert.equal(readDemoSession(), null);
  assert.throws(() => buildDemoUser('guest@aureliagrand.local'), /disabled/i);
});

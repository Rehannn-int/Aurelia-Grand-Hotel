import test from 'node:test';
import assert from 'node:assert/strict';
import { rooms } from '../src/data/sampleData.js';
import { findRoomByCategorySlug, normalizeCategorySlug } from '../src/utils/roomSlug.js';

test('normalizeCategorySlug keeps category names consistent across booking links', () => {
  assert.equal(normalizeCategorySlug('Signature Suite'), 'signature-suite');
  assert.equal(normalizeCategorySlug('Signature suite'), 'signature-suite');
  assert.equal(normalizeCategorySlug('Poolside Villa'), 'poolside-villa');
});

test('booking lookup resolves both room ids and category slugs', () => {
  const byRoomId = findRoomByCategorySlug(rooms, 'sierra-suite');
  const byCategorySlug = findRoomByCategorySlug(rooms, 'signature-suite');

  assert.equal(byRoomId?.category, 'Signature Suite');
  assert.equal(byCategorySlug?.category, 'Signature Suite');
});

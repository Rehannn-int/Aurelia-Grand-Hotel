import test from 'node:test';
import assert from 'node:assert/strict';
import { enumerateStayNights, parseStayDates } from '../src/utils/dateUtils.js';
import ApiError from '../src/utils/ApiError.js';
import InventoryNight from '../src/models/InventoryNight.js';
import Booking from '../src/models/Booking.js';
import Payment from '../src/models/Payment.js';

test('stay dates include check-in night and exclude check-out date', () => {
  const nights = enumerateStayNights('2026-11-02', '2026-11-05');
  assert.deepEqual(nights.map((date) => date.toISOString().slice(0, 10)), [
    '2026-11-02',
    '2026-11-03',
    '2026-11-04',
  ]);
  assert.equal(parseStayDates('2026-11-02', '2026-11-05').nights, 3);
});

test('invalid and reversed stays are rejected', () => {
  assert.throws(() => parseStayDates('2026-02-30', '2026-03-02'), ApiError);
  assert.throws(() => parseStayDates('2026-00-01', '2026-03-02'), ApiError);
  assert.throws(() => parseStayDates('2026-11-05', '2026-11-02'), ApiError);
  assert.throws(() => parseStayDates('2026/11/02', '2026-11-05'), ApiError);
});

test('stays longer than 90 nights are rejected', () => {
  assert.throws(() => parseStayDates('2026-01-01', '2026-04-02'), ApiError);
});

test('inventory enforces at most one reservation per physical room and night', () => {
  const uniqueInventoryIndex = InventoryNight.schema.indexes().find(([keys, options]) => (
    keys.room === 1 && keys.night === 1 && options.unique === true
  ));
  assert.ok(uniqueInventoryIndex);
});

test('booking and payment serialization hides idempotency and provider internals', () => {
  const booking = new Booking({
    reference: 'AG-TEST12345',
    idempotencyKey: 'private-booking-key',
    requestFingerprint: 'private-request-fingerprint',
  }).toJSON();
  const payment = new Payment({
    booking: new Booking()._id,
    provider: 'stripe',
    providerIntentId: 'pi_private',
    idempotencyKey: 'private-payment-key',
    processedWebhookIds: ['evt_private'],
    amount: 100,
    currency: 'INR',
  }).toJSON();
  assert.equal('idempotencyKey' in booking, false);
  assert.equal('requestFingerprint' in booking, false);
  assert.equal('idempotencyKey' in payment, false);
  assert.equal('processedWebhookIds' in payment, false);
  assert.equal('providerIntentId' in payment, false);
});

test('a booking can have only one payment record', () => {
  const uniqueBookingIndex = Payment.schema.indexes().find(([keys, options]) => (
    keys.booking === 1 && options.unique === true
  ));
  assert.ok(uniqueBookingIndex);
});

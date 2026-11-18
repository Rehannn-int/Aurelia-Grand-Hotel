import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../src/config/db.js';
import RoomCategory from '../src/models/RoomCategory.js';
import Room from '../src/models/Room.js';
import InventoryNight from '../src/models/InventoryNight.js';
import { createBooking } from '../src/services/bookingService.js';

test('concurrent overlapping bookings cannot reserve the same physical room', {
  skip: !process.env.MONGODB_TEST_URI,
}, async () => {
  const databaseName = `aurelia_booking_test_${randomUUID().replaceAll('-', '')}`;
  let connected = false;
  try {
    await connectDatabase(process.env.MONGODB_TEST_URI, { dbName: databaseName });
    connected = true;
    const category = await RoomCategory.create({
      name: 'Concurrency Test Category',
      slug: `concurrency-${randomUUID()}`,
      basePrice: 100,
      maxOccupancy: 2,
    });
    await Room.create({ roomNumber: `T-${randomUUID().slice(0, 8)}`, category: category._id });

    const sharedInput = {
      checkIn: '2026-11-02',
      checkOut: '2026-11-05',
      adults: 2,
      children: 0,
      roomCount: 1,
      categoryId: String(category._id),
      guestName: 'Test Guest',
      email: 'guest@example.test',
    };
    const results = await Promise.allSettled([
      createBooking(sharedInput, {
        customer: new mongoose.Types.ObjectId(),
        currency: 'INR',
        idempotencyKey: `test-${randomUUID()}`,
      }),
      createBooking(sharedInput, {
        customer: new mongoose.Types.ObjectId(),
        currency: 'INR',
        idempotencyKey: `test-${randomUUID()}`,
      }),
    ]);

    assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
    const rejected = results.find((result) => result.status === 'rejected');
    assert.equal(rejected.reason.statusCode, 409);
    assert.equal(await InventoryNight.countDocuments(), 3);
  } finally {
    if (connected) {
      await mongoose.connection.dropDatabase();
      await disconnectDatabase();
    }
  }
});

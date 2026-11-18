import test from 'node:test';
import assert from 'node:assert/strict';
import { profileSchema } from '../src/validators/authValidators.js';
import { adminBookingQuerySchema } from '../src/validators/adminValidators.js';
import { staffCreateSchema, staffUpdateSchema } from '../src/validators/staffValidators.js';

test('administrator profile updates cannot change account roles', () => {
  assert.equal(profileSchema.safeParse({ name: 'Hotel Manager' }).success, true);
  assert.equal(profileSchema.safeParse({ role: 'super_admin' }).success, false);
});

test('staff provisioning cannot create or promote a super administrator', () => {
  const base = {
    name: 'New Team Member',
    email: 'staff@example.test',
    password: 'a-safe-temporary-password',
  };
  assert.equal(staffCreateSchema.safeParse({ ...base, role: 'receptionist' }).success, true);
  assert.equal(staffCreateSchema.safeParse({ ...base, role: 'super_admin' }).success, false);
  assert.equal(staffCreateSchema.safeParse({ ...base, role: 'housekeeping_staff' }).success, false);
  assert.equal(staffUpdateSchema.safeParse({ role: 'super_admin' }).success, false);
});

test('reservation filters validate calendar dates and search limits', () => {
  assert.equal(adminBookingQuerySchema.safeParse({ startDate: '2026-10-01', endDate: '2026-10-31' }).success, true);
  assert.equal(adminBookingQuerySchema.safeParse({ startDate: '2026-10-31', endDate: '2026-10-01' }).success, false);
  assert.equal(adminBookingQuerySchema.safeParse({ startDate: '2026-02-30' }).success, false);
});

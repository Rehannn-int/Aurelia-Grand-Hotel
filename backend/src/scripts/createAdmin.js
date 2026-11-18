import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { getEnv } from '../config/env.js';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import User from '../models/User.js';

const env = getEnv();
const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error('Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD in the process environment before running this script.');
}
if (ADMIN_PASSWORD.length < 12 || ADMIN_PASSWORD.length > 128) {
  throw new Error('ADMIN_PASSWORD must contain between 12 and 128 characters.');
}

await connectDatabase(env.MONGODB_URI);
try {
  if (await User.exists({ role: 'super_admin', isActive: true })) {
    throw new Error('An active super administrator already exists; refusing to create another through initial setup.');
  }
  const email = ADMIN_EMAIL.trim().toLowerCase();
  if (await User.exists({ email })) throw new Error('An account already exists for ADMIN_EMAIL.');
  await User.create({
    name: ADMIN_NAME.trim(),
    email,
    passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12),
    role: 'super_admin',
    emailVerified: true,
  });
  console.info(`Initial super administrator created for ${email}.`);
} finally {
  await disconnectDatabase();
}

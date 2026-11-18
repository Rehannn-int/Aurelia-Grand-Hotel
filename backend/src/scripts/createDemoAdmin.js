import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { getEnv } from '../config/env.js';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import User from '../models/User.js';

const DEFAULT_DEMO_ADMIN = {
  name: 'Aurelia Grand Admin',
  email: 'admin@aureliagrand.local',
  password: 'AureliaDemo2026!',
};

export async function ensureLocalDemoAdmin(customEnv = process.env) {
  const env = getEnv(customEnv);

  if (env.NODE_ENV === 'production') {
    throw new Error('Local demo admin setup is disabled in production. Use the secure admin provisioning flow instead.');
  }

  const name = (customEnv.DEMO_ADMIN_NAME || DEFAULT_DEMO_ADMIN.name).trim();
  const email = ((customEnv.DEMO_ADMIN_EMAIL || DEFAULT_DEMO_ADMIN.email)).trim().toLowerCase();
  const password = customEnv.DEMO_ADMIN_PASSWORD || DEFAULT_DEMO_ADMIN.password;

  if (!name || !email || !password) {
    throw new Error('DEMO_ADMIN_NAME, DEMO_ADMIN_EMAIL, and DEMO_ADMIN_PASSWORD must all be set for local demo admin setup.');
  }

  if (password.length < 12 || password.length > 128) {
    throw new Error('DEMO_ADMIN_PASSWORD must be between 12 and 128 characters.');
  }

  await connectDatabase(env.MONGODB_URI);
  try {
    const activeSuperAdmin = await User.findOne({ role: 'super_admin', isActive: true }).sort({ createdAt: 1 });
    if (activeSuperAdmin) {
      const userWithEmail = await User.findOne({ email });
      if (userWithEmail && userWithEmail.role === 'super_admin' && userWithEmail.isActive) {
        console.info(`A demo admin already exists for ${email}. No changes were made. If you need a password reset, use the reset-password flow or update the user manually.`);
        return { status: 'exists', email };
      }

      console.info(`An active super administrator already exists (${activeSuperAdmin.email}). No new demo admin account was created. If you want to use the demo email, reset or update the existing admin account manually.`);
      return { status: 'blocked-existing-admin', email: activeSuperAdmin.email };
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error(`A user already exists for ${email}, but it is not an active super_admin. Refusing to overwrite or change that user's password.`);
    }

    const user = await User.create({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: 'super_admin',
      emailVerified: true,
      isActive: true,
    });

    console.info(`Local demo super administrator created for ${user.email}.`);
    return { status: 'created', email: user.email };
  } finally {
    await disconnectDatabase();
  }
}

try {
  await ensureLocalDemoAdmin(process.env);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

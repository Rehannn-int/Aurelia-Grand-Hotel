import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { sendPasswordResetEmail } from '../services/emailService.js';

const safeUserFields = 'name email phone role isActive emailVerified lastLoginAt createdAt';
const adminRoles = ['super_admin', 'hotel_manager', 'receptionist'];

function issueToken(user, env) {
  return jwt.sign({ tokenVersion: user.tokenVersion }, env.JWT_SECRET, {
    subject: String(user._id),
    expiresIn: env.JWT_EXPIRES_IN,
    issuer: 'aurelia-grand-api',
    audience: 'aurelia-grand-client',
  });
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  const normalizedEmail = email.toLowerCase();
  if (await User.exists({ email: normalizedEmail })) throw new ApiError(409, 'An account with this email already exists');
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email: normalizedEmail, passwordHash, phone, role: 'customer' });
  return sendSuccess(res, { user: user.toJSON() }, 'Account created successfully', 201);
});

async function authenticate(req, res, adminOnly = false) {
  const user = await User.findOne({ email: req.body.email.toLowerCase() }).select('+passwordHash');
  const passwordMatches = user && await bcrypt.compare(req.body.password, user.passwordHash);
  if (!passwordMatches || !user.isActive) throw new ApiError(401, 'Email or password is incorrect');
  if (adminOnly && !adminRoles.includes(user.role)) throw new ApiError(401, 'Email or password is incorrect');
  user.lastLoginAt = new Date();
  await user.save();
  const token = issueToken(user, req.app.locals.env);
  return sendSuccess(res, { token, user: await User.findById(user._id).select(safeUserFields) }, adminOnly ? 'Administrator signed in successfully' : 'Signed in successfully');
}

export const login = asyncHandler(async (req, res) => authenticate(req, res));

export const adminLogin = asyncHandler(async (req, res) => authenticate(req, res, true));

export const updateProfile = asyncHandler(async (req, res) => {
  Object.assign(req.user, req.body);
  await req.user.save();
  const user = await User.findById(req.user._id).select(safeUserFields);
  return sendSuccess(res, { user }, 'Profile updated successfully');
});

export const me = asyncHandler(async (req, res) => sendSuccess(res, { user: req.user }, 'Account retrieved successfully'));

export const logout = asyncHandler(async (req, res) => {
  await User.updateOne({ _id: req.user._id }, { $inc: { tokenVersion: 1 } });
  return sendSuccess(res, null, 'Signed out successfully');
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase() }).select('+passwordResetTokenHash +passwordResetExpiresAt');
  if (user) {
    const resetToken = randomBytes(32).toString('hex');
    user.passwordResetTokenHash = createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();
    await sendPasswordResetEmail(req.app.locals.env, user.email, resetToken);
  }
  return sendSuccess(res, null, 'If an account exists for this email, password reset instructions will be sent');
});

export const resetPassword = asyncHandler(async (req, res) => {
  const tokenHash = createHash('sha256').update(req.body.token).digest('hex');
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpiresAt: { $gt: new Date() },
  }).select('+passwordHash +passwordResetTokenHash +passwordResetExpiresAt');
  if (!user) throw new ApiError(400, 'Password reset token is invalid or expired');
  user.passwordHash = await bcrypt.hash(req.body.password, 12);
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpiresAt = undefined;
  user.tokenVersion += 1;
  await user.save();
  return sendSuccess(res, null, 'Password has been reset');
});

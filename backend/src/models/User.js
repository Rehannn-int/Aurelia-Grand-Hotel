import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  phone: { type: String, trim: true, maxlength: 30 },
  passwordHash: { type: String, required: true, select: false },
  role: {
    type: String,
    enum: ['customer', 'super_admin', 'hotel_manager', 'receptionist', 'housekeeping_staff'],
    default: 'customer',
  },
  isActive: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: false },
  passwordResetTokenHash: { type: String, select: false },
  passwordResetExpiresAt: { type: Date, select: false },
  emailVerificationTokenHash: { type: String, select: false },
  lastLoginAt: Date,
  tokenVersion: { type: Number, default: 0 },
}, { timestamps: true });

userSchema.set('toJSON', {
  transform(_doc, value) {
    delete value.passwordHash;
    delete value.passwordResetTokenHash;
    delete value.passwordResetExpiresAt;
    delete value.emailVerificationTokenHash;
    delete value.tokenVersion;
    return value;
  },
});

export default mongoose.model('User', userSchema);

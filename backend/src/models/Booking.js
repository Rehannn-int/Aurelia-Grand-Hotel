import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  reference: { type: String, required: true, unique: true, index: true },
  idempotencyKey: { type: String, unique: true, sparse: true, select: false },
  requestFingerprint: { type: String, select: false },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  guest: {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    phone: { type: String, default: '', maxlength: 30 },
  },
  rooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }],
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomCategory' },
  checkIn: { type: Date, required: true, index: true },
  checkOut: { type: Date, required: true, index: true },
  adults: { type: Number, required: true, min: 1 },
  children: { type: Number, default: 0, min: 0 },
  roomCount: { type: Number, required: true, min: 1 },
  nightCount: { type: Number, required: true, min: 1 },
  pricing: {
    nightlyRate: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  currency: { type: String, required: true, uppercase: true, minlength: 3, maxlength: 3 },
  status: { type: String, enum: ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'], default: 'pending', index: true },
  paymentStatus: { type: String, enum: ['unpaid', 'pending', 'paid', 'partially_refunded', 'refunded', 'failed'], default: 'unpaid' },
  specialRequests: { type: String, default: '', maxlength: 2000 },
  cancellation: { cancelledAt: Date, reason: { type: String, maxlength: 500 }, cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } },
  source: { type: String, enum: ['web', 'admin'], default: 'web' },
  holdExpiresAt: { type: Date, index: true },
}, { timestamps: true });

bookingSchema.set('toJSON', {
  transform(_doc, value) {
    delete value.idempotencyKey;
    delete value.requestFingerprint;
    return value;
  },
});

export default mongoose.model('Booking', bookingSchema);

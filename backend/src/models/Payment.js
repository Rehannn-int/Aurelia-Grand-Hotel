import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  provider: { type: String, enum: ['stripe'], required: true },
  providerIntentId: { type: String, unique: true, sparse: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, uppercase: true, minlength: 3, maxlength: 3 },
  status: { type: String, enum: ['pending', 'succeeded', 'failed', 'refunded', 'partially_refunded'], default: 'pending', index: true },
  idempotencyKey: { type: String, required: true, unique: true },
  processedWebhookIds: { type: [String], default: [] },
  refundedAmount: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

paymentSchema.index({ booking: 1 }, { unique: true });
paymentSchema.set('toJSON', {
  transform(_doc, value) {
    delete value.idempotencyKey;
    delete value.processedWebhookIds;
    delete value.providerIntentId;
    return value;
  },
});

export default mongoose.model('Payment', paymentSchema);

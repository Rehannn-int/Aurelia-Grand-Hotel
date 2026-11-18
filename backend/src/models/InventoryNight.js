import mongoose from 'mongoose';

const inventoryNightSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  night: { type: Date, required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  holdExpiresAt: { type: Date },
}, { timestamps: true });

inventoryNightSchema.index({ room: 1, night: 1 }, { unique: true });
inventoryNightSchema.index({ holdExpiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });
export default mongoose.model('InventoryNight', inventoryNightSchema);

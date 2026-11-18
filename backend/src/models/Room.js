import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, trim: true, uppercase: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomCategory', required: true, index: true },
  description: { type: String, default: '', maxlength: 2000 },
  operationalStatus: { type: String, enum: ['available', 'occupied', 'maintenance', 'out_of_service'], default: 'available' },
  housekeepingStatus: { type: String, enum: ['clean', 'dirty', 'cleaning', 'inspected'], default: 'clean' },
  floor: { type: Number, default: 0 },
  amenities: { type: [String], default: [] },
  images: { type: [String], default: [] },
  active: { type: Boolean, default: true },
  reservationVersion: { type: Number, default: 0, select: false },
}, { timestamps: true });

roomSchema.index({ roomNumber: 1 }, { unique: true });
roomSchema.set('toJSON', {
  transform(_doc, value) {
    delete value.reservationVersion;
    return value;
  },
});
export default mongoose.model('Room', roomSchema);

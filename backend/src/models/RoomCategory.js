import mongoose from 'mongoose';

const roomCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String, default: '', maxlength: 2000 },
  basePrice: { type: Number, required: true, min: 0 },
  maxOccupancy: { type: Number, required: true, min: 1, max: 20 },
  bedConfiguration: { type: String, default: '', maxlength: 100 },
  size: { type: String, default: '', maxlength: 50 },
  amenities: { type: [String], default: [] },
  images: { type: [String], default: [] },
  active: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('RoomCategory', roomCategorySchema);

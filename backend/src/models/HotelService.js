import mongoose from 'mongoose';

const hotelServiceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 1000, default: '' },
  category: { type: String, enum: ['dining', 'wellness', 'transport', 'concierge', 'other'], default: 'other' },
  price: { type: Number, min: 0, default: 0 },
  currency: { type: String, uppercase: true, minlength: 3, maxlength: 3, default: 'INR' },
  active: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('HotelService', hotelServiceSchema);

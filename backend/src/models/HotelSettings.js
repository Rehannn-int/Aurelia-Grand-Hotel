import mongoose from 'mongoose';

const hotelSettingsSchema = new mongoose.Schema({
  _id: { type: String, default: 'hotel' },
  hotelName: { type: String, required: true, trim: true, maxlength: 120, default: 'Aurelia Grand' },
  contactEmail: { type: String, trim: true, lowercase: true, maxlength: 254, default: '' },
  contactPhone: { type: String, trim: true, maxlength: 30, default: '' },
  timezone: { type: String, trim: true, maxlength: 100, default: 'Asia/Kolkata' },
  currency: { type: String, uppercase: true, minlength: 3, maxlength: 3, default: 'INR' },
}, { timestamps: true });

export default mongoose.model('HotelSettings', hotelSettingsSchema);

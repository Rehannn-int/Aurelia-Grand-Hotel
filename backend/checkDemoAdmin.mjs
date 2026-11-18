import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();
const uri = process.env.MONGODB_URI;
console.log('URI present', !!uri);
await mongoose.connect(uri);
const User = (await import('./src/models/User.js')).default;
const user = await User.findOne({ email: 'admin@aureliagrand.local' }).lean();
console.log('USER:', JSON.stringify(user));
await mongoose.disconnect();

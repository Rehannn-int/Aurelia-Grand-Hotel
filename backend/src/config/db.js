
import mongoose from 'mongoose';

export async function connectDatabase(uri, options = {}) {
  if (!uri) {
    throw new Error('MONGODB_URI is missing from your .env file');
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      ...options,
    });

    console.log(
      `MongoDB connected successfully: ${mongoose.connection.name}`
    );

    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection failed:', {
      name: error.name,
      message: error.message,
      code: error.code,
    });

    throw error;
  }
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
  console.log('MongoDB disconnected.');
}


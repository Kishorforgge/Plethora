import mongoose from 'mongoose';

const mongoUri = process.env.MONGO_URI;

export const connectDB = async (): Promise<void> => {
  const uri = mongoUri || process.env.MONGO_URI;

  if (!uri) {
    console.error('Missing MONGO_URI');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds for DNS/connection issues
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${(error as Error).message}`);
    process.exit(1);
  }
};


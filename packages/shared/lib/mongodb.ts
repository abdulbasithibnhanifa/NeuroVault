import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';
import { env } from '@neurovault/shared/config/env';
import { logger } from '@neurovault/shared/utils/logger';

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections from growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!env.MONGODB_URI) {
    logger.warn('MONGODB_URI is not defined. Database operations will be skipped.');
    return null;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    logger.info('Connecting to MongoDB via Mongoose...');
    cached.promise = mongoose.connect(env.MONGODB_URI, opts).then((mongoose) => {
      logger.info('MongoDB Connected successfully via Mongoose');
      return mongoose;
    }).catch((err) => {
      logger.error('MongoDB connection error:', err);
      cached.promise = null;
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

/**
 * Direct MongoClient for NextAuth Adapter
 * Uses the same singleton pattern for the raw driver client
 */
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (env.MONGODB_URI) {
  if (env.NODE_ENV === 'development') {
    if (!(global as any)._mongoClientPromise) {
      client = new MongoClient(env.MONGODB_URI);
      (global as any)._mongoClientPromise = client.connect();
    }
    clientPromise = (global as any)._mongoClientPromise;
  } else {
    client = new MongoClient(env.MONGODB_URI);
    clientPromise = client.connect();
  }
} else {
  // Graceful failure for dev without DB
  clientPromise = Promise.reject(new Error('MONGODB_URI is not defined')) as any;
}

export { clientPromise };

// Handle connection events
mongoose.connection.on('error', (err) => {
  logger.error('Mongoose connection event error:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('Mongoose disconnected');
});

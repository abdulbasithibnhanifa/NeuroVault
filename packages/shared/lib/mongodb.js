"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientPromise = void 0;
exports.connectDB = connectDB;
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_1 = require("mongodb");
const env_1 = require("@neurovault/shared/config/env");
const logger_1 = require("@neurovault/shared/utils/logger");
/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections from growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;
if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}
async function connectDB() {
    if (cached.conn) {
        return cached.conn;
    }
    if (!env_1.env.MONGODB_URI) {
        logger_1.logger.warn('MONGODB_URI is not defined. Database operations will be skipped.');
        return null;
    }
    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };
        logger_1.logger.info('Connecting to MongoDB via Mongoose...');
        cached.promise = mongoose_1.default.connect(env_1.env.MONGODB_URI, opts).then((mongoose) => {
            logger_1.logger.info('MongoDB Connected successfully via Mongoose');
            return mongoose;
        }).catch((err) => {
            logger_1.logger.error('MongoDB connection error:', err);
            cached.promise = null;
            throw err;
        });
    }
    try {
        cached.conn = await cached.promise;
    }
    catch (e) {
        cached.promise = null;
        throw e;
    }
    return cached.conn;
}
/**
 * Direct MongoClient for NextAuth Adapter
 * Uses the same singleton pattern for the raw driver client
 */
let client;
let clientPromise;
if (env_1.env.MONGODB_URI) {
    if (env_1.env.NODE_ENV === 'development') {
        if (!global._mongoClientPromise) {
            client = new mongodb_1.MongoClient(env_1.env.MONGODB_URI);
            global._mongoClientPromise = client.connect();
        }
        exports.clientPromise = clientPromise = global._mongoClientPromise;
    }
    else {
        client = new mongodb_1.MongoClient(env_1.env.MONGODB_URI);
        exports.clientPromise = clientPromise = client.connect();
    }
}
else {
    // Graceful failure for dev without DB
    exports.clientPromise = clientPromise = Promise.reject(new Error('MONGODB_URI is not defined'));
}
// Handle connection events
mongoose_1.default.connection.on('error', (err) => {
    logger_1.logger.error('Mongoose connection event error:', err);
});
mongoose_1.default.connection.on('disconnected', () => {
    logger_1.logger.warn('Mongoose disconnected');
});

// models/User.ts
// User Model - MongoDB schema for user accounts
// Managed by NextAuth with Google/GitHub OAuth

import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  image?: string;
  settings: {
    strictMode: boolean;
    defaultModel: string;
    similarityThreshold: number;
  };
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  image: { type: String },
  settings: {
    strictMode: { type: Boolean, default: true },
    defaultModel: { type: String, default: 'meta-llama/llama-3.1-8b-instruct:free' },
    similarityThreshold: { type: Number, default: 0.1 },
  },
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

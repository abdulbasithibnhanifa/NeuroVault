import mongoose, { Schema, Document } from 'mongoose';

export interface IChat extends Document {
  userId: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    sources?: any[];
    timestamp: Date;
  }>;
  createdAt: Date;
}

const ChatSchema = new Schema<IChat>({
  userId: { type: String, required: true, index: true },
  messages: [{
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    sources: { type: [Schema.Types.Mixed] },
    timestamp: { type: Date, default: Date.now },
  }],
  createdAt: { type: Date, default: Date.now, index: true },
});

export const Chat = mongoose.models.Chat || mongoose.model<IChat>('Chat', ChatSchema);

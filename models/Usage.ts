import mongoose, { Schema, Document } from 'mongoose';

/**
 * Usage Model tracks LLM token consumption for cost auditing and potential rate limiting.
 */
export interface IUsage extends Document {
  userId: string;
  tokens: number;
  aiModel: string;
  type: 'chat' | 'summarization' | 'embedding';
  createdAt: Date;
}

const UsageSchema = new Schema<IUsage>({
  userId: { type: String, required: true, index: true },
  tokens: { type: Number, required: true },
  aiModel: { type: String, required: true },

  type: { 
    type: String, 
    enum: ['chat', 'summarization', 'embedding'], 
    default: 'chat',
    required: true 
  },
  createdAt: { type: Date, default: Date.now, index: true },
});

export const Usage = mongoose.models.Usage || mongoose.model<IUsage>('Usage', UsageSchema);


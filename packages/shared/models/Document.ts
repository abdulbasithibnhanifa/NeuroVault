import mongoose, { Schema, Document as MongoDocument } from 'mongoose';

export interface IDocument extends MongoDocument {
  userId: string;
  title: string;
  originalFilename?: string;
  type: 'pdf' | 'note' | 'youtube';
  s3Url?: string;
  status: 'uploaded' | 'processing' | 'processed' | 'indexed' | 'analyzed' | 'failed';
  chunkCount: number;
  sharedWith: string[]; // User IDs
  tags: string[];
  suggestedTags: string[];
  description?: string;
  content?: string;
  createdAt: Date;
}

const DocumentSchema = new Schema<IDocument>({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  originalFilename: { type: String },
  type: { type: String, enum: ['pdf', 'note', 'youtube'], required: true },
  s3Url: { type: String },
  status: { type: String, enum: ['uploaded', 'processing', 'processed', 'indexed', 'analyzed', 'failed'], default: 'uploaded' },
  chunkCount: { type: Number, default: 0 },
  sharedWith: [{ type: String, index: true }],
  tags: { type: [String], default: [] },
  suggestedTags: { type: [String], default: [] },
  description: { type: String },
  content: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const DocumentModel = mongoose.models.Document || mongoose.model<IDocument>('Document', DocumentSchema);
export default DocumentModel;

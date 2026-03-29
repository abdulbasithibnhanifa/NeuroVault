/**
 * Backfill Metadata Script
 * Finds all documents with empty suggestedTags and re-runs AI analysis for them.
 * Run with: npx tsx --env-file=.env.local scripts/backfillMetadata.ts
 */
import { connectDB } from '../lib/mongodb';
import { DocumentModel } from '../models/Document';
import { TaggingService } from '../services/ai/taggingService';
import { S3Service } from '../services/storage/s3Service';
import { TextExtractor } from '../services/documents/textExtractor';

async function backfillMetadata() {
  console.log('🔄 Starting metadata backfill...');
  await connectDB();

  const docs = await DocumentModel.find({
    $or: [
      { suggestedTags: { $size: 0 } },
      { suggestedTags: { $exists: false } },
    ],
    status: { $in: ['indexed', 'analyzed', 'processed'] },
  });

  console.log(`Found ${docs.length} documents with empty tags.`);
  const tagger = new TaggingService();

  for (const doc of docs) {
    console.log(`\nProcessing [${doc.type}] "${doc.title}" (${doc._id})`);
    let text = '';

    try {
      if (doc.type === 'pdf' && doc.s3Url) {
        const s3 = new S3Service();
        const key = S3Service.extractKey(doc.s3Url);
        const buffer = await s3.downloadFile(key);
        const extractor = new TextExtractor();
        text = await extractor.extract('pdf', buffer);
      } else if (doc.type === 'note' && (doc as any).content) {
        text = (doc as any).content;
      } else {
        text = doc.description || doc.title;
      }
    } catch (e) {
      console.warn(`  ⚠️  Text extraction failed, using title as fallback`);
      text = doc.title;
    }

    if (!text || text.trim().length < 5) {
      text = doc.title;
    }

    const analysis = await tagger.generateAnalysis(text, doc.userId.toString());
    console.log(`  ✅ Generated ${analysis.tags.length} tags: [${analysis.tags.join(', ')}]`);

    await DocumentModel.findByIdAndUpdate(doc._id, {
      suggestedTags: analysis.tags,
      ...(analysis.summary && !doc.description ? { description: analysis.summary } : {}),
    });
  }

  console.log('\n✅ Backfill complete!');
  process.exit(0);
}

backfillMetadata().catch(err => {
  console.error('❌ Backfill failed:', err);
  process.exit(1);
});

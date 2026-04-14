import { connectDB } from '../lib/mongodb';
import { DocumentModel } from '../models/Document';
import { Queue } from 'bullmq';
import { getRedisClient } from '../lib/redis';
import { DOCUMENT_QUEUE_NAME } from '../queues/documentQueue';

async function reindexDocuments() {
  console.log('Starting reindex of failed documents...');
  await connectDB();
  
  const failedDocs = await DocumentModel.find({ 
    status: { $in: ['failed', 'processing', 'uploaded', 'processed'] } 
  });
  console.log(`Found ${failedDocs.length} documents to re-queue.`);

  const queue = new Queue(DOCUMENT_QUEUE_NAME, { 
    connection: getRedisClient() as any 
  });

  for (const doc of failedDocs) {
    console.log(`Re-queueing document: ${doc.title} (${doc._id}) [Current Status: ${doc.status}]`);
    
    // Remove existing job if it exists to avoid jobId collision
    const existingJob = await queue.getJob(doc._id.toString());
    if (existingJob) {
      await existingJob.remove();
    }

    // For notes, we need to pass 'content' if it's missing from the doc but was meant for extraction
    // Actually, documentWorker.ts checks job.data.content for 'note' type
    await queue.add('process-document', {
      documentId: doc._id.toString(),
      s3Url: doc.s3Url,
      youtubeUrl: doc.youtubeUrl,
      content: doc.content || (doc.type === 'note' ? doc.description : ''), // Fallback for notes if content was in description
      userId: doc.userId,
      type: doc.type || 'pdf'
    }, {
      jobId: doc._id.toString() 
    });

    await DocumentModel.findByIdAndUpdate(doc._id, { status: 'processing' });
  }

  console.log('Re-queueing complete.');
  process.exit(0);
}

reindexDocuments().catch((err) => {
  console.error('Reindex Error:', err);
  process.exit(1);
});

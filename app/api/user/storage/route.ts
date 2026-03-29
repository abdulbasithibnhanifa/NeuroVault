import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { DocumentModel } from '@/models/Document';
import { logger } from '@/utils/logger';
import { RateLimiter } from '@/utils/rateLimiter';

const rateLimiter = new RateLimiter();


const STORAGE_LIMIT_GB = 5.0;
// Estimate: 1 PDF page ≈ 3KB text, average PDF ≈ 50 chunks ≈ ~150KB per doc
// YouTube/note ≈ 10 chunks ≈ ~30KB per doc
const BYTES_PER_CHUNK = 2048; // ~2KB per chunk (conservative estimate)

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. Rate Limiting Check
    const isAllowed = await rateLimiter.checkLimit(userId, 'storage_api', 60);
    if (!isAllowed) {
      logger.warn('Rate limit exceeded for storage stats', { userId });
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }


    await connectDB();

    // Use chunkCount as a proxy since fileSize is not stored in the schema
    const result = await DocumentModel.aggregate([
      { $match: { userId: session.user.id } },
      {
        $group: {
          _id: null,
          totalChunks: { $sum: '$chunkCount' },
          documentCount: { $sum: 1 },
          pdfCount: { $sum: { $cond: [{ $eq: ['$type', 'pdf'] }, 1, 0] } },
        }
      }
    ]);

    const totalChunks = result[0]?.totalChunks || 0;
    const documentCount = result[0]?.documentCount || 0;
    const pdfCount = result[0]?.pdfCount || 0;

    // Estimate size: PDFs are larger (~4KB/chunk), others smaller (~1KB/chunk)
    const estimatedBytes = (pdfCount * totalChunks * 3000) + ((documentCount - pdfCount) * 30000);
    const usedMB = Math.max(estimatedBytes / (1024 * 1024), documentCount > 0 ? documentCount * 0.1 : 0);
    const usedGB = usedMB / 1024;
    const percentUsed = Math.min((usedGB / STORAGE_LIMIT_GB) * 100, 100);

    return NextResponse.json({
      usedBytes: estimatedBytes,
      usedMB: parseFloat(usedMB.toFixed(2)),
      usedGB: parseFloat(usedGB.toFixed(3)),
      limitGB: STORAGE_LIMIT_GB,
      percentUsed: parseFloat(percentUsed.toFixed(1)),
      documentCount,
      totalChunks,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch storage stats' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { DocumentModel } from '@/models/Document';
import { TaggingService } from '@/services/ai/taggingService';
import { S3Service } from '@/services/storage/s3Service';
import { TextExtractor } from '@/services/documents/textExtractor';
import { logger } from '@/utils/logger';

/**
 * POST /api/documents/regenerate
 * Re-runs AI analysis for a specific document and saves the results.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { documentId } = await req.json();
    if (!documentId) {
      return NextResponse.json({ error: 'Missing documentId' }, { status: 400 });
    }

    await connectDB();
    const document = await DocumentModel.findById(documentId);

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    if (document.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const taggingService = new TaggingService();
    let textToAnalyze = '';

    // Get the best available text for analysis
    if (document.type === 'pdf' && document.s3Url) {
      try {
        const s3 = new S3Service();
        const s3Key = S3Service.extractKey(document.s3Url);
        const buffer = await s3.downloadFile(s3Key);
        const extractor = new TextExtractor();
        textToAnalyze = await extractor.extract('pdf', buffer);
      } catch {
        textToAnalyze = document.title;
      }
    } else if (document.type === 'note' && (document as any).content) {
      textToAnalyze = (document as any).content;
    } else if (document.type === 'youtube') {
      textToAnalyze = document.description || document.title;
    }

    // Fallback to title if no text extracted
    if (!textToAnalyze || textToAnalyze.trim().length < 10) {
      textToAnalyze = document.title;
    }

    const analysis = await taggingService.generateAnalysis(textToAnalyze, session.user.id);
    logger.info(`Re-generate analysis for ${documentId}: ${analysis.tags.length} tags`);

    // Save results
    const updatedDoc = await DocumentModel.findByIdAndUpdate(
      documentId,
      {
        suggestedTags: analysis.tags,
        ...(analysis.summary ? { description: analysis.summary } : {}),
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      suggestedTags: analysis.tags,
      description: updatedDoc?.description || '',
    });

  } catch (error: any) {
    logger.error('Regenerate metadata error', { error: error.message });
    return NextResponse.json({ error: 'Failed to regenerate metadata' }, { status: 500 });
  }
}

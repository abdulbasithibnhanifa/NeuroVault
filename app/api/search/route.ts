// app/api/search/route.ts
// GET /api/search - Semantic search across user's knowledge base

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RetrievalService } from '@/services/rag/retrievalService';
import { logger } from '@/utils/logger';
import { RateLimiter } from '@/utils/rateLimiter';

const rateLimiter = new RateLimiter();

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. Rate Limiting Check
    const isAllowed = await rateLimiter.checkLimit(userId, 'search_api', 20);
    if (!isAllowed) {
      logger.warn('Rate limit exceeded for search', { userId });
      return NextResponse.json({ error: 'Too many search requests. Please slow down.' }, { status: 429 });
    }

    const query = req.nextUrl.searchParams.get('q');
    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: 'Missing search query parameter "q"' }, { status: 400 });
    }

    const topK = parseInt(req.nextUrl.searchParams.get('limit') || '10', 10);
    const filterType = req.nextUrl.searchParams.get('type') as any;
    const filterTags = req.nextUrl.searchParams.get('tags')?.split(',').filter(Boolean);
    
    logger.info('Search query received', { userId, query, topK, filterType, filterTags });


    const retrievalService = new RetrievalService();
    const results = await retrievalService.retrieve(userId, query, topK, 0.1, {
      type: filterType,
      tags: filterTags
    });

    // Transform to a user-friendly format
    const searchResults = results.map((r) => ({
      text: r.text,
      documentId: r.documentId,
      chunkIndex: r.chunkIndex,
      similarityScore: r.similarity,
    }));

    logger.info('Search completed', { userId, resultCount: searchResults.length });

    return NextResponse.json({ results: searchResults, query, count: searchResults.length });
  } catch (error: any) {
    logger.error('Search API error', { 
      message: error.message,
      stack: error.stack,
      userId: (await getServerSession(authOptions))?.user?.id 
    });
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred during search' 
      }, 
      { status: 500 }
    );
  }
}


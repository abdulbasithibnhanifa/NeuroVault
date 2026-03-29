export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { DocumentModel } from '@/models/Document';
import { logger } from '@/utils/logger';
import { RateLimiter } from '@/utils/rateLimiter';

const rateLimiter = new RateLimiter();

/**
 * GET /api/graph
 * Returns graph data (nodes and links) for the current user's knowledge base.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. Rate Limiting Check
    const isAllowed = await rateLimiter.checkLimit(userId, 'graph_api', 60);
    if (!isAllowed) {
      logger.warn('Rate limit exceeded for graph', { userId });
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    if (!process.env.MONGODB_URI) {

      logger.warn('MONGODB_URI missing. Returning empty graph.');
      return NextResponse.json({ nodes: [], links: [] });
    }

    await connectDB();

    // 1. Fetch documents (own + shared)
    const documents = await DocumentModel.find({
      $or: [
        { userId: userId },
        { sharedWith: userId }
      ]
    }).lean();

    // 2. Transform into nodes and links
    const nodes: any[] = [];
    const links: any[] = [];
    const tagSet = new Set<string>();

    documents.forEach((doc: any) => {
      // Document Node
      nodes.push({
        id: doc._id.toString(),
        label: doc.title,
        type: 'document',
        docType: doc.type,
        val: 20
      });

      // Process Tags
      if (doc.tags && Array.isArray(doc.tags)) {
        doc.tags.forEach((tag: string) => {
          const tagId = `tag-${tag}`;
          if (!tagSet.has(tag)) {
            tagSet.add(tag);
            nodes.push({
              id: tagId,
              label: `#${tag}`,
              type: 'tag',
              val: 12
            });
          }

          // Link Document to Tag
          links.push({
            source: doc._id.toString(),
            target: tagId
          });
        });
      }
    });

    logger.info("Graph data generated", { 
      userId, 
      nodeCount: nodes.length, 
      linkCount: links.length 
    });

    return NextResponse.json({ nodes, links });

  } catch (error: any) {
    logger.error("Graph API failed", { error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

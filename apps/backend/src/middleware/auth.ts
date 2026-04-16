import { Request, Response, NextFunction } from 'express';
import { jwtVerify } from 'jose';
import { env } from '@neurovault/shared';

/**
 * Middleware to verify NextAuth JWT tokens
 * Allows the Express backend to identify the user from the Vercel frontend request
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.cookies?.['next-auth.session-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const secret = new TextEncoder().encode(env.NEXTAUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);

    if (!payload?.id) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token payload' });
    }

    // Attach user to request object
    (req as any).user = {
      id: payload.id as string,
      email: payload.email as string,
    };

    next();
  } catch (error: any) {
    logger.error('Auth Middleware Error:', { 
      message: error.message, 
      path: req.path,
      hasToken: !!req.headers.authorization || !!req.cookies?.['next-auth.session-token']
    });
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}

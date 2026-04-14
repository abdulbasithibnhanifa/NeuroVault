import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';

/**
 * Middleware to validate MongoDB Object IDs in request parameters or body.
 * Prevents NoSQL injection and unnecessary database calls for invalid IDs.
 */
export const validateObjectId = (source: 'params' | 'body', fieldName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = source === 'params' ? req.params[fieldName] : req.body[fieldName];

    if (value && !Types.ObjectId.isValid(value)) {
      return res.status(400).json({ error: `Invalid ID format for ${fieldName}` });
    }

    next();
  };
};

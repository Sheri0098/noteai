import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from './supabase';

export interface AuthenticatedRequest extends Request {
  userId: string;
  userEmail?: string;
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.header('authorization') || req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    return res.status(401).json({ error: 'Missing bearer token' });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  (req as AuthenticatedRequest).userId = data.user.id;
  (req as AuthenticatedRequest).userEmail = data.user.email || undefined;
  next();
};

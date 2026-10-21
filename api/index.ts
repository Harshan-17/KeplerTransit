import type { Request, Response } from 'express';
import app from '../server';

export const config = {
  maxDuration: 30,
};

export default function handler(req: Request, res: Response) {
  // If Vercel rewrites stripped the /api prefix, restore it so Express route handlers match
  if (req.url && !req.url.startsWith('/api')) {
    req.url = `/api${req.url.startsWith('/') ? req.url : `/${req.url}`}`;
  }
  return app(req, res);
}

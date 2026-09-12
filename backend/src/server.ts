import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import parcelRoutes from './routes/parcels';
import taxRoutes from './routes/tax';
import mutationRoutes from './routes/mutations';
import reconciliationRoutes from './routes/reconciliation';
import complaintRoutes from './routes/complaints';
import toolsRoutes from './routes/tools';
import { ok, fail } from './lib/respond';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      // Allow same-origin / non-browser requests (no Origin header) and whitelisted origins.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
  })
);
app.use(express.json());

// Baseline rate limit across the whole API; auth gets a tighter one in its own router.
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Health Check with live DB probe
app.get('/api/health', async (req: Request, res: Response) => {
  let database = 'unreachable';
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = 'connected';
  } catch {
    // Database may be offline in dev/demo mode
  }
  ok(res, {
    status: 'online',
    service: 'Bangladesh Digital Land Platform API (ভূমি সেবা)',
    database,
    version: '3.1',
    timestamp: new Date().toISOString(),
  });
});

// Mount Modular Routers
app.use('/api/auth', authRoutes);
app.use('/api/parcels', parcelRoutes);
app.use('/api/payments', taxRoutes);
app.use('/api/mutations', mutationRoutes);
app.use('/api/reconciliation', reconciliationRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/tools', toolsRoutes);

// 404 for unmatched API routes
app.use('/api', (req: Request, res: Response) => {
  fail(res, `No route for ${req.method} ${req.originalUrl}`, 404);
});

// Last-resort error handler so a thrown/rejected error never leaks a stack trace or crashes the process.
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err.message === 'Not allowed by CORS') return fail(res, err.message, 403);
  console.error(err);
  fail(res, 'Internal server error', 500);
});

app.listen(PORT, () => {
  console.log(`[Land Platform API] Server running on http://localhost:${PORT}`);
});

export default app;

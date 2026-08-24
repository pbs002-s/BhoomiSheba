import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import parcelRoutes from './routes/parcels';
import taxRoutes from './routes/tax';
import mutationRoutes from './routes/mutations';
import reconciliationRoutes from './routes/reconciliation';
import complaintRoutes from './routes/complaints';
import toolsRoutes from './routes/tools';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health Check with live DB probe
app.get('/api/health', async (req: Request, res: Response) => {
  let database = 'unreachable';
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = 'connected';
  } catch {
    // Database may be offline in dev/demo mode
  }
  res.json({
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

app.listen(PORT, () => {
  console.log(`[Land Platform API] Server running on http://localhost:${PORT}`);
});

export default app;

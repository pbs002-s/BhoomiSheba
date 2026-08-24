import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// List all parcels with optional search query
router.get('/', async (req: Request, res: Response) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';

  try {
    const whereClause: any = {};
    if (query) {
      whereClause.OR = [
        { id: { contains: query, mode: 'insensitive' } },
        { khatianNo: { contains: query, mode: 'insensitive' } },
        { dagNo: { contains: query, mode: 'insensitive' } },
        { holdingNo: { contains: query, mode: 'insensitive' } },
        { currentOwner: { contains: query, mode: 'insensitive' } },
        { nidNumber: { contains: query, mode: 'insensitive' } },
        { mouza: { contains: query, mode: 'insensitive' } },
        { upazila: { contains: query, mode: 'insensitive' } },
        { district: { contains: query, mode: 'insensitive' } },
      ];
    }

    const parcels = await prisma.parcel.findMany({
      where: whereClause,
      select: {
        id: true,
        division: true,
        district: true,
        upazila: true,
        mouza: true,
        jlNumber: true,
        khatianNo: true,
        dagNo: true,
        holdingNo: true,
        landClass: true,
        areaDecimal: true,
        currentOwner: true,
        nidNumber: true,
        phone: true,
        geojsonBoundary: true,
        taxRecords: {
          orderBy: { fiscalYear: 'desc' },
          take: 1,
        },
        mutations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        discrepancies: {
          where: { isResolved: false },
        },
      },
      orderBy: { id: 'asc' },
    });
    res.json(parcels);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific parcel details with all relational records
router.get('/:parcelId', async (req: Request, res: Response) => {
  const { parcelId } = req.params;
  try {
    const parcel = await prisma.parcel.findUnique({
      where: { id: parcelId },
      include: {
        mutations: { orderBy: { createdAt: 'desc' } },
        taxRecords: { orderBy: { fiscalYear: 'desc' } },
        timelineEvents: { orderBy: { eventDate: 'desc' } },
        documents: true,
        discrepancies: { where: { isResolved: false } },
        complaints: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!parcel) {
      return res.status(404).json({ error: `Parcel ${parcelId} not found in authoritative records.` });
    }

    res.json(parcel);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

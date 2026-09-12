import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ok, fail } from '../lib/respond';

const router = Router();
const prisma = new PrismaClient();

// Submit a citizen dispute / grievance complaint
router.post('/', async (req: Request, res: Response) => {
  const { parcelId, complainant, phone, category, description, assignedOffice } = req.body;
  try {
    const trackingNo = `CMP-SAV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const complaint = await prisma.complaint.create({
      data: {
        trackingNo,
        parcelId,
        complainant,
        phone,
        category,
        description,
        assignedOffice: assignedOffice || 'Tetuljhora Union Land Office, Savar',
        status: 'ROUTED',
      },
    });

    // Create a timeline event on the parcel
    await prisma.timelineEvent.create({
      data: {
        parcelId,
        eventType: 'DISPUTE_FILED',
        title: `Dispute Complaint Lodged: ${category}`,
        description: `Filed by ${complainant}. Tracking token: ${trackingNo}. Routed to ${assignedOffice || 'Union Land Office'}.`,
        actor: complainant,
        referenceDoc: trackingNo,
      },
    });

    ok(res, { message: 'Complaint lodged and tracking token issued.', complaint }, 201);
  } catch (error: any) {
    fail(res, error.message);
  }
});

// List complaints for a parcel or all
router.get('/', async (req: Request, res: Response) => {
  const { parcelId } = req.query;
  try {
    const complaints = await prisma.complaint.findMany({
      where: parcelId ? { parcelId: String(parcelId) } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    ok(res, complaints);
  } catch (error: any) {
    fail(res, error.message);
  }
});

// Update complaint status
router.patch('/:id/status', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, resolution } = req.body;
  try {
    const complaint = await prisma.complaint.update({
      where: { id },
      data: { status },
    });
    ok(res, { message: 'Complaint status updated.', complaint });
  } catch (error: any) {
    fail(res, error.message);
  }
});

export default router;

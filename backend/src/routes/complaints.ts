import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

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

    res.status(201).json({
      message: 'Complaint lodged and tracking token issued.',
      complaint,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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
    res.json(complaints);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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
    res.json({ message: 'Complaint status updated.', complaint });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

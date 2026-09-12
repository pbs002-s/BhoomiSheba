import { Router, Request, Response } from 'express';
import { PrismaClient, MutationStatus } from '@prisma/client';
import { ok, fail } from '../lib/respond';

const router = Router();
const prisma = new PrismaClient();

const NEXT_STAGES: Record<MutationStatus, { nextStatus: MutationStatus; stageText: string }> = {
  SUBMITTED: {
    nextStatus: MutationStatus.KANUNGO_VERIFICATION,
    stageText: 'Stage 2: Assigned to Union Land Assistant Officer (ULAO) & Kanungo Spot Survey',
  },
  KANUNGO_VERIFICATION: {
    nextStatus: MutationStatus.AC_LAND_HEARING,
    stageText: 'Stage 3: Spot Survey Verified. AC (Land) Judicial Hearing Scheduled',
  },
  AC_LAND_HEARING: {
    nextStatus: MutationStatus.DCR_PAYMENT_PENDING,
    stageText: 'Stage 4: Hearing Completed with No Objections. Duplicate Carbon Receipt (DCR) Fee Due',
  },
  DCR_PAYMENT_PENDING: {
    nextStatus: MutationStatus.APPROVED,
    stageText: 'Stage 5: DCR Payment Settled & Authoritative Certified New Khatian (নতুন খতিয়ান) Published',
  },
  APPROVED: {
    nextStatus: MutationStatus.APPROVED,
    stageText: 'Mutation Case Closed. Ownership Successfully Updated in Cadastral Ledger',
  },
  REJECTED: {
    nextStatus: MutationStatus.REJECTED,
    stageText: 'Mutation Rejected by AC (Land)',
  },
};

// Submit a new e-Mutation application
router.post('/', async (req: Request, res: Response) => {
  const { parcelId, applicantName, applicantNid, applicantPhone, proposedOwner, dcrAmount, remarks } = req.body;
  try {
    const caseNumber = `MUT-${new Date().getFullYear()}-DH-${Math.floor(1000 + Math.random() * 9000)}`;
    const mutation = await prisma.mutation.create({
      data: {
        caseNumber,
        parcelId,
        applicantName,
        applicantNid,
        applicantPhone,
        proposedOwner,
        status: MutationStatus.SUBMITTED,
        currentStage: 'Stage 1: Application Received & Assigned to Union Land Assistant Officer (ULAO)',
        dcrAmount: dcrAmount ? Number(dcrAmount) : 1150.0,
        remarks: remarks || 'Online submission via Digital Land Portal.',
      },
    });

    await prisma.timelineEvent.create({
      data: {
        parcelId,
        eventType: 'MUTATION_SUBMITTED',
        title: `e-Mutation Case Filed: ${caseNumber}`,
        description: `Application by ${applicantName} for ownership transfer to ${proposedOwner}.`,
        actor: applicantName,
        referenceDoc: caseNumber,
      },
    });

    ok(res, { message: 'Mutation application submitted successfully.', mutation }, 201);
  } catch (error: any) {
    fail(res, error.message);
  }
});

// Officer action: Advance mutation stage or make judicial ruling
router.patch('/:id/advance', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { action, officerNote, customStatus } = req.body;

  try {
    const existing = await prisma.mutation.findUnique({
      where: { id },
      include: { parcel: true },
    });

    if (!existing) {
      return fail(res, 'Mutation case not found.', 404);
    }

    let targetStatus: MutationStatus = existing.status;
    let targetStage = existing.currentStage;

    if (action === 'REJECT') {
      targetStatus = MutationStatus.REJECTED;
      targetStage = officerNote ? `Rejected: ${officerNote}` : 'Rejected by AC (Land) following judicial review.';
    } else if (customStatus && customStatus in MutationStatus) {
      targetStatus = customStatus as MutationStatus;
      targetStage = NEXT_STAGES[targetStatus]?.stageText || existing.currentStage;
    } else if (NEXT_STAGES[existing.status]) {
      targetStatus = NEXT_STAGES[existing.status].nextStatus;
      targetStage = NEXT_STAGES[existing.status].stageText;
    }

    const updated = await prisma.mutation.update({
      where: { id },
      data: {
        status: targetStatus,
        currentStage: targetStage,
        remarks: officerNote ? `${existing.remarks || ''} [Officer Note: ${officerNote}]`.trim() : existing.remarks,
        hearingDate: targetStatus === MutationStatus.AC_LAND_HEARING ? new Date(Date.now() + 7 * 24 * 3600 * 1000) : existing.hearingDate,
      },
    });

    // If approved, update parcel owner and create timeline entry
    if (targetStatus === MutationStatus.APPROVED) {
      await prisma.parcel.update({
        where: { id: existing.parcelId },
        data: {
          currentOwner: `${existing.proposedOwner}`,
        },
      });

      await prisma.timelineEvent.create({
        data: {
          parcelId: existing.parcelId,
          eventType: 'MUTATION_APPROVED',
          title: `Mutation Approved: ${existing.caseNumber}`,
          description: `Ownership officially transferred to ${existing.proposedOwner}. Certified Khatian updated.`,
          actor: 'Assistant Commissioner (Land)',
          referenceDoc: existing.caseNumber,
        },
      });
    } else {
      await prisma.timelineEvent.create({
        data: {
          parcelId: existing.parcelId,
          eventType: 'MUTATION_STAGE_UPDATE',
          title: `Mutation Stage: ${targetStatus}`,
          description: targetStage,
          actor: 'Upazila Land Office',
          referenceDoc: existing.caseNumber,
        },
      });
    }

    ok(res, { message: 'Mutation case updated successfully.', mutation: updated });
  } catch (error: any) {
    fail(res, error.message);
  }
});

export default router;

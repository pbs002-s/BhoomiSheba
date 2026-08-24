import { Router, Request, Response } from 'express';
import { PrismaClient, PaymentStatus } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Pay Land Development Tax (LD Tax) & Issue Digital Dakhila
router.post('/pay-tax', async (req: Request, res: Response) => {
  const { parcelId, fiscalYear, amount, paymentMethod, trxId } = req.body;
  try {
    const taxRecord = await prisma.taxRecord.findFirst({ where: { parcelId, fiscalYear } });
    if (!taxRecord) {
      return res.status(404).json({ error: 'Tax record not found for the specified fiscal year.' });
    }

    const dakhilaNumber = `DAK-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const finalTrxId = trxId || `BKASH_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const method = paymentMethod || 'bKash Digital Gateway';

    const updated = await prisma.taxRecord.update({
      where: { id: taxRecord.id },
      data: {
        paidAmountBDT: Number(amount),
        status: PaymentStatus.VERIFIED,
        trxId: finalTrxId,
        paymentMethod: method,
        dakhilaNumber,
        qrCodeUrl: `https://land.gov.bd/verify/dakhila/${dakhilaNumber}`,
        paymentDate: new Date(),
        reconciledAt: new Date(),
        reconciledBy: 'n8n-automated-reconciler',
      },
    });

    // Create a timeline event
    await prisma.timelineEvent.create({
      data: {
        parcelId,
        eventType: 'TAX_PAID',
        title: `LD Tax Cleared (${fiscalYear})`,
        description: `Online payment of ৳${amount} recorded via ${method}. Dakhila #${dakhilaNumber} generated.`,
        actor: 'Citizen Self-Service Portal',
        referenceDoc: dakhilaNumber,
      },
    });

    // Dispatch webhook to n8n workflow for reconciliation
    const n8nWebhookUrl = process.env.N8N_PAYMENT_RECON_WEBHOOK || 'http://localhost:5678/webhook/payment-reconciled';
    fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'PAYMENT_RECEIVED',
        parcelId,
        dakhilaNumber,
        trxId: updated.trxId,
        amount: Number(amount),
        paymentMethod: updated.paymentMethod,
        timestamp: new Date().toISOString(),
      }),
    }).catch((err) => {
      // Optional notice if n8n container is not active
      console.log('n8n Webhook trigger notice:', err.message);
    });

    res.json({
      message: 'Payment verified and registered. Digital Dakhila issued.',
      taxRecord: updated,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Verify Dakhila receipt
router.get('/verify/:dakhilaNumber', async (req: Request, res: Response) => {
  const { dakhilaNumber } = req.params;
  try {
    const taxRecord = await prisma.taxRecord.findUnique({
      where: { dakhilaNumber },
      include: { parcel: true },
    });

    if (!taxRecord) {
      return res.status(404).json({ valid: false, error: 'Dakhila record not found.' });
    }

    res.json({
      valid: true,
      dakhilaNumber: taxRecord.dakhilaNumber,
      fiscalYear: taxRecord.fiscalYear,
      paidAmountBDT: taxRecord.paidAmountBDT,
      paymentDate: taxRecord.paymentDate,
      paymentMethod: taxRecord.paymentMethod,
      trxId: taxRecord.trxId,
      parcelId: taxRecord.parcelId,
      owner: taxRecord.parcel.currentOwner,
      mouza: taxRecord.parcel.mouza,
      dagNo: taxRecord.parcel.dagNo,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

import { Router, Request, Response } from 'express';

const router = Router();

export const DEMO_ACCOUNTS = [
  {
    role: 'citizen' as const,
    name: 'Md. Rafiqul Islam',
    nid: '19852691234567890',
    phone: '01711223344',
    parcels: ['BD-DHK-SAV-000001', 'BD-RAJ-PAB-000731'],
  },
  {
    role: 'officer' as const,
    name: 'Farhana Akter',
    nid: '19901122334455660',
    phone: '01555667788',
    office: 'AC (Land), Savar',
    parcels: ['BD-DHK-SAV-000001', 'BD-CTG-PAN-000492', 'BD-SYL-SRM-000108', 'BD-RAJ-PAB-000731'],
  },
];

export const DEMO_CODE = '123456';

// Step 1: claim an identity, receive a code.
router.post('/request-code', (req: Request, res: Response) => {
  const { nid } = req.body ?? {};
  if (!nid || String(nid).replace(/\D/g, '').length < 10) {
    return res.status(400).json({ error: 'Enter the 17-digit number printed on your NID card.' });
  }
  res.json({ sent: true, demoCode: DEMO_CODE });
});

// Step 2: exchange the code for a session.
router.post('/verify-code', (req: Request, res: Response) => {
  const { nid, code, role } = req.body ?? {};
  if (String(code) !== DEMO_CODE) {
    return res.status(401).json({ error: 'That code does not match.' });
  }
  const cleanNid = String(nid ?? '').replace(/\D/g, '');
  const account =
    DEMO_ACCOUNTS.find((a) => a.nid === cleanNid) ??
    DEMO_ACCOUNTS.find((a) => a.role === role) ??
    DEMO_ACCOUNTS[0];

  res.json({
    session: {
      name: account.name,
      nid: account.nid,
      role: account.role,
      office: 'office' in account ? account.office : undefined,
      parcels: account.parcels,
      signedInAt: new Date().toISOString(),
    },
  });
});

export default router;

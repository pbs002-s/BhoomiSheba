import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { ok, fail } from '../lib/respond';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-insecure-secret';
const OTP_TTL_MS = 5 * 60 * 1000;

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

// In-memory OTP store, keyed by NID. A real deployment would use Redis or a
// database table with the same shape so it survives a process restart.
const otpStore = new Map<string, { code: string; expiresAt: number }>();

function issueOtp(nid: string): string {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  otpStore.set(nid, { code, expiresAt: Date.now() + OTP_TTL_MS });
  return code;
}

// Tight limiter: OTP requests are the classic SMS-bombing / brute-force target.
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many attempts. Please wait before trying again.' },
});
router.use(authLimiter);

// Step 1: claim an identity, receive a code.
router.post('/request-code', (req: Request, res: Response) => {
  const { nid } = req.body ?? {};
  const cleanNid = String(nid ?? '').replace(/\D/g, '');
  if (cleanNid.length < 10) {
    return fail(res, 'Enter the 17-digit number printed on your NID card.', 400);
  }

  const code = issueOtp(cleanNid);
  if (process.env.NODE_ENV !== 'production') {
    // Demo convenience only — a real deployment dispatches this over SMS and never returns it.
    console.log(`[auth] OTP for ${cleanNid}: ${code}`);
    return ok(res, { sent: true, demoCode: code });
  }
  ok(res, { sent: true });
});

// Step 2: exchange the code for a session.
router.post('/verify-code', (req: Request, res: Response) => {
  const { nid, code, role } = req.body ?? {};
  const cleanNid = String(nid ?? '').replace(/\D/g, '');
  const entry = otpStore.get(cleanNid);

  if (!entry || entry.expiresAt < Date.now()) {
    return fail(res, 'That code has expired. Request a new one.', 401);
  }
  if (String(code ?? '').trim() !== entry.code) {
    return fail(res, 'That code does not match.', 401);
  }
  otpStore.delete(cleanNid);

  const account =
    DEMO_ACCOUNTS.find((a) => a.nid === cleanNid) ??
    DEMO_ACCOUNTS.find((a) => a.role === role) ??
    DEMO_ACCOUNTS[0];

  const session = {
    name: account.name,
    nid: account.nid,
    role: account.role,
    office: 'office' in account ? account.office : undefined,
    parcels: account.parcels,
    signedInAt: new Date().toISOString(),
  };

  const token = jwt.sign({ nid: account.nid, role: account.role }, JWT_SECRET, { expiresIn: '2h' });

  ok(res, { session, token });
});

export default router;

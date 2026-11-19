import { Request, Response, Router } from 'express';
import { PaymentVerificationEngine } from './payment-verification.service';
import { prisma } from '@chatechat/database';

export const financialRouter = Router();

/**
 * 1. Submit Deposit for Automated Verification (7-Tier Security Pipeline)
 */
financialRouter.post('/deposit/submit', async (req: Request, res: Response) => {
  const {
    organizationId = 'org_royal',
    gateway,
    transactionId,
    amountMmk,
    receiverAccountPhone,
    receiverAccountName,
    slipImageBase64,
    customDelayMs,
  } = req.body;

  if (!gateway || !transactionId || !amountMmk) {
    return res.status(400).json({
      success: false,
      error: 'gateway, transactionId, and amountMmk are required fields.',
    });
  }

  let slipImageBytes: Buffer | undefined;
  if (slipImageBase64) {
    const cleanBase64 = slipImageBase64.replace(/^data:image\/\w+;base64,/, '');
    slipImageBytes = Buffer.from(cleanBase64, 'base64');
  }

  const result = await PaymentVerificationEngine.verifyDeposit(
    {
      organizationId,
      gateway,
      transactionId: transactionId.toString().trim(),
      amountMmk: Number(amountMmk),
      receiverAccountPhone,
      receiverAccountName,
      slipImageBytes,
      submissionTimestamp: new Date(),
      customDelayMs: customDelayMs !== undefined ? Number(customDelayMs) : undefined,
    },
    (req as any).socketEmitter
  );

  if (!result.success && result.status === 'REJECTED') {
    return res.status(422).json(result);
  }

  return res.json(result);
});

/**
 * 2. Check Deposit Status & 1-Minute Countdown
 */
financialRouter.get('/deposit/status/:slipId', async (req: Request, res: Response) => {
  const { slipId } = req.params;

  try {
    const statusData = await PaymentVerificationEngine.getSlipStatus(slipId);
    res.json({
      success: true,
      ...statusData,
    });
  } catch (err: any) {
    res.status(404).json({ success: false, error: err.message });
  }
});

/**
 * 2. Get Immutable Financial Ledger & Wallet Balance
 */
financialRouter.get('/ledger/:organizationId', async (req: Request, res: Response) => {
  const { organizationId } = req.params;

  try {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true, walletBalance: true },
    });

    const ledgers = await prisma.financialLedger.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const slips = await prisma.paymentSlip.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({
      success: true,
      walletBalance: org?.walletBalance || 0,
      organizationName: org?.name || 'ChateChat Merchant',
      ledgers,
      slips,
    });
  } catch (err: any) {
    // Graceful offline fallback
    const balance = PaymentVerificationEngine.inMemoryBalances[organizationId] || 0;
    const ledgers = PaymentVerificationEngine.inMemoryLedgers.filter((l) => l.organizationId === organizationId);
    const slips = PaymentVerificationEngine.inMemorySlips.filter((s) => s.organizationId === organizationId);

    res.json({
      success: true,
      walletBalance: balance,
      organizationName: 'ChateChat Merchant',
      ledgers,
      slips,
    });
  }
});

/**
 * 3. Admin Manual Approval (for High-Value > 50,000 MMK Held Transactions)
 */
financialRouter.post('/deposit/admin-approve', async (req: Request, res: Response) => {
  const { slipId, adminUserId = 'admin_michael', approved = true, notes } = req.body;

  if (!slipId) {
    return res.status(400).json({ success: false, error: 'slipId is required.' });
  }

  try {
    const slip = await prisma.paymentSlip.findUnique({
      where: { id: slipId },
    });

    if (!slip) {
      return res.status(404).json({ success: false, error: 'Slip not found' });
    }

    if (slip.status === 'AUTO_APPROVED' || slip.status === 'APPROVED') {
      return res.status(400).json({ success: false, error: 'Slip has already been approved' });
    }

    if (approved) {
      const result = await prisma.$transaction(async (tx: any) => {
        const updatedSlip = await tx.paymentSlip.update({
          where: { id: slipId },
          data: {
            status: 'APPROVED',
            verifiedBy: adminUserId,
            verifiedAt: new Date(),
            notes: notes || `Manually verified and approved by Admin (${adminUserId}) after physical SMS check.`,
          },
        });

        const updatedOrg = await tx.organization.update({
          where: { id: slip.organizationId },
          data: {
            walletBalance: { increment: slip.amountMmk },
          },
        });

        const ledger = await tx.financialLedger.create({
          data: {
            organizationId: slip.organizationId,
            entryType: 'DEPOSIT',
            amount: slip.amountMmk,
            runningBalance: updatedOrg.walletBalance,
            referenceId: slip.transactionId || slip.id,
            description: `Manual Admin Approval via SMS Verification (${adminUserId})`,
          },
        });

        return { updatedSlip, updatedOrg, ledger };
      });

      return res.json({
        success: true,
        message: `Slip ${slipId} approved. Credited ${slip.amountMmk.toLocaleString()} MMK.`,
        newBalance: result.updatedOrg.walletBalance,
      });
    } else {
      await prisma.paymentSlip.update({
        where: { id: slipId },
        data: {
          status: 'REJECTED',
          verifiedBy: adminUserId,
          verifiedAt: new Date(),
          rejectionReason: notes || 'Rejected by Admin during physical verification.',
        },
      });

      return res.json({
        success: true,
        message: `Slip ${slipId} rejected.`,
      });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 4. Engine Health & Security Configuration Status
 */
financialRouter.get('/status', (_req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    engine: 'ChateChat 24/7 Automated Myanmar Payment Verification Engine',
    securityGates: [
      'Gate 1: Format & Concurrency Lock (Race Condition Guard & TxID Format Validation)',
      'Gate 2: Global Database Duplicate Checks (TxID & SHA-256 Slip Hash)',
      'Gate 3: Receipt Vision / Gemini OCR Extraction',
      'Gate 4: Receiver & Data Matching Rules (Name, Suffix, TxID, Amount) -> Auto-Reject on Mismatch',
      'Gate 5: Time Drift & 15-Minute Expiry Rule (MMT UTC+6:30)',
      'Gate 6: Safety Threshold (50,000 MMK auto-credit, >50k manual review)',
      'Gate 7: 1-Minute Security Buffer Delay & Atomic Ledger (Auto-Approve after 60s)',
    ],
    autoApproveDelaySeconds: 60,
    autoRejectOnMismatch: true,
    autoRejectOnInvalidTxId: true,
    autoApproveThresholdMmk: PaymentVerificationEngine.AUTO_APPROVE_THRESHOLD_MMK,
    officialReceiver: PaymentVerificationEngine.OFFICIAL_RECEIVER,
    activeQueuedApprovalJobs: PaymentVerificationEngine.pendingApprovalJobs.size,
    timestampMmt: PaymentVerificationEngine.getMmtDate().toISOString(),
  });
});

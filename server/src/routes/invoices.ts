import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { requireAuth } from '../middleware/auth';
import { getOwnedEvent, pid } from '../utils/ownership';

const router = Router();
router.use(requireAuth);

const InvoiceStatus = z.enum(['DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE']);

const invoiceSchema = z.object({
  number: z.string().min(1),
  amount: z.coerce.number().positive(),
  amountPaid: z.coerce.number().optional(),
  status: InvoiceStatus.optional(),
  dueDate: z.coerce.date().optional().nullable(),
  description: z.string().optional(),
  eventId: z.string().min(1),
  clientId: z.string().min(1),
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const invoices = await prisma.invoice.findMany({
      where: { event: { ownerId: req.user!.id } },
      orderBy: { createdAt: 'desc' },
      include: { client: true, event: true },
    });
    res.json({ invoices });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = invoiceSchema.parse(req.body);
    await getOwnedEvent(data.eventId, req.user!.id);
    const client = await prisma.client.findFirst({ where: { id: data.clientId, ownerId: req.user!.id } });
    if (!client) throw new AppError('Client not found', 404);

    const invoice = await prisma.invoice.create({ data });
    res.status(201).json({ invoice });
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.invoice.findFirst({
      where: { id: pid(req.params.id), event: { ownerId: req.user!.id } },
    });
    if (!existing) throw new AppError('Invoice not found', 404);

    const data = invoiceSchema.partial().omit({ eventId: true, clientId: true }).parse(req.body);
    const invoice = await prisma.invoice.update({ where: { id: pid(req.params.id) }, data });
    res.json({ invoice });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.invoice.findFirst({
      where: { id: pid(req.params.id), event: { ownerId: req.user!.id } },
    });
    if (!existing) throw new AppError('Invoice not found', 404);

    await prisma.invoice.delete({ where: { id: pid(req.params.id) } });
    res.status(204).send();
  })
);

export default router;

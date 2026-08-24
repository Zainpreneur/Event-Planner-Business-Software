import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { pid } from '../utils/ownership';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

const clientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')).optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  notes: z.string().optional(),
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const clients = await prisma.client.findMany({
      where: { ownerId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { events: true } } },
    });
    res.json({ clients });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const client = await prisma.client.findFirst({
      where: { id: pid(req.params.id), ownerId: req.user!.id },
      include: { events: true, invoices: true },
    });
    if (!client) throw new AppError('Client not found', 404);
    res.json({ client });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = clientSchema.parse(req.body);
    const client = await prisma.client.create({
      data: { ...data, ownerId: req.user!.id },
    });
    res.status(201).json({ client });
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = clientSchema.partial().parse(req.body);
    const existing = await prisma.client.findFirst({
      where: { id: pid(req.params.id), ownerId: req.user!.id },
    });
    if (!existing) throw new AppError('Client not found', 404);

    const client = await prisma.client.update({ where: { id: pid(req.params.id) }, data });
    res.json({ client });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.client.findFirst({
      where: { id: pid(req.params.id), ownerId: req.user!.id },
    });
    if (!existing) throw new AppError('Client not found', 404);

    await prisma.client.delete({ where: { id: pid(req.params.id) } });
    res.status(204).send();
  })
);

export default router;

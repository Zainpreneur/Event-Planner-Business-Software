import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { pid } from '../utils/ownership';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

const vendorSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')).optional(),
  phone: z.string().optional(),
  priceRange: z.string().optional(),
  notes: z.string().optional(),
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const vendors = await prisma.vendor.findMany({
      where: { ownerId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ vendors });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const vendor = await prisma.vendor.findFirst({
      where: { id: pid(req.params.id), ownerId: req.user!.id },
      include: { eventVendors: { include: { event: true } } },
    });
    if (!vendor) throw new AppError('Vendor not found', 404);
    res.json({ vendor });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = vendorSchema.parse(req.body);
    const vendor = await prisma.vendor.create({ data: { ...data, ownerId: req.user!.id } });
    res.status(201).json({ vendor });
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = vendorSchema.partial().parse(req.body);
    const existing = await prisma.vendor.findFirst({
      where: { id: pid(req.params.id), ownerId: req.user!.id },
    });
    if (!existing) throw new AppError('Vendor not found', 404);

    const vendor = await prisma.vendor.update({ where: { id: pid(req.params.id) }, data });
    res.json({ vendor });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.vendor.findFirst({
      where: { id: pid(req.params.id), ownerId: req.user!.id },
    });
    if (!existing) throw new AppError('Vendor not found', 404);

    await prisma.vendor.delete({ where: { id: pid(req.params.id) } });
    res.status(204).send();
  })
);

export default router;

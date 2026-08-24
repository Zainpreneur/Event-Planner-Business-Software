import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { requireAuth } from '../middleware/auth';
import { getOwnedEvent, pid } from '../utils/ownership';

const router = Router();
router.use(requireAuth);

const EventStatus = z.enum(['LEAD', 'PLANNING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']);

const eventSchema = z.object({
  title: z.string().min(1),
  type: z.string().optional(),
  status: EventStatus.optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  location: z.string().optional(),
  budget: z.coerce.number().optional(),
  description: z.string().optional(),
  clientId: z.string().optional().nullable(),
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { status, clientId } = req.query as { status?: string; clientId?: string };
    const events = await prisma.event.findMany({
      where: {
        ownerId: req.user!.id,
        ...(status ? { status: status as never } : {}),
        ...(clientId ? { clientId } : {}),
      },
      orderBy: { startDate: 'asc' },
      include: {
        client: true,
        _count: { select: { tasks: true, guests: true, budgetItems: true } },
      },
    });
    res.json({ events });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const event = await prisma.event.findFirst({
      where: { id: pid(req.params.id), ownerId: req.user!.id },
      include: {
        client: true,
        tasks: { orderBy: { dueDate: 'asc' } },
        budgetItems: true,
        guests: true,
        invoices: true,
        eventVendors: { include: { vendor: true } },
      },
    });
    if (!event) throw new AppError('Event not found', 404);
    res.json({ event });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = eventSchema.parse(req.body);
    const event = await prisma.event.create({
      data: { ...data, ownerId: req.user!.id },
    });
    res.status(201).json({ event });
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    await getOwnedEvent(pid(req.params.id), req.user!.id);
    const data = eventSchema.partial().parse(req.body);
    const event = await prisma.event.update({ where: { id: pid(req.params.id) }, data });
    res.json({ event });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await getOwnedEvent(pid(req.params.id), req.user!.id);
    await prisma.event.delete({ where: { id: pid(req.params.id) } });
    res.status(204).send();
  })
);

// ---- Nested: tasks ----

const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.coerce.date().optional().nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
});

router.get(
  '/:eventId/tasks',
  asyncHandler(async (req, res) => {
    await getOwnedEvent(pid(req.params.eventId), req.user!.id);
    const tasks = await prisma.task.findMany({
      where: { eventId: pid(req.params.eventId) },
      orderBy: { dueDate: 'asc' },
    });
    res.json({ tasks });
  })
);

router.post(
  '/:eventId/tasks',
  asyncHandler(async (req, res) => {
    await getOwnedEvent(pid(req.params.eventId), req.user!.id);
    const data = taskSchema.parse(req.body);
    const task = await prisma.task.create({ data: { ...data, eventId: pid(req.params.eventId) } });
    res.status(201).json({ task });
  })
);

router.put(
  '/:eventId/tasks/:taskId',
  asyncHandler(async (req, res) => {
    await getOwnedEvent(pid(req.params.eventId), req.user!.id);
    const data = taskSchema.partial().parse(req.body);
    const task = await prisma.task.update({ where: { id: pid(req.params.taskId) }, data });
    res.json({ task });
  })
);

router.delete(
  '/:eventId/tasks/:taskId',
  asyncHandler(async (req, res) => {
    await getOwnedEvent(pid(req.params.eventId), req.user!.id);
    await prisma.task.delete({ where: { id: pid(req.params.taskId) } });
    res.status(204).send();
  })
);

// ---- Nested: budget items ----

const budgetItemSchema = z.object({
  category: z.string().min(1),
  description: z.string().optional(),
  estimatedCost: z.coerce.number().optional(),
  actualCost: z.coerce.number().optional(),
  paid: z.boolean().optional(),
});

router.get(
  '/:eventId/budget-items',
  asyncHandler(async (req, res) => {
    await getOwnedEvent(pid(req.params.eventId), req.user!.id);
    const budgetItems = await prisma.budgetItem.findMany({ where: { eventId: pid(req.params.eventId) } });
    res.json({ budgetItems });
  })
);

router.post(
  '/:eventId/budget-items',
  asyncHandler(async (req, res) => {
    await getOwnedEvent(pid(req.params.eventId), req.user!.id);
    const data = budgetItemSchema.parse(req.body);
    const budgetItem = await prisma.budgetItem.create({ data: { ...data, eventId: pid(req.params.eventId) } });
    res.status(201).json({ budgetItem });
  })
);

router.put(
  '/:eventId/budget-items/:itemId',
  asyncHandler(async (req, res) => {
    await getOwnedEvent(pid(req.params.eventId), req.user!.id);
    const data = budgetItemSchema.partial().parse(req.body);
    const budgetItem = await prisma.budgetItem.update({ where: { id: pid(req.params.itemId) }, data });
    res.json({ budgetItem });
  })
);

router.delete(
  '/:eventId/budget-items/:itemId',
  asyncHandler(async (req, res) => {
    await getOwnedEvent(pid(req.params.eventId), req.user!.id);
    await prisma.budgetItem.delete({ where: { id: pid(req.params.itemId) } });
    res.status(204).send();
  })
);

// ---- Nested: guests ----

const guestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')).optional(),
  phone: z.string().optional(),
  rsvpStatus: z.enum(['PENDING', 'CONFIRMED', 'DECLINED']).optional(),
  plusOne: z.boolean().optional(),
  notes: z.string().optional(),
});

router.get(
  '/:eventId/guests',
  asyncHandler(async (req, res) => {
    await getOwnedEvent(pid(req.params.eventId), req.user!.id);
    const guests = await prisma.guest.findMany({ where: { eventId: pid(req.params.eventId) } });
    res.json({ guests });
  })
);

router.post(
  '/:eventId/guests',
  asyncHandler(async (req, res) => {
    await getOwnedEvent(pid(req.params.eventId), req.user!.id);
    const data = guestSchema.parse(req.body);
    const guest = await prisma.guest.create({ data: { ...data, eventId: pid(req.params.eventId) } });
    res.status(201).json({ guest });
  })
);

router.put(
  '/:eventId/guests/:guestId',
  asyncHandler(async (req, res) => {
    await getOwnedEvent(pid(req.params.eventId), req.user!.id);
    const data = guestSchema.partial().parse(req.body);
    const guest = await prisma.guest.update({ where: { id: pid(req.params.guestId) }, data });
    res.json({ guest });
  })
);

router.delete(
  '/:eventId/guests/:guestId',
  asyncHandler(async (req, res) => {
    await getOwnedEvent(pid(req.params.eventId), req.user!.id);
    await prisma.guest.delete({ where: { id: pid(req.params.guestId) } });
    res.status(204).send();
  })
);

// ---- Nested: vendor bookings ----

const eventVendorSchema = z.object({
  vendorId: z.string().min(1),
  status: z.enum(['INQUIRY', 'BOOKED', 'CONFIRMED', 'CANCELLED']).optional(),
  cost: z.coerce.number().optional(),
  notes: z.string().optional(),
});

router.post(
  '/:eventId/vendors',
  asyncHandler(async (req, res) => {
    await getOwnedEvent(pid(req.params.eventId), req.user!.id);
    const data = eventVendorSchema.parse(req.body);
    const vendor = await prisma.vendor.findFirst({ where: { id: data.vendorId, ownerId: req.user!.id } });
    if (!vendor) throw new AppError('Vendor not found', 404);

    const eventVendor = await prisma.eventVendor.create({
      data: { ...data, eventId: pid(req.params.eventId) },
    });
    res.status(201).json({ eventVendor });
  })
);

router.put(
  '/:eventId/vendors/:eventVendorId',
  asyncHandler(async (req, res) => {
    await getOwnedEvent(pid(req.params.eventId), req.user!.id);
    const data = eventVendorSchema.partial().omit({ vendorId: true }).parse(req.body);
    const eventVendor = await prisma.eventVendor.update({
      where: { id: pid(req.params.eventVendorId) },
      data,
    });
    res.json({ eventVendor });
  })
);

router.delete(
  '/:eventId/vendors/:eventVendorId',
  asyncHandler(async (req, res) => {
    await getOwnedEvent(pid(req.params.eventId), req.user!.id);
    await prisma.eventVendor.delete({ where: { id: pid(req.params.eventVendorId) } });
    res.status(204).send();
  })
);

export default router;

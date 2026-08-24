import { Router } from 'express';
import { prisma } from '../prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const ownerId = req.user!.id;
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      totalEvents,
      upcomingEvents,
      activeClients,
      openTasks,
      overdueTasks,
      invoices,
      eventsByStatus,
    ] = await Promise.all([
      prisma.event.count({ where: { ownerId } }),
      prisma.event.findMany({
        where: { ownerId, startDate: { gte: now, lte: in30Days } },
        orderBy: { startDate: 'asc' },
        take: 5,
        include: { client: true },
      }),
      prisma.client.count({ where: { ownerId } }),
      prisma.task.count({ where: { event: { ownerId }, status: { not: 'DONE' } } }),
      prisma.task.count({
        where: { event: { ownerId }, status: { not: 'DONE' }, dueDate: { lt: now } },
      }),
      prisma.invoice.findMany({ where: { event: { ownerId } } }),
      prisma.event.groupBy({ by: ['status'], where: { ownerId }, _count: { _all: true } }),
    ]);

    const revenue = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
    const outstanding = invoices.reduce((sum, inv) => sum + (inv.amount - inv.amountPaid), 0);

    res.json({
      totalEvents,
      activeClients,
      openTasks,
      overdueTasks,
      revenue,
      outstanding,
      upcomingEvents,
      eventsByStatus: eventsByStatus.map((row) => ({ status: row.status, count: row._count._all })),
    });
  })
);

export default router;

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const owner = await prisma.user.upsert({
    where: { email: 'demo@planner.com' },
    update: {},
    create: {
      name: 'Demo Planner',
      email: 'demo@planner.com',
      passwordHash,
      role: 'ADMIN',
    },
  });

  const client = await prisma.client.create({
    data: {
      name: 'Amara Chen',
      email: 'amara@example.com',
      phone: '555-0142',
      company: 'Chen & Co.',
      notes: 'Prefers outdoor venues, allergic to peanuts.',
      ownerId: owner.id,
    },
  });

  const photographer = await prisma.vendor.create({
    data: {
      name: 'Golden Hour Photography',
      category: 'Photography',
      contactName: 'Jules Park',
      email: 'jules@goldenhour.example',
      phone: '555-0199',
      priceRange: '$$$',
      ownerId: owner.id,
    },
  });

  const caterer = await prisma.vendor.create({
    data: {
      name: 'Harvest Table Catering',
      category: 'Catering',
      contactName: 'Ravi Patel',
      email: 'ravi@harvesttable.example',
      phone: '555-0177',
      priceRange: '$$',
      ownerId: owner.id,
    },
  });

  const now = new Date();
  const eventDate = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);

  const event = await prisma.event.create({
    data: {
      title: "Amara & Leo's Wedding",
      type: 'Wedding',
      status: 'PLANNING',
      startDate: eventDate,
      location: 'Willow Creek Gardens',
      budget: 25000,
      description: 'Outdoor ceremony, indoor reception for 120 guests.',
      ownerId: owner.id,
      clientId: client.id,
      tasks: {
        create: [
          { title: 'Book venue', status: 'DONE', priority: 'HIGH' },
          { title: 'Send save-the-dates', status: 'IN_PROGRESS', priority: 'MEDIUM', dueDate: now },
          { title: 'Finalize menu with caterer', status: 'TODO', priority: 'HIGH', dueDate: eventDate },
        ],
      },
      budgetItems: {
        create: [
          { category: 'Venue', estimatedCost: 8000, actualCost: 8000, paid: true },
          { category: 'Catering', estimatedCost: 6000, actualCost: 5800, paid: false },
          { category: 'Photography', estimatedCost: 3000, actualCost: 0, paid: false },
        ],
      },
      guests: {
        create: [
          { name: 'Priya Nair', rsvpStatus: 'CONFIRMED', plusOne: true },
          { name: 'Tom Alvarez', rsvpStatus: 'PENDING' },
          { name: 'Grace Kim', rsvpStatus: 'DECLINED' },
        ],
      },
    },
  });

  await prisma.eventVendor.createMany({
    data: [
      { eventId: event.id, vendorId: photographer.id, status: 'BOOKED', cost: 3000 },
      { eventId: event.id, vendorId: caterer.id, status: 'CONFIRMED', cost: 5800 },
    ],
  });

  await prisma.invoice.create({
    data: {
      number: 'INV-1001',
      amount: 12500,
      amountPaid: 5000,
      status: 'PARTIALLY_PAID',
      dueDate: eventDate,
      description: 'Deposit + first installment',
      eventId: event.id,
      clientId: client.id,
    },
  });

  console.log('Seed complete. Login with demo@planner.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

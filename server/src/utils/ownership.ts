import { prisma } from '../prisma';
import { AppError } from './AppError';

// Express types route params as `string | string[]` (to account for repeated
// path segments), but every param this API uses is a single named segment —
// this narrows it back to the plain string it always is at runtime.
export function pid(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

// Confirms the event exists and belongs to the given user; throws a 404 otherwise.
// Used by every nested-resource route (tasks, budget items, guests, invoices, vendor bookings)
// so a user can never read or mutate data attached to someone else's event.
export async function getOwnedEvent(eventId: string, ownerId: string) {
  const event = await prisma.event.findFirst({ where: { id: eventId, ownerId } });
  if (!event) throw new AppError('Event not found', 404);
  return event;
}

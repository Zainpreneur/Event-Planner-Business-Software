export type Role = 'ADMIN' | 'PLANNER' | 'STAFF';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export type EventStatus = 'LEAD' | 'PLANNING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type RsvpStatus = 'PENDING' | 'CONFIRMED' | 'DECLINED';
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
export type VendorBookingStatus = 'INQUIRY' | 'BOOKED' | 'CONFIRMED' | 'CANCELLED';

export interface Client {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  notes?: string | null;
  createdAt: string;
  _count?: { events: number };
  events?: Event[];
  invoices?: Invoice[];
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  priceRange?: string | null;
  notes?: string | null;
  createdAt: string;
  eventVendors?: EventVendor[];
}

export interface EventVendor {
  id: string;
  status: VendorBookingStatus;
  cost: number;
  notes?: string | null;
  vendor?: Vendor;
  event?: Event;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  eventId: string;
}

export interface BudgetItem {
  id: string;
  category: string;
  description?: string | null;
  estimatedCost: number;
  actualCost: number;
  paid: boolean;
  eventId: string;
}

export interface Guest {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  rsvpStatus: RsvpStatus;
  plusOne: boolean;
  notes?: string | null;
  eventId: string;
}

export interface Invoice {
  id: string;
  number: string;
  amount: number;
  amountPaid: number;
  status: InvoiceStatus;
  dueDate?: string | null;
  issuedDate: string;
  description?: string | null;
  eventId: string;
  clientId: string;
  client?: Client;
  event?: Event;
}

export interface Event {
  id: string;
  title: string;
  type?: string | null;
  status: EventStatus;
  startDate: string;
  endDate?: string | null;
  location?: string | null;
  budget: number;
  description?: string | null;
  clientId?: string | null;
  client?: Client | null;
  tasks?: Task[];
  budgetItems?: BudgetItem[];
  guests?: Guest[];
  invoices?: Invoice[];
  eventVendors?: EventVendor[];
  _count?: { tasks: number; guests: number; budgetItems: number };
}

export interface DashboardData {
  totalEvents: number;
  activeClients: number;
  openTasks: number;
  overdueTasks: number;
  revenue: number;
  outstanding: number;
  upcomingEvents: Event[];
  eventsByStatus: { status: EventStatus; count: number }[];
}

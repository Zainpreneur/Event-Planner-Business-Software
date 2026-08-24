import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import authRoutes from './routes/auth';
import clientRoutes from './routes/clients';
import vendorRoutes from './routes/vendors';
import eventRoutes from './routes/events';
import invoiceRoutes from './routes/invoices';
import dashboardRoutes from './routes/dashboard';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN?.split(',') ?? '*',
    })
  );
  app.use(express.json());
  app.use(morgan('dev'));

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/clients', clientRoutes);
  app.use('/api/vendors', vendorRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/invoices', invoiceRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

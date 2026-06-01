import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { env } from './config/env';
import { errorHandler } from './middlewares/error.middleware';

// Routes
import authRoutes from './modules/auth/auth.routes';
import companiesRoutes from './modules/companies/companies.routes';
import usersRoutes from './modules/users/users.routes';
import templatesRoutes from './modules/templates/templates.routes';
import contractsRoutes from './modules/contracts/contracts.routes';
import signaturesRoutes from './modules/signatures/signatures.routes';
import obrasRoutes from './modules/obras/obras.routes';
import purchaseOrdersRoutes from './modules/purchase-orders/purchase-orders.routes';
import uploadsRoutes from './modules/uploads/uploads.routes';
import reportsRoutes from './modules/reports/reports.routes';
import auditRoutes from './modules/audit/audit.routes';

const app = express();

// ─── Security ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: true, // Aceita qualquer origin
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Logging ─────────────────────────────────────────────────────────────────
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// ─── Body parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Static uploads ──────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR)));

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    },
  });
});

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/contracts', contractsRoutes);
app.use('/api/signatures', signaturesRoutes);
app.use('/api/obras', obrasRoutes);
app.use('/api/purchase-orders', purchaseOrdersRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/audit', auditRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada',
    code: 'NOT_FOUND',
  });
});

// ─── Global error handler ────────────────────────────────────────────────────
app.use(errorHandler);

export default app;

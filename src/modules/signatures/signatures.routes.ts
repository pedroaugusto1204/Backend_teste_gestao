import { Router } from 'express';
import { SignaturesController } from './signatures.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantGuard } from '../../middlewares/tenant.middleware';
import { roleGuard } from '../../middlewares/role.middleware';

const router = Router();
const ctrl = new SignaturesController();
const mgr = roleGuard(['ADMIN', 'MANAGER']);

// Public routes (no auth) — must come before auth middleware usage
router.get('/sign/:token', (req, res, next) => ctrl.getSignPage(req, res, next));
router.post('/sign/:token', (req, res, next) => ctrl.confirmSignature(req, res, next));

// Protected routes
router.use(authMiddleware, tenantGuard);
router.get('/', (req, res, next) => ctrl.list(req, res, next));
router.get('/:id', (req, res, next) => ctrl.findById(req, res, next));
router.post('/contracts/:contractId/send', mgr, (req, res, next) => ctrl.send(req, res, next));
router.post('/:id/resend', mgr, (req, res, next) => ctrl.resend(req, res, next));
router.post('/:id/cancel', mgr, (req, res, next) => ctrl.cancel(req, res, next));

export default router;

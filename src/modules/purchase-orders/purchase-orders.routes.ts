import { Router } from 'express';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantGuard } from '../../middlewares/tenant.middleware';
import { roleGuard } from '../../middlewares/role.middleware';

const router = Router();
const ctrl = new PurchaseOrdersController();
const mgr = roleGuard(['ADMIN', 'MANAGER']);
const op = roleGuard(['ADMIN', 'MANAGER', 'OPERATOR']);

router.use(authMiddleware, tenantGuard);

router.get('/next-number', (req, res, next) => ctrl.getNextNumber(req, res, next));
router.get('/', (req, res, next) => ctrl.list(req, res, next));
router.post('/', op, (req, res, next) => ctrl.create(req, res, next));
router.get('/:id', (req, res, next) => ctrl.findById(req, res, next));
router.put('/:id', op, (req, res, next) => ctrl.update(req, res, next));
router.delete('/:id', op, (req, res, next) => ctrl.delete(req, res, next));
router.put('/:id/status', op, (req, res, next) => ctrl.updateStatus(req, res, next));
router.post('/:id/approve', mgr, (req, res, next) => ctrl.approve(req, res, next));

export default router;

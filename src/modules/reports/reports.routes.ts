import { Router } from 'express';
import { ReportsController } from './reports.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantGuard } from '../../middlewares/tenant.middleware';

const router = Router();
const ctrl = new ReportsController();

router.use(authMiddleware, tenantGuard);

router.get('/contracts/overview', (req, res, next) => ctrl.contractsOverview(req, res, next));
router.get('/contracts/expiring', (req, res, next) => ctrl.contractsExpiring(req, res, next));
router.get('/obras/financial', (req, res, next) => ctrl.obrasFinancial(req, res, next));
router.get('/obras/status', (req, res, next) => ctrl.obrasStatus(req, res, next));
router.get('/purchase-orders/summary', (req, res, next) => ctrl.purchaseOrdersSummary(req, res, next));
router.get('/dashboard/consolidated', (req, res, next) => ctrl.consolidated(req, res, next));

export default router;

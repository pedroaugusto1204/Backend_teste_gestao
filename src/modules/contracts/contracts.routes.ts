import { Router } from 'express';
import { ContractsController } from './contracts.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantGuard } from '../../middlewares/tenant.middleware';
import { roleGuard } from '../../middlewares/role.middleware';

const router = Router();
const ctrl = new ContractsController();
const mgr = roleGuard(['ADMIN', 'MANAGER']);

router.use(authMiddleware, tenantGuard);

// Static routes BEFORE parameterized routes
router.get('/dashboard/kpis', (req, res, next) => ctrl.getKPIs(req, res, next));
router.get('/manager/active', (req, res, next) => ctrl.getActiveManager(req, res, next));
router.post('/generate-ai', mgr, (req, res, next) => ctrl.generateAiContract(req, res, next));
router.post('/setup-ai', mgr, (req, res, next) => ctrl.setupAiContract(req, res, next));

router.get('/', (req, res, next) => ctrl.list(req, res, next));
router.post('/', mgr, (req, res, next) => ctrl.create(req, res, next));
router.get('/:id', (req, res, next) => ctrl.findById(req, res, next));
router.put('/:id', mgr, (req, res, next) => ctrl.update(req, res, next));
router.delete('/:id', mgr, (req, res, next) => ctrl.delete(req, res, next));
router.put('/:id/status', mgr, (req, res, next) => ctrl.updateStatus(req, res, next));
router.post('/:id/renew', mgr, (req, res, next) => ctrl.renew(req, res, next));
router.post('/:id/addendum', mgr, (req, res, next) => ctrl.addendum(req, res, next));

export default router;

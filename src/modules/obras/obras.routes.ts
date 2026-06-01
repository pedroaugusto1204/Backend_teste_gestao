import { Router } from 'express';
import { ObrasController } from './obras.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantGuard } from '../../middlewares/tenant.middleware';
import { roleGuard } from '../../middlewares/role.middleware';

const router = Router();
const ctrl = new ObrasController();
const mgr = roleGuard(['ADMIN', 'MANAGER']);
const op = roleGuard(['ADMIN', 'MANAGER', 'OPERATOR']);

router.use(authMiddleware, tenantGuard);

// Dashboard KPIs (static route first)
router.get('/dashboard/kpis', (req, res, next) => ctrl.getKPIs(req, res, next));

// Obras CRUD
router.get('/', (req, res, next) => ctrl.list(req, res, next));
router.post('/', op, (req, res, next) => ctrl.create(req, res, next));
router.get('/:id', (req, res, next) => ctrl.findById(req, res, next));
router.put('/:id', op, (req, res, next) => ctrl.update(req, res, next));
router.delete('/:id', mgr, (req, res, next) => ctrl.delete(req, res, next));
router.get('/:id/summary', (req, res, next) => ctrl.getSummary(req, res, next));
router.put('/:id/status', op, (req, res, next) => ctrl.updateStatus(req, res, next));

// Steps
router.get('/:id/steps', (req, res, next) => ctrl.listSteps(req, res, next));
router.post('/:id/steps', op, (req, res, next) => ctrl.createStep(req, res, next));
router.post('/:id/steps/seed', op, (req, res, next) => ctrl.seedSteps(req, res, next));
router.post('/:id/steps/generate', op, (req, res, next) => ctrl.seedSteps(req, res, next));
router.put('/:id/steps/:sid', op, (req, res, next) => ctrl.updateStep(req, res, next));
router.put('/:id/steps/:sid/toggle', op, (req, res, next) => ctrl.toggleStep(req, res, next));
router.post('/:id/steps/:sid/toggle', op, (req, res, next) => ctrl.toggleStep(req, res, next));
router.delete('/:id/steps/:sid', mgr, (req, res, next) => ctrl.deleteStep(req, res, next));

// Vistorias
router.get('/:id/vistorias', (req, res, next) => ctrl.listVistorias(req, res, next));
router.post('/:id/vistorias', op, (req, res, next) => ctrl.createVistoria(req, res, next));
router.get('/:id/vistorias/:vid', (req, res, next) => ctrl.findVistoriaById(req, res, next));
router.put('/:id/vistorias/:vid', op, (req, res, next) => ctrl.updateVistoria(req, res, next));

// Custos
router.get('/:id/custos/report', (req, res, next) => ctrl.getCostReport(req, res, next));
router.get('/:id/custos', (req, res, next) => ctrl.listCustos(req, res, next));
router.post('/:id/custos', op, (req, res, next) => ctrl.createCusto(req, res, next));
router.put('/:id/custos/:cid', op, (req, res, next) => ctrl.updateCusto(req, res, next));
router.delete('/:id/custos/:cid', mgr, (req, res, next) => ctrl.deleteCusto(req, res, next));

export default router;

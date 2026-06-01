import { Router } from 'express';
import { TemplatesController } from './templates.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantGuard } from '../../middlewares/tenant.middleware';
import { roleGuard } from '../../middlewares/role.middleware';

const router = Router();
const ctrl = new TemplatesController();
const mgr = roleGuard(['ADMIN', 'MANAGER']);

router.use(authMiddleware, tenantGuard);

router.get('/seed/defaults', mgr, (req, res, next) => ctrl.seedDefaults(req, res, next));
router.get('/', (req, res, next) => ctrl.list(req, res, next));
router.post('/', mgr, (req, res, next) => ctrl.create(req, res, next));
router.get('/:id', (req, res, next) => ctrl.findById(req, res, next));
router.put('/:id', mgr, (req, res, next) => ctrl.update(req, res, next));
router.delete('/:id', mgr, (req, res, next) => ctrl.archive(req, res, next));
router.post('/:id/fields', mgr, (req, res, next) => ctrl.addField(req, res, next));
router.put('/:id/fields/:fid', mgr, (req, res, next) => ctrl.updateField(req, res, next));
router.delete('/:id/fields/:fid', mgr, (req, res, next) => ctrl.deleteField(req, res, next));

export default router;

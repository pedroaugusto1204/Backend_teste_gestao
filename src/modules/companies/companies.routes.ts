import { Router } from 'express';
import { CompaniesController } from './companies.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantGuard } from '../../middlewares/tenant.middleware';
import { roleGuard } from '../../middlewares/role.middleware';

const router = Router();
const ctrl = new CompaniesController();

// All company routes require ADMIN role
router.use(authMiddleware, tenantGuard, roleGuard(['ADMIN']));

router.get('/', (req, res, next) => ctrl.list(req, res, next));
router.post('/', (req, res, next) => ctrl.create(req, res, next));
router.get('/:id', (req, res, next) => ctrl.findById(req, res, next));
router.put('/:id', (req, res, next) => ctrl.update(req, res, next));

export default router;

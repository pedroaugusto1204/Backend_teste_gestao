import { Router } from 'express';
import { UsersController } from './users.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantGuard } from '../../middlewares/tenant.middleware';
import { roleGuard } from '../../middlewares/role.middleware';

const router = Router();
const ctrl = new UsersController();

router.use(authMiddleware, tenantGuard);

router.get('/', roleGuard(['ADMIN', 'MANAGER']), (req, res, next) => ctrl.list(req, res, next));
router.post('/', roleGuard(['ADMIN']), (req, res, next) => ctrl.create(req, res, next));
router.get('/:id', (req, res, next) => ctrl.findById(req, res, next));
router.put('/:id', roleGuard(['ADMIN', 'MANAGER']), (req, res, next) => ctrl.update(req, res, next));
router.delete('/:id', roleGuard(['ADMIN']), (req, res, next) => ctrl.deactivate(req, res, next));
router.put('/:id/password', (req, res, next) => ctrl.changePassword(req, res, next));

export default router;

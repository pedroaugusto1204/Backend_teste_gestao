import { Router } from 'express';
import { AuditController } from './audit.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantGuard } from '../../middlewares/tenant.middleware';
import { roleGuard } from '../../middlewares/role.middleware';

const router = Router();
const ctrl = new AuditController();

router.use(authMiddleware, tenantGuard, roleGuard(['ADMIN', 'MANAGER']));
router.get('/', (req, res, next) => ctrl.list(req, res, next));

export default router;

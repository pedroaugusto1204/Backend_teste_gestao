import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();
const ctrl = new AuthController();

router.post('/register', (req, res, next) => ctrl.register(req, res, next));
router.post('/login', (req, res, next) => ctrl.login(req, res, next));
router.post('/refresh', (req, res, next) => ctrl.refresh(req, res, next));
router.post('/logout', authMiddleware, (req, res) => ctrl.logout(req, res));
router.get('/me', authMiddleware, (req, res, next) => ctrl.me(req, res, next));

export default router;

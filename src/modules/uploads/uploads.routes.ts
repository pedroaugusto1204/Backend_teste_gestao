import { Router } from 'express';
import { UploadsController } from './uploads.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { uploadMiddleware } from '../../middlewares/upload.middleware';

const router = Router();
const ctrl = new UploadsController();

// All upload routes require authentication
router.use(authMiddleware);

// POST /api/uploads — upload a single file (field name: "file")
router.post('/', uploadMiddleware.single('file'), (req, res) => ctrl.upload(req, res));

// GET /api/uploads — list all uploaded files
router.get('/', (req, res) => ctrl.list(req, res));

// DELETE /api/uploads/:filename — remove a file from disk
router.delete('/:filename', (req, res, next) => ctrl.delete(req, res, next));

export default router;

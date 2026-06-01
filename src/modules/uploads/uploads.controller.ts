import { Request, Response, NextFunction } from 'express';
import { UploadsService } from './uploads.service';

export class UploadsController {
  private service = new UploadsService();

  /**
   * POST /api/uploads
   * Receives a file via multipart/form-data (field name: "file").
   * The actual file saving is handled by the uploadMiddleware in the route.
   */
  upload(req: Request, res: Response): void {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'Nenhum arquivo enviado. Use o campo "file" no form-data.',
        code: 'NO_FILE',
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/${req.file.filename}`,
      },
    });
  }

  /**
   * GET /api/uploads
   * Lists all uploaded files.
   */
  list(_req: Request, res: Response): void {
    const files = this.service.listFiles();
    res.json({ success: true, data: files });
  }

  /**
   * DELETE /api/uploads/:filename
   * Removes a file from disk.
   */
  delete(req: Request, res: Response, next: NextFunction): void {
    try {
      const { filename } = req.params;
      const deleted = this.service.deleteFile(filename);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Arquivo não encontrado.',
          code: 'FILE_NOT_FOUND',
        });
        return;
      }

      res.json({ success: true, data: { message: 'Arquivo removido com sucesso.' } });
    } catch (err) {
      next(err);
    }
  }
}

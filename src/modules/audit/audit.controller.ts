import { Request, Response, NextFunction } from 'express';
import { AuditService } from './audit.service';
import { successResponse } from '../../utils/response';

const svc = new AuditService();

export class AuditController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const r = await svc.list(req.companyId!, req);
      res.json(successResponse(r.logs, r.meta));
    } catch (err) { next(err); }
  }
}

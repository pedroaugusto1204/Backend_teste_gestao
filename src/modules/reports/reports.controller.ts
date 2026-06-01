import { Request, Response, NextFunction } from 'express';
import { ReportsService } from './reports.service';
import { successResponse } from '../../utils/response';

const svc = new ReportsService();

export class ReportsController {
  async contractsOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const r = await svc.contractsOverview(req.companyId!);
      res.json(successResponse(r));
    } catch (err) { next(err); }
  }

  async contractsExpiring(req: Request, res: Response, next: NextFunction) {
    try {
      const r = await svc.contractsExpiring(req.companyId!, req);
      res.json(successResponse(r));
    } catch (err) { next(err); }
  }

  async obrasFinancial(req: Request, res: Response, next: NextFunction) {
    try {
      const r = await svc.obrasFinancial(req.companyId!);
      res.json(successResponse(r));
    } catch (err) { next(err); }
  }

  async obrasStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const r = await svc.obrasStatus(req.companyId!);
      res.json(successResponse(r));
    } catch (err) { next(err); }
  }

  async purchaseOrdersSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const r = await svc.purchaseOrdersSummary(req.companyId!);
      res.json(successResponse(r));
    } catch (err) { next(err); }
  }

  async consolidated(req: Request, res: Response, next: NextFunction) {
    try {
      const r = await svc.consolidatedDashboard(req.companyId!);
      res.json(successResponse(r));
    } catch (err) { next(err); }
  }
}

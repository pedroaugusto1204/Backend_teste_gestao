import { Request, Response, NextFunction } from 'express';
import { ContractsService } from './contracts.service';
import {
  createContractSchema,
  updateContractSchema,
  updateStatusSchema,
  generateAiSchema,
} from './contracts.schemas';
import { successResponse } from '../../utils/response';

const svc = new ContractsService();

export class ContractsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await svc.list(req.companyId!, req);
      res.json(successResponse(result.contracts, result.meta));
    } catch (err) { next(err); }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const c = await svc.findById(req.params.id, req.companyId!);
      res.json(successResponse(c));
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createContractSchema.parse(req.body);
      const c = await svc.create(req.companyId!, req.user!.userId, data);
      res.status(201).json(successResponse(c));
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateContractSchema.parse(req.body);
      const c = await svc.update(req.params.id, req.companyId!, data);
      res.json(successResponse(c));
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await svc.delete(req.params.id, req.companyId!);
      res.json(successResponse({ message: 'Contrato excluído' }));
    } catch (err) { next(err); }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateStatusSchema.parse(req.body);
      const c = await svc.updateStatus(req.params.id, req.companyId!, data);
      res.json(successResponse(c));
    } catch (err) { next(err); }
  }

  async renew(req: Request, res: Response, next: NextFunction) {
    try {
      const c = await svc.renew(req.params.id, req.companyId!, req.user!.userId);
      res.status(201).json(successResponse(c));
    } catch (err) { next(err); }
  }

  async addendum(req: Request, res: Response, next: NextFunction) {
    try {
      const c = await svc.addendum(req.params.id, req.companyId!, req.user!.userId);
      res.status(201).json(successResponse(c));
    } catch (err) { next(err); }
  }

  async getKPIs(req: Request, res: Response, next: NextFunction) {
    try {
      const kpis = await svc.getKPIs(req.companyId!);
      res.json(successResponse(kpis));
    } catch (err) { next(err); }
  }

  async getActiveManager(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await svc.getActiveManager(req.companyId!, req);
      res.json(successResponse(result.contracts, result.meta));
    } catch (err) { next(err); }
  }

  async generateAiContract(req: Request, res: Response, next: NextFunction) {
    try {
      const data = generateAiSchema.parse(req.body);
      const result = await svc.generateAiContract(req.companyId!, data);
      res.status(200).json(successResponse(result));
    } catch (err) { next(err); }
  }

  async setupAiContract(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await svc.setupAiContract(req.companyId!, req.body.apiKey);
      res.status(200).json(successResponse(result));
    } catch (err) { next(err); }
  }
}

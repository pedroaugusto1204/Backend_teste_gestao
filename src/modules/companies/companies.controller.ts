import { Request, Response, NextFunction } from 'express';
import { CompaniesService } from './companies.service';
import { createCompanySchema, updateCompanySchema } from './companies.schemas';
import { successResponse } from '../../utils/response';

const svc = new CompaniesService();

export class CompaniesController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await svc.list(req);
      res.json(successResponse(result.companies, result.meta));
    } catch (err) { next(err); }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const company = await svc.findById(req.params.id);
      res.json(successResponse(company));
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createCompanySchema.parse(req.body);
      const company = await svc.create(data);
      res.status(201).json(successResponse(company));
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateCompanySchema.parse(req.body);
      const company = await svc.update(req.params.id, data);
      res.json(successResponse(company));
    } catch (err) { next(err); }
  }
}

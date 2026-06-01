import { Request, Response, NextFunction } from 'express';
import { TemplatesService } from './templates.service';
import {
  createTemplateSchema,
  updateTemplateSchema,
  createFieldSchema,
  updateFieldSchema,
} from './templates.schemas';
import { successResponse } from '../../utils/response';

const svc = new TemplatesService();

export class TemplatesController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await svc.list(req.companyId!, req);
      res.json(successResponse(result.templates, result.meta));
    } catch (err) { next(err); }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const t = await svc.findById(req.params.id, req.companyId!);
      res.json(successResponse(t));
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createTemplateSchema.parse(req.body);
      const t = await svc.create(req.companyId!, data);
      res.status(201).json(successResponse(t));
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateTemplateSchema.parse(req.body);
      const t = await svc.update(req.params.id, req.companyId!, data);
      res.json(successResponse(t));
    } catch (err) { next(err); }
  }

  async archive(req: Request, res: Response, next: NextFunction) {
    try {
      await svc.archive(req.params.id, req.companyId!);
      res.json(successResponse({ message: 'Template arquivado' }));
    } catch (err) { next(err); }
  }

  async addField(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createFieldSchema.parse(req.body);
      const field = await svc.addField(req.params.id, req.companyId!, data);
      res.status(201).json(successResponse(field));
    } catch (err) { next(err); }
  }

  async updateField(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateFieldSchema.parse(req.body);
      const field = await svc.updateField(req.params.id, req.params.fid, req.companyId!, data);
      res.json(successResponse(field));
    } catch (err) { next(err); }
  }

  async deleteField(req: Request, res: Response, next: NextFunction) {
    try {
      await svc.deleteField(req.params.id, req.params.fid, req.companyId!);
      res.json(successResponse({ message: 'Campo removido' }));
    } catch (err) { next(err); }
  }

  async seedDefaults(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await svc.seedDefaults(req.companyId!);
      res.json(successResponse(result));
    } catch (err) { next(err); }
  }
}

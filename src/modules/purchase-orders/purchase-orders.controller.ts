import { Request, Response, NextFunction } from 'express';
import { PurchaseOrdersService } from './purchase-orders.service';
import {
  createPOSchema,
  updatePOSchema,
  approveSchema,
} from './purchase-orders.schemas';
import { successResponse } from '../../utils/response';
import { z } from 'zod';

const svc = new PurchaseOrdersService();

export class PurchaseOrdersController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const r = await svc.list(req.companyId!, req);
      res.json(successResponse(r.pos, r.meta));
    } catch (err) { next(err); }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const po = await svc.findById(req.params.id, req.companyId!);
      res.json(successResponse(po));
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createPOSchema.parse(req.body);
      const po = await svc.create(req.companyId!, data);
      res.status(201).json(successResponse(po));
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updatePOSchema.parse(req.body);
      const po = await svc.update(req.params.id, req.companyId!, data);
      res.json(successResponse(po));
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await svc.delete(req.params.id, req.companyId!);
      res.json(successResponse({ message: 'Ordem de compra excluída' }));
    } catch (err) { next(err); }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = z.object({ status: z.string() }).parse(req.body);
      const po = await svc.updateStatus(req.params.id, req.companyId!, status);
      res.json(successResponse(po));
    } catch (err) { next(err); }
  }

  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const data = approveSchema.parse(req.body);
      const po = await svc.approve(req.params.id, req.companyId!, data);
      res.json(successResponse(po));
    } catch (err) { next(err); }
  }

  async getNextNumber(req: Request, res: Response, next: NextFunction) {
    try {
      const number = await svc.getNextNumber(req.companyId!);
      res.json(successResponse({ number }));
    } catch (err) { next(err); }
  }
}

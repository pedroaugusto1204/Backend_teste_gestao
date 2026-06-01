import { Request, Response, NextFunction } from 'express';
import { ObrasService } from './obras.service';
import {
  createObraSchema,
  updateObraSchema,
  createStepSchema,
  updateStepSchema,
  createVistoriaSchema,
  updateVistoriaSchema,
  createCustoSchema,
  updateCustoSchema,
} from './obras.schemas';
import { successResponse } from '../../utils/response';
import { z } from 'zod';

const svc = new ObrasService();

export class ObrasController {
  // ── OBRAS ──
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const r = await svc.list(req.companyId!, req);
      res.json(successResponse(r.obras, r.meta));
    } catch (err) { next(err); }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const obra = await svc.findById(req.params.id, req.companyId!);
      res.json(successResponse(obra));
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createObraSchema.parse(req.body);
      const obra = await svc.create(req.companyId!, req.user!.userId, data);
      res.status(201).json(successResponse(obra));
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateObraSchema.parse(req.body);
      const obra = await svc.update(req.params.id, req.companyId!, data);
      res.json(successResponse(obra));
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await svc.delete(req.params.id, req.companyId!);
      res.json(successResponse({ message: 'Obra excluída' }));
    } catch (err) { next(err); }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = z.object({ status: z.string() }).parse(req.body);
      const obra = await svc.updateStatus(req.params.id, req.companyId!, status);
      res.json(successResponse(obra));
    } catch (err) { next(err); }
  }

  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await svc.getSummary(req.params.id, req.companyId!);
      res.json(successResponse(summary));
    } catch (err) { next(err); }
  }

  async getKPIs(req: Request, res: Response, next: NextFunction) {
    try {
      const kpis = await svc.getDashboardKPIs(req.companyId!);
      res.json(successResponse(kpis));
    } catch (err) { next(err); }
  }

  // ── STEPS ──
  async listSteps(req: Request, res: Response, next: NextFunction) {
    try {
      const steps = await svc.listSteps(req.params.id, req.companyId!);
      res.json(successResponse(steps));
    } catch (err) { next(err); }
  }

  async createStep(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createStepSchema.parse(req.body);
      const step = await svc.createStep(req.params.id, req.companyId!, data);
      res.status(201).json(successResponse(step));
    } catch (err) { next(err); }
  }

  async updateStep(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateStepSchema.parse(req.body);
      const step = await svc.updateStep(req.params.id, req.params.sid, req.companyId!, data);
      res.json(successResponse(step));
    } catch (err) { next(err); }
  }

  async deleteStep(req: Request, res: Response, next: NextFunction) {
    try {
      await svc.deleteStep(req.params.id, req.params.sid, req.companyId!);
      res.json(successResponse({ message: 'Etapa removida' }));
    } catch (err) { next(err); }
  }

  async seedSteps(req: Request, res: Response, next: NextFunction) {
    try {
      await svc.seedSteps(req.params.id, req.companyId!);
      const updatedObra = await svc.findById(req.params.id, req.companyId!);
      res.json(successResponse(updatedObra));
    } catch (err) { next(err); }
  }

  async toggleStep(req: Request, res: Response, next: NextFunction) {
    try {
      await svc.toggleStep(req.params.id, req.params.sid, req.companyId!);
      const updatedObra = await svc.findById(req.params.id, req.companyId!);
      res.json(successResponse(updatedObra));
    } catch (err) { next(err); }
  }

  // ── VISTORIAS ──
  async listVistorias(req: Request, res: Response, next: NextFunction) {
    try {
      const vs = await svc.listVistorias(req.params.id, req.companyId!);
      res.json(successResponse(vs));
    } catch (err) { next(err); }
  }

  async createVistoria(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createVistoriaSchema.parse(req.body);
      await svc.createVistoria(req.params.id, req.companyId!, data);
      const updatedObra = await svc.findById(req.params.id, req.companyId!);
      res.status(201).json(successResponse(updatedObra));
    } catch (err) { next(err); }
  }

  async findVistoriaById(req: Request, res: Response, next: NextFunction) {
    try {
      const v = await svc.findVistoriaById(req.params.id, req.params.vid, req.companyId!);
      res.json(successResponse(v));
    } catch (err) { next(err); }
  }

  async updateVistoria(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateVistoriaSchema.parse(req.body);
      const v = await svc.updateVistoria(req.params.id, req.params.vid, req.companyId!, data);
      res.json(successResponse(v));
    } catch (err) { next(err); }
  }

  // ── CUSTOS ──
  async listCustos(req: Request, res: Response, next: NextFunction) {
    try {
      const r = await svc.listCustos(req.params.id, req.companyId!, req);
      res.json(successResponse(r.custos, { ...r.meta, total_value: r.total_value }));
    } catch (err) { next(err); }
  }

  async createCusto(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createCustoSchema.parse(req.body);
      await svc.createCusto(req.params.id, req.companyId!, data);
      const updatedObra = await svc.findById(req.params.id, req.companyId!);
      res.status(201).json(successResponse(updatedObra));
    } catch (err) { next(err); }
  }

  async updateCusto(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateCustoSchema.parse(req.body);
      const c = await svc.updateCusto(req.params.id, req.params.cid, req.companyId!, data);
      res.json(successResponse(c));
    } catch (err) { next(err); }
  }

  async deleteCusto(req: Request, res: Response, next: NextFunction) {
    try {
      await svc.deleteCusto(req.params.id, req.params.cid, req.companyId!);
      res.json(successResponse({ message: 'Custo removido' }));
    } catch (err) { next(err); }
  }

  async getCostReport(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await svc.getCostReport(req.params.id, req.companyId!);
      res.json(successResponse(report));
    } catch (err) { next(err); }
  }
}

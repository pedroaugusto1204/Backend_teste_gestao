import { Request, Response, NextFunction } from 'express';
import { SignaturesService } from './signatures.service';
import {
  sendSignatureSchema,
  confirmSignatureSchema,
} from './signatures.schemas';
import { successResponse } from '../../utils/response';

const svc = new SignaturesService();

export class SignaturesController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await svc.list(req.companyId!, req);
      res.json(successResponse(result.requests, result.meta));
    } catch (err) { next(err); }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const s = await svc.findById(req.params.id, req.companyId!);
      res.json(successResponse(s));
    } catch (err) { next(err); }
  }

  async send(req: Request, res: Response, next: NextFunction) {
    try {
      const data = sendSignatureSchema.parse(req.body);
      const result = await svc.send(req.params.contractId, req.companyId!, data);
      res.status(201).json(successResponse(result));
    } catch (err) { next(err); }
  }

  async resend(req: Request, res: Response, next: NextFunction) {
    try {
      const s = await svc.resend(req.params.id, req.companyId!);
      res.json(successResponse(s));
    } catch (err) { next(err); }
  }

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const s = await svc.cancel(req.params.id, req.companyId!);
      res.json(successResponse(s));
    } catch (err) { next(err); }
  }

  /** Public — no auth */
  async getSignPage(req: Request, res: Response, next: NextFunction) {
    try {
      const page = await svc.getPublicSignPage(req.params.token);
      res.json(successResponse(page));
    } catch (err) { next(err); }
  }

  /** Public — no auth */
  async confirmSignature(req: Request, res: Response, next: NextFunction) {
    try {
      const data = confirmSignatureSchema.parse(req.body);
      const ipAddress = req.ip ?? 'unknown';
      const userAgent = req.get('user-agent') ?? 'unknown';
      const result = await svc.confirmSignature(
        req.params.token,
        data,
        ipAddress,
        userAgent
      );
      res.json(successResponse(result));
    } catch (err) { next(err); }
  }
}

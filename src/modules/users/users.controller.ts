import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';
import {
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
} from './users.schemas';
import { successResponse } from '../../utils/response';

const svc = new UsersService();

export class UsersController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await svc.list(req.companyId!, req);
      res.json(successResponse({ users: result.users }, result.meta));
    } catch (err) { next(err); }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await svc.findById(req.params.id, req.companyId!);
      res.json(successResponse(user));
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createUserSchema.parse(req.body);
      const user = await svc.create(req.companyId!, data);
      res.status(201).json(successResponse(user));
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateUserSchema.parse(req.body);
      const user = await svc.update(req.params.id, req.companyId!, data);
      res.json(successResponse(user));
    } catch (err) { next(err); }
  }

  async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await svc.deactivate(req.params.id, req.companyId!);
      res.json(successResponse(user));
    } catch (err) { next(err); }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const data = changePasswordSchema.parse(req.body);
      const result = await svc.changePassword(req.params.id, req.companyId!, data);
      res.json(successResponse(result));
    } catch (err) { next(err); }
  }
}

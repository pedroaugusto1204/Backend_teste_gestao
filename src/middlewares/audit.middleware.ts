import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

/**
 * Factory that returns a middleware that logs an audit event.
 *
 * @param entityType - Type of the entity being operated on (e.g. 'Contract')
 * @param action     - Action performed (e.g. 'CREATE', 'UPDATE', 'DELETE')
 * @param getEntityId - Optional fn to extract entity ID from req; defaults to req.params.id
 */
export function auditLogger(
  entityType: string,
  action: string,
  getEntityId?: (req: Request) => string
) {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    next();

    // Fire-and-forget audit log after response is sent
    const companyId = req.companyId ?? req.user?.companyId;
    const userId = req.user?.userId;
    const entityId = getEntityId ? getEntityId(req) : req.params.id;

    if (!companyId || !entityId) return;

    try {
      await prisma.auditLog.create({
        data: {
          company_id: companyId,
          user_id: userId ?? null,
          entity_type: entityType,
          entity_id: entityId,
          action,
          ip_address: req.ip,
          user_agent: req.get('user-agent'),
          new_value: req.body ? (req.body as object) : undefined,
        },
      });
    } catch (err) {
      // Non-critical: log but don't break the request
      console.error('[AuditLogger] Failed to write audit log:', err);
    }
  };
}

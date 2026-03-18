import { prisma } from "./storage/core";

export type AuditAction =
  | "LOGIN"
  | "LOGOUT"
  | "LOGIN_FAILED"
  | "PASSWORD_CHANGED"
  | "FORCE_PASSWORD_CHANGE"
  | "CREATE_ORDER"
  | "UPDATE_ORDER"
  | "UPDATE_ORDER_STATUS"
  | "DELETE_ORDER"
  | "APPROVE_BUDGET"
  | "REJECT_BUDGET"
  | "REGISTER_PAYMENT"
  | "CREATE_PART"
  | "UPDATE_PART"
  | "DELETE_PART"
  | "CREATE_SERVICE"
  | "UPDATE_SERVICE"
  | "DELETE_SERVICE"
  | "UPDATE_SETTINGS"
  | "CREATE_USER"
  | "UPDATE_USER"
  | "DEACTIVATE_USER"
  | "DOWNLOAD_BACKUP"
  | "DOWNLOAD_EXPORT";

export type AuditEntity =
  | "auth"
  | "order"
  | "part"
  | "service"
  | "settings"
  | "user"
  | "payment"
  | "backup";

interface LogAuditParams {
  userId: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId || null,
        details: params.details ? JSON.stringify(params.details) : null,
        ipAddress: params.ipAddress || null,
      },
    });
  } catch (error) {
    // Never let audit logging break the main flow
    console.error("[audit] Failed to log:", error);
  }
}

export async function getAuditLogs(options?: {
  limit?: number;
  offset?: number;
  userId?: string;
  action?: string;
  entity?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const where: Record<string, unknown> = {};

  if (options?.userId) where.userId = options.userId;
  if (options?.action) where.action = options.action;
  if (options?.entity) where.entity = options.entity;
  if (options?.startDate || options?.endDate) {
    where.createdAt = {
      ...(options?.startDate && { gte: options.startDate }),
      ...(options?.endDate && { lte: options.endDate }),
    };
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { username: true, displayName: true } } },
      orderBy: { createdAt: "desc" },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
}

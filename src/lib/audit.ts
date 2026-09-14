import prisma from './prisma';

export async function logAuditEvent(params: {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        details: typeof params.details === 'object' ? JSON.stringify(params.details) : params.details,
        ipAddress: params.ipAddress,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}

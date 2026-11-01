import prisma from './prisma';

export async function activityLog(userId, action, entity, entityId, metadata) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (error) {
    // Activity log must never break the main flow
    console.error('Activity log failed:', error.message);
  }
}

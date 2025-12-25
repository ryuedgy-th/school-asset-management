import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function logAudit(
    action: string,
    entity: string,
    entityId: string | number,
    details?: any,
    userId?: number
) {
    try {
        let actorId = userId;

        // If userId not provided, try to get from session
        if (!actorId) {
            const session = await auth();
            if (session?.user?.email) {
                const user = await prisma.user.findUnique({
                    where: { email: session.user.email },
                    select: { id: true }
                });
                if (user) actorId = user.id;
            }
        }

        if (!actorId) return; // Cannot log without user

        await prisma.auditLog.create({
            data: {
                action,
                entity,
                entityId: String(entityId),
                details: details ? JSON.stringify(details) : undefined,
                userId: actorId,
            }
        });
    } catch (error) {
        console.error("Failed to write audit log:", error);
    }
}

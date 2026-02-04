import { prisma, ensureDatabaseDir } from "@/lib/database/prisma";
import { CreateDiagramRequest, UpdateDiagramRequest, Diagram } from "@/types/diagram";

function mapToDiagram(p: any): Diagram {
    if (!p) return p;
    return {
        id: p.id,
        userId: p.userId,
        title: p.title,
        description: p.description,
        status: p.status,
        metadata: p.metadata as any,
        createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
        updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt,
    } as Diagram;
}

export const diagramDb = {
    async findById(id: string, userId?: string): Promise<Diagram | null> {
        try {
            const p = await prisma.diagram.findFirst({
                where: {
                    id,
                    ...(userId ? { userId: userId } : {}),
                },
            });
            return mapToDiagram(p);
        } catch (error) {
            console.error("Database error in findById:", error);
            return null;
        }
    },

    async findByUserId(userId: string, options: { limit?: number; offset?: number; status?: string } = {}) {
        const { limit = 20, offset = 0, status } = options;

        try {
            const [diagrams, total] = await Promise.all([
                prisma.diagram.findMany({
                    where: {
                        userId: userId,
                        ...(status ? { status } : {}),
                    },
                    orderBy: { createdAt: "desc" },
                    take: limit,
                    skip: offset,
                }),
                prisma.diagram.count({
                    where: {
                        userId: userId,
                        ...(status ? { status } : {}),
                    },
                }),
            ]);

            const page = Math.floor(offset / limit) + 1;

            return {
                diagrams: diagrams.map(mapToDiagram),
                total,
                limit,
                page
            };
        } catch (error) {
            console.error("Database error in findByUserId:", error);
            return {
                diagrams: [],
                total: 0,
                limit,
                offset,
                error: "Database unavailable"
            };
        }
    },

    async create(userId: string, data: CreateDiagramRequest): Promise<Diagram> {
        try {
            ensureDatabaseDir();
            const p = await prisma.diagram.create({
                data: {
                    userId: userId,
                    title: data.prompt.split('\n')[0].substring(0, 50) || "New Diagram",
                    description: data.prompt.substring(0, 200),
                    status: "processing",
                    metadata: {
                        prompt: data.prompt,
                        options: data.options,
                    },
                },
            });
            return mapToDiagram(p);
        } catch (error) {
            console.error("Database error in create:", error);
            // Return a mock object if DB fails to allow the flow to continue in memory if needed
            // However, the caller usually handles this
            throw error;
        }
    },

    async update(id: string, userId: string, data: UpdateDiagramRequest): Promise<Diagram> {
        const existing = await this.findById(id, userId);
        if (!existing) throw new Error("Diagram not found");

        const p = await prisma.diagram.update({
            where: { id },
            data: {
                ...(data.title ? { title: data.title } : {}),
                ...(data.description ? { description: data.description } : {}),
                ...(data.status ? { status: data.status } : { status: "completed" }),
                // Deep merge metadata to prevent data loss (e.g. wiping artifacts when saving chat history)
                ...(data.metadata ? {
                    metadata: {
                        ...(existing.metadata as Record<string, any> || {}),
                        ...(data.metadata as Record<string, any> || {})
                    }
                } : {}),
            },
        });
        return mapToDiagram(p);
    },

    async duplicate(id: string, userId: string): Promise<Diagram> {
        const existing = await this.findById(id, userId);
        if (!existing) throw new Error("Diagram not found");

        const p = await prisma.diagram.create({
            data: {
                userId: userId,
                title: `${existing.title} (Copy)`,
                description: existing.description,
                status: "completed",
                metadata: existing.metadata as any,
            },
        });
        return mapToDiagram(p);
    },

    async delete(id: string, userId: string) {
        const existing = await this.findById(id, userId);
        if (!existing) throw new Error("Diagram not found");

        return prisma.diagram.delete({
            where: { id },
        });
    },

    async updateStatus(id: string, status: string, error?: string): Promise<Diagram> {
        const p = await prisma.diagram.update({
            where: { id },
            data: {
                status,
                metadata: error ? { update_error: error } : undefined,
            },
        });
        return mapToDiagram(p);
    },

    async updateProgress(id: string, progress: number, currentStep?: string): Promise<Diagram> {
        const p = await prisma.diagram.update({
            where: { id },
            data: {
                metadata: {
                    current_progress: progress,
                    current_step: currentStep,
                },
            },
        });
        return mapToDiagram(p);
    },

    async migrateGuestDiagrams(guestUserId: string, targetUserId: string) {
        // Find all diagrams belonging to the guest user
        const guestDiagrams = await prisma.diagram.findMany({
            where: { userId: guestUserId },
        });

        if (guestDiagrams.length === 0) return;

        // Update them to the new user ID
        await prisma.diagram.updateMany({
            where: { userId: guestUserId },
            data: { userId: targetUserId },
        });

        console.log(`Migrated ${guestDiagrams.length} diagrams from ${guestUserId} to ${targetUserId}`);
    }
};


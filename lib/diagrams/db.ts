import { prisma } from "@/lib/database/prisma";
import { CreateDiagramRequest, UpdateDiagramRequest, Diagram } from "@/types/diagram";

function mapToDiagram(d: any): Diagram {
    if (!d) return d;
    return {
        ...d,
        nodes: d.nodes as any,
        edges: d.edges as any,
        metadata: d.metadata as any,
        created_at: d.created_at instanceof Date ? d.created_at.toISOString() : d.created_at,
        updated_at: d.updated_at instanceof Date ? d.updated_at.toISOString() : d.updated_at,
    } as Diagram;
}

export const diagramDb = {
    async findById(id: string, userId?: string): Promise<Diagram | null> {
        const d = await prisma.diagram.findFirst({
            where: {
                id,
                ...(userId ? { user_id: userId } : {}),
            },
        });
        return mapToDiagram(d);
    },

    async findByUserId(userId: string, options: { limit?: number; offset?: number; status?: string } = {}) {
        const { limit = 20, offset = 0, status } = options;
        const [diagrams, total] = await Promise.all([
            prisma.diagram.findMany({
                where: {
                    user_id: userId,
                    ...(status ? { status } : {}),
                },
                orderBy: { created_at: "desc" },
                take: limit,
                skip: offset,
            }),
            prisma.diagram.count({
                where: {
                    user_id: userId,
                    ...(status ? { status } : {}),
                },
            }),
        ]);

        return {
            diagrams: diagrams.map(mapToDiagram),
            total,
            limit,
            offset
        };
    },

    async create(userId: string, data: CreateDiagramRequest): Promise<Diagram> {
        const d = await prisma.diagram.create({
            data: {
                user_id: userId,
                title: data.prompt.split('\n')[0].substring(0, 50) || "New Generation",
                description: data.prompt.substring(0, 200),
                nodes: [],
                edges: [],
                status: "processing",
                metadata: {
                    prompt: data.prompt,
                    options: data.options,
                },
            },
        });
        return mapToDiagram(d);
    },

    async update(id: string, userId: string, data: UpdateDiagramRequest): Promise<Diagram> {
        const existing = await this.findById(id, userId);
        if (!existing) throw new Error("Diagram not found");

        const d = await prisma.diagram.update({
            where: { id },
            data: {
                ...(data.title ? { title: data.title } : {}),
                ...(data.description ? { description: data.description } : {}),
                ...(data.nodes ? { nodes: data.nodes as any } : {}),
                ...(data.edges ? { edges: data.edges as any } : {}),
                ...(data.metadata ? { metadata: data.metadata as any } : {}),
            },
        });
        return mapToDiagram(d);
    },

    async duplicate(id: string, userId: string): Promise<Diagram> {
        const existing = await this.findById(id, userId);
        if (!existing) throw new Error("Diagram not found");

        const d = await prisma.diagram.create({
            data: {
                user_id: userId,
                title: `${existing.title} (Copy)`,
                description: existing.description,
                nodes: existing.nodes as any,
                edges: existing.edges as any,
                status: existing.status,
                metadata: existing.metadata as any,
            },
        });
        return mapToDiagram(d);
    },

    async delete(id: string, userId: string) {
        const existing = await this.findById(id, userId);
        if (!existing) throw new Error("Diagram not found");

        return prisma.diagram.delete({
            where: { id },
        });
    },

    async updateStatus(id: string, status: string, error?: string): Promise<Diagram> {
        const d = await prisma.diagram.update({
            where: { id },
            data: {
                status,
                metadata: error ? { update_error: error } : undefined,
            },
        });
        return mapToDiagram(d);
    },

    async updateProgress(id: string, progress: number, currentStep?: string): Promise<Diagram> {
        const d = await prisma.diagram.update({
            where: { id },
            data: {
                metadata: {
                    current_progress: progress,
                    current_step: currentStep,
                },
            },
        });
        return mapToDiagram(d);
    },

    async updateResult(id: string, nodes: any[], edges: any[], metadata?: any): Promise<Diagram> {
        const d = await prisma.diagram.update({
            where: { id },
            data: {
                nodes: nodes as any,
                edges: edges as any,
                status: "completed",
                metadata: metadata ? { metasop_artifacts: metadata } : undefined,
            },
        });
        return mapToDiagram(d);
    }
};

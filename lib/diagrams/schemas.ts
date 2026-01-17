import { z } from "zod";
import { CreateDiagramRequest, UpdateDiagramRequest } from "@/types/diagram";

export const CreateDiagramSchema = z.object({
    prompt: z.string().min(1, "Prompt is required"),
    options: z.object({
        includeStateManagement: z.boolean().optional(),
        includeAPIs: z.boolean().optional(),
        includeDatabase: z.boolean().optional(),
        model: z.string().optional(),
        reasoning: z.boolean().optional(),
    }).optional(),
});

export const UpdateDiagramSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    nodes: z.array(z.any()).optional(),
    edges: z.array(z.any()).optional(),
    metadata: z.any().optional(),
});

export function validateCreateDiagramRequest(data: any): CreateDiagramRequest {
    return CreateDiagramSchema.parse(data) as CreateDiagramRequest;
}

export function validateUpdateDiagramRequest(data: any): UpdateDiagramRequest {
    return UpdateDiagramSchema.parse(data) as UpdateDiagramRequest;
}
export const RefineDiagramSchema = z.object({
    diagramId: z.string(),
    stepId: z.string(),
    instruction: z.string().min(1, "Instruction is required"),
    previousArtifacts: z.record(z.any()),
    cascade: z.boolean().optional(),
    isAtomicAction: z.boolean().optional(),
});

export function validateRefineDiagramRequest(data: any) {
    return RefineDiagramSchema.parse(data);
}

export const AskQuestionSchema = z.object({
    diagramId: z.string(),
    question: z.string().min(1, "Question is required"),
    contextMarkdown: z.string(),
    activeTab: z.string().optional(),
    cacheId: z.string().optional(),
});

export function validateAskQuestionRequest(data: any) {
    return AskQuestionSchema.parse(data);
}

export const CreateDocumentSchema = z.object({
    name: z.string().min(1, "Name is required"),
    type: z.string(),
    content: z.string().min(1, "Content is required"),
    url: z.string().optional(),
});

export function validateCreateDocumentRequest(data: any) {
    return CreateDocumentSchema.parse(data);
}

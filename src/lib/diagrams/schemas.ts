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
    documents: z.array(z.any()).optional(),
    clarificationAnswers: z.record(z.string()).optional(),
});

export const ScopeRequestSchema = z.object({
    prompt: z.string().min(1, "Prompt is required"),
});

export function validateScopeRequest(data: any) {
    return ScopeRequestSchema.parse(data);
}

export const UpdateDiagramSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    metadata: z.any().optional(),
});

export function validateCreateDiagramRequest(data: any): CreateDiagramRequest {
    return CreateDiagramSchema.parse(data) as CreateDiagramRequest;
}

export function validateUpdateDiagramRequest(data: any): UpdateDiagramRequest {
    return UpdateDiagramSchema.parse(data) as UpdateDiagramRequest;
}

const EditOpSchema = z.discriminatedUnion("tool", [
    z.object({ tool: z.literal("set_at_path"), artifactId: z.string(), path: z.string(), value: z.any() }),
    z.object({ tool: z.literal("delete_at_path"), artifactId: z.string(), path: z.string() }),
    z.object({ tool: z.literal("add_array_item"), artifactId: z.string(), path: z.string(), value: z.any() }),
    z.object({ tool: z.literal("remove_array_item"), artifactId: z.string(), path: z.string(), index: z.number().int().min(0).optional() }),
]);

export const EditArtifactsSchema = z.object({
    diagramId: z.string().optional(),
    previousArtifacts: z.record(z.any()),
    edits: z.array(EditOpSchema).min(1, "At least one edit is required"),
});

export function validateEditArtifactsRequest(data: any) {
    return EditArtifactsSchema.parse(data);
}

export const AskQuestionSchema = z.object({
    diagramId: z.string(),
    question: z.string().min(1, "Question is required"),
    contextMarkdown: z.string(),
    activeTab: z.string().optional(),
    cacheId: z.string().optional(),
    conversationHistory: z.string().optional(),
});

export function validateAskQuestionRequest(data: any) {
    return AskQuestionSchema.parse(data);
}

export const RefineArtifactsSchema = z.object({
    diagramId: z.string().optional(),
    intent: z.string().min(1, "Intent is required"),
    previousArtifacts: z.record(z.any()),
    chatHistory: z.string().optional(),
    activeTab: z.string().optional(),
});

export function validateRefineArtifactsRequest(data: any) {
    return RefineArtifactsSchema.parse(data);
}

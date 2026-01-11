/**
 * MetaSOP - Multi-Agent System for Architecture Diagram Generation
 * 
 * This module provides a simplified TypeScript implementation of the MetaSOP
 * multi-agent orchestration system, integrated directly into the Next.js application.
 * 
 * The system is designed to be easily extensible and ready for future migration
 * to Python if advanced AI features are needed.
 */

export * from "./types";
export * from "./orchestrator";
export * from "./config";
export * from "./adapters/llm-adapter";
export * from "./services";
export { productManagerAgent } from "./agents/product-manager";
export { architectAgent } from "./agents/architect";
export { devopsAgent } from "./agents/devops";
export { securityAgent } from "./agents/security";
export { engineerAgent } from "./agents/engineer";
export { uiDesignerAgent } from "./agents/ui-designer";
export { qaAgent } from "./agents/qa";


/**
 * Schema Knowledge Graph Module
 * 
 * Exports the knowledge graph system for schema-aware dependency tracking
 * and surgical refinement planning.
 */

export * from './types';
export { SchemaKnowledgeGraph } from './graph';
export { RefinementPlanner } from './planner';

// Re-export commonly used types for convenience
export type {
  SchemaNode,
  SchemaEdge,
  RefinementPlan,
  SurgicalUpdate,
  DependencyQueryResult,
  KnowledgeGraphConfig,
} from './types';

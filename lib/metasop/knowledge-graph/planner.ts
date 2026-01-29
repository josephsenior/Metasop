/**
 * Refinement Planner
 * 
 * Translates user intent into surgical refinement plans using the knowledge graph.
 * This is the "brain" that decides exactly what needs to be updated and how.
 */

import type {
  SchemaNode,
  RefinementPlan,
  SurgicalUpdate,
  DependencyQueryResult,
} from './types';
import { SchemaKnowledgeGraph } from './graph';
import { logger } from '../utils/logger';

export class RefinementPlanner {
  private graph: SchemaKnowledgeGraph;

  constructor(graph: SchemaKnowledgeGraph) {
    this.graph = graph;
  }

  /**
   * Create a refinement plan from user intent
   * 
   * @param intent - The parsed user intent (from Chat RAG layer)
   * @param targetArtifact - The artifact type being modified
   * @param targetPath - The specific schema path being modified
   * @param newValue - The new value for the target
   */
  createPlan(
    intent: string,
    targetArtifact: string,
    targetPath: string,
    newValue: any
  ): RefinementPlan {
    logger.info('Creating refinement plan', { intent, targetArtifact, targetPath });

    const startTime = Date.now();

    // Get the target node
    const targetNode = this.graph.getNode(`${targetArtifact}.${targetPath}`);
    if (!targetNode) {
      throw new Error(`Target node not found: ${targetArtifact}.${targetPath}`);
    }

    // Query for all dependents
    const dependencyResult = this.graph.getDependents(targetArtifact, targetPath);

    // Generate surgical updates for each affected artifact
    const updates: SurgicalUpdate[] = [];
    const affectedArtifacts = new Set<string>();

    // Add update for the target artifact itself
    updates.push(this.createTargetUpdate(targetNode, intent, newValue));
    affectedArtifacts.add(targetArtifact);

    // Add updates for each dependent
    for (const dependent of dependencyResult.directDependents) {
      if (!affectedArtifacts.has(dependent.artifactType)) {
        updates.push(this.createDependentUpdate(
          dependent,
          targetNode,
          intent,
          newValue,
          'direct'
        ));
        affectedArtifacts.add(dependent.artifactType);
      }
    }

    // Add updates for transitive dependents
    for (const dependent of dependencyResult.transitiveDependents) {
      if (!affectedArtifacts.has(dependent.artifactType)) {
        updates.push(this.createDependentUpdate(
          dependent,
          targetNode,
          intent,
          newValue,
          'transitive'
        ));
        affectedArtifacts.add(dependent.artifactType);
      }
    }

    // Sort updates by dependency order (upstream first)
    const sortedUpdates = this.sortUpdatesByDependency(updates);

    // Calculate impact score
    const impactScore = this.calculateImpactScore(dependencyResult, targetNode);

    // Find unaffected artifacts
    const allArtifacts = ['pm_spec', 'arch_design', 'security_architecture', 'devops_infrastructure', 'ui_design', 'engineer_impl', 'qa_verification'];
    const unaffectedArtifacts = allArtifacts.filter(a => !affectedArtifacts.has(a));

    const plan: RefinementPlan = {
      originalIntent: intent,
      targetNode,
      newValue,
      updates: sortedUpdates,
      unaffectedArtifacts,
      impactScore,
    };

    logger.info('Refinement plan created', {
      duration: `${Date.now() - startTime}ms`,
      updates: updates.length,
      impactScore,
    });

    return plan;
  }

  /**
   * Create an update for the target artifact itself
   */
  private createTargetUpdate(targetNode: SchemaNode, intent: string, newValue: any): SurgicalUpdate {
    return {
      artifactType: targetNode.artifactType,
      targetPaths: [targetNode.schemaPath],
      instruction: this.generateTargetInstruction(targetNode, intent, newValue),
      context: {
        upstreamChange: intent,
        reason: 'Direct user modification',
      },
      priority: 'critical',
      dependsOn: [],
    };
  }

  /**
   * Create an update for a dependent artifact
   */
  private createDependentUpdate(
    dependent: SchemaNode,
    targetNode: SchemaNode,
    intent: string,
    newValue: any,
    dependencyType: 'direct' | 'transitive'
  ): SurgicalUpdate {
    const priority = dependencyType === 'direct' ? 'high' : 'medium';
    
    return {
      artifactType: dependent.artifactType,
      targetPaths: [dependent.schemaPath],
      instruction: this.generateDependentInstruction(dependent, targetNode, intent, newValue),
      context: {
        upstreamChange: `${targetNode.artifactType}.${targetNode.schemaPath} changed to: ${JSON.stringify(newValue).substring(0, 100)}`,
        reason: `This artifact ${dependencyType === 'direct' ? 'directly references' : 'is transitively affected by'} the changed field`,
        referenceValues: {
          oldValue: targetNode.value,
          newValue,
        },
      },
      priority,
      dependsOn: [targetNode.artifactType],
    };
  }

  /**
   * Generate instruction for updating the target
   */
  private generateTargetInstruction(node: SchemaNode, intent: string, newValue: any): string {
    const path = node.schemaPath;
    const valueStr = typeof newValue === 'string' ? newValue : JSON.stringify(newValue);

    // Generate specific instructions based on the field type
    if (node.metadata.isArrayItem) {
      return `Update the ${this.describePath(path)} to: "${valueStr}". Preserve all other fields in this item.`;
    }

    if (node.valueType === 'object') {
      return `Update the ${this.describePath(path)} object with the new values: ${valueStr}. Preserve any fields not explicitly changed.`;
    }

    return `Change ${this.describePath(path)} from "${node.value}" to "${valueStr}".`;
  }

  /**
   * Generate instruction for updating a dependent
   */
  private generateDependentInstruction(
    dependent: SchemaNode,
    targetNode: SchemaNode,
    intent: string,
    newValue: any
  ): string {
    const targetDesc = this.describePath(targetNode.schemaPath);
    const dependentDesc = this.describePath(dependent.schemaPath);
    const newValueStr = typeof newValue === 'string' ? newValue : JSON.stringify(newValue).substring(0, 100);

    // Context-aware instructions based on artifact types
    if (dependent.artifactType === 'engineer_impl' && targetNode.artifactType === 'arch_design') {
      if (targetNode.schemaPath.includes('apis')) {
        return `Update your implementation to match the API changes. The ${targetDesc} has changed to "${newValueStr}". Ensure your route handlers, controllers, and types reflect this change.`;
      }
      if (targetNode.schemaPath.includes('database_schema')) {
        return `Update your data models and database interactions to match the schema changes. The ${targetDesc} has been modified to "${newValueStr}".`;
      }
    }

    if (dependent.artifactType === 'qa_verification') {
      return `Update your test cases to reflect the changes in ${targetDesc}. The new value is "${newValueStr}". Ensure your test scenarios cover the updated behavior.`;
    }

    if (dependent.artifactType === 'devops_infrastructure' && targetNode.artifactType === 'security_architecture') {
      return `Update your infrastructure configuration to match the security changes. ${targetDesc} is now "${newValueStr}". Ensure your deployment scripts and environment variables are updated.`;
    }

    // Default instruction
    return `Synchronize your ${dependentDesc} with the upstream changes. The ${targetDesc} has been updated to "${newValueStr}". Update any references while preserving your existing implementation quality.`;
  }

  /**
   * Sort updates so dependencies are updated first
   */
  private sortUpdatesByDependency(updates: SurgicalUpdate[]): SurgicalUpdate[] {
    const order = ['pm_spec', 'arch_design', 'security_architecture', 'devops_infrastructure', 'ui_design', 'engineer_impl', 'qa_verification'];
    
    return updates.sort((a, b) => {
      const aIndex = order.indexOf(a.artifactType);
      const bIndex = order.indexOf(b.artifactType);
      return aIndex - bIndex;
    });
  }

  /**
   * Calculate an impact score (0-1) for the refinement
   */
  private calculateImpactScore(result: DependencyQueryResult, targetNode: SchemaNode): number {
    let score = 0;

    // Base score for the change itself
    score += 0.2;

    // Add for direct dependents
    score += result.directDependents.length * 0.15;

    // Add for transitive dependents (weighted less)
    score += result.transitiveDependents.length * 0.05;

    // Boost if critical artifacts are affected
    const criticalArtifacts = ['arch_design', 'security_architecture'];
    const affectedCritical = result.directDependents.filter(n => 
      criticalArtifacts.includes(n.artifactType)
    ).length;
    score += affectedCritical * 0.1;

    // Cap at 1.0
    return Math.min(score, 1.0);
  }

  /**
   * Create a human-readable description of a schema path
   */
  private describePath(path: string): string {
    // Convert schema paths to readable descriptions
    return path
      .replace(/\[/g, ' item ')
      .replace(/\]/g, '')
      .replace(/\./g, ' ')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Analyze the intent to determine the type of change
   */
  analyzeIntent(intent: string): {
    type: 'modify' | 'add' | 'remove' | 'restructure';
    confidence: number;
    keywords: string[];
  } {
    const lowerIntent = intent.toLowerCase();
    
    const keywords = {
      modify: ['change', 'update', 'modify', 'replace', 'set to', 'make it', 'switch to'],
      add: ['add', 'create', 'new', 'include', 'introduce', 'implement'],
      remove: ['remove', 'delete', 'drop', 'eliminate', 'get rid of', 'take out'],
      restructure: ['restructure', 'reorganize', 'refactor', 'redesign', 'rework'],
    };

    let bestMatch: 'modify' | 'add' | 'remove' | 'restructure' = 'modify';
    let maxMatches = 0;
    const matchedKeywords: string[] = [];

    for (const [type, words] of Object.entries(keywords)) {
      const matches = words.filter(word => lowerIntent.includes(word));
      if (matches.length > maxMatches) {
        maxMatches = matches.length;
        bestMatch = type as any;
        matchedKeywords.push(...matches);
      }
    }

    const confidence = Math.min(maxMatches * 0.3 + 0.4, 1.0);

    return {
      type: bestMatch,
      confidence,
      keywords: matchedKeywords,
    };
  }

  /**
   * Validate that a plan is executable
   */
  validatePlan(plan: RefinementPlan): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check target node exists
    if (!plan.targetNode) {
      errors.push('Target node is missing');
    }

    // Check for circular dependencies in updates
    const visited = new Set<string>();
    const checkCircular = (update: SurgicalUpdate, path: string[]): boolean => {
      if (path.includes(update.artifactType)) {
        errors.push(`Circular dependency detected: ${path.join(' -> ')} -> ${update.artifactType}`);
        return false;
      }
      
      visited.add(update.artifactType);
      
      for (const dep of update.dependsOn) {
        const depUpdate = plan.updates.find(u => u.artifactType === dep);
        if (depUpdate && !checkCircular(depUpdate, [...path, update.artifactType])) {
          return false;
        }
      }
      
      return true;
    };

    for (const update of plan.updates) {
      if (!visited.has(update.artifactType)) {
        checkCircular(update, []);
      }
    }

    // Check all target paths are valid
    for (const update of plan.updates) {
      if (update.targetPaths.length === 0) {
        errors.push(`Update for ${update.artifactType} has no target paths`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

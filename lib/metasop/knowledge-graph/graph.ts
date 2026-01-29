/**
 * Schema Knowledge Graph
 * 
 * Core class for building and querying the schema-aware knowledge graph.
 * Tracks dependencies between artifact fields for surgical refinement.
 */

import type {
  SchemaNode,
  SchemaEdge,
  DependencyQueryResult,
  GraphBuildResult,
  KnowledgeGraphConfig,
} from './types';
import { DEFAULT_KG_CONFIG, ARTIFACT_DEPENDENCY_MAP } from './types';
import { logger } from '../utils/logger';
import { generateWithLLM } from '../utils/llm-helper';

export class SchemaKnowledgeGraph {
  private nodes: Map<string, SchemaNode> = new Map();
  private edges: SchemaEdge[] = [];
  private config: KnowledgeGraphConfig;
  private buildResult: GraphBuildResult | null = null;

  constructor(config: Partial<KnowledgeGraphConfig> = {}) {
    this.config = { ...DEFAULT_KG_CONFIG, ...config };
  }

  /**
   * Build the knowledge graph from a set of artifacts
   */
  async build(artifacts: Record<string, any>): Promise<GraphBuildResult> {
    logger.info('Building Schema Knowledge Graph...');
    
    const startTime = Date.now();
    this.nodes.clear();
    this.edges = [];
    
    const warnings: string[] = [];
    const artifactsProcessed: string[] = [];

    // Phase 1: Create nodes for all schema paths
    for (const [artifactType, artifact] of Object.entries(artifacts)) {
      if (!artifact?.content) {
        warnings.push(`Artifact ${artifactType} has no content`);
        continue;
      }

      try {
        this.createNodesForArtifact(artifactType, artifact.content);
        artifactsProcessed.push(artifactType);
      } catch (error: any) {
        warnings.push(`Failed to process ${artifactType}: ${error.message}`);
      }
    }

    // Phase 2: Create edges based on cross-artifact references (LLM-based)
    await this.createEdges(artifacts);

    this.buildResult = {
      nodeCount: this.nodes.size,
      edgeCount: this.edges.length,
      artifactsProcessed,
      warnings,
      timestamp: new Date().toISOString(),
    };

    logger.info('Schema Knowledge Graph built', {
      duration: `${Date.now() - startTime}ms`,
      nodes: this.nodes.size,
      edges: this.edges.length,
      artifacts: artifactsProcessed.length,
    });

    return this.buildResult;
  }

  /**
   * Create nodes for all paths in an artifact
   */
  private createNodesForArtifact(artifactType: string, content: any, basePath = ''): void {
    if (content === null || content === undefined) return;

    const currentPath = basePath || artifactType;

    // Create node for current path
    if (basePath) {
      const node: SchemaNode = {
        id: `${artifactType}.${basePath}`,
        artifactType,
        schemaPath: basePath,
        value: content,
        valueType: this.getValueType(content),
        metadata: {
          isArrayItem: /\[\d+\]$/.test(basePath),
          arrayIndex: this.extractArrayIndex(basePath),
          identifier: this.extractIdentifier(content),
          description: this.extractDescription(content),
        },
      };
      this.nodes.set(node.id, node);
    }

    // Recurse into objects and arrays
    if (typeof content === 'object' && content !== null) {
      if (Array.isArray(content)) {
        content.forEach((item, index) => {
          const itemPath = `${basePath}[${index}]`;
          this.createNodesForArtifact(artifactType, item, itemPath);
        });
      } else {
        for (const [key, value] of Object.entries(content)) {
          const fieldPath = basePath ? `${basePath}.${key}` : key;
          this.createNodesForArtifact(artifactType, value, fieldPath);
        }
      }
    }
  }

  /**
   * Create edges between nodes based on cross-artifact references
   */
  private async createEdges(artifacts: Record<string, any>): Promise<void> {
    for (const [artifactType, artifact] of Object.entries(artifacts)) {
      if (!artifact?.content) continue;

      // Get upstream dependencies for this artifact type
      const upstreamTypes = ARTIFACT_DEPENDENCY_MAP[artifactType] || [];
      
      for (const upstreamType of upstreamTypes) {
        const upstreamArtifact = artifacts[upstreamType];
        if (!upstreamArtifact?.content) continue;

        await this.findReferences(artifactType, artifact.content, upstreamType, upstreamArtifact.content);
      }
    }
  }

  /**
   * Find references from one artifact to another using LLM-based detection
   */
  private async findReferences(
    fromType: string,
    fromContent: any,
    toType: string,
    toContent: any,
    currentPath = ''
  ): Promise<void> {
    if (fromContent === null || fromContent === undefined) return;

    // Get all searchable values from the upstream artifact
    const upstreamValues = this.extractSearchableValues(toType, toContent);

    if (typeof fromContent === 'string') {
      // Use batch LLM detection for efficiency
      const fromNodeId = currentPath ? `${fromType}.${currentPath}` : fromType;
      const matches = await this.batchDetectReferences(
        fromContent,
        upstreamValues,
        fromType,
        toType
      );

      for (const match of matches) {
        if (this.nodes.has(fromNodeId) && this.nodes.has(match.nodeId)) {
          this.edges.push({
            from: fromNodeId,
            to: match.nodeId,
            type: 'references',
            confidence: match.confidence,
            detectionMethod: 'semantic',
            context: fromContent.substring(0, 100),
          });
        }
      }
    } else if (Array.isArray(fromContent)) {
      for (let index = 0; index < fromContent.length; index++) {
        const item = fromContent[index];
        const itemPath = currentPath ? `${currentPath}[${index}]` : `[${index}]`;
        await this.findReferences(fromType, item, toType, toContent, itemPath);
      }
    } else if (typeof fromContent === 'object') {
      for (const [key, value] of Object.entries(fromContent)) {
        const fieldPath = currentPath ? `${currentPath}.${key}` : key;
        await this.findReferences(fromType, value, toType, toContent, fieldPath);
      }
    }
  }

  /**
   * Extract searchable values from an artifact for reference detection
   */
  private extractSearchableValues(artifactType: string, content: any, basePath = ''): Array<{ nodeId: string; value: string; valueType: string }> {
    const values: Array<{ nodeId: string; value: string; valueType: string }> = [];

    if (content === null || content === undefined) return values;

    // Skip ignored fields
    const fieldName = basePath.split('.').pop() || '';
    if (this.config.ignoredFields.includes(fieldName)) return values;

    const currentPath = basePath || artifactType;
    const nodeId = `${artifactType}.${currentPath}`;

    if (typeof content === 'string') {
      values.push({ nodeId, value: content, valueType: 'string' });
    } else if (typeof content === 'number' || typeof content === 'boolean') {
      values.push({ nodeId, value: String(content), valueType: typeof content });
    } else if (Array.isArray(content)) {
      content.forEach((item, index) => {
        const itemPath = `${currentPath}[${index}]`;
        values.push(...this.extractSearchableValues(artifactType, item, itemPath));
      });
    } else if (typeof content === 'object') {
      // For objects, also extract identifier fields as primary search targets
      const identifierField = this.config.identifierFields.find(f => f in content);
      if (identifierField) {
        const idValue = content[identifierField];
        if (typeof idValue === 'string') {
          values.push({ nodeId, value: idValue, valueType: 'identifier' });
        }
      }

      for (const [key, value] of Object.entries(content)) {
        const fieldPath = `${currentPath}.${key}`;
        values.push(...this.extractSearchableValues(artifactType, value, fieldPath));
      }
    }

    return values;
  }

  /**
   * Detect if a text references a value using LLM-based semantic matching
   */
  private async detectReference(
    text: string, 
    value: string, 
    valueType: string,
    context?: { fromArtifact: string; toArtifact: string; fieldPath: string }
  ): Promise<{ found: boolean; confidence: number; method: 'exact' | 'semantic' }> {
    if (!text || !value) return { found: false, confidence: 0, method: 'exact' };

    // Quick exact match check (no LLM needed)
    if (text.toLowerCase().includes(value.toLowerCase())) {
      return { found: true, confidence: 1.0, method: 'exact' };
    }

    // Use LLM for semantic reference detection
    try {
      const prompt = `Analyze if the following text semantically references the given value.

TEXT (from ${context?.fromArtifact || 'unknown'}):
"""${text.substring(0, 500)}"""

VALUE (from ${context?.toArtifact || 'unknown'} at ${context?.fieldPath || 'unknown'}):
"${value}"

Question: Does the TEXT reference, use, implement, or depend on the VALUE?

Consider:
- Direct mentions or variations
- Semantic equivalence (e.g., "users endpoint" vs "/api/users")
- Implementation references (e.g., implementing an API spec)
- Conceptual dependencies

Respond with ONLY a JSON object:
{
  "references": true/false,
  "confidence": 0.0-1.0,
  "reason": "brief explanation"
}`;

      const response = await generateWithLLM(prompt, {
        temperature: 0.1,
        maxTokens: 150,
      });

      // Parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        if (result.references && result.confidence >= this.config.minConfidence) {
          return {
            found: true,
            confidence: result.confidence,
            method: 'semantic',
          };
        }
      }
    } catch (error: any) {
      logger.warn('LLM reference detection failed, falling back to no match', { error: error.message });
    }

    return { found: false, confidence: 0, method: 'exact' };
  }

  /**
   * Batch detect references using LLM for efficiency
   */
  private async batchDetectReferences(
    text: string,
    candidates: Array<{ nodeId: string; value: string; valueType: string }>,
    fromArtifact: string,
    toArtifact: string
  ): Promise<Array<{ nodeId: string; confidence: number }>> {
    if (!text || candidates.length === 0) return [];

    // Limit candidates to avoid token explosion
    const limitedCandidates = candidates.slice(0, 20);

    const prompt = `Analyze which of the following values are semantically referenced in the text.

TEXT (from ${fromArtifact}):
"""${text.substring(0, 800)}"""

CANDIDATE VALUES (from ${toArtifact}):
${limitedCandidates.map((c, i) => `${i + 1}. "${c.value}" (type: ${c.valueType})`).join('\n')}

For each candidate, determine if the TEXT references, uses, implements, or depends on it.
Consider semantic equivalence, not just exact matches.

Respond with ONLY a JSON array of objects for matches:
[
  { "index": 1, "references": true, "confidence": 0.95 },
  { "index": 3, "references": true, "confidence": 0.82 }
]

Only include candidates that are actually referenced. Confidence should be 0.0-1.0.`;

    try {
      const response = await generateWithLLM(prompt, {
        temperature: 0.1,
        maxTokens: 500,
      });

      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const results = JSON.parse(jsonMatch[0]);
        return results
          .filter((r: any) => r.references && r.confidence >= this.config.minConfidence)
          .map((r: any) => ({
            nodeId: limitedCandidates[r.index - 1]?.nodeId,
            confidence: r.confidence,
          }))
          .filter((r: any) => r.nodeId);
      }
    } catch (error: any) {
      logger.warn('Batch LLM reference detection failed', { error: error.message });
    }

    return [];
  }

  /**
   * Query for dependents of a specific schema path
   */
  getDependents(artifactType: string, schemaPath: string): DependencyQueryResult {
    const targetNodeId = `${artifactType}.${schemaPath}`;
    const targetNode = this.nodes.get(targetNodeId);

    if (!targetNode) {
      return {
        sourceNode: null as any,
        directDependents: [],
        transitiveDependents: [],
        edges: [],
        groupedByArtifact: {},
      };
    }

    // Find direct dependents
    const directEdges = this.edges.filter(e => e.to === targetNodeId);
    const directDependents = directEdges
      .map(e => this.nodes.get(e.from))
      .filter((n): n is SchemaNode => n !== undefined);

    // Find transitive dependents (up to max depth)
    const transitiveDependents: SchemaNode[] = [];
    const visited = new Set<string>([targetNodeId]);
    let currentLevel = directDependents.map(n => n.id);
    let depth = 0;

    while (currentLevel.length > 0 && depth < this.config.maxDepth) {
      const nextLevel: string[] = [];
      
      for (const nodeId of currentLevel) {
        if (visited.has(nodeId)) continue;
        visited.add(nodeId);
        
        const node = this.nodes.get(nodeId);
        if (node && !directDependents.includes(node)) {
          transitiveDependents.push(node);
        }

        // Find what depends on this node
        const dependentEdges = this.edges.filter(e => e.to === nodeId);
        nextLevel.push(...dependentEdges.map(e => e.from));
      }

      currentLevel = nextLevel;
      depth++;
    }

    // Group by artifact type
    const groupedByArtifact: Record<string, SchemaNode[]> = {};
    for (const node of [...directDependents, ...transitiveDependents]) {
      if (!groupedByArtifact[node.artifactType]) {
        groupedByArtifact[node.artifactType] = [];
      }
      groupedByArtifact[node.artifactType].push(node);
    }

    return {
      sourceNode: targetNode,
      directDependents,
      transitiveDependents,
      edges: directEdges,
      groupedByArtifact,
    };
  }

  /**
   * Get all nodes for a specific artifact type
   */
  getNodesForArtifact(artifactType: string): SchemaNode[] {
    return Array.from(this.nodes.values()).filter(n => n.artifactType === artifactType);
  }

  /**
   * Get a specific node by ID
   */
  getNode(nodeId: string): SchemaNode | undefined {
    return this.nodes.get(nodeId);
  }

  /**
   * Get all edges
   */
  getEdges(): SchemaEdge[] {
    return [...this.edges];
  }

  /**
   * Get graph statistics
   */
  getStats(): { nodes: number; edges: number; artifacts: string[] } {
    const artifacts = new Set<string>();
    for (const node of this.nodes.values()) {
      artifacts.add(node.artifactType);
    }
    return {
      nodes: this.nodes.size,
      edges: this.edges.length,
      artifacts: Array.from(artifacts),
    };
  }

  /**
   * Export the graph to a serializable format
   */
  export(): { nodes: SchemaNode[]; edges: SchemaEdge[]; buildResult: GraphBuildResult | null } {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: this.edges,
      buildResult: this.buildResult,
    };
  }

  /**
   * Import a graph from a serialized format
   */
  import(data: { nodes: SchemaNode[]; edges: SchemaEdge[] }): void {
    this.nodes.clear();
    this.edges = data.edges;
    
    for (const node of data.nodes) {
      this.nodes.set(node.id, node);
    }
  }

  // Helper methods
  private getValueType(value: any): 'string' | 'number' | 'boolean' | 'object' | 'array' {
    if (value === null) return 'object';
    if (Array.isArray(value)) return 'array';
    return typeof value as any;
  }

  private extractArrayIndex(path: string): number | undefined {
    const match = path.match(/\[(\d+)\]$/);
    return match ? parseInt(match[1], 10) : undefined;
  }

  private extractIdentifier(content: any): string | undefined {
    if (typeof content !== 'object' || content === null) return undefined;
    
    for (const field of this.config.identifierFields) {
      if (field in content && typeof content[field] === 'string') {
        return content[field];
      }
    }
    return undefined;
  }

  private extractDescription(content: any): string | undefined {
    if (typeof content !== 'object' || content === null) return undefined;
    return content.description || content.summary;
  }
}

/**
 * Validation utilities for diagram nodes and edges
 */

export function ensureUniqueNodeIds(nodes: any[]) {
    const ids = new Set();
    nodes.forEach(node => {
        if (ids.has(node.id)) {
            node.id = `${node.id}_${Math.random().toString(36).substr(2, 5)}`;
        }
        ids.add(node.id);
    });
    return nodes;
}

export function ensureEdgeIds(edges: any[]) {
    edges.forEach((edge, index) => {
        if (!edge.id) {
            edge.id = `edge_${edge.from}_${edge.to}_${index}`;
        }
    });
    return edges;
}

export function validateEdgeReferences(nodes: any[], edges: any[]) {
    const nodeIds = new Set(nodes.map(n => n.id));
    const invalidEdges = edges.filter(edge => !nodeIds.has(edge.from) || !nodeIds.has(edge.to));

    return {
        valid: invalidEdges.length === 0,
        errors: invalidEdges.map(e => `Edge ${e.id || 'unknown'} has invalid references: ${e.from} -> ${e.to}`),
        invalidEdges
    };
}

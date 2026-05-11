import Graph from 'graphology';
import type { GraphAdapter, EdgeAttrs, NodeAttrs } from './adapter';
import type { RawGraph } from './schema';

export type AppGraph = Graph<NodeAttrs, EdgeAttrs>;

export function buildGraph(raw: RawGraph, adapter: GraphAdapter): AppGraph {
  const graph: AppGraph = new Graph<NodeAttrs, EdgeAttrs>({ multi: true, type: 'directed' });

  for (const rawNode of raw.nodes) {
    if (graph.hasNode(rawNode.id)) continue;
    const attrs = adapter.parseNode(rawNode);
    graph.addNode(attrs.id, attrs);
  }

  for (const rawEdge of raw.edges) {
    const attrs = adapter.parseEdge(rawEdge);
    if (!graph.hasNode(attrs.from)) {
      graph.addNode(attrs.from, adapter.parseNode({ id: attrs.from }));
    }
    if (!graph.hasNode(attrs.to)) {
      graph.addNode(attrs.to, adapter.parseNode({ id: attrs.to }));
    }
    graph.addEdge(attrs.from, attrs.to, attrs);
  }

  return graph;
}

export function summariseGraph(graph: AppGraph): { nodes: number; edges: number } {
  return { nodes: graph.order, edges: graph.size };
}

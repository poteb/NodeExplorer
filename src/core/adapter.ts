import type { RawEdge, RawNode } from './schema';

export interface NodeAttrs {
  id: string;
  label: string;
  kind?: string;
  file?: string;
  line?: number;
  // Adapter-derived facets used for grouping & filtering.
  namespace?: string;
  className?: string;
  member?: string;
  signature?: string;
  folder?: string;
  project?: string;
  [extra: string]: unknown;
}

export interface EdgeAttrs {
  from: string;
  to: string;
  file?: string;
  line?: number;
  [extra: string]: unknown;
}

export interface GroupingDef {
  id: string;
  label: string;
  // Returns the group key for a node, or null to exclude from grouping.
  keyOf: (node: NodeAttrs) => string | null;
}

export interface NodeDescription {
  title: string;
  subtitle?: string;
  facts: { label: string; value: string }[];
}

export interface GraphAdapter {
  id: string;
  label: string;
  parseNode: (raw: RawNode) => NodeAttrs;
  parseEdge: (raw: RawEdge) => EdgeAttrs;
  groupings: () => GroupingDef[];
  describe: (node: NodeAttrs) => NodeDescription;
  detect?: (raw: unknown) => boolean;
}

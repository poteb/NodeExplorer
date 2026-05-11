import type { GraphAdapter, NodeAttrs } from '../adapter';

export const genericAdapter: GraphAdapter = {
  id: 'generic',
  label: 'Generic',

  parseNode: (raw) => ({
    id: raw.id,
    label: raw.id,
    kind: raw.kind,
    file: raw.file,
    line: raw.line,
  }),

  parseEdge: (raw) => ({
    from: raw.from,
    to: raw.to,
    file: raw.file,
    line: raw.line,
  }),

  groupings: () => [
    { id: 'kind', label: 'Kind', keyOf: (n: NodeAttrs) => n.kind ?? null },
    { id: 'file', label: 'File', keyOf: (n: NodeAttrs) => n.file ?? null },
  ],

  describe: (node) => ({
    title: node.label,
    subtitle: node.kind,
    facts: [
      ...(node.file ? [{ label: 'File', value: node.file }] : []),
      ...(node.line != null ? [{ label: 'Line', value: String(node.line) }] : []),
    ],
  }),
};

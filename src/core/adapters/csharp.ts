import type { GraphAdapter, NodeAttrs } from '../adapter';

// Splits a fully-qualified C# member id into namespace, class, member, signature.
// Handles examples like:
//   "pote.Config.Admin.Api.Controllers.ApiKeysController..ctor(ILogger<...>, IDataProvider)"
//   "Foo.Bar.Baz.Method(System.Threading.CancellationToken)"
//   "Foo.Bar.Baz.SomeProperty"
//
// Strategy: split off the parameter list first (everything from the first
// top-level '(' onwards), then split the remaining qualified name on dots
// while respecting generic angle brackets.
export function parseCSharpId(id: string): {
  namespace?: string;
  className?: string;
  member?: string;
  signature?: string;
} {
  const parenIdx = findTopLevelParen(id);
  const head = parenIdx >= 0 ? id.slice(0, parenIdx) : id;
  const signature = parenIdx >= 0 ? id.slice(parenIdx) : undefined;

  // ".ctor" appears as a final segment with leading dot — preserve it.
  const ctorIdx = head.indexOf('..ctor');
  let qualified: string;
  let memberOverride: string | undefined;
  if (ctorIdx >= 0) {
    qualified = head.slice(0, ctorIdx);
    memberOverride = '.ctor';
  } else {
    qualified = head;
  }

  const parts = splitQualified(qualified);
  if (parts.length === 0) return {};

  let member = memberOverride;
  let className: string | undefined;
  let namespaceParts: string[];

  if (memberOverride) {
    // qualified ends at the class name: parts[-1] is the class.
    className = parts[parts.length - 1];
    namespaceParts = parts.slice(0, -1);
  } else if (parts.length === 1) {
    member = parts[0];
    namespaceParts = [];
  } else if (parts.length === 2) {
    className = parts[0];
    member = parts[1];
    namespaceParts = [];
  } else {
    member = parts[parts.length - 1];
    className = parts[parts.length - 2];
    namespaceParts = parts.slice(0, -2);
  }

  return {
    namespace: namespaceParts.length > 0 ? namespaceParts.join('.') : undefined,
    className,
    member,
    signature,
  };
}

function findTopLevelParen(s: string): number {
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '<') depth++;
    else if (c === '>') depth--;
    else if (c === '(' && depth === 0) return i;
  }
  return -1;
}

function splitQualified(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let buf = '';
  for (const c of s) {
    if (c === '<') { depth++; buf += c; }
    else if (c === '>') { depth--; buf += c; }
    else if (c === '.' && depth === 0) {
      if (buf) out.push(buf);
      buf = '';
    } else {
      buf += c;
    }
  }
  if (buf) out.push(buf);
  return out;
}

// Derive {project, folder} from a relative path like "Config.Admin.Api/Controllers/ApiKeysController.cs".
// Absolute paths (drive letters, leading slash, ~) are treated as opaque external dependencies
// and only contribute a folder, not a project — they don't belong to the user's solution.
export function deriveProjectAndFolder(file?: string): { project?: string; folder?: string } {
  if (!file) return {};
  const norm = file.replace(/\\/g, '/');
  const isAbsolute = /^([A-Za-z]:)?\//.test(norm) || norm.startsWith('~');
  const segments = norm.split('/').filter(Boolean);
  if (segments.length <= 1) return {};
  const folder = norm.slice(0, norm.lastIndexOf('/'));
  if (isAbsolute) return { folder };
  return { project: segments[0], folder };
}

export const csharpAdapter: GraphAdapter = {
  id: 'csharp',
  label: 'C# call graph',

  parseNode: (raw) => {
    const parsed = parseCSharpId(raw.id);
    const loc = deriveProjectAndFolder(raw.file);
    const label = parsed.member
      ? (parsed.className ? `${parsed.className}.${parsed.member}` : parsed.member)
      : raw.id;
    return {
      id: raw.id,
      label,
      kind: raw.kind,
      file: raw.file,
      line: raw.line,
      ...parsed,
      ...loc,
    };
  },

  parseEdge: (raw) => ({
    from: raw.from,
    to: raw.to,
    file: raw.file,
    line: raw.line,
  }),

  groupings: () => [
    { id: 'project', label: 'Project', keyOf: (n: NodeAttrs) => (n.project as string | undefined) ?? null },
    { id: 'namespace', label: 'Namespace', keyOf: (n: NodeAttrs) => (n.namespace as string | undefined) ?? null },
    { id: 'class', label: 'Class', keyOf: (n: NodeAttrs) => (n.className as string | undefined) ?? null },
    { id: 'folder', label: 'Folder', keyOf: (n: NodeAttrs) => (n.folder as string | undefined) ?? null },
    { id: 'kind', label: 'Kind', keyOf: (n: NodeAttrs) => n.kind ?? null },
  ],

  describe: (node) => {
    const facts: { label: string; value: string }[] = [];
    if (node.namespace) facts.push({ label: 'Namespace', value: String(node.namespace) });
    if (node.className) facts.push({ label: 'Class', value: String(node.className) });
    if (node.kind) facts.push({ label: 'Kind', value: String(node.kind) });
    if (node.project) facts.push({ label: 'Project', value: String(node.project) });
    if (node.file) facts.push({ label: 'File', value: String(node.file) });
    if (node.line != null) facts.push({ label: 'Line', value: String(node.line) });
    if (node.signature) facts.push({ label: 'Signature', value: String(node.signature) });
    return {
      title: node.label,
      subtitle: node.namespace ? String(node.namespace) : undefined,
      facts,
    };
  },

  // Heuristic: if any node id contains a dotted namespace and a paren'd signature,
  // it's almost certainly a Roslyn-style C# call graph.
  detect: (raw: unknown) => {
    if (!raw || typeof raw !== 'object') return false;
    const obj = raw as { nodes?: unknown };
    if (!Array.isArray(obj.nodes)) return false;
    const sample = obj.nodes.slice(0, 10) as { id?: string; kind?: string }[];
    return sample.some(
      (n) => typeof n.id === 'string' && /\./.test(n.id) && (/\(/.test(n.id) || n.kind === 'Constructor' || n.kind === 'Method' || n.kind === 'Property'),
    );
  },
};

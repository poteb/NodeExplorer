import { useAppStore } from '@/state/store';

export function DetailPanel() {
  const graph = useAppStore((s) => s.graph);
  const adapter = useAppStore((s) => s.adapter);
  const selectedNodeId = useAppStore((s) => s.selectedNodeId);
  const setSelectedNode = useAppStore((s) => s.setSelectedNode);

  if (!graph || !adapter || !selectedNodeId || !graph.hasNode(selectedNodeId)) return null;

  const attrs = graph.getNodeAttributes(selectedNodeId);
  const description = adapter.describe(attrs);
  const inDegree = graph.inDegree(selectedNodeId);
  const outDegree = graph.outDegree(selectedNodeId);

  return (
    <aside className="absolute right-3 top-12 z-10 max-h-[calc(100%-4rem)] w-80 overflow-y-auto rounded-md border border-neutral-200 bg-white/95 p-3 text-xs shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold" title={description.title}>
            {description.title}
          </div>
          {description.subtitle && (
            <div className="truncate text-neutral-500" title={description.subtitle}>
              {description.subtitle}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setSelectedNode(null)}
          className="shrink-0 rounded px-1.5 py-0.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          title="Close"
        >
          ×
        </button>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <dt className="text-neutral-500">Callers</dt>
        <dd className="font-mono">{inDegree}</dd>
        <dt className="text-neutral-500">Callees</dt>
        <dd className="font-mono">{outDegree}</dd>
        {description.facts.map((fact) => (
          <FactRow key={fact.label} label={fact.label} value={fact.value} />
        ))}
      </dl>
    </aside>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-neutral-500">{label}</dt>
      <dd className="break-words font-mono" title={value}>
        {value}
      </dd>
    </>
  );
}

import { useMemo } from 'react';
import { useAppStore } from '@/state/store';
import { applyGrouping } from '@/core/grouping';

export function GroupingTree() {
  const graph = useAppStore((s) => s.graph);
  const adapter = useAppStore((s) => s.adapter);
  const groupBy = useAppStore((s) => s.groupBy);
  const setGroupBy = useAppStore((s) => s.setGroupBy);
  const filters = useAppStore((s) => s.filters);
  const theme = useAppStore((s) => s.theme);
  const setSelectedNode = useAppStore((s) => s.setSelectedNode);
  const epoch = useAppStore((s) => s.epoch);

  const sizingMode = useAppStore((s) => s.sizingMode);
  const setSizingMode = useAppStore((s) => s.setSizingMode);

  const groupingOptions = useMemo(() => {
    if (!adapter) return [{ id: 'none', label: 'None' }];
    return [{ id: 'none', label: 'None' }, ...adapter.groupings()];
  }, [adapter]);

  const grouping = useMemo(() => {
    if (!graph || !adapter) return null;
    return applyGrouping(graph, adapter, groupBy, filters, theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph, adapter, groupBy, filters, theme, epoch]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h2 className="text-xs font-semibold">Group by</h2>
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value)}
          className="flex-1 rounded border border-neutral-300 bg-white px-1.5 py-0.5 text-xs focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-neutral-700 dark:bg-neutral-900"
        >
          {groupingOptions.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>
      </div>
      <label
        className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800"
        title={
          groupBy === 'none'
            ? 'Scale node size by incoming-call count, normalised globally.'
            : `Scale node size by incoming-call count, normalised within each ${groupingOptions.find((g) => g.id === groupBy)?.label.toLowerCase() ?? 'group'}.`
        }
      >
        <input
          type="checkbox"
          className="accent-sky-500"
          checked={sizingMode === 'usage'}
          onChange={(e) => setSizingMode(e.target.checked ? 'usage' : 'uniform')}
        />
        <span>Size by usage</span>
      </label>
      {grouping && grouping.groups.length > 0 && (
        <ul className="max-h-[40vh] space-y-0.5 overflow-y-auto pr-1">
          {grouping.groups.map((g) => (
            <li key={g.id} className="text-xs">
              <details className="rounded">
                <summary className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                  <span
                    className="inline-block size-2.5 shrink-0 rounded-sm"
                    style={{ background: grouping.colorOf(g.id) }}
                  />
                  <span className="flex-1 truncate" title={g.name}>
                    {g.name}
                  </span>
                  <span className="font-mono text-[10px] text-neutral-500">{g.count}</span>
                </summary>
                <ul className="ml-5 max-h-48 overflow-y-auto border-l border-neutral-200 pl-2 dark:border-neutral-800">
                  {g.nodeIds.slice(0, 200).map((id) => {
                    const attrs = graph!.getNodeAttributes(id);
                    return (
                      <li key={id}>
                        <button
                          type="button"
                          onClick={() => setSelectedNode(id)}
                          className="block w-full truncate px-1 py-0.5 text-left text-[11px] hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          title={id}
                        >
                          {attrs.label}
                        </button>
                      </li>
                    );
                  })}
                  {g.nodeIds.length > 200 && (
                    <li className="px-1 py-0.5 text-[10px] text-neutral-500">
                      … and {g.nodeIds.length - 200} more
                    </li>
                  )}
                </ul>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

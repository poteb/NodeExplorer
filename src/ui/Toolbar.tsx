import { useAppStore } from '@/state/store';

export function Toolbar() {
  const source = useAppStore((s) => s.source);
  const adapter = useAppStore((s) => s.adapter);
  const graph = useAppStore((s) => s.graph);
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const clearGraph = useAppStore((s) => s.clearGraph);

  return (
    <div className="flex items-center justify-between border-b border-neutral-200 bg-white/70 px-3 py-2 text-xs backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/70">
      <div className="flex items-center gap-3 truncate">
        <span className="font-semibold tracking-tight">NodeExplorer</span>
        {source && (
          <>
            <span className="text-neutral-400">·</span>
            <span className="truncate text-neutral-600 dark:text-neutral-400" title={source.name}>
              {source.name}
            </span>
            {graph && (
              <span className="text-neutral-500">
                {graph.order.toLocaleString()} nodes · {graph.size.toLocaleString()} edges
              </span>
            )}
            {adapter && (
              <span className="rounded border border-neutral-300 px-1.5 py-px text-[10px] uppercase tracking-wider text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
                {adapter.label}
              </span>
            )}
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        {graph && (
          <button
            type="button"
            onClick={clearGraph}
            className="rounded px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Close
          </button>
        )}
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          title="Toggle theme"
        >
          {theme === 'dark' ? '☀︎ Light' : '☾ Dark'}
        </button>
      </div>
    </div>
  );
}

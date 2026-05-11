import { useEffect } from 'react';
import { useAppStore } from '@/state/store';
import { SigmaCanvas } from '@/renderer/SigmaCanvas';
import { FilePicker } from './FilePicker';
import { Toolbar } from './Toolbar';
import { DetailPanel } from './DetailPanel';
import { Sidebar } from './Sidebar/Sidebar';

export function App() {
  const graph = useAppStore((s) => s.graph);
  const loading = useAppStore((s) => s.loading);
  const loadError = useAppStore((s) => s.loadError);
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <div className="flex h-full flex-col">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        {graph && <Sidebar />}
        <div className="relative flex-1 overflow-hidden">
          {graph ? (
            <>
              <SigmaCanvas />
              <DetailPanel />
            </>
          ) : (
            <FilePicker />
          )}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 text-sm dark:bg-neutral-950/60">
              Loading…
            </div>
          )}
          {loadError && (
            <div className="absolute bottom-3 left-3 right-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
              {loadError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

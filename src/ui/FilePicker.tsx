import { useCallback, useRef, useState, type DragEvent } from 'react';
import { useAppStore } from '@/state/store';
import { loadGraphFromFile } from '@/core/loader';

export function FilePicker() {
  const inputRef = useRef<HTMLInputElement>(null);
  const setLoading = useAppStore((s) => s.setLoading);
  const setLoadError = useAppStore((s) => s.setLoadError);
  const setGraph = useAppStore((s) => s.setGraph);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      setLoading(true);
      setLoadError(null);
      try {
        const result = await loadGraphFromFile(file);
        setGraph({ graph: result.graph, adapter: result.adapter, source: result.source });
      } catch (err) {
        setLoadError((err as Error).message);
      }
    },
    [setGraph, setLoading, setLoadError],
  );

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragging(false);
      const file = event.dataTransfer.files[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  return (
    <div
      onDrop={onDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      className={`flex h-full w-full flex-col items-center justify-center gap-4 px-6 text-center transition-colors ${
        dragging ? 'bg-sky-50 dark:bg-sky-950/30' : ''
      }`}
    >
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">NodeExplorer</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Drop a JSON graph file here, or click to browse.
        </p>
        <p className="text-xs text-neutral-500">
          Expected shape: <code className="font-mono">{'{ nodes: [{ id, ... }], edges: [{ from, to, ... }] }'}</code>
        </p>
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
      >
        Choose file…
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
          event.target.value = '';
        }}
      />
    </div>
  );
}

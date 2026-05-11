import { useEffect, useMemo, useRef } from 'react';
import { SigmaContainer, useLoadGraph, useRegisterEvents, useSigma } from '@react-sigma/core';
import '@react-sigma/core/lib/style.css';
import { MultiDirectedGraph } from 'graphology';
import { useAppStore } from '@/state/store';
import { tokensFor } from './styling';
import { makeNodeHoverRenderer, makeNodeLabelRenderer } from './labelRenderer';
import { applyGrouping, type GroupingResult } from '@/core/grouping';
import { isVisible } from '@/core/filters';
import { computeNodeSizing } from '@/core/sizing';
import type { AppGraph } from '@/core/graph';

function GraphLoader({ graph }: { graph: AppGraph }) {
  const loadGraph = useLoadGraph();
  useEffect(() => {
    loadGraph(graph);
  }, [graph, loadGraph]);
  return null;
}

function EventBindings() {
  const setSelectedNode = useAppStore((s) => s.setSelectedNode);
  const registerEvents = useRegisterEvents();
  const sigma = useSigma();

  useEffect(() => {
    registerEvents({
      clickNode: (event) => setSelectedNode(event.node),
      clickStage: () => setSelectedNode(null),
    });
    const container = sigma.getContainer();
    container.style.cursor = 'default';
  }, [registerEvents, setSelectedNode, sigma]);

  return null;
}

function ThemeApplier() {
  const theme = useAppStore((s) => s.theme);
  const sigma = useSigma();

  useEffect(() => {
    const tokens = tokensFor(theme);
    const container = sigma.getContainer();
    container.style.background = tokens.background;
    sigma.setSetting('labelColor', { color: tokens.labelColor });
    sigma.setSetting('defaultEdgeColor', tokens.edgeColor);
    sigma.setSetting('defaultDrawNodeLabel', makeNodeLabelRenderer(tokens));
    sigma.setSetting('defaultDrawNodeHover', makeNodeHoverRenderer(tokens));
    sigma.refresh();
  }, [theme, sigma]);

  return null;
}

function CameraOnSelection() {
  const selectedNodeId = useAppStore((s) => s.selectedNodeId);
  const sigma = useSigma();
  const lastFocused = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedNodeId || selectedNodeId === lastFocused.current) return;
    const graph = sigma.getGraph();
    if (!graph.hasNode(selectedNodeId)) return;
    const display = sigma.getNodeDisplayData(selectedNodeId);
    if (!display) return;
    const camera = sigma.getCamera();
    camera.animate({ x: display.x, y: display.y, ratio: Math.min(camera.ratio, 0.4) }, { duration: 350 });
    lastFocused.current = selectedNodeId;
  }, [selectedNodeId, sigma]);

  return null;
}

function VisualReducers() {
  const selectedNodeId = useAppStore((s) => s.selectedNodeId);
  const theme = useAppStore((s) => s.theme);
  const groupBy = useAppStore((s) => s.groupBy);
  const filters = useAppStore((s) => s.filters);
  const sizingMode = useAppStore((s) => s.sizingMode);
  const adapter = useAppStore((s) => s.adapter);
  const graph = useAppStore((s) => s.graph);
  const epoch = useAppStore((s) => s.epoch);
  const sigma = useSigma();

  const grouping: GroupingResult | null = useMemo(() => {
    if (!graph || !adapter) return null;
    return applyGrouping(graph, adapter, groupBy, filters, theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph, adapter, groupBy, filters, theme, epoch]);

  const sizing = useMemo(() => {
    if (!graph) return null;
    return computeNodeSizing(graph, filters, grouping, sizingMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph, filters, grouping, sizingMode, epoch]);

  useEffect(() => {
    const tokens = tokensFor(theme);

    const neighbours = new Set<string>();
    if (selectedNodeId && graph?.hasNode(selectedNodeId)) {
      neighbours.add(selectedNodeId);
      graph.forEachNeighbor(selectedNodeId, (n) => neighbours.add(n));
    }

    const baseSizeFor = (node: string, attrs: { size?: number }) =>
      sizing ? sizing.sizeOf(node) : (attrs.size ?? 4);

    sigma.setSetting('nodeReducer', (node, attrs) => {
      const visible = !graph ? true : isVisible(graph.getNodeAttributes(node), filters);
      if (!visible) return { ...attrs, hidden: true };

      const groupId = grouping?.nodeToGroup.get(node) ?? null;
      const baseColor = grouping ? grouping.colorOf(groupId) : tokens.nodeFill;
      const size = baseSizeFor(node, attrs);

      if (selectedNodeId) {
        if (node === selectedNodeId) {
          return { ...attrs, color: tokens.nodeFillSelected, size: size * 1.6, zIndex: 2 };
        }
        if (neighbours.has(node)) {
          return { ...attrs, color: baseColor, size: size * 1.2, zIndex: 1 };
        }
        // Dim non-neighbours
        return { ...attrs, color: baseColor, label: '', size: Math.max(2, size * 0.7), zIndex: 0 };
      }

      return { ...attrs, color: baseColor, size };
    });

    sigma.setSetting('edgeReducer', (edge, attrs) => {
      if (!graph) return { ...attrs, color: tokens.edgeColor };
      const [source, target] = graph.extremities(edge);
      const sourceVisible = isVisible(graph.getNodeAttributes(source), filters);
      const targetVisible = isVisible(graph.getNodeAttributes(target), filters);
      if (!sourceVisible || !targetVisible) return { ...attrs, hidden: true };

      if (selectedNodeId && (source === selectedNodeId || target === selectedNodeId)) {
        return { ...attrs, color: tokens.edgeColorHighlight, size: 1.5, zIndex: 1 };
      }
      if (selectedNodeId) {
        return { ...attrs, color: tokens.edgeColor, hidden: false };
      }
      return { ...attrs, color: tokens.edgeColor };
    });

    sigma.refresh();
  }, [selectedNodeId, theme, sigma, graph, filters, grouping]);

  return null;
}

export function SigmaCanvas() {
  const graph = useAppStore((s) => s.graph);
  const theme = useAppStore((s) => s.theme);

  if (!graph) return null;

  const tokens = tokensFor(theme);

  return (
    <div className="sigma-host">
      <SigmaContainer
        graph={MultiDirectedGraph}
        style={{ height: '100%', width: '100%', background: tokens.background }}
        settings={{
          renderLabels: true,
          labelDensity: 0.7,
          labelGridCellSize: 60,
          labelRenderedSizeThreshold: 3,
          labelSize: 12,
          labelWeight: '500',
          labelFont: 'system-ui, -apple-system, "Segoe UI", sans-serif',
          defaultNodeColor: tokens.nodeFill,
          defaultEdgeColor: tokens.edgeColor,
          labelColor: { color: tokens.labelColor },
          defaultDrawNodeLabel: makeNodeLabelRenderer(tokens),
          defaultDrawNodeHover: makeNodeHoverRenderer(tokens),
          allowInvalidContainer: true,
        }}
      >
        <GraphLoader graph={graph} />
        <ThemeApplier />
        <VisualReducers />
        <CameraOnSelection />
        <EventBindings />
      </SigmaContainer>
    </div>
  );
}

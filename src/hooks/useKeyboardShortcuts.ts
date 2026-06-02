import { useEffect } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useFlowStore, beginSnapshotRestore, endSnapshotRestore } from '../store/flow-store';
import { useHistoryStore } from '../store/history-store';
import { useAppStore } from '../store/app-store';

export function useKeyboardShortcuts() {
  const { getNodes, setNodes, getEdges, setEdges } = useReactFlow();
  const addNode = useFlowStore((s) => s.addNode);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement;

      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      // Ctrl+Z — Undo
      if (isMod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        const nodes = getNodes();
        const edges = getEdges();
        const snapshot = useHistoryStore.getState().undo({ nodes, edges });
        if (snapshot) {
          beginSnapshotRestore();
          setNodes(snapshot.nodes);
          setEdges(snapshot.edges);
          endSnapshotRestore();
        }
        return;
      }

      // Ctrl+Shift+Z — Redo
      if (isMod && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        const nodes = getNodes();
        const edges = getEdges();
        const snapshot = useHistoryStore.getState().redo({ nodes, edges });
        if (snapshot) {
          beginSnapshotRestore();
          setNodes(snapshot.nodes);
          setEdges(snapshot.edges);
          endSnapshotRestore();
        }
        return;
      }

      // Ctrl+A — Select all
      if (isMod && e.key === 'a') {
        e.preventDefault();
        setNodes(getNodes().map((n) => ({ ...n, selected: true })));
        return;
      }

      // Ctrl+D — Duplicate selected
      if (isMod && e.key === 'd') {
        e.preventDefault();
        const selected = getNodes().filter((n) => n.selected);
        for (const node of selected) {
          if (node.type) {
            addNode(node.type, { x: node.position.x + 40, y: node.position.y + 40 });
          }
        }
        return;
      }

      // Ctrl+S — Save flow
      if (isMod && e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        useFlowStore.getState().saveFlow();
        useAppStore.getState().addToast('Flow saved', 'success');
        return;
      }

      // Ctrl+O — Open flow browser
      if (isMod && e.key === 'o') {
        e.preventDefault();
        useAppStore.getState().setFlowBrowserOpen(true);
        return;
      }

      // Ctrl+Shift+S — Save As (new name)
      if (isMod && e.key === 's' && e.shiftKey) {
        e.preventDefault();
        const name = prompt('Save flow as:', useFlowStore.getState().flowMeta.name);
        if (name) {
          useFlowStore.getState().saveFlow(name);
          useAppStore.getState().addToast(`Saved as "${name}"`, 'success');
        }
        return;
      }

      // Delete / Backspace — Delete selected nodes and edges
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selectedNodes = getNodes().filter((n) => n.selected);
        const selectedEdges = getEdges().filter((e) => e.selected);
        if (selectedNodes.length > 0 || selectedEdges.length > 0) {
          const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));
          const newNodes = getNodes().filter((n) => !selectedNodeIds.has(n.id));
          const newEdges = getEdges().filter(
            (e) => !selectedEdges.some((se) => se.id === e.id) && !selectedNodeIds.has(e.source) && !selectedNodeIds.has(e.target)
          );
          setNodes(newNodes);
          setEdges(newEdges);
        }
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [getNodes, setNodes, getEdges, setEdges, addNode]);
}

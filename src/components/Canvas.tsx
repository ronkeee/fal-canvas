import { useCallback, useState, useRef, type DragEvent } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  type ReactFlowInstance,
  type Connection,
  type Edge,
  type Node,
  type OnConnectStart,
  type OnConnectEnd,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useFlowStore } from '../store/flow-store';
import { useAppStore, type BgStyle } from '../store/app-store';
import { nodeTypes, NODE_CONFIGS } from '../nodes';
import { CustomEdge } from './CustomEdge';
import { ConnectionLine } from './ConnectionLine';
import { ContextMenu } from './ContextMenu';
import { BottomToolbar } from './BottomToolbar';
import { EmptyState } from './EmptyState';
import { QuickAddMenu } from './QuickAddMenu';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { usePopoverStore } from '../store/popover-store';
import type { PortType } from '../engine/types';

import { Map, Minimize2 } from 'lucide-react';

const edgeTypes = { custom: CustomEdge };

function CollapsibleMinimap() {
  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem('riverflow-minimap') !== 'closed'; }
    catch { return true; }
  });

  const toggle = () => {
    const next = !open;
    setOpen(next);
    try { localStorage.setItem('riverflow-minimap', next ? 'open' : 'closed'); } catch {}
  };

  if (!open) {
    return (
      <div className="absolute bottom-3 right-3 z-10">
        <button
          onClick={toggle}
          className="flex items-center justify-center transition-all duration-150"
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: 'rgba(26, 26, 28, 0.50)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-secondary-c200)',
            cursor: 'pointer',
          }}
          title="Show minimap"
        >
          <Map size={14} />
        </button>
      </div>
    );
  }

  return (
    <>
      <MiniMap
        position="bottom-right"
        maskColor="rgba(0,0,0,0.7)"
        nodeStrokeWidth={3}
        style={{ marginBottom: 8, marginRight: 8 }}
      />
      {/* Minimize button overlaid on top of minimap */}
      <div className="absolute bottom-3 right-3 z-10">
        <button
          onClick={toggle}
          className="flex items-center justify-center transition-all duration-150 hover:bg-[rgba(255,255,255,0.1)]"
          style={{
            width: 20,
            height: 20,
            borderRadius: 6,
            background: 'rgba(26, 26, 28, 0.7)',
            color: 'var(--color-secondary-c300)',
            cursor: 'pointer',
            border: 'none',
          }}
          title="Hide minimap"
        >
          <Minimize2 size={10} />
        </button>
      </div>
    </>
  );
}

interface ContextMenuState {
  x: number;
  y: number;
  type: 'pane' | 'node';
  nodeId?: string;
}

const BG_CONFIGS: Record<BgStyle, { variant: BackgroundVariant; gap: number; size: number; color: string }> = {
  fine:   { variant: BackgroundVariant.Dots, gap: 24, size: 2, color: 'rgba(255,255,255,0.15)' },
  coarse: { variant: BackgroundVariant.Dots, gap: 44, size: 3, color: 'rgba(255,255,255,0.15)' },
  cross:  { variant: BackgroundVariant.Cross, gap: 36, size: 3, color: 'rgba(255,255,255,0.08)' },
};

export function Canvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode } = useFlowStore();
  const setSelectedNodeId = useAppStore((s) => s.setSelectedNodeId);
  const bgStyle = useAppStore((s) => s.bgStyle);
  const showGradient = useAppStore((s) => s.showGradient);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // Quick-connect: track drag start info
  const connectStartRef = useRef<{ nodeId: string; handleId: string; handleType: string } | null>(null);
  const [quickAddMenu, setQuickAddMenu] = useState<{
    x: number; y: number; sourceNodeId: string; sourceHandleId: string; portType: PortType;
    direction: 'left' | 'right';
  } | null>(null);
  const edgeCountRef = useRef(0);

  useKeyboardShortcuts();

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type || !rfInstance) return;

      const position = rfInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode(type, position);
    },
    [rfInstance, addNode]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: { id: string }) => {
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setContextMenu(null);
    setQuickAddMenu(null);
    // Dismiss all open popovers/menus globally
    usePopoverStore.getState().dismissAll();
  }, [setSelectedNodeId]);

  // Sync React Flow selection state with app store (covers post-execution staleness)
  const onSelectionChange = useCallback(({ nodes: selectedNodes }: { nodes: { id: string }[] }) => {
    if (selectedNodes.length === 1) {
      setSelectedNodeId(selectedNodes[0].id);
    } else if (selectedNodes.length === 0) {
      setSelectedNodeId(null);
    }
  }, [setSelectedNodeId]);

  const onPaneContextMenu = useCallback(
    (event: MouseEvent | React.MouseEvent) => {
      event.preventDefault();
      setContextMenu({ x: event.clientX, y: event.clientY, type: 'pane' });
    },
    []
  );

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      setContextMenu({ x: event.clientX, y: event.clientY, type: 'node', nodeId: node.id });
    },
    []
  );

  const handleContextMenuAddNode = useCallback(
    (type: string, screenPos: { x: number; y: number }) => {
      if (!rfInstance) return;
      const position = rfInstance.screenToFlowPosition(screenPos);
      addNode(type, position);
    },
    [rfInstance, addNode]
  );

  const isValidConnection = useCallback(
    (connection: Connection | Edge) => {
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);
      if (!sourceNode?.type || !targetNode?.type) return false;

      const sourceConfig = NODE_CONFIGS[sourceNode.type];
      const targetConfig = NODE_CONFIGS[targetNode.type];
      if (!sourceConfig || !targetConfig) return false;

      const sourcePort = sourceConfig.outputs.find((p) => p.id === connection.sourceHandle);
      const targetPort = targetConfig.inputs.find((p) => p.id === connection.targetHandle);
      if (!sourcePort || !targetPort) return false;

      // 'any' type accepts everything
      if (sourcePort.type === 'any' || targetPort.type === 'any') return true;

      return sourcePort.type === targetPort.type;
    },
    [nodes]
  );

  const onConnectStart: OnConnectStart = useCallback((_event, params) => {
    connectStartRef.current = {
      nodeId: params.nodeId || '',
      handleId: params.handleId || '',
      handleType: params.handleType || 'source',
    };
    edgeCountRef.current = useFlowStore.getState().edges.length;
  }, []);

  const onConnectEnd: OnConnectEnd = useCallback((event) => {
    const startInfo = connectStartRef.current;
    connectStartRef.current = null;

    if (!startInfo || !rfInstance) return;

    // Wait a tick for the edge to be created
    setTimeout(() => {
      const currentEdgeCount = useFlowStore.getState().edges.length;
      if (currentEdgeCount > edgeCountRef.current) return; // edge was created, no menu needed

      // Check if released on empty canvas (not on a handle)
      const nativeEvent = 'changedTouches' in event
        ? (event as TouchEvent).changedTouches[0]
        : (event as MouseEvent);

      const target = (event as MouseEvent).target as HTMLElement;
      // If dropped on a handle, don't show menu
      if (target?.closest?.('.react-flow__handle')) return;

      const clientX = nativeEvent.clientX;
      const clientY = nativeEvent.clientY;
      if (!clientX && !clientY) return; // safety check

      const currentNodes = useFlowStore.getState().nodes;
      const dragNode = currentNodes.find((n) => n.id === startInfo.nodeId);
      let portType: PortType = 'any';

      if (startInfo.handleType === 'source') {
        // Dragged from output → new node receives from us (direction: right)
        if (dragNode?.type) {
          const config = NODE_CONFIGS[dragNode.type];
          const port = config?.outputs.find((p) => p.id === startInfo.handleId);
          if (port) portType = port.type;
        }
        setQuickAddMenu({
          x: clientX, y: clientY,
          sourceNodeId: startInfo.nodeId,
          sourceHandleId: startInfo.handleId,
          portType, direction: 'right',
        });
      } else {
        // Dragged from input → new node sends to us (direction: left)
        if (dragNode?.type) {
          const config = NODE_CONFIGS[dragNode.type];
          const port = config?.inputs.find((p) => p.id === startInfo.handleId);
          if (port) portType = port.type;
        }
        setQuickAddMenu({
          x: clientX, y: clientY,
          sourceNodeId: startInfo.nodeId,
          sourceHandleId: startInfo.handleId,
          portType, direction: 'left',
        });
      }
    }, 50);
  }, [rfInstance]);

  const handleQuickAddSelect = useCallback((nodeType: string, newNodeHandleId: string) => {
    if (!quickAddMenu || !rfInstance) return;

    const flowPos = rfInstance.screenToFlowPosition({
      x: quickAddMenu.x,
      y: quickAddMenu.y,
    });

    const store = useFlowStore.getState();
    const newNodeId = store.addNode(nodeType, { x: flowPos.x - 130, y: flowPos.y - 40 });
    if (!newNodeId) { setQuickAddMenu(null); return; }

    if (quickAddMenu.direction === 'right') {
      // Existing node's output → new node's input
      store.onConnect({
        source: quickAddMenu.sourceNodeId,
        sourceHandle: quickAddMenu.sourceHandleId,
        target: newNodeId,
        targetHandle: newNodeHandleId,
      });
    } else {
      // New node's output → existing node's input
      store.onConnect({
        source: newNodeId,
        sourceHandle: newNodeHandleId,
        target: quickAddMenu.sourceNodeId,
        targetHandle: quickAddMenu.sourceHandleId,
      });
    }
    setQuickAddMenu(null);
  }, [quickAddMenu, rfInstance]);

  return (
    <div className="absolute inset-0">
      {/* Base canvas color */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'var(--color-canvas-bg)', zIndex: 0 }} />
      {/* Breathing gradient overlay — GPU-accelerated via transform + opacity */}
      {showGradient && (
        <div
          className="absolute inset-0 canvas-breathing-bg pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse 120% 80% at 50% -10%, rgba(55, 75, 65, 0.5) 0%, transparent 65%),
              radial-gradient(ellipse 100% 70% at 90% 10%, rgba(40, 60, 80, 0.4) 0%, transparent 60%),
              radial-gradient(ellipse 90% 80% at 10% 90%, rgba(70, 45, 55, 0.3) 0%, transparent 60%),
              radial-gradient(ellipse 70% 60% at 70% 75%, rgba(50, 40, 70, 0.25) 0%, transparent 60%)
            `,
            zIndex: 1,
          }}
        />
      )}
      <EmptyState />
      <ReactFlow
        style={{
          background: 'transparent',
        }}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setRfInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onSelectionChange={onSelectionChange}
        onPaneContextMenu={onPaneContextMenu}
        onNodeContextMenu={onNodeContextMenu}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        isValidConnection={isValidConnection}
        connectionLineComponent={ConnectionLine}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        deleteKeyCode={null}
        colorMode="dark"
        snapToGrid
        snapGrid={[12, 12]}
        selectNodesOnDrag
        multiSelectionKeyCode="Shift"
        proOptions={{ hideAttribution: true }}
        minZoom={0.1}
        maxZoom={4}
        defaultEdgeOptions={{
          type: 'custom',
        }}
      >
        <Background
          variant={BG_CONFIGS[bgStyle].variant}
          gap={BG_CONFIGS[bgStyle].gap}
          size={BG_CONFIGS[bgStyle].size}
          color={BG_CONFIGS[bgStyle].color}
        />
        <CollapsibleMinimap />
        <BottomToolbar />
      </ReactFlow>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          type={contextMenu.type}
          nodeId={contextMenu.nodeId}
          onClose={() => setContextMenu(null)}
          onAddNode={handleContextMenuAddNode}
        />
      )}

      {/* Quick-connect menu (drag handle to empty canvas) */}
      {quickAddMenu && (
        <QuickAddMenu
          x={quickAddMenu.x}
          y={quickAddMenu.y}
          sourcePortType={quickAddMenu.portType}
          direction={quickAddMenu.direction}
          onSelect={handleQuickAddSelect}
          onClose={() => setQuickAddMenu(null)}
        />
      )}
    </div>
  );
}

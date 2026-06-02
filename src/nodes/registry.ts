import type { NodeTypes } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import type { NodeConfig } from '../engine/types';

type NodeHandler = (
  node: Node,
  inputs: Record<string, unknown>,
  onStatus: (status: string, progress?: number) => void,
  abortSignal?: AbortSignal,
) => Promise<Record<string, unknown>>;

class NodeRegistry {
  private _nodeTypes: NodeTypes = {};
  private _configs: Record<string, NodeConfig> = {};
  private _handlers: Record<string, NodeHandler> = {};

  register(
    type: string,
    config: NodeConfig,
    component: React.ComponentType<unknown>,
    handler: NodeHandler,
  ) {
    this._configs[type] = config;
    this._nodeTypes[type] = component as unknown as NodeTypes[string];
    this._handlers[type] = handler;
  }

  get nodeTypes(): NodeTypes {
    return this._nodeTypes;
  }

  get configs(): Record<string, NodeConfig> {
    return this._configs;
  }

  get handlers(): Record<string, NodeHandler> {
    return this._handlers;
  }

  getHandler(type: string): NodeHandler | undefined {
    return this._handlers[type];
  }

  getConfig(type: string): NodeConfig | undefined {
    return this._configs[type];
  }
}

export const nodeRegistry = new NodeRegistry();
export type { NodeHandler };

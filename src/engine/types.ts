export type PortType = 'text' | 'image' | 'video' | 'audio' | 'model-id' | 'any';

export interface PortDef {
  id: string;
  label: string;
  type: PortType;
  required: boolean;
}

export interface NodeConfig {
  type: string;
  label: string;
  category: 'input' | 'ai' | 'output' | 'utility';
  icon: string;
  inputs: PortDef[];
  outputs: PortDef[];
  defaultData: Record<string, unknown>;
}

export type NodeExecutionStatus = 'idle' | 'pending' | 'queued' | 'running' | 'completed' | 'error';

export interface NodeExecutionState {
  status: NodeExecutionStatus;
  progress?: number;
  result?: Record<string, unknown>;
  error?: string;
  startedAt?: number;
  completedAt?: number;
}

// ===== Flow Analysis Types =====

export interface FlowAnalysisModel {
  nodeId: string;
  modelId: string;
  modelName: string;
  category: string;
  description: string;
  timeRange: [number, number];
  costRange: [number, number];
}

export interface FlowAnalysisWarning {
  type: 'empty-prompt' | 'missing-image' | 'unconnected' | 'high-resolution';
  message: string;
  nodeId?: string;
}

export interface FlowAnalysis {
  totalNodes: number;
  totalEdges: number;
  aiModels: FlowAnalysisModel[];
  executionWaves: string[][];
  totalTimeRange: [number, number];
  totalCostRange: [number, number];
  warnings: FlowAnalysisWarning[];
}

// Monochrome port colors — single neutral gray
export const PORT_COLORS: Record<PortType, string> = {
  text: '#636366',
  image: '#636366',
  video: '#636366',
  audio: '#636366',
  'model-id': '#636366',
  any: '#636366',
};

// Monochrome category colors — no per-category tints
export const CATEGORY_COLORS: Record<string, string> = {
  input: '#636366',
  ai: '#636366',
  output: '#636366',
  utility: '#636366',
};

export const STATUS_COLORS: Record<NodeExecutionStatus, string> = {
  idle: '#636366',     // Apple systemGray2
  pending: '#ff9f0a',  // Apple systemOrange
  queued: '#ff9f0a',
  running: '#64d2ff',  // Apple systemCyan
  completed: '#30d158', // Apple systemGreen
  error: '#ff453a',    // Apple systemRed
};

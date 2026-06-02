import { fal } from './client';

export interface RunModelOptions {
  modelId: string;
  input: Record<string, unknown>;
  onStatusUpdate?: (status: string, progress?: number) => void;
  abortSignal?: AbortSignal;
}

export interface RunModelResult {
  data: Record<string, unknown>;
  requestId: string;
}

export async function runModel({ modelId, input, onStatusUpdate, abortSignal }: RunModelOptions): Promise<RunModelResult> {
  onStatusUpdate?.('queued');

  const result = await fal.subscribe(modelId, {
    input,
    logs: true,
    abortSignal,
    onQueueUpdate: (update) => {
      if (update.status === 'IN_QUEUE') {
        onStatusUpdate?.('queued', update.queue_position ? 1 / (update.queue_position + 1) : 0);
      } else if (update.status === 'IN_PROGRESS') {
        onStatusUpdate?.('running');
      }
    },
  });

  onStatusUpdate?.('completed');

  return {
    data: result.data as Record<string, unknown>,
    requestId: result.requestId,
  };
}

import { useExecutionStore } from '../store/execution-store';
import { checkJobStatus, getJobResult } from './fal-service';

interface ActiveJob {
  nodeId: string;
  modelId: string;
  requestId: string;
  startedAt: number;
}

const activeJobs: Map<string, ActiveJob> = new Map();
let pollingInterval: ReturnType<typeof setInterval> | null = null;

export function registerJob(nodeId: string, modelId: string, requestId: string) {
  activeJobs.set(requestId, { nodeId, modelId, requestId, startedAt: Date.now() });
  ensurePolling();
}

export function removeJob(requestId: string) {
  activeJobs.delete(requestId);
  if (activeJobs.size === 0 && pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

function ensurePolling() {
  if (pollingInterval) return;
  pollingInterval = setInterval(pollJobs, 3000);
}

async function pollJobs() {
  const store = useExecutionStore.getState();

  for (const [requestId, job] of activeJobs) {
    try {
      const status = await checkJobStatus(job.modelId, requestId);

      if (status.status === 'COMPLETED') {
        const result = await getJobResult(job.modelId, requestId);
        const data = result.data as Record<string, unknown>;

        // Extract results
        const video = data.video as { url: string } | undefined;
        const images = data.images as Array<{ url: string }> | undefined;
        const audio = data.audio_file as { url: string } | undefined;

        store.setNodeState(job.nodeId, {
          status: 'completed',
          result: {
            video: video?.url,
            image: images?.[0]?.url,
            audio: audio?.url,
            rawResult: data,
          },
          completedAt: Date.now(),
        });

        removeJob(requestId);
      } else if ((status.status as string) === 'FAILED') {
        store.setNodeState(job.nodeId, {
          status: 'error',
          error: 'Job failed',
          completedAt: Date.now(),
        });
        removeJob(requestId);
      } else {
        // Still in progress - update status
        store.setNodeState(job.nodeId, {
          status: status.status === 'IN_QUEUE' ? 'queued' : 'running',
        });
      }
    } catch (err) {
      console.error(`Error polling job ${requestId}:`, err);
    }
  }
}

export function getActiveJobCount(): number {
  return activeJobs.size;
}

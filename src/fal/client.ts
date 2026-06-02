import { fal } from '@fal-ai/client';

export function configureFal(apiKey: string) {
  fal.config({ credentials: apiKey });
}

export { fal };

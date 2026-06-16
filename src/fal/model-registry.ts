// ===== Model Parameter Schema =====

export interface ModelParam {
  key: string;
  label: string;
  type: 'select' | 'slider' | 'toggle' | 'number';
  default: unknown;
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  step?: number;
}

export interface ModelInfo {
  id: string;
  name: string;
  category: 'image' | 'video' | 'audio' | 'upscale' | 'edit';
  description: string;
  defaultParams: Record<string, unknown>;
  params: ModelParam[];
  /** Estimated execution time in seconds [min, max] */
  estimatedTimeSeconds: [number, number];
  /** Estimated cost in cents [min, max] */
  estimatedCostCents: [number, number];
  /** Whether this model accepts an image input for image-to-X generation */
  supportsImageInput?: boolean;
  /** The API param key for the image input (default: 'image_url') — e.g. Kling uses 'start_image_url' */
  imageInputKey?: string;
  /** Whether this model accepts a video input for video-to-video generation */
  supportsVideoInput?: boolean;
  /** The API param key for the video input (default: 'video_url') — Seedance uses 'video_urls' */
  videoInputKey?: string;
  /** Whether this model accepts an audio input as reference */
  supportsAudioInput?: boolean;
  /** The API param key for the audio input — Seedance uses 'audio_urls' */
  audioInputKey?: string;
}

// ===== Shared Option Sets =====

const NANO_BANANA_ASPECT_RATIOS = [
  { label: 'Auto', value: 'auto' },
  { label: '21:9', value: '21:9' },
  { label: '16:9', value: '16:9' },
  { label: '3:2', value: '3:2' },
  { label: '4:3', value: '4:3' },
  { label: '1:1', value: '1:1' },
  { label: '3:4', value: '3:4' },
  { label: '9:16', value: '9:16' },
];

const FLUX_IMAGE_SIZES = [
  { label: 'Square', value: 'square' },
  { label: 'Square HD', value: 'square_hd' },
  { label: 'Landscape 4:3', value: 'landscape_4_3' },
  { label: 'Landscape 16:9', value: 'landscape_16_9' },
  { label: 'Portrait 3:4', value: 'portrait_4_3' },
  { label: 'Portrait 9:16', value: 'portrait_16_9' },
];

// ===== Model Registry =====

export const MODELS: ModelInfo[] = [
  // ── Image Generation ──────────────────────────────
  {
    id: 'fal-ai/nano-banana-2',
    name: 'Nano Banana 2',
    category: 'image',
    description: 'Fastest reasoning-guided image generation (~1-3s)',
    estimatedTimeSeconds: [1, 3],
    estimatedCostCents: [1, 2],
    defaultParams: { aspect_ratio: '16:9', num_images: 1, resolution: '1K' },
    params: [
      { key: 'aspect_ratio', label: 'Aspect Ratio', type: 'select', default: '16:9', options: NANO_BANANA_ASPECT_RATIOS },
      { key: 'resolution', label: 'Resolution', type: 'select', default: '1K', options: [
        { label: '0.5K', value: '0.5K' }, { label: '1K', value: '1K' }, { label: '2K', value: '2K' }, { label: '4K', value: '4K' },
      ]},
      { key: 'num_images', label: 'Images', type: 'number', default: 1, min: 1, max: 4, step: 1 },
      { key: 'thinking_level', label: 'Thinking', type: 'select', default: '', options: [
        { label: 'Off', value: '' }, { label: 'Minimal', value: 'minimal' }, { label: 'High', value: 'high' },
      ]},
      { key: 'enable_web_search', label: 'Web Search', type: 'toggle', default: false },
      { key: 'seed', label: 'Seed', type: 'number', default: 0, min: 0, max: 999999999, step: 1 },
    ],
  },
  {
    id: 'fal-ai/nano-banana-pro',
    name: 'Nano Banana Pro',
    category: 'image',
    description: 'Max reasoning depth, premium quality',
    estimatedTimeSeconds: [3, 8],
    estimatedCostCents: [2, 5],
    defaultParams: { aspect_ratio: '16:9', num_images: 1, resolution: '1K' },
    params: [
      { key: 'aspect_ratio', label: 'Aspect Ratio', type: 'select', default: '16:9', options: NANO_BANANA_ASPECT_RATIOS },
      { key: 'resolution', label: 'Resolution', type: 'select', default: '1K', options: [
        { label: '0.5K', value: '0.5K' }, { label: '1K', value: '1K' }, { label: '2K', value: '2K' }, { label: '4K', value: '4K' },
      ]},
      { key: 'num_images', label: 'Images', type: 'number', default: 1, min: 1, max: 4, step: 1 },
      { key: 'thinking_level', label: 'Thinking', type: 'select', default: '', options: [
        { label: 'Off', value: '' }, { label: 'Minimal', value: 'minimal' }, { label: 'High', value: 'high' },
      ]},
      { key: 'enable_web_search', label: 'Web Search', type: 'toggle', default: false },
      { key: 'seed', label: 'Seed', type: 'number', default: 0, min: 0, max: 999999999, step: 1 },
    ],
  },
  {
    id: 'fal-ai/flux-pro/v1.1',
    name: 'FLUX.2 Pro',
    category: 'image',
    description: 'Best photorealism — skin, lighting, texture',
    estimatedTimeSeconds: [5, 15],
    estimatedCostCents: [5, 10],
    defaultParams: { image_size: 'landscape_4_3', num_images: 1 },
    params: [
      { key: 'image_size', label: 'Size', type: 'select', default: 'landscape_4_3', options: FLUX_IMAGE_SIZES },
      { key: 'num_images', label: 'Images', type: 'number', default: 1, min: 1, max: 4, step: 1 },
      { key: 'enhance_prompt', label: 'Enhance Prompt', type: 'toggle', default: false },
      { key: 'seed', label: 'Seed', type: 'number', default: 0, min: 0, max: 999999999, step: 1 },
    ],
  },
  {
    id: 'fal-ai/flux/schnell',
    name: 'Flux Schnell',
    category: 'image',
    description: 'Fast and free-tier friendly',
    estimatedTimeSeconds: [1, 3],
    estimatedCostCents: [0.3, 0.5],
    defaultParams: { image_size: 'landscape_4_3', num_images: 1, num_inference_steps: 4 },
    params: [
      { key: 'image_size', label: 'Size', type: 'select', default: 'landscape_4_3', options: FLUX_IMAGE_SIZES },
      { key: 'num_inference_steps', label: 'Steps', type: 'slider', default: 4, min: 1, max: 4, step: 1 },
      { key: 'guidance_scale', label: 'Guidance', type: 'slider', default: 3.5, min: 1, max: 10, step: 0.5 },
      { key: 'num_images', label: 'Images', type: 'number', default: 1, min: 1, max: 4, step: 1 },
      { key: 'seed', label: 'Seed', type: 'number', default: 0, min: 0, max: 999999999, step: 1 },
    ],
  },
  {
    id: 'fal-ai/recraft-v3',
    name: 'Recraft V3',
    category: 'image',
    description: 'Best for logos/design, SVG export',
    estimatedTimeSeconds: [3, 8],
    estimatedCostCents: [4, 8],
    defaultParams: { image_size: 'landscape_4_3' },
    params: [
      { key: 'style', label: 'Style', type: 'select', default: 'realistic_image', options: [
        { label: 'Realistic', value: 'realistic_image' },
        { label: 'Digital Illustration', value: 'digital_illustration' },
        { label: 'Vector', value: 'vector_illustration' },
        { label: 'Icon', value: 'icon' },
      ]},
      { key: 'image_size', label: 'Size', type: 'select', default: 'landscape_4_3', options: FLUX_IMAGE_SIZES },
    ],
  },
  {
    id: 'fal-ai/gpt-image-1.5',
    name: 'GPT Image 1.5',
    category: 'image',
    description: 'OpenAI GPT image gen via fal — high quality, transparent bg support',
    estimatedTimeSeconds: [3, 10],
    estimatedCostCents: [1, 20],
    defaultParams: { image_size: '1024x1024', quality: 'high', background: 'auto', num_images: 1, output_format: 'png' },
    params: [
      { key: 'image_size', label: 'Size', type: 'select', default: '1024x1024', options: [
        { label: '1024×1024', value: '1024x1024' },
        { label: '1536×1024', value: '1536x1024' },
        { label: '1024×1536', value: '1024x1536' },
      ]},
      { key: 'quality', label: 'Quality', type: 'select', default: 'high', options: [
        { label: 'Low', value: 'low' }, { label: 'Medium', value: 'medium' }, { label: 'High', value: 'high' },
      ]},
      { key: 'background', label: 'Background', type: 'select', default: 'auto', options: [
        { label: 'Auto', value: 'auto' }, { label: 'Transparent', value: 'transparent' }, { label: 'Opaque', value: 'opaque' },
      ]},
      { key: 'output_format', label: 'Format', type: 'select', default: 'png', options: [
        { label: 'PNG', value: 'png' }, { label: 'JPEG', value: 'jpeg' }, { label: 'WebP', value: 'webp' },
      ]},
      { key: 'num_images', label: 'Images', type: 'number', default: 1, min: 1, max: 4, step: 1 },
    ],
  },
  {
    id: 'openai/gpt-image-2',
    name: 'GPT Image 2',
    category: 'image',
    description: 'Latest OpenAI image generation — high quality, multiple sizes',
    estimatedTimeSeconds: [3, 12],
    estimatedCostCents: [1, 25],
    defaultParams: { image_size: 'landscape_4_3', quality: 'high', num_images: 1, output_format: 'png' },
    params: [
      { key: 'image_size', label: 'Size', type: 'select', default: 'landscape_4_3', options: FLUX_IMAGE_SIZES },
      { key: 'quality', label: 'Quality', type: 'select', default: 'high', options: [
        { label: 'Low', value: 'low' }, { label: 'Medium', value: 'medium' }, { label: 'High', value: 'high' },
      ]},
      { key: 'output_format', label: 'Format', type: 'select', default: 'png', options: [
        { label: 'PNG', value: 'png' }, { label: 'JPEG', value: 'jpeg' }, { label: 'WebP', value: 'webp' },
      ]},
      { key: 'num_images', label: 'Images', type: 'number', default: 1, min: 1, max: 4, step: 1 },
    ],
  },

  // ── Image Editing ─────────────────────────────────
  {
    id: 'fal-ai/nano-banana-2/edit',
    name: 'Nano Banana 2 Edit',
    category: 'edit',
    description: 'Edit images with up to 14 references, no masks needed',
    estimatedTimeSeconds: [2, 5],
    estimatedCostCents: [1, 3],
    defaultParams: {},
    params: [
      { key: 'aspect_ratio', label: 'Aspect Ratio', type: 'select', default: 'auto', options: NANO_BANANA_ASPECT_RATIOS },
      { key: 'resolution', label: 'Resolution', type: 'select', default: '1K', options: [
        { label: '0.5K', value: '0.5K' }, { label: '1K', value: '1K' }, { label: '2K', value: '2K' }, { label: '4K', value: '4K' },
      ]},
    ],
  },
  {
    id: 'openai/gpt-image-2/edit',
    name: 'GPT Image 2 Edit',
    category: 'edit',
    description: 'Edit images with GPT Image 2 — supports multiple reference images',
    estimatedTimeSeconds: [5, 15],
    estimatedCostCents: [2, 30],
    defaultParams: { quality: 'high', num_images: 1, output_format: 'png' },
    params: [
      { key: 'quality', label: 'Quality', type: 'select', default: 'high', options: [
        { label: 'Low', value: 'low' }, { label: 'Medium', value: 'medium' }, { label: 'High', value: 'high' },
      ]},
      { key: 'output_format', label: 'Format', type: 'select', default: 'png', options: [
        { label: 'PNG', value: 'png' }, { label: 'JPEG', value: 'jpeg' }, { label: 'WebP', value: 'webp' },
      ]},
      { key: 'num_images', label: 'Images', type: 'number', default: 1, min: 1, max: 4, step: 1 },
    ],
  },

  // ── Video Generation — Text to Video ─────────────
  {
    id: 'fal-ai/veo3',
    name: 'Veo 3.1',
    category: 'video',
    supportsImageInput: false,
    description: 'Top video quality + audio sync (text only)',
    estimatedTimeSeconds: [30, 120],
    estimatedCostCents: [15, 50],
    defaultParams: { duration: '4s', aspect_ratio: '16:9', generate_audio: true },
    params: [
      { key: 'duration', label: 'Duration', type: 'select', default: '4s', options: [
        { label: '4s', value: '4s' }, { label: '8s', value: '8s' }, { label: '12s', value: '12s' },
      ]},
      { key: 'aspect_ratio', label: 'Aspect Ratio', type: 'select', default: '16:9', options: [
        { label: '16:9', value: '16:9' }, { label: '9:16', value: '9:16' },
      ]},
      { key: 'generate_audio', label: 'Generate Audio', type: 'toggle', default: true },
    ],
  },
  {
    id: 'fal-ai/sora',
    name: 'Sora 2 Pro',
    category: 'video',
    supportsImageInput: false,
    description: 'Long text-to-video clips up to 25 seconds',
    estimatedTimeSeconds: [30, 120],
    estimatedCostCents: [15, 50],
    defaultParams: { duration: '4s', resolution: '720p', aspect_ratio: '16:9' },
    params: [
      { key: 'duration', label: 'Duration', type: 'select', default: '4s', options: [
        { label: '4s', value: '4s' }, { label: '8s', value: '8s' }, { label: '12s', value: '12s' }, { label: '25s', value: '25s' },
      ]},
      { key: 'resolution', label: 'Resolution', type: 'select', default: '720p', options: [
        { label: '720p', value: '720p' }, { label: '1080p', value: '1080p' },
      ]},
      { key: 'aspect_ratio', label: 'Aspect Ratio', type: 'select', default: '16:9', options: [
        { label: '16:9', value: '16:9' }, { label: '9:16', value: '9:16' }, { label: '1:1', value: '1:1' },
      ]},
    ],
  },

  // ── Video Generation — Image to Video ─────────────
  {
    id: 'bytedance/seedance-2.0/enterprise/reference-to-video',
    name: 'Seedance 2.0 Enterprise',
    category: 'video',
    supportsImageInput: true,
    imageInputKey: 'image_urls',
    supportsVideoInput: true,
    videoInputKey: 'video_urls',
    supportsAudioInput: true,
    audioInputKey: 'audio_urls',
    description: 'Seedance 2.0 Enterprise — up to 9 image + 3 video refs, reduced content restrictions',
    estimatedTimeSeconds: [20, 90],
    estimatedCostCents: [10, 60],
    defaultParams: { resolution: '720p', duration: 'auto', aspect_ratio: 'auto', generate_audio: true },
    params: [
      { key: 'resolution', label: 'Resolution', type: 'select', default: '720p', options: [
        { label: '480p', value: '480p' }, { label: '720p', value: '720p' }, { label: '1080p', value: '1080p' },
      ]},
      { key: 'duration', label: 'Duration', type: 'select', default: 'auto', options: [
        { label: 'Auto', value: 'auto' },
        { label: '4s', value: '4' }, { label: '5s', value: '5' }, { label: '6s', value: '6' },
        { label: '7s', value: '7' }, { label: '8s', value: '8' }, { label: '9s', value: '9' },
        { label: '10s', value: '10' }, { label: '12s', value: '12' }, { label: '15s', value: '15' },
      ]},
      { key: 'aspect_ratio', label: 'Aspect Ratio', type: 'select', default: 'auto', options: [
        { label: 'Auto', value: 'auto' }, { label: '21:9', value: '21:9' }, { label: '16:9', value: '16:9' },
        { label: '4:3', value: '4:3' }, { label: '1:1', value: '1:1' }, { label: '3:4', value: '3:4' }, { label: '9:16', value: '9:16' },
      ]},
      { key: 'generate_audio', label: 'Generate Audio', type: 'toggle', default: true },
      { key: 'seed', label: 'Seed', type: 'number', default: 0, min: 0, max: 999999999, step: 1 },
    ],
  },
  {
    id: 'fal-ai/veo3.1/fast/image-to-video',
    name: 'Veo 3.1 Img2Vid',
    category: 'video',
    supportsImageInput: true,
    imageInputKey: 'image_url',
    description: 'Veo 3.1 image-to-video with audio',
    estimatedTimeSeconds: [30, 120],
    estimatedCostCents: [20, 70],
    defaultParams: { duration: '8s', aspect_ratio: 'auto', resolution: '720p', generate_audio: true },
    params: [
      { key: 'duration', label: 'Duration', type: 'select', default: '8s', options: [
        { label: '4s', value: '4s' }, { label: '6s', value: '6s' }, { label: '8s', value: '8s' },
      ]},
      { key: 'aspect_ratio', label: 'Aspect Ratio', type: 'select', default: 'auto', options: [
        { label: 'Auto', value: 'auto' }, { label: '16:9', value: '16:9' }, { label: '9:16', value: '9:16' },
      ]},
      { key: 'resolution', label: 'Resolution', type: 'select', default: '720p', options: [
        { label: '720p', value: '720p' }, { label: '1080p', value: '1080p' }, { label: '4K', value: '4k' },
      ]},
      { key: 'generate_audio', label: 'Generate Audio', type: 'toggle', default: true },
      { key: 'seed', label: 'Seed', type: 'number', default: 0, min: 0, max: 999999999, step: 1 },
    ],
  },
  {
    id: 'fal-ai/kling-video/v3/pro/image-to-video',
    name: 'Kling v3 Pro Img2Vid',
    category: 'video',
    supportsImageInput: true,
    imageInputKey: 'start_image_url',
    description: 'Top-tier image-to-video with cinematic quality',
    estimatedTimeSeconds: [30, 90],
    estimatedCostCents: [15, 50],
    defaultParams: { duration: '5s', aspect_ratio: '16:9' },
    params: [
      { key: 'duration', label: 'Duration', type: 'select', default: '5s', options: [
        { label: '5s', value: '5s' }, { label: '10s', value: '10s' },
      ]},
      { key: 'aspect_ratio', label: 'Aspect Ratio', type: 'select', default: '16:9', options: [
        { label: '16:9', value: '16:9' }, { label: '9:16', value: '9:16' }, { label: '1:1', value: '1:1' },
      ]},
      { key: 'generate_audio', label: 'Generate Audio', type: 'toggle', default: false },
    ],
  },
  {
    id: 'fal-ai/sora-2/image-to-video',
    name: 'Sora 2 Img2Vid',
    category: 'video',
    supportsImageInput: true,
    imageInputKey: 'image_url',
    description: 'Sora image-to-video with rich detail',
    estimatedTimeSeconds: [30, 120],
    estimatedCostCents: [15, 50],
    defaultParams: { duration: '4s', resolution: '720p', aspect_ratio: '16:9' },
    params: [
      { key: 'duration', label: 'Duration', type: 'select', default: '4s', options: [
        { label: '4s', value: '4s' }, { label: '8s', value: '8s' }, { label: '12s', value: '12s' },
      ]},
      { key: 'resolution', label: 'Resolution', type: 'select', default: '720p', options: [
        { label: '720p', value: '720p' }, { label: '1080p', value: '1080p' },
      ]},
      { key: 'aspect_ratio', label: 'Aspect Ratio', type: 'select', default: '16:9', options: [
        { label: '16:9', value: '16:9' }, { label: '9:16', value: '9:16' }, { label: '1:1', value: '1:1' },
      ]},
    ],
  },

  {
    id: 'fal-ai/wan/v2.7/text-to-video',
    name: 'Wan 2.7',
    category: 'video',
    description: 'Alibaba\'s latest video model — enhanced motion smoothness and scene fidelity',
    estimatedTimeSeconds: [30, 90],
    estimatedCostCents: [3, 12],
    defaultParams: { resolution: '720p', aspect_ratio: '16:9', num_frames: 81, num_inference_steps: 30, guidance_scale: 3.5 },
    params: [
      { key: 'resolution', label: 'Resolution', type: 'select', default: '720p', options: [
        { label: '580p', value: '580p' }, { label: '720p', value: '720p' },
      ]},
      { key: 'aspect_ratio', label: 'Aspect Ratio', type: 'select', default: '16:9', options: [
        { label: '16:9', value: '16:9' }, { label: '9:16', value: '9:16' },
      ]},
      { key: 'num_frames', label: 'Frames', type: 'slider', default: 81, min: 17, max: 161, step: 8 },
      { key: 'num_inference_steps', label: 'Steps', type: 'slider', default: 30, min: 10, max: 50, step: 1 },
      { key: 'guidance_scale', label: 'Guidance', type: 'slider', default: 3.5, min: 1, max: 10, step: 0.5 },
    ],
  },
  {
    id: 'fal-ai/wan/v2.7/image-to-video',
    name: 'Wan 2.7 Img2Vid',
    category: 'video',
    supportsImageInput: true,
    imageInputKey: 'image_url',
    description: 'Wan 2.7 image-to-video — animate any image with smooth motion',
    estimatedTimeSeconds: [30, 90],
    estimatedCostCents: [3, 12],
    defaultParams: { resolution: '720p', aspect_ratio: '16:9', num_frames: 81, num_inference_steps: 30, guidance_scale: 3.5 },
    params: [
      { key: 'resolution', label: 'Resolution', type: 'select', default: '720p', options: [
        { label: '580p', value: '580p' }, { label: '720p', value: '720p' },
      ]},
      { key: 'aspect_ratio', label: 'Aspect Ratio', type: 'select', default: '16:9', options: [
        { label: '16:9', value: '16:9' }, { label: '9:16', value: '9:16' },
      ]},
      { key: 'num_frames', label: 'Frames', type: 'slider', default: 81, min: 17, max: 161, step: 8 },
      { key: 'num_inference_steps', label: 'Steps', type: 'slider', default: 30, min: 10, max: 50, step: 1 },
      { key: 'guidance_scale', label: 'Guidance', type: 'slider', default: 3.5, min: 1, max: 10, step: 0.5 },
    ],
  },

  // ── Audio Generation ──────────────────────────────
  {
    id: 'fal-ai/qwen-3-tts/text-to-speech/1.7b',
    name: 'Qwen 3 TTS',
    category: 'audio',
    supportsAudioInput: true,
    description: 'Alibaba Qwen 3 TTS — voice cloning via two-step embedding (clone + synthesize)',
    estimatedTimeSeconds: [5, 20],
    estimatedCostCents: [1, 5],
    defaultParams: { temperature: 0.9, repetition_penalty: 1.05 },
    params: [
      { key: 'temperature', label: 'Temperature', type: 'slider', default: 0.9, min: 0.1, max: 2.0, step: 0.05 },
      { key: 'repetition_penalty', label: 'Rep. Penalty', type: 'slider', default: 1.05, min: 1.0, max: 1.5, step: 0.01 },
    ],
  },
  {
    id: 'fal-ai/stable-audio',
    name: 'Stable Audio',
    category: 'audio',
    description: 'Music and sound generation',
    estimatedTimeSeconds: [5, 15],
    estimatedCostCents: [1, 3],
    defaultParams: { seconds_total: 10 },
    params: [
      { key: 'seconds_total', label: 'Duration (sec)', type: 'slider', default: 10, min: 1, max: 60, step: 1 },
    ],
  },
  {
    id: 'fal-ai/f5-tts',
    name: 'F5-TTS',
    category: 'audio',
    supportsAudioInput: true,
    audioInputKey: 'ref_audio_url',
    description: 'Voice cloning TTS — connect a reference audio to clone any voice',
    estimatedTimeSeconds: [5, 20],
    estimatedCostCents: [1, 5],
    defaultParams: { model_type: 'F5-TTS', remove_silence: true },
    params: [
      { key: 'model_type', label: 'Engine', type: 'select', default: 'F5-TTS', options: [
        { label: 'F5-TTS', value: 'F5-TTS' }, { label: 'E2-TTS', value: 'E2-TTS' },
      ]},
      { key: 'remove_silence', label: 'Remove Silence', type: 'toggle', default: true },
    ],
  },
  {
    id: 'fal-ai/elevenlabs/tts/eleven-v3',
    name: 'ElevenLabs V3',
    category: 'audio',
    description: 'High-quality expressive TTS with voice selection',
    estimatedTimeSeconds: [3, 10],
    estimatedCostCents: [1, 5],
    defaultParams: { voice: 'Rachel', stability: 0.5, similarity_boost: 0.75, speed: 1 },
    params: [
      { key: 'voice', label: 'Voice', type: 'select', default: 'Rachel', options: [
        { label: 'Rachel', value: 'Rachel' }, { label: 'Aria', value: 'Aria' },
        { label: 'Bill', value: 'Bill' }, { label: 'Brian', value: 'Brian' },
        { label: 'Callum', value: 'Callum' }, { label: 'Charlie', value: 'Charlie' },
        { label: 'Charlotte', value: 'Charlotte' }, { label: 'Chris', value: 'Chris' },
        { label: 'Daniel', value: 'Daniel' }, { label: 'Eric', value: 'Eric' },
        { label: 'George', value: 'George' }, { label: 'Jessica', value: 'Jessica' },
        { label: 'Laura', value: 'Laura' }, { label: 'Liam', value: 'Liam' },
        { label: 'Lily', value: 'Lily' }, { label: 'Matilda', value: 'Matilda' },
        { label: 'River', value: 'River' }, { label: 'Roger', value: 'Roger' },
        { label: 'Sarah', value: 'Sarah' }, { label: 'Will', value: 'Will' },
      ]},
      { key: 'stability', label: 'Stability', type: 'slider', default: 0.5, min: 0, max: 1, step: 0.05 },
      { key: 'similarity_boost', label: 'Similarity', type: 'slider', default: 0.75, min: 0, max: 1, step: 0.05 },
      { key: 'speed', label: 'Speed', type: 'slider', default: 1, min: 0.7, max: 1.2, step: 0.05 },
    ],
  },
  {
    id: 'fal-ai/minimax/voice-clone',
    name: 'MiniMax Voice Clone',
    category: 'audio',
    supportsAudioInput: true,
    audioInputKey: 'audio_url',
    description: 'High-quality voice cloning — connect reference audio (min 10s) to clone any voice',
    estimatedTimeSeconds: [5, 20],
    estimatedCostCents: [1, 5],
    defaultParams: { model: 'speech-02-hd', noise_reduction: false, need_volume_normalization: false },
    params: [
      { key: 'model', label: 'Quality', type: 'select', default: 'speech-02-hd', options: [
        { label: 'HD (best)', value: 'speech-02-hd' },
        { label: 'Turbo (fast)', value: 'speech-02-turbo' },
        { label: 'HD v1', value: 'speech-01-hd' },
        { label: 'Turbo v1', value: 'speech-01-turbo' },
      ]},
      { key: 'noise_reduction', label: 'Noise Reduction', type: 'toggle', default: false },
      { key: 'need_volume_normalization', label: 'Normalize Volume', type: 'toggle', default: false },
    ],
  },

  // ── Upscale ───────────────────────────────────────
  {
    id: 'fal-ai/topaz/upscale/image',
    name: 'Topaz Image Upscale',
    category: 'upscale',
    description: 'Cinema-grade image upscaling by Topaz Labs',
    estimatedTimeSeconds: [5, 20],
    estimatedCostCents: [2, 5],
    defaultParams: { upscale_factor: 2, model: 'Standard V2' },
    params: [
      { key: 'model', label: 'Model', type: 'select', default: 'Standard V2', options: [
        { label: 'Standard V2', value: 'Standard V2' },
        { label: 'Low Resolution V2', value: 'Low Resolution V2' },
        { label: 'CGI', value: 'CGI' },
        { label: 'High Fidelity V2', value: 'High Fidelity V2' },
        { label: 'Recovery V2', value: 'Recovery V2' },
      ]},
      { key: 'upscale_factor', label: 'Scale', type: 'slider', default: 2, min: 1, max: 4, step: 0.5 },
      { key: 'face_enhancement', label: 'Face Enhance', type: 'toggle', default: true },
    ],
  },
  {
    id: 'fal-ai/topaz/upscale/video',
    name: 'Topaz Video Upscale',
    category: 'upscale',
    description: 'Video upscale up to 16K with Topaz AI',
    estimatedTimeSeconds: [10, 40],
    estimatedCostCents: [5, 15],
    defaultParams: { upscale_factor: 2 },
    params: [
      { key: 'upscale_factor', label: 'Scale', type: 'slider', default: 2, min: 1, max: 8, step: 1 },
    ],
  },
];

// ===== Utilities =====

export const IMAGE_SIZES = [
  { label: 'Square (1:1)', value: 'square' },
  { label: 'Landscape (4:3)', value: 'landscape_4_3' },
  { label: 'Landscape (16:9)', value: 'landscape_16_9' },
  { label: 'Portrait (3:4)', value: 'portrait_4_3' },
  { label: 'Portrait (9:16)', value: 'portrait_16_9' },
];

export function getModelsByCategory(category: ModelInfo['category']): ModelInfo[] {
  return MODELS.filter((m) => m.category === category);
}

export function getModelById(id: string): ModelInfo | undefined {
  return MODELS.find((m) => m.id === id);
}

import type { NodeTypes } from '@xyflow/react';
import type { NodeConfig } from '../engine/types';
import { nodeRegistry } from './registry';
import { PromptNode } from './prompt/PromptNode';
import { ImageGenNode } from './image-gen/ImageGenNode';
import { OutputNode } from './output/OutputNode';
import { VideoGenNode } from './video-gen/VideoGenNode';
import { AudioGenNode } from './audio-gen/AudioGenNode';
import { Img2ImgNode } from './img2img/Img2ImgNode';
import { UpscaleNode } from './upscale/UpscaleNode';
import { BgRemoveNode } from './bg-remove/BgRemoveNode';
import { FileUploadNode } from './file-upload/FileUploadNode';
import { LLMNode } from './llm/LLMNode';
import { MergeNode } from './merge/MergeNode';
import { NumberNode } from './number/NumberNode';
import { NoteNode } from './note/NoteNode';
import { runModel } from '../fal/run-model';
import { getModelById } from '../fal/model-registry';

// ===== INPUT NODES =====

nodeRegistry.register(
  'prompt',
  {
    type: 'prompt',
    label: 'Text Prompt',
    category: 'input',
    icon: 'Type',
    inputs: [],
    outputs: [{ id: 'text', label: 'Text', type: 'text', required: false }],
    defaultData: { text: '' },
  },
  PromptNode as React.ComponentType<unknown>,
  async (node) => ({ text: node.data.text || '' }),
);

nodeRegistry.register(
  'fileUpload',
  {
    type: 'fileUpload',
    label: 'File Upload',
    category: 'input',
    icon: 'Upload',
    inputs: [],
    outputs: [
      { id: 'image', label: 'Image', type: 'image', required: false },
      { id: 'video', label: 'Video', type: 'video', required: false },
      { id: 'audio', label: 'Audio', type: 'audio', required: false },
    ],
    defaultData: {},
  },
  FileUploadNode as React.ComponentType<unknown>,
  async (node) => {
    // Prefer CDN URL (public, accessible by fal.ai) over local blob URL
    const cdnUrl = node.data.cdnUrl as string | undefined;
    const previewUrl = node.data.previewUrl as string | undefined;
    const fileType = (node.data.fileType as 'image' | 'video' | 'audio') || 'image';
    const url = cdnUrl || previewUrl || '';
    // Output on the correct port based on file type
    if (fileType === 'video') return { image: '', video: url, audio: '' };
    if (fileType === 'audio') return { image: '', video: '', audio: url };
    return { image: url, video: '', audio: '' };
  },
);

nodeRegistry.register(
  'number',
  {
    type: 'number',
    label: 'Number',
    category: 'input',
    icon: 'Hash',
    inputs: [],
    outputs: [{ id: 'text', label: 'Value', type: 'text', required: false }],
    defaultData: { value: 0, min: 0, max: 100 },
  },
  NumberNode as React.ComponentType<unknown>,
  async (node) => ({ text: String(node.data.value ?? 0) }),
);

// ===== AI NODES =====

nodeRegistry.register(
  'imageGen',
  {
    type: 'imageGen',
    label: 'Image Generation',
    category: 'ai',
    icon: 'Image',
    inputs: [
      { id: 'prompt', label: 'Prompt', type: 'text', required: true },
      { id: 'image', label: 'Reference Image', type: 'image', required: false },
    ],
    outputs: [{ id: 'image', label: 'Image', type: 'image', required: false }],
    defaultData: { modelId: 'fal-ai/nano-banana-2', imageSize: 'landscape_4_3' },
  },
  ImageGenNode as React.ComponentType<unknown>,
  async (node, inputs, onStatus, abortSignal) => {
    const prompt = (inputs.prompt as string) || (node.data.prompt as string) || '';
    let modelId = (node.data.modelId as string) || 'fal-ai/nano-banana-2';

    // Collect reference images — can be a single string or an array from multiple connections
    const rawImage = inputs.image;
    const referenceImages: string[] = Array.isArray(rawImage)
      ? rawImage.filter((v): v is string => typeof v === 'string' && v.length > 0)
      : typeof rawImage === 'string' && rawImage ? [rawImage] : [];

    // Build input: start with model defaults, then overlay user-set params
    const model = getModelById(modelId);
    const input: Record<string, unknown> = {
      prompt,
      ...(model?.defaultParams || {}),
    };

    // Overlay all user-set params from node data (skip internal keys, allow false/0)
    const skipKeys = ['modelId', 'text', 'prompt', '_nodeWidth', '_nodeHeight'];
    for (const [key, value] of Object.entries(node.data)) {
      if (skipKeys.includes(key)) continue;
      if (value === undefined || value === null || value === '') continue;
      input[key] = value;
    }

    // Ensure defaults
    if (!input.num_images) input.num_images = 1;

    // When reference image(s) are connected, auto-switch to the edit endpoint
    // Nano Banana 2/Pro uses /edit with image_urls (array — supports 1-14 reference images)
    // Flux and other models use image_url (singular — first image only)
    if (referenceImages.length > 0) {
      if (modelId === 'fal-ai/nano-banana-2') {
        modelId = 'fal-ai/nano-banana-2/edit';
        input.image_urls = referenceImages;
      } else if (modelId === 'fal-ai/nano-banana-pro') {
        modelId = 'fal-ai/nano-banana-pro/edit';
        input.image_urls = referenceImages;
      } else if (modelId === 'openai/gpt-image-2') {
        modelId = 'openai/gpt-image-2/edit';
        input.image_urls = referenceImages;
      } else {
        // Flux and other models use image_url (singular — use first image)
        input.image_url = referenceImages[0];
      }
    }

    const result = await runModel({
      modelId,
      input,
      onStatusUpdate: onStatus,
      abortSignal,
    });

    const images = result.data.images as Array<{ url: string }> | undefined;
    const imageUrl = images?.[0]?.url || (result.data.image as { url: string })?.url || '';
    return { image: imageUrl, rawResult: result.data };
  },
);

nodeRegistry.register(
  'videoGen',
  {
    type: 'videoGen',
    label: 'Video Generation',
    category: 'ai',
    icon: 'Video',
    inputs: [
      { id: 'prompt', label: 'Prompt', type: 'text', required: true },
      { id: 'image', label: 'Image', type: 'image', required: false },
      { id: 'video', label: 'Video', type: 'video', required: false },
      { id: 'audio', label: 'Audio', type: 'audio', required: false },
    ],
    outputs: [{ id: 'video', label: 'Video', type: 'video', required: false }],
    defaultData: { modelId: 'fal-ai/veo3' },
  },
  VideoGenNode as React.ComponentType<unknown>,
  async (node, inputs, onStatus, abortSignal) => {
    const prompt = (inputs.prompt as string) || '';
    let modelId = (node.data.modelId as string) || 'fal-ai/veo3';
    const imageUrl = inputs.image as string | undefined;
    const videoUrl = inputs.video as string | undefined;
    const audioUrl = inputs.audio as string | undefined;

    // Auto-switch priority: video > audio > image
    if (videoUrl) {
      const currentModel = getModelById(modelId);
      if (!currentModel?.supportsVideoInput) {
        modelId = 'bytedance/seedance-2.0/enterprise/reference-to-video';
      }
    } else if (audioUrl) {
      const currentModel = getModelById(modelId);
      if (!currentModel?.supportsAudioInput) {
        modelId = 'bytedance/seedance-2.0/enterprise/reference-to-video';
      }
    } else if (imageUrl) {
      const currentModel = getModelById(modelId);
      if (!currentModel?.supportsImageInput) {
        modelId = 'fal-ai/veo3.1/fast/image-to-video';
      }
    }

    // Build input: model defaults → user params
    const model = getModelById(modelId);
    const input: Record<string, unknown> = {
      prompt,
      ...(model?.defaultParams || {}),
    };
    const skipKeys = ['modelId', 'text', 'prompt', '_nodeWidth', '_nodeHeight'];
    for (const [key, value] of Object.entries(node.data)) {
      if (!skipKeys.includes(key) && value !== undefined && value !== '') {
        input[key] = value;
      }
    }

    // Pass reference video using the model's specific param key (always array)
    if (videoUrl) {
      const vidKey = model?.videoInputKey || 'video_url';
      input[vidKey] = vidKey.endsWith('_urls') ? [videoUrl] : videoUrl;
    }

    // Pass reference image using the model's specific param key
    // Models that use `image_urls` (plural) expect an array; others take a single string
    if (imageUrl) {
      const imgKey = model?.imageInputKey || 'image_url';
      input[imgKey] = imgKey.endsWith('_urls') ? [imageUrl] : imageUrl;
    }

    // Pass reference audio
    if (audioUrl) {
      const audKey = model?.audioInputKey || 'audio_url';
      input[audKey] = audKey.endsWith('_urls') ? [audioUrl] : audioUrl;
    }

    const result = await runModel({ modelId, input, onStatusUpdate: onStatus, abortSignal });
    const video = result.data.video as { url: string } | undefined;
    return { video: video?.url || '' };
  },
);

nodeRegistry.register(
  'audioGen',
  {
    type: 'audioGen',
    label: 'Audio Generation',
    category: 'ai',
    icon: 'Music',
    inputs: [
      { id: 'prompt', label: 'Prompt', type: 'text', required: true },
      { id: 'reference', label: 'Reference Voice', type: 'audio', required: false },
    ],
    outputs: [{ id: 'audio', label: 'Audio', type: 'audio', required: false }],
    defaultData: { modelId: 'fal-ai/stable-audio' },
  },
  AudioGenNode as React.ComponentType<unknown>,
  async (node, inputs, onStatus, abortSignal) => {
    const promptText = (inputs.prompt as string) || '';
    const referenceAudio = inputs.reference as string | undefined;
    let modelId = (node.data.modelId as string) || 'fal-ai/stable-audio';

    // Auto-switch if reference audio connected and model doesn't support it
    if (referenceAudio) {
      const currentModel = getModelById(modelId);
      if (!currentModel?.supportsAudioInput) {
        modelId = 'fal-ai/f5-tts';
      }
    }

    const model = getModelById(modelId);

    // Map prompt text to the correct API key per model
    const promptKey =
      modelId === 'fal-ai/f5-tts' ? 'gen_text' :
      modelId.startsWith('fal-ai/elevenlabs') ? 'text' :
      'prompt';

    const input: Record<string, unknown> = {
      [promptKey]: promptText,
      ...(model?.defaultParams || {}),
    };

    const skipKeys = ['modelId', 'text', 'prompt', '_nodeWidth', '_nodeHeight'];
    for (const [key, value] of Object.entries(node.data)) {
      if (skipKeys.includes(key)) continue;
      if (value === undefined || value === null || value === '') continue;
      input[key] = value;
    }

    // Pass reference audio using the model's input key
    if (referenceAudio) {
      const audKey = model?.audioInputKey || 'ref_audio_url';
      input[audKey] = referenceAudio;
    }

    // Stable Audio fallback
    if (modelId === 'fal-ai/stable-audio' && !input.seconds_total) {
      input.seconds_total = 10;
    }

    const result = await runModel({ modelId, input, onStatusUpdate: onStatus, abortSignal });
    const data = result.data;

    // Each model returns audio under a different field name
    const audioUrl =
      (data.audio_url as { url: string } | undefined)?.url ||   // f5-tts
      (data.audio as { url: string } | undefined)?.url ||        // elevenlabs
      (data.audio_file as { url: string } | undefined)?.url ||   // stable-audio
      '';

    return { audio: audioUrl };
  },
);

nodeRegistry.register(
  'img2img',
  {
    type: 'img2img',
    label: 'Image to Image',
    category: 'ai',
    icon: 'Paintbrush',
    inputs: [
      { id: 'image', label: 'Image', type: 'image', required: true },
      { id: 'prompt', label: 'Prompt', type: 'text', required: true },
    ],
    outputs: [{ id: 'image', label: 'Image', type: 'image', required: false }],
    defaultData: { modelId: 'fal-ai/nano-banana-2/edit', strength: 0.75 },
  },
  Img2ImgNode as React.ComponentType<unknown>,
  async (node, inputs, onStatus, abortSignal) => {
    const prompt = (inputs.prompt as string) || '';
    const imageUrl = (inputs.image as string) || '';
    const modelId = (node.data.modelId as string) || 'fal-ai/nano-banana-2/edit';

    // Build input: model defaults → user params
    const model = getModelById(modelId);
    const input: Record<string, unknown> = {
      prompt,
      image_url: imageUrl,
      ...(model?.defaultParams || {}),
    };
    const skipKeys = ['modelId', 'text', 'prompt', '_nodeWidth', '_nodeHeight'];
    for (const [key, value] of Object.entries(node.data)) {
      if (skipKeys.includes(key)) continue;
      if (value === undefined || value === null) continue;
      input[key] = value;
    }
    if (!input.num_images) input.num_images = 1;
    if (!input.strength && input.strength !== 0) input.strength = 0.75;

    const result = await runModel({
      modelId,
      input,
      onStatusUpdate: onStatus,
      abortSignal,
    });

    const images = result.data.images as Array<{ url: string }> | undefined;
    const resultUrl = images?.[0]?.url || (result.data.image as { url: string })?.url || '';
    return { image: resultUrl, rawResult: result.data };
  },
);

nodeRegistry.register(
  'bgRemove',
  {
    type: 'bgRemove',
    label: 'Background Removal',
    category: 'ai',
    icon: 'Scissors',
    inputs: [{ id: 'image', label: 'Image', type: 'image', required: true }],
    outputs: [{ id: 'image', label: 'Image', type: 'image', required: false }],
    defaultData: {},
  },
  BgRemoveNode as React.ComponentType<unknown>,
  async (_node, inputs, onStatus, abortSignal) => {
    const imageUrl = (inputs.image as string) || '';
    const result = await runModel({
      modelId: 'fal-ai/bria/background/remove',
      input: { image_url: imageUrl },
      onStatusUpdate: onStatus,
      abortSignal,
    });
    const resultImage = result.data.image as { url: string } | undefined;
    return { image: resultImage?.url || '' };
  },
);

nodeRegistry.register(
  'upscale',
  {
    type: 'upscale',
    label: 'Upscale',
    category: 'ai',
    icon: 'ArrowUpCircle',
    inputs: [{ id: 'image', label: 'Image', type: 'image', required: true }],
    outputs: [{ id: 'image', label: 'Image', type: 'image', required: false }],
    defaultData: { scale: 2 },
  },
  UpscaleNode as React.ComponentType<unknown>,
  async (node, inputs, onStatus, abortSignal) => {
    const imageUrl = (inputs.image as string) || '';
    const modelId = (node.data.modelId as string) || 'fal-ai/topaz/upscale/image';

    // Build input: start with model defaults, then overlay user-set params
    const model = getModelById(modelId);
    const input: Record<string, unknown> = {
      image_url: imageUrl,
      ...(model?.defaultParams || {}),
    };
    const skipKeys = ['modelId', 'text', 'prompt', '_nodeWidth', '_nodeHeight'];
    for (const [key, value] of Object.entries(node.data)) {
      if (!skipKeys.includes(key) && value !== undefined && value !== '') {
        input[key] = value;
      }
    }
    if (!input.upscale_factor && !input.scale) input.upscale_factor = 2;

    const result = await runModel({
      modelId,
      input,
      onStatusUpdate: onStatus,
      abortSignal,
    });

    const resultImage = result.data.image as { url: string } | undefined;
    return { image: resultImage?.url || '' };
  },
);

nodeRegistry.register(
  'llm',
  {
    type: 'llm',
    label: 'LLM / Text',
    category: 'ai',
    icon: 'MessageSquare',
    inputs: [{ id: 'prompt', label: 'Prompt', type: 'text', required: true }],
    outputs: [{ id: 'text', label: 'Text', type: 'text', required: false }],
    defaultData: { systemPrompt: '', template: '{{input}}' },
  },
  LLMNode as React.ComponentType<unknown>,
  async (node, inputs) => {
    const inputText = (inputs.prompt as string) || (inputs.text as string) || '';
    const template = (node.data.template as string) || '{{input}}';
    const result = template.replace(/\{\{input\}\}/g, inputText);
    return { text: result };
  },
);

// ===== UTILITY NODES =====

nodeRegistry.register(
  'merge',
  {
    type: 'merge',
    label: 'Merge',
    category: 'utility',
    icon: 'Merge',
    inputs: [
      { id: 'input1', label: 'Input 1', type: 'any', required: false },
      { id: 'input2', label: 'Input 2', type: 'any', required: false },
    ],
    outputs: [{ id: 'combined', label: 'Combined', type: 'any', required: false }],
    defaultData: {},
  },
  MergeNode as React.ComponentType<unknown>,
  async (_node, inputs) => ({ ...inputs }),
);

nodeRegistry.register(
  'note',
  {
    type: 'note',
    label: 'Note',
    category: 'utility',
    icon: 'StickyNote',
    inputs: [],
    outputs: [],
    defaultData: { text: '' },
  },
  NoteNode as React.ComponentType<unknown>,
  async () => ({}),
);

// ===== OUTPUT NODES =====

nodeRegistry.register(
  'output',
  {
    type: 'output',
    label: 'Output',
    category: 'output',
    icon: 'Eye',
    inputs: [{ id: 'default', label: 'Input', type: 'any', required: true }],
    outputs: [],
    defaultData: {},
  },
  OutputNode as React.ComponentType<unknown>,
  async (_node, inputs) => inputs,
);

// Re-export for backward compatibility
export const nodeTypes: NodeTypes = nodeRegistry.nodeTypes;
export const NODE_CONFIGS: Record<string, NodeConfig> = nodeRegistry.configs;

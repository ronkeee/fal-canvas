import type { Node, Edge } from '@xyflow/react';

export interface FlowTemplate {
  name: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
}

export const TEMPLATES: FlowTemplate[] = [
  {
    name: 'Text to Image',
    description: 'Type a prompt and generate an image',
    nodes: [
      { id: 'tpl_prompt_1', type: 'prompt', position: { x: 50, y: 120 }, data: { text: 'A serene mountain landscape at sunset' } },
      { id: 'tpl_img_1', type: 'imageGen', position: { x: 500, y: 100 }, data: { modelId: 'fal-ai/nano-banana-2', imageSize: 'landscape_4_3' } },
    ],
    edges: [
      { id: 'tpl_e1', source: 'tpl_prompt_1', target: 'tpl_img_1', sourceHandle: 'text', targetHandle: 'prompt', type: 'custom', animated: true, data: { portType: 'text' } },
    ],
  },
  {
    name: 'Image to Video',
    description: 'Upload an image and generate a video from it',
    nodes: [
      { id: 'tpl_upload_1', type: 'fileUpload', position: { x: 50, y: 80 }, data: {} },
      { id: 'tpl_prompt_2', type: 'prompt', position: { x: 50, y: 340 }, data: { text: 'Slow pan across the scene with gentle wind' } },
      { id: 'tpl_vid_1', type: 'videoGen', position: { x: 520, y: 140 }, data: { modelId: 'fal-ai/kling-video/v1/standard/image-to-video' } },
    ],
    edges: [
      { id: 'tpl_e3', source: 'tpl_upload_1', target: 'tpl_vid_1', sourceHandle: 'image', targetHandle: 'image', type: 'custom', animated: true, data: { portType: 'image' } },
      { id: 'tpl_e4', source: 'tpl_prompt_2', target: 'tpl_vid_1', sourceHandle: 'text', targetHandle: 'prompt', type: 'custom', animated: true, data: { portType: 'text' } },
    ],
  },
  {
    name: 'Multi-Model Compare',
    description: 'Compare outputs from 3 different image models',
    nodes: [
      { id: 'tpl_prompt_3', type: 'prompt', position: { x: 50, y: 120 }, data: { text: 'A cyberpunk cityscape at night with neon lights' } },
      { id: 'tpl_img_2', type: 'imageGen', position: { x: 500, y: 100 }, data: { modelId: 'fal-ai/nano-banana-2', imageSize: 'landscape_4_3' } },
      { id: 'tpl_img_3', type: 'imageGen', position: { x: 950, y: 100 }, data: { modelId: 'fal-ai/nano-banana-2', imageSize: 'landscape_4_3' } },
      { id: 'tpl_img_4', type: 'imageGen', position: { x: 1400, y: 100 }, data: { modelId: 'fal-ai/nano-banana-2', imageSize: 'landscape_4_3' } },
    ],
    edges: [
      { id: 'tpl_e6', source: 'tpl_prompt_3', target: 'tpl_img_2', sourceHandle: 'text', targetHandle: 'prompt', type: 'custom', animated: true, data: { portType: 'text' } },
      { id: 'tpl_e7', source: 'tpl_prompt_3', target: 'tpl_img_3', sourceHandle: 'text', targetHandle: 'prompt', type: 'custom', animated: true, data: { portType: 'text' } },
      { id: 'tpl_e8', source: 'tpl_prompt_3', target: 'tpl_img_4', sourceHandle: 'text', targetHandle: 'prompt', type: 'custom', animated: true, data: { portType: 'text' } },
    ],
  },
  {
    name: 'Image Upscale',
    description: 'Upload an image and upscale it',
    nodes: [
      { id: 'tpl_upload_2', type: 'fileUpload', position: { x: 50, y: 120 }, data: {} },
      { id: 'tpl_up_1', type: 'upscale', position: { x: 500, y: 100 }, data: { scale: 4 } },
    ],
    edges: [
      { id: 'tpl_e12', source: 'tpl_upload_2', target: 'tpl_up_1', sourceHandle: 'image', targetHandle: 'image', type: 'custom', animated: true, data: { portType: 'image' } },
    ],
  },
];

import type { ChatModel } from 'openai/resources/index.mjs'

// OpenAI 模型
export const OPENAI_MODELS: ChatModel[] = [
  'gpt-4o',
  'gpt-4o-2024-05-13',
  'gpt-4-turbo',
  'gpt-4-turbo-2024-04-09',
  'gpt-4-0125-preview',
  'gpt-4-turbo-preview',
  'gpt-4-1106-preview',
  'gpt-4-vision-preview',
  'gpt-4',
  'gpt-4-0314',
  'gpt-4-0613',
  'gpt-4-32k',
  'gpt-4-32k-0314',
  'gpt-4-32k-0613',
  'gpt-3.5-turbo',
  'gpt-3.5-turbo-16k',
  'gpt-3.5-turbo-0301',
  'gpt-3.5-turbo-0613',
  'gpt-3.5-turbo-1106',
  'gpt-3.5-turbo-0125',
  'gpt-3.5-turbo-16k-0613'
]

// 阿里云通义千问模型
export const TONGYI_MODELS = [
  'qwen-turbo',
  'qwen-plus',
  'qwen-max',
  'qwen-max-1201',
  'qwen-max-longcontext',
  'qwen2.5-72b-instruct',
  'qwen2.5-32b-instruct',
  'qwen2.5-14b-instruct',
  'qwen2.5-7b-instruct'
] as const

// AI 提供商类型
export type AIProvider = 'openai' | 'tongyi' | 'custom'

// 所有支持的模型
export const AI_MODELS = [...OPENAI_MODELS, ...TONGYI_MODELS] as const

export type SupportedAIModel = (typeof AI_MODELS)[number]

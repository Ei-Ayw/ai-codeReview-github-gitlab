import OpenAI from 'openai'
import type { ChatCompletion, ChatCompletionMessageParam } from 'openai/resources/index.mjs'
import { OPENAI_MODELS, TONGYI_MODELS, AI_MODELS, type AIProvider, type SupportedAIModel } from '../config/index.js'
import { AI_MODEL_TEMPERATURE } from '../prompt/index.js'

// 统一的 AI 响应接口
export interface AIResponse {
  content: string | null
  model: string
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
}

// 通义千问 API 响应接口
interface TongyiResponse {
  output: {
    text: string
    finish_reason: string
  }
  usage: {
    input_tokens: number
    output_tokens: number
    total_tokens: number
  }
  request_id: string
}

// AI 客户端基类
export abstract class AIClient {
  abstract generateCompletion(messages: ChatCompletionMessageParam[], model: string): Promise<AIResponse>
}

// OpenAI 客户端
export class OpenAIClient extends AIClient {
  private client: OpenAI

  constructor(apiKey: string, baseURL?: string) {
    super()
    this.client = new OpenAI({
      apiKey,
      baseURL
    })
  }

  async generateCompletion(messages: ChatCompletionMessageParam[], model: string): Promise<AIResponse> {
    const completion = await this.client.chat.completions.create({
      model: model as any,
      messages,
      temperature: AI_MODEL_TEMPERATURE,
      stream: false
    })

    return {
      content: completion.choices[0]?.message?.content || null,
      model: completion.model,
      usage: completion.usage ? {
        prompt_tokens: completion.usage.prompt_tokens,
        completion_tokens: completion.usage.completion_tokens,
        total_tokens: completion.usage.total_tokens
      } : undefined
    }
  }
}

// 通义千问客户端
export class TongyiClient extends AIClient {
  private apiKey: string
  private baseURL: string

  constructor(apiKey: string, baseURL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation') {
    super()
    this.apiKey = apiKey
    this.baseURL = baseURL
  }

  async generateCompletion(messages: ChatCompletionMessageParam[], model: string): Promise<AIResponse> {
    // 将 OpenAI 格式的消息转换为通义千问格式
    const prompt = this.convertMessagesToPrompt(messages)

    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'X-DashScope-Async': 'enable'
      },
      body: JSON.stringify({
        model,
        input: {
          prompt
        },
        parameters: {
          temperature: AI_MODEL_TEMPERATURE,
          top_p: 0.8,
          max_tokens: 2000
        }
      })
    })

    if (!response.ok) {
      throw new Error(`通义千问 API 调用失败: ${response.status} ${response.statusText}`)
    }

    const data: TongyiResponse = await response.json()

    return {
      content: data.output.text,
      model,
      usage: {
        prompt_tokens: data.usage.input_tokens,
        completion_tokens: data.usage.output_tokens,
        total_tokens: data.usage.total_tokens
      }
    }
  }

  private convertMessagesToPrompt(messages: ChatCompletionMessageParam[]): string {
    // 将 OpenAI 格式的消息转换为单个提示字符串
    return messages.map(msg => {
      if (typeof msg.content === 'string') {
        return `${msg.role === 'system' ? '[系统]' : msg.role === 'user' ? '[用户]' : '[助手]'}: ${msg.content}`
      }
      return ''
    }).join('\n\n')
  }
}

// AI 客户端工厂
export class AIClientFactory {
  static createClient(): AIClient {
    const provider = this.detectProvider()
    
    switch (provider) {
      case 'tongyi':
        if (!process.env.TONGYI_API_KEY) {
          throw new Error('缺少 TONGYI_API_KEY 环境变量')
        }
        return new TongyiClient(
          process.env.TONGYI_API_KEY,
          process.env.TONGYI_API_URL
        )
      
      case 'openai':
        if (process.env.OPENAI_API_URL && process.env.OPENAI_AUTH_KEY) {
          return new OpenAIClient(process.env.OPENAI_AUTH_KEY, process.env.OPENAI_API_URL)
        } else if (process.env.OPENAI_API_KEY) {
          return new OpenAIClient(process.env.OPENAI_API_KEY)
        } else {
          throw new Error('缺少 OpenAI API 配置')
        }
      
      default:
        throw new Error(`不支持的 AI 提供商: ${provider}`)
    }
  }

  static detectProvider(): AIProvider {
    const model = process.env.AI_MODEL as SupportedAIModel
    
    if (!model) {
      throw new Error('缺少 AI_MODEL 环境变量')
    }

    if (TONGYI_MODELS.includes(model as any)) {
      return 'tongyi'
    } else if (OPENAI_MODELS.includes(model as any)) {
      return 'openai'
    } else {
      return 'custom'
    }
  }

  static getSupportedModels(provider: AIProvider): readonly string[] {
    switch (provider) {
      case 'tongyi':
        return TONGYI_MODELS
      case 'openai':
        return OPENAI_MODELS
      default:
        return AI_MODELS
    }
  }
}

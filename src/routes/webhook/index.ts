import type { FastifyPluginAsync } from 'fastify'
import { 
  PlatformClientFactory, 
  GitHubWebhookHandler, 
  GitLabWebhookHandler,
  type WebhookResult 
} from '../../services/platformClient.js'
import { AIClientFactory } from '../../services/aiClient.js'
import { buildAnswer } from '../../prompt/index.js'

// 统一的 Webhook 请求接口
interface WebhookRequest {
  Body?: any
  Headers?: {
    'x-github-event'?: string
    'x-hub-signature-256'?: string
    'x-gitlab-event'?: string
    'x-gitlab-token'?: string
    'user-agent'?: string
  }
}

const unifiedWebhook: FastifyPluginAsync = async (fastify): Promise<void> => {
  // 统一的 webhook 处理路由
  fastify.post<WebhookRequest>('/', async (request, reply) => {
    const headers = request.headers
    const body = request.body

    if (!body) {
      reply.code(400).send({ error: 'Missing request body' })
      return
    }

    // 检测平台类型
    const platform = detectPlatform(headers)
    if (!platform) {
      reply.code(400).send({ error: 'Unknown platform' })
      return
    }

    fastify.log.info(`收到 ${platform.toUpperCase()} webhook 事件`)

    try {
      // 创建平台客户端和处理器
      const platformClient = PlatformClientFactory.createClient(platform)
      const webhookHandler = platform === 'github' 
        ? new GitHubWebhookHandler(platformClient)
        : new GitLabWebhookHandler(platformClient)

      // 验证签名
      const signature = platform === 'github' 
        ? headers['x-hub-signature-256'] || ''
        : headers['x-gitlab-token'] || ''
      
      if (!webhookHandler.verifySignature(signature, JSON.stringify(body))) {
        reply.code(401).send({ error: 'Invalid signature' })
        return
      }

      // 处理 webhook
      const result = await webhookHandler.handleWebhook(body)
      
      if (!result) {
        reply.code(200).send({ message: 'Event ignored' })
        return
      }

      // 立即返回 200，避免超时
      reply.code(200).send({ status: 'Processing' })

      // 异步处理 AI 审查
      processAIReview(result, platformClient, fastify)
        .catch(error => {
          fastify.log.error('AI 审查处理失败:', error)
        })

    } catch (error) {
      fastify.log.error(`Webhook 处理失败: ${error instanceof Error ? error.message : String(error)}`)
      reply.code(500).send({ error: 'Internal server error' })
    }
  })

  // GitHub 专用路由（可选）
  fastify.post('/github', async (request, reply) => {
    request.headers['x-platform'] = 'github'
    return fastify.inject({
      method: 'POST',
      url: '/',
      headers: request.headers,
      payload: JSON.stringify(request.body)
    })
  })

  // GitLab 专用路由（可选）
  fastify.post('/gitlab', async (request, reply) => {
    request.headers['x-platform'] = 'gitlab'
    return fastify.inject({
      method: 'POST',
      url: '/',
      headers: request.headers,
      payload: JSON.stringify(request.body)
    })
  })
}

// 检测平台类型
function detectPlatform(headers: any): 'github' | 'gitlab' | null {
  // 强制指定平台
  if (headers['x-platform']) {
    return headers['x-platform']
  }

  // GitHub 特征
  if (headers['x-github-event'] || headers['x-hub-signature-256']) {
    return 'github'
  }

  // GitLab 特征
  if (headers['x-gitlab-event'] || headers['x-gitlab-token']) {
    return 'gitlab'
  }

  // User-Agent 检测
  const userAgent = headers['user-agent']?.toLowerCase() || ''
  if (userAgent.includes('github')) {
    return 'github'
  }
  if (userAgent.includes('gitlab')) {
    return 'gitlab'
  }

  return null
}

// 异步处理 AI 审查
async function processAIReview(
  result: WebhookResult, 
  platformClient: any, 
  fastify: any
): Promise<void> {
  try {
    // 创建 AI 客户端
    const aiClient = AIClientFactory.createClient()
    const aiModel = process.env.AI_MODEL!

    fastify.log.info(`正在使用 ${aiModel} 模型生成 AI 代码审查...`)

    // 生成 AI 审查
    const aiResponse = await aiClient.generateCompletion(result.messageParams, aiModel)
    const reviewComment = buildAnswer(aiResponse)

    fastify.log.info('AI 审查生成成功，正在发布评论...')

    // 发布评论
    await platformClient.postComment({
      owner: result.repoInfo.owner,
      repo: result.repoInfo.repo,
      pullNumber: result.repoInfo.pullNumber,
      body: reviewComment
    })

    fastify.log.info(`${result.platform.toUpperCase()} 评论发布成功`)
  } catch (error) {
    throw new Error(`AI 审查处理失败: ${error instanceof Error ? error.message : error}`)
  }
}

export default unifiedWebhook

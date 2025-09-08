import Fastify from 'fastify'
import 'dotenv/config'
import { AI_MODELS, TONGYI_MODELS, OPENAI_MODELS } from './config/index.js'
import { AIClientFactory } from './services/aiClient.js'
import unifiedWebhook from './routes/webhook/index.js'
import gitlabWebhook from './routes/gitlab-webhook/index.js'

// 验证基础环境变量
const requiredEnvVars = ['AI_MODEL']
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ 缺少必需的环境变量: ${envVar}`)
    process.exit(1)
  }
}

// 检测支持的平台
const supportedPlatforms: string[] = []
if (process.env.GITLAB_TOKEN && process.env.GITLAB_URL) {
  supportedPlatforms.push('GitLab')
}
if (process.env.GITHUB_TOKEN) {
  supportedPlatforms.push('GitHub')
}

if (supportedPlatforms.length === 0) {
  console.error('❌ 至少需要配置一个平台:')
  console.error('  - GitLab: GITLAB_TOKEN + GITLAB_URL')
  console.error('  - GitHub: GITHUB_TOKEN')
  process.exit(1)
}

console.log(`🔗 支持的平台: ${supportedPlatforms.join(', ')}`)

// 验证 AI 模型
if (!AI_MODELS.includes(process.env.AI_MODEL as any)) {
  console.error(`❌ 不支持的 AI 模型: ${process.env.AI_MODEL}`)
  console.error(`支持的模型: ${AI_MODELS.join(', ')}`)
  process.exit(1)
}

// 验证 AI 配置
try {
  const provider = AIClientFactory.detectProvider()
  console.log(`🤖 检测到 AI 提供商: ${provider}`)
  
  if (provider === 'tongyi') {
    if (!process.env.TONGYI_API_KEY) {
      console.error('❌ 使用通义千问模型需要配置 TONGYI_API_KEY')
      process.exit(1)
    }
    console.log(`✅ 通义千问配置正常，模型: ${process.env.AI_MODEL}`)
  } else if (provider === 'openai') {
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY
    const hasCustomAPI = !!(process.env.OPENAI_API_URL && process.env.OPENAI_AUTH_KEY)
    if (!hasOpenAIKey && !hasCustomAPI) {
      console.error('❌ 使用 OpenAI 模型需要配置 OPENAI_API_KEY 或者 OPENAI_API_URL + OPENAI_AUTH_KEY')
      process.exit(1)
    }
    console.log(`✅ OpenAI 配置正常，模型: ${process.env.AI_MODEL}`)
  }
  
  // 测试 AI 客户端创建
  AIClientFactory.createClient()
  console.log('✅ AI 客户端初始化成功')
} catch (error) {
  console.error('❌ AI 配置验证失败:', error instanceof Error ? error.message : error)
  process.exit(1)
}

// 创建 Fastify 实例
const fastify = Fastify({ logger: true })

// 注册根路由
fastify.get('/', async () => {
  return { root: true }
})

// 注册统一 webhook 路由 (推荐)
await fastify.register(unifiedWebhook, { prefix: '/webhook' })

// 保持向后兼容的 GitLab 路由
await fastify.register(gitlabWebhook)

// 启动服务器
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' })
    console.log('🚀 AI GitLab 代码审查服务已启动在端口 3000')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()

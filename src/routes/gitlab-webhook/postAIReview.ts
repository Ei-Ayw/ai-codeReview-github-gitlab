import { type FastifyPluginAsync } from 'fastify'
import { buildAnswer } from '../../prompt/index.js'
import { buildCommentPayload } from './hookHandlers.js'
import { postAIComment } from './services.js'
import { AIClientFactory } from '../../services/aiClient.js'
import type { GitLabWebhookRequest } from './index.js'

export const postAIReview: FastifyPluginAsync =
    async (fastify): Promise<void> => {
      fastify.addHook<GitLabWebhookRequest>('onResponse',
        async (request, reply) => {
          if (reply.statusCode !== 200) {
            // Do not execute onResponse hook if the response status code is not 200
            return
          }
          if (request.headers['x-gitlab-token'] !== process.env.GITLAB_TOKEN) {
            fastify.log.error({ error: 'Unauthorized' })
            return
          }
          if (request.body == null) {
            fastify.log.error({ error: 'Bad Request' })
            return
          }

          if (fastify.gitLabWebhookHandlerResult instanceof Error) throw fastify.gitLabWebhookHandlerResult

          if (fastify.gitLabWebhookHandlerResult == null) return

          // CREATE AI COMMENT
          const { messageParams, gitLabBaseUrl, mergeRequestIid } = fastify.gitLabWebhookHandlerResult

          try {
            // 使用统一的 AI 客户端工厂
            const aiClient = AIClientFactory.createClient()
            const aiModel = process.env.AI_MODEL!

            fastify.log.info(`正在使用 ${aiModel} 模型生成 AI 代码审查...`)
            const aiResponse = await aiClient.generateCompletion(messageParams, aiModel)
            const answer = buildAnswer(aiResponse)
            const commentPayload = buildCommentPayload(answer, request.body.object_kind)

            fastify.log.info('AI completion generated successfully, posting comment on the merge request...')
            // POST COMMENT ON MERGE REQUEST
            const aiComment = postAIComment({
              gitLabBaseUrl,
              mergeRequestIid,
              headers: fastify.gitLabFetchHeaders
            }, commentPayload)
            if (aiComment instanceof Error) throw aiComment
            fastify.log.info('AI Comment posted successfully')
          } catch (error) {
            if (error instanceof Error) {
              fastify.log.error(error.message)
            }
          }
        })
    }

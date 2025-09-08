import { Octokit } from '@octokit/rest'
import type { ChatCompletionMessageParam } from 'openai/resources/index.mjs'
import { buildPrompt } from '../prompt/index.js'

// 统一的平台接口
export interface PlatformClient {
  // 获取代码差异
  getCodeDiff(params: DiffParams): Promise<CodeDiff[]>
  
  // 获取原始文件内容
  getFileContent(params: FileParams): Promise<FileContent[]>
  
  // 发布评论
  postComment(params: CommentParams): Promise<void>
  
  // 验证 webhook 签名
  verifyWebhook(signature: string, body: string, secret: string): boolean
}

// 通用接口定义
export interface DiffParams {
  owner: string
  repo: string
  base: string
  head: string
}

export interface FileParams {
  owner: string
  repo: string
  paths: string[]
  ref: string
}

export interface CommentParams {
  owner: string
  repo: string
  pullNumber: number
  body: string
}

export interface CodeDiff {
  filename: string
  patch: string
  status: 'added' | 'removed' | 'modified' | 'renamed'
}

export interface FileContent {
  filename: string
  content: string
}

// Webhook 处理结果
export interface WebhookResult {
  platform: 'github' | 'gitlab'
  messageParams: ChatCompletionMessageParam[]
  repoInfo: {
    owner: string
    repo: string
    pullNumber: number
  }
}

// GitHub 客户端实现
export class GitHubClient implements PlatformClient {
  private octokit: Octokit

  constructor(token: string) {
    this.octokit = new Octokit({
      auth: token
    })
  }

  async getCodeDiff(params: DiffParams): Promise<CodeDiff[]> {
    const { data } = await this.octokit.repos.compareCommits({
      owner: params.owner,
      repo: params.repo,
      base: params.base,
      head: params.head
    })

    return data.files?.map(file => ({
      filename: file.filename,
      patch: file.patch || '',
      status: file.status as any
    })) || []
  }

  async getFileContent(params: FileParams): Promise<FileContent[]> {
    const results: FileContent[] = []
    
    for (const path of params.paths) {
      try {
        const { data } = await this.octokit.repos.getContent({
          owner: params.owner,
          repo: params.repo,
          path,
          ref: params.ref
        })

        if ('content' in data && !Array.isArray(data)) {
          const content = Buffer.from(data.content, 'base64').toString('utf-8')
          results.push({
            filename: path,
            content
          })
        }
      } catch (error) {
        // 文件可能不存在（新文件），跳过
        console.warn(`无法获取文件内容: ${path}`, error)
      }
    }

    return results
  }

  async postComment(params: CommentParams): Promise<void> {
    await this.octokit.pulls.createReview({
      owner: params.owner,
      repo: params.repo,
      pull_number: params.pullNumber,
      body: params.body,
      event: 'COMMENT'
    })
  }

  verifyWebhook(signature: string, body: string, secret: string): boolean {
    const crypto = require('crypto')
    const expectedSignature = 'sha256=' + crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex')
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  }
}

// GitLab 客户端实现（适配现有代码）
export class GitLabClient implements PlatformClient {
  private token: string
  private baseUrl: string

  constructor(token: string, baseUrl: string) {
    this.token = token
    this.baseUrl = baseUrl
  }

  async getCodeDiff(params: DiffParams): Promise<CodeDiff[]> {
    const compareUrl = new URL(`${this.baseUrl}/projects/${encodeURIComponent(`${params.owner}/${params.repo}`)}/repository/compare`)
    compareUrl.searchParams.append('from', params.base)
    compareUrl.searchParams.append('to', params.head)
    compareUrl.searchParams.append('unidiff', 'true')

    const response = await fetch(compareUrl, {
      headers: { 'private-token': this.token }
    })

    if (!response.ok) {
      throw new Error(`GitLab API 调用失败: ${response.status}`)
    }

    const data = await response.json()
    return data.diffs?.map((diff: any) => ({
      filename: diff.new_path,
      patch: diff.diff,
      status: diff.new_file ? 'added' : diff.deleted_file ? 'removed' : 'modified'
    })) || []
  }

  async getFileContent(params: FileParams): Promise<FileContent[]> {
    const results: FileContent[] = []
    
    for (const path of params.paths) {
      try {
        const fileUrl = new URL(`${this.baseUrl}/projects/${encodeURIComponent(`${params.owner}/${params.repo}`)}/repository/files/${encodeURIComponent(path)}/raw`)
        fileUrl.searchParams.append('ref', params.ref)

        const response = await fetch(fileUrl, {
          headers: { 'private-token': this.token }
        })

        if (response.ok) {
          const content = await response.text()
          results.push({
            filename: path,
            content
          })
        }
      } catch (error) {
        console.warn(`无法获取文件内容: ${path}`, error)
      }
    }

    return results
  }

  async postComment(params: CommentParams): Promise<void> {
    const commentUrl = new URL(`${this.baseUrl}/projects/${encodeURIComponent(`${params.owner}/${params.repo}`)}/merge_requests/${params.pullNumber}/notes`)

    const response = await fetch(commentUrl, {
      method: 'POST',
      headers: {
        'private-token': this.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ body: params.body })
    })

    if (!response.ok) {
      throw new Error(`GitLab 评论发布失败: ${response.status}`)
    }
  }

  verifyWebhook(signature: string, body: string, secret: string): boolean {
    // GitLab 使用简单的 token 验证
    return signature === secret
  }
}

// 平台客户端工厂
export class PlatformClientFactory {
  static createClient(platform: 'github' | 'gitlab'): PlatformClient {
    switch (platform) {
      case 'github':
        if (!process.env.GITHUB_TOKEN) {
          throw new Error('缺少 GITHUB_TOKEN 环境变量')
        }
        return new GitHubClient(process.env.GITHUB_TOKEN)
      
      case 'gitlab':
        if (!process.env.GITLAB_TOKEN || !process.env.GITLAB_URL) {
          throw new Error('缺少 GITLAB_TOKEN 或 GITLAB_URL 环境变量')
        }
        return new GitLabClient(process.env.GITLAB_TOKEN, process.env.GITLAB_URL)
      
      default:
        throw new Error(`不支持的平台: ${platform}`)
    }
  }
}

// Webhook 处理器基类
export abstract class WebhookHandler {
  protected platformClient: PlatformClient

  constructor(platformClient: PlatformClient) {
    this.platformClient = platformClient
  }

  abstract handleWebhook(body: any): Promise<WebhookResult | null>
  abstract verifySignature(signature: string, body: string): boolean
}

// GitHub Webhook 处理器
export class GitHubWebhookHandler extends WebhookHandler {
  verifySignature(signature: string, body: string): boolean {
    const secret = process.env.GITHUB_WEBHOOK_SECRET || process.env.GITHUB_TOKEN
    if (!secret) return false
    return this.platformClient.verifyWebhook(signature, body, secret)
  }

  async handleWebhook(body: any): Promise<WebhookResult | null> {
    // 只处理 Pull Request 事件
    if (body.action !== 'opened' && body.action !== 'synchronize') {
      return null
    }

    const pr = body.pull_request
    const repo = body.repository

    // 获取代码差异
    const diffs = await this.platformClient.getCodeDiff({
      owner: repo.owner.login,
      repo: repo.name,
      base: pr.base.sha,
      head: pr.head.sha
    })

    if (diffs.length === 0) {
      return null
    }

    // 获取修改前的文件内容
    const filePaths = diffs.map(diff => diff.filename)
    const oldFiles = await this.platformClient.getFileContent({
      owner: repo.owner.login,
      repo: repo.name,
      paths: filePaths,
      ref: pr.base.sha
    })

    // 构建 AI 提示
    const messageParams = buildPrompt({
      oldFiles: oldFiles.map(file => ({
        fileName: file.filename,
        fileContent: file.content
      })),
      changes: diffs.map(diff => ({ diff: diff.patch }))
    })

    return {
      platform: 'github',
      messageParams,
      repoInfo: {
        owner: repo.owner.login,
        repo: repo.name,
        pullNumber: pr.number
      }
    }
  }
}

// GitLab Webhook 处理器
export class GitLabWebhookHandler extends WebhookHandler {
  verifySignature(signature: string, body: string): boolean {
    const secret = process.env.GITLAB_TOKEN
    if (!secret) return false
    return this.platformClient.verifyWebhook(signature, body, secret)
  }

  async handleWebhook(body: any): Promise<WebhookResult | null> {
    // 只处理 Merge Request 更新事件
    if (body.object_kind !== 'merge_request' || body.object_attributes?.action !== 'update') {
      return null
    }

    const mr = body.object_attributes
    const project = body.project

    // 获取代码差异
    const diffs = await this.platformClient.getCodeDiff({
      owner: project.namespace,
      repo: project.name,
      base: mr.target_branch,
      head: mr.source_branch
    })

    if (diffs.length === 0) {
      return null
    }

    // 获取修改前的文件内容
    const filePaths = diffs.map(diff => diff.filename)
    const oldFiles = await this.platformClient.getFileContent({
      owner: project.namespace,
      repo: project.name,
      paths: filePaths,
      ref: mr.target_branch
    })

    // 构建 AI 提示
    const messageParams = buildPrompt({
      oldFiles: oldFiles.map(file => ({
        fileName: file.filename,
        fileContent: file.content
      })),
      changes: diffs.map(diff => ({ diff: diff.patch }))
    })

    return {
      platform: 'gitlab',
      messageParams,
      repoInfo: {
        owner: project.namespace,
        repo: project.name,
        pullNumber: mr.iid
      }
    }
  }
}

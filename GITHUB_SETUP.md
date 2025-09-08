# 🐙 GitHub 配置指南

本文档详细说明如何配置 GitHub 平台的 AI 代码审查功能。

## 📋 前置准备

### 1. 获取 GitHub Personal Access Token

1. 登录 GitHub，进入 **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. 点击 **Generate new token** → **Generate new token (classic)**
3. 配置权限：
   - **repo** - 完整的仓库权限
   - **pull_requests:write** - 写入 Pull Request 权限
   - **contents:read** - 读取仓库内容权限

### 2. 设置 Webhook 密钥 (可选但推荐)

生成一个安全的密钥用于验证 Webhook 请求：

```bash
# 生成随机密钥
openssl rand -hex 20
```

## ⚙️ 环境配置

### 基础配置

```bash
# .env 文件
AI_MODEL=gpt-4-turbo
GITHUB_TOKEN=ghp_your-github-personal-access-token
GITHUB_WEBHOOK_SECRET=your-generated-webhook-secret

# AI 配置 (选择一种)
OPENAI_API_KEY=sk-your-openai-api-key
# 或
TONGYI_API_KEY=sk-your-tongyi-api-key
```

### 同时支持 GitHub 和 GitLab

```bash
# .env 文件
AI_MODEL=gpt-3.5-turbo

# GitHub 配置
GITHUB_TOKEN=ghp_your-github-token
GITHUB_WEBHOOK_SECRET=github-webhook-secret

# GitLab 配置
GITLAB_TOKEN=glpat-your-gitlab-token
GITLAB_URL=https://gitlab.com/api/v4

# AI 配置
OPENAI_API_KEY=sk-your-openai-api-key
```

## 🔗 Webhook 配置

### 方式一：使用统一路由 (推荐)

1. 进入 GitHub 仓库
2. **Settings** → **Webhooks** → **Add webhook**
3. 配置：
   - **Payload URL**: `https://your-domain.com/webhook`
   - **Content type**: `application/json`
   - **Secret**: 你的 `GITHUB_WEBHOOK_SECRET`
   - **Events**: 选择 `Pull requests`

### 方式二：使用 GitHub 专用路由

配置 Payload URL 为：`https://your-domain.com/webhook/github`

## 🧪 测试配置

### 1. 启动应用

```bash
pnpm run start
```

应该看到类似输出：
```
🔗 支持的平台: GitHub
🤖 检测到 AI 提供商: openai
✅ OpenAI 配置正常，模型: gpt-4-turbo
✅ AI 客户端初始化成功
🚀 AI 代码审查服务已启动在端口 3000
```

### 2. 测试 Webhook

创建一个测试 Pull Request：

1. 在 GitHub 仓库中创建新分支
2. 修改一些代码文件
3. 创建 Pull Request
4. 等待 AI 审查评论出现

## 🚀 高级配置

### 使用 ngrok 本地测试

```bash
# 启动 ngrok
ngrok http 3000

# 使用 ngrok 提供的 HTTPS 地址配置 GitHub Webhook
# 例如：https://abc123.ngrok.io/webhook
```

### 多仓库配置

同一个服务实例可以处理多个 GitHub 仓库的 Webhook，只需要在每个仓库中配置相同的 Webhook URL 即可。

### 自定义审查规则

可以通过修改 `src/prompt/index.ts` 中的提示模板来自定义审查规则：

```typescript
const QUESTIONS = `
1. 代码是否遵循最佳实践？
2. 是否有潜在的性能问题？
3. 是否存在安全漏洞？
4. 代码可读性如何？
5. 是否需要添加测试？
`
```

## 🔍 故障排除

### 常见问题

**Q: Webhook 没有触发？**
- 检查 GitHub Webhook 配置中的 "Recent Deliveries"
- 确认 Payload URL 可以从公网访问
- 检查应用日志是否有错误

**Q: 签名验证失败？**
- 确认 `GITHUB_WEBHOOK_SECRET` 与 GitHub 设置中的 Secret 一致
- 检查 Webhook 配置中的 Content type 是否为 `application/json`

**Q: AI 评论没有发布？**
- 检查 `GITHUB_TOKEN` 权限是否包含 `pull_requests:write`
- 确认 AI API 配置正确
- 查看应用日志中的错误信息

### 调试模式

启动应用时查看详细日志：

```bash
DEBUG=* pnpm run start
```

## 📚 API 参考

### GitHub API 调用

应用会调用以下 GitHub API：

- `GET /repos/:owner/:repo/compare/:base...:head` - 获取代码差异
- `GET /repos/:owner/:repo/contents/:path` - 获取文件内容
- `POST /repos/:owner/:repo/pulls/:number/reviews` - 发布审查评论

### Webhook 事件格式

GitHub 发送的 Pull Request 事件格式：

```json
{
  "action": "opened",
  "pull_request": {
    "number": 123,
    "base": { "sha": "abc123" },
    "head": { "sha": "def456" }
  },
  "repository": {
    "name": "repo-name",
    "owner": { "login": "owner-name" }
  }
}
```

## 🔐 安全建议

1. **使用 HTTPS**: 生产环境必须使用 HTTPS
2. **验证签名**: 始终配置 `GITHUB_WEBHOOK_SECRET`
3. **最小权限**: GitHub Token 只授予必需的权限
4. **环境隔离**: 不同环境使用不同的 Token
5. **定期轮换**: 定期更换 Token 和 Webhook 密钥

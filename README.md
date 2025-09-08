# AI 代码审查工具 🚀

一个轻量级的 AI 驱动代码审查工具，支持 **GitLab** 和 **GitHub** 平台，基于多种 AI 模型自动分析代码变更并提供智能反馈。

> 💡 本项目基于 [Evobaso-J/ai-gitlab-code-review](https://github.com/Evobaso-J/ai-gitlab-code-review) 进行了功能增强和架构优化，增加了多平台支持、多 AI 模型支持等特性。

## ✨ 特性

- 🤖 **多模型支持**: 支持 OpenAI GPT 和阿里云通义千问模型
- 🔗 **双平台集成**: 支持 GitLab Merge Request 和 GitHub Pull Request
- 📝 **Markdown 格式**: 生成格式化的审查评论，直接发布到对应平台
- 🌐 **灵活配置**: 支持官方 API、自定义代理和多种 AI 提供商
- ⚡ **轻量快速**: 精简版本，依赖少，启动快
- 🎯 **智能检测**: 自动识别平台类型和 AI 提供商
- 🔒 **安全验证**: 支持 GitHub HMAC 和 GitLab Token 验证

## 🛠️ 安装和配置

### 环境要求

- Node.js 18+ 
- pnpm (推荐) 或 npm
- 平台访问令牌：GitLab 个人访问令牌 或 GitHub 个人访问令牌 (至少一个)
- AI 服务密钥：OpenAI API 密钥 或 阿里云通义千问 API 密钥

### 1. 克隆项目

```bash
git clone <repository-url>
cd ai-gitlab-code-review-main
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

创建 `.env` 文件：

```bash
# AI 模型配置 - 根据选择的模型自动检测提供商
AI_MODEL=gpt-3.5-turbo

# === 平台配置 (至少配置一个) ===

# GitLab 配置
GITLAB_TOKEN=your-gitlab-personal-access-token
GITLAB_URL=https://gitlab.com/api/v4

# GitHub 配置
# GITHUB_TOKEN=ghp_your-github-personal-access-token
# GITHUB_WEBHOOK_SECRET=your-webhook-secret

# === OpenAI 配置 (当使用 OpenAI 模型时) ===
# 方式一：使用官方 OpenAI API
OPENAI_API_KEY=sk-your-openai-api-key

# 方式二：使用自定义 OpenAI API 代理
# OPENAI_API_URL=https://your-api-proxy.com/v1
# OPENAI_AUTH_KEY=your-auth-key

# === 阿里云通义千问配置 (当使用通义千问模型时) ===
# TONGYI_API_KEY=sk-your-tongyi-api-key
# TONGYI_API_URL=https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation
```

### 4. 构建和启动

```bash
# 构建项目
pnpm run build

# 启动服务
pnpm run start
```

服务将在 `http://localhost:3000` 启动。

## 📋 环境变量说明

| 变量名 | 必需 | 说明 |
|--------|------|------|
| `AI_MODEL` | ✅ | AI 模型名称，系统会根据模型自动选择提供商 |
| `GITLAB_TOKEN` | 条件 | GitLab 个人访问令牌，用于 API 调用和 Webhook 验证 |
| `GITLAB_URL` | 条件 | GitLab API 地址，通常为 `https://gitlab.com/api/v4` |
| `GITHUB_TOKEN` | 条件 | GitHub 个人访问令牌，用于 API 调用 |
| `GITHUB_WEBHOOK_SECRET` | 可选 | GitHub Webhook 密钥，用于验证请求签名 |
| `OPENAI_API_KEY` | 条件 | 官方 OpenAI API 密钥 (使用 OpenAI 模型时) |
| `OPENAI_API_URL` | 条件 | 自定义 OpenAI API 代理地址 |
| `OPENAI_AUTH_KEY` | 条件 | 自定义 OpenAI API 的认证密钥 |
| `TONGYI_API_KEY` | 条件 | 阿里云通义千问 API 密钥 (使用通义千问模型时) |
| `TONGYI_API_URL` | 可选 | 通义千问 API 地址，默认为官方地址 |

> **平台配置**: 至少需要配置一个平台：
> - GitLab: `GITLAB_TOKEN` + `GITLAB_URL`
> - GitHub: `GITHUB_TOKEN`
> 
> **AI 模型检测**: 系统会根据 `AI_MODEL` 自动选择对应的提供商：
> - OpenAI 模型 (如 `gpt-3.5-turbo`, `gpt-4`) → 需要 OpenAI 配置
> - 通义千问模型 (如 `qwen-turbo`, `qwen-plus`) → 需要通义千问配置

## 🔗 Webhook 配置

### 统一 Webhook 配置 (推荐)

使用统一端点 `/webhook` 可以自动识别平台类型：

**GitLab 项目配置:**
1. 进入项目 → **Settings** → **Webhooks**
2. 配置 Webhook：
   - **URL**: `http://your-server:3000/webhook`
   - **Secret token**: 与 `GITLAB_TOKEN` 相同
   - **Trigger**: 勾选 `Merge request events`

**GitHub 仓库配置:**
1. 进入仓库 → **Settings** → **Webhooks** → **Add webhook**
2. 配置 Webhook：
   - **Payload URL**: `http://your-server:3000/webhook`
   - **Content type**: `application/json`
   - **Secret**: 设置 Webhook 密钥 (对应 `GITHUB_WEBHOOK_SECRET`)
   - **Events**: 选择 `Pull requests`

### 专用 Webhook 端点 (可选)

如果需要明确指定平台，也可以使用专用端点：
- GitLab: `http://your-server:3000/webhook/gitlab`
- GitHub: `http://your-server:3000/webhook/github`
- 向下兼容: `http://your-server:3000/` (仅 GitLab)

### 2. 本地测试 (使用 ngrok)

如果需要本地测试，可以使用 ngrok 提供公网访问：

```bash
# 安装并配置 ngrok
ngrok config add-authtoken YOUR_NGROK_TOKEN
ngrok http 3000
```

然后使用 ngrok 提供的公网地址配置 GitLab Webhook。

## 🚀 使用方式

1. **启动服务**: 确保应用正在运行
2. **配置 Webhook**: 在 GitLab/GitHub 项目中添加 Webhook 配置
3. **创建 PR/MR**: 创建或更新 Pull Request (GitHub) 或 Merge Request (GitLab)
4. **自动审查**: AI 将自动分析代码变更并发布审查评论

### 支持的事件

| 平台 | 事件类型 | 触发条件 |
|------|----------|----------|
| GitLab | Merge Request | `action: update` |
| GitHub | Pull Request | `action: opened` 或 `synchronize` |

## 📝 可用脚本

```bash
# 构建 TypeScript
pnpm run build

# 启动生产服务
pnpm run start

# 开发模式 (构建后启动)
pnpm run dev

# Docker 模式启动
pnpm run docker:start
```

## 🐳 Docker 部署

```bash
# 构建并启动
docker compose up -d
```

## 📁 项目结构

```
src/
├── app.ts                     # 应用入口，统一配置和路由注册
├── config/                    # 配置文件
│   ├── index.ts              # AI 模型配置和类型定义
│   └── errors.ts             # 错误处理配置
├── prompt/                    # AI 提示模板
│   └── index.ts              # 代码审查提示词和格式化
├── services/                  # 核心服务层
│   ├── aiClient.ts           # AI 客户端抽象层 (OpenAI/通义千问)
│   └── platformClient.ts     # 平台客户端抽象层 (GitLab/GitHub)
└── routes/                    # 路由处理
    ├── webhook/              # 统一 Webhook 处理
    │   └── index.ts          # 多平台 Webhook 路由
    └── gitlab-webhook/       # GitLab 专用路由 (向下兼容)
        ├── index.ts          # GitLab Webhook 主路由
        ├── hookHandlers.ts   # GitLab 事件处理
        ├── postAIReview.ts   # AI 审查结果发布
        ├── services.ts       # GitLab 相关服务
        └── types.ts          # GitLab 类型定义
```

## 🔧 支持的 AI 模型

### OpenAI 模型
- `gpt-4o` / `gpt-4o-2024-05-13`
- `gpt-4-turbo` / `gpt-4-turbo-2024-04-09`
- `gpt-4` / `gpt-4-0613` / `gpt-4-32k`
- `gpt-3.5-turbo` / `gpt-3.5-turbo-16k`
- 其他 OpenAI 支持的模型

### 阿里云通义千问模型
- `qwen-turbo` - 通义千问超大规模语言模型，适合日常对话
- `qwen-plus` - 通义千问增强版，平衡性能和成本
- `qwen-max` - 通义千问旗舰版，最强性能
- `qwen-max-longcontext` - 支持长文本的旗舰版
- `qwen2.5-72b-instruct` - 千问2.5系列72B参数模型
- `qwen2.5-32b-instruct` - 千问2.5系列32B参数模型
- `qwen2.5-14b-instruct` - 千问2.5系列14B参数模型
- `qwen2.5-7b-instruct` - 千问2.5系列7B参数模型

### 模型选择建议
- **代码审查推荐**: `gpt-4-turbo`, `qwen-plus`, `qwen-max`
- **成本优化**: `gpt-3.5-turbo`, `qwen-turbo`
- **长代码文件**: `gpt-4-32k`, `qwen-max-longcontext`

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 🙏 致谢

本项目基于 [Evobaso-J/ai-gitlab-code-review](https://github.com/Evobaso-J/ai-gitlab-code-review) 开发，感谢原作者的优秀工作。在原项目基础上，我们进行了以下改进：

- ✨ 增加了 GitHub 平台支持
- 🤖 集成了阿里云通义千问模型  
- 🏗️ 重构了架构，采用模块化设计
- 📝 完善了文档和配置指南
- 🔒 增强了安全验证机制
- ⚡ 精简了依赖，提升了性能

## 📄 许可证

ISC License

# 🚀 快速开始指南

## 5 分钟启动 AI GitLab 代码审查工具

### 1️⃣ 准备工作

确保你有以下信息：
- **平台访问令牌** (至少一个)：
  - GitLab 个人访问令牌 ([获取方法](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html))
  - GitHub 个人访问令牌 ([获取方法](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token))
- **AI 服务密钥** (选择其一)：
  - OpenAI API 密钥 或 自定义 OpenAI API 服务
  - 阿里云通义千问 API 密钥 ([获取方法](https://help.aliyun.com/zh/dashscope/developer-reference/activate-dashscope-and-create-an-api-key))

### 2️⃣ 安装和配置

```bash
# 克隆项目
git clone <repository-url>
cd ai-gitlab-code-review-main

# 安装依赖
pnpm install

# 复制配置文件
cp .env.sample .env
```

### 3️⃣ 编辑 .env 文件

**基础配置 (必需)**:
```bash
AI_MODEL=gpt-3.5-turbo

# 平台配置 (至少选择一个)
# GitLab
GITLAB_TOKEN=glpat-xxxxxxxxxxxxxxxxxxxx
GITLAB_URL=https://gitlab.com/api/v4

# GitHub
# GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

**AI 配置 (选择一种)**:

选项 A - 使用 OpenAI:
```bash
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
```

选项 B - 使用自定义 OpenAI 代理:
```bash
OPENAI_API_URL=https://gpt.co.link/openai/v1
OPENAI_AUTH_KEY=lJWF6iS0aCEv
```

选项 C - 使用阿里云通义千问:
```bash
AI_MODEL=qwen-turbo
TONGYI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
```

### 4️⃣ 启动服务

```bash
# 构建并启动
pnpm run build
pnpm run start
```

✅ 看到 `🚀 AI GitLab 代码审查服务已启动在端口 3000` 说明启动成功！

### 5️⃣ 配置 Webhook

#### GitLab Webhook
1. 进入你的 GitLab 项目
2. **Settings** → **Webhooks**
3. 添加 Webhook:
   - **URL**: `http://localhost:3000/webhook` 或你的服务器地址
   - **Secret Token**: 与 `GITLAB_TOKEN` 相同
   - **Trigger**: 勾选 `Merge request events`

#### GitHub Webhook  
1. 进入你的 GitHub 仓库
2. **Settings** → **Webhooks** → **Add webhook**
3. 配置:
   - **Payload URL**: `http://localhost:3000/webhook`
   - **Content type**: `application/json`
   - **Events**: 选择 `Pull requests`

### 6️⃣ 测试

#### GitLab 测试
1. 在 GitLab 项目中创建一个新的 Merge Request
2. 或者更新现有的 Merge Request
3. 等待几秒钟，AI 会自动分析代码并发布评论！

#### GitHub 测试
1. 在 GitHub 仓库中创建一个新的 Pull Request
2. 或者向现有的 Pull Request 推送新的提交
3. AI 会自动分析变更并发布审查评论！

## 🔧 本地测试 (使用 ngrok)

如果需要本地测试，使用 ngrok 提供公网访问：

```bash
# 安装 ngrok 并获取 authtoken
ngrok config add-authtoken YOUR_NGROK_TOKEN

# 启动隧道
ngrok http 3000
```

然后使用 ngrok 提供的 HTTPS 地址配置 GitLab Webhook。

## ❗ 常见问题

**Q: 应用启动失败？**
- 检查 `.env` 文件是否正确配置
- 确保所有必需的环境变量都已设置

**Q: GitLab Webhook 没有触发？**
- 检查 Webhook URL 是否可访问
- 确保 Secret Token 与 `GITLAB_TOKEN` 相同
- 查看 GitLab 项目的 Webhook 日志

**Q: AI 没有发布评论？**
- 检查应用日志是否有错误信息
- 确认 OpenAI API 配置正确
- 验证 GitLab Token 有足够的权限

## 📞 需要帮助？

查看完整文档：[README.md](./README.md)

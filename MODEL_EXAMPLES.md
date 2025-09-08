# 🎯 AI 模型配置示例

本文档展示如何配置不同的 AI 模型提供商。

## 📋 配置示例

### 1. OpenAI 官方 API

```bash
# .env 配置
GITLAB_TOKEN=your-gitlab-token
GITLAB_URL=https://gitlab.com/api/v4
AI_MODEL=gpt-4-turbo
OPENAI_API_KEY=sk-your-openai-api-key
```

**推荐模型**:
- `gpt-4-turbo` - 最新最强的 GPT-4 模型
- `gpt-3.5-turbo` - 性价比高的选择

### 2. 自定义 OpenAI API 代理

```bash
# .env 配置
GITLAB_TOKEN=your-gitlab-token
GITLAB_URL=https://gitlab.com/api/v4
AI_MODEL=gpt-3.5-turbo
OPENAI_API_URL=https://gpt.co.link/openai/v1
OPENAI_AUTH_KEY=lJWF6iS0aCEv
```

### 3. 阿里云通义千问

```bash
# .env 配置
GITLAB_TOKEN=your-gitlab-token
GITLAB_URL=https://gitlab.com/api/v4
AI_MODEL=qwen-plus
TONGYI_API_KEY=sk-your-tongyi-api-key
```

**推荐模型**:
- `qwen-plus` - 性能与成本平衡
- `qwen-max` - 最强性能
- `qwen-turbo` - 最经济选择

## 🔄 模型切换

只需要修改 `.env` 文件中的 `AI_MODEL` 和对应的 API 密钥，然后重启应用即可：

```bash
# 从 OpenAI 切换到通义千问
# 修改 .env 文件
AI_MODEL=qwen-plus
TONGYI_API_KEY=sk-your-tongyi-api-key

# 重启应用
pnpm run start
```

## 📊 模型对比

| 模型 | 提供商 | 性能 | 成本 | 中文支持 | 推荐场景 |
|------|--------|------|------|----------|----------|
| `gpt-4-turbo` | OpenAI | ⭐⭐⭐⭐⭐ | 💰💰💰💰 | ⭐⭐⭐⭐ | 高质量代码审查 |
| `gpt-3.5-turbo` | OpenAI | ⭐⭐⭐⭐ | 💰💰 | ⭐⭐⭐ | 日常代码审查 |
| `qwen-max` | 通义千问 | ⭐⭐⭐⭐⭐ | 💰💰💰 | ⭐⭐⭐⭐⭐ | 中文项目审查 |
| `qwen-plus` | 通义千问 | ⭐⭐⭐⭐ | 💰💰 | ⭐⭐⭐⭐⭐ | 性价比选择 |
| `qwen-turbo` | 通义千问 | ⭐⭐⭐ | 💰 | ⭐⭐⭐⭐⭐ | 经济型选择 |

## 🚀 启动验证

启动应用时，系统会自动检测配置并显示：

```bash
$ pnpm run start
🤖 检测到 AI 提供商: tongyi
✅ 通义千问配置正常，模型: qwen-plus
✅ AI 客户端初始化成功
🚀 AI GitLab 代码审查服务已启动在端口 3000
```

## ❓ 常见问题

**Q: 如何获取通义千问 API 密钥？**
A: 访问 [阿里云百炼平台](https://bailian.console.aliyun.com/)，开通服务后在 API-KEY 管理页面创建。

**Q: 可以同时配置多个提供商吗？**
A: 可以，但系统会根据 `AI_MODEL` 自动选择对应的提供商。

**Q: 如何选择合适的模型？**
A: 
- 中文项目推荐通义千问系列
- 英文项目推荐 OpenAI GPT 系列
- 预算有限选择 turbo 版本
- 追求质量选择 max/4-turbo 版本

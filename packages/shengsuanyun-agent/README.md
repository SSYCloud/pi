# 胜算云 Coding Agent CLI

胜算云 Coding Agent CLI 是基于 Pi 的胜算云分发版本。它通过 Pi extension/theme/provider 机制接入胜算云大模型网关，并提供独立命令：

```bash
shengsuanyun-agent
```

## 安装

```bash
npm install -g @cocovs/shengsuanyun-coding-agent@0.75.5-shengsuanyun.1
```

配置胜算云模型网关 API key：

```bash
export SHENGSUANYUN_GATEWAY_API_KEY="..."
```

启动 CLI：

```bash
shengsuanyun-agent
```

非交互验证：

```bash
shengsuanyun-agent --print "只回复 OK"
```

## 截图

启动页：

![胜算云 Coding Agent 启动页](./assets/ssc-startup.svg)

模型选择：

![胜算云模型选择](./assets/ssc-model.svg)

## 默认行为

- 默认网关：`https://router.shengsuanyun.com/api/v1`
- 默认 provider：`shengsuanyun`
- 默认模型：`deepseek/deepseek-v4-pro`
- 交互式 `/model` 默认查看和切换胜算云模型，范围为 `shengsuanyun/*`
- 默认协议：OpenAI Chat Completions
- 实际调用路径：`${SHENGSUANYUN_GATEWAY_BASE_URL}/chat/completions`
- 模型列表路径：`${SHENGSUANYUN_GATEWAY_BASE_URL}/models`

切换默认模型：

```bash
SHENGSUANYUN_GATEWAY_MODEL=ali/qwen3-coder-plus shengsuanyun-agent
```

查看胜算云模型列表：

```bash
shengsuanyun-agent --list-models shengsuanyun
```

## 环境变量

| 变量 | 说明 |
| --- | --- |
| `SHENGSUANYUN_GATEWAY_API_KEY` | 胜算云模型网关 API key |
| `SHENGSUANYUN_GATEWAY_BASE_URL` | 覆盖默认网关地址 |
| `SHENGSUANYUN_GATEWAY_MODEL` | 覆盖 CLI 默认启动模型 |
| `SHENGSUANYUN_GATEWAY_MODELS_URL` | 覆盖模型列表接口地址 |
| `SHENGSUANYUN_GATEWAY_MODELS` | 模型列表接口失败时的 fallback，格式为 `model-id=显示名,other-model` |

## 协议边界

当前版本只接入 OpenAI Chat Completions 兼容协议。动态模型发现只注册 `support_apis` 包含 `/chat/completions` 的模型。

这个限制是有意保留的：Pi 的 `api` 决定请求体、流式响应解析、tool calling 格式和兼容性选项，不能只靠同一份模型列表安全混用。

后续多协议支持建议拆为独立 provider：

- `shengsuanyun-openai`：`/v1/chat/completions` -> `openai-completions`
- `shengsuanyun-responses`：`/v1/responses` -> `openai-responses`
- `shengsuanyun-claude`：`/v1/messages` -> `anthropic-messages`
- `shengsuanyun-gemini`：Gemini 兼容路径 -> `google-generative-ai`

## 本地开发

在仓库根目录安装依赖：

```bash
npm install --ignore-scripts
```

运行 workspace CLI：

```bash
npm run dev --workspace @cocovs/shengsuanyun-coding-agent
```

构建 Pi 后运行本地 bin：

```bash
npm run build
./node_modules/.bin/shengsuanyun-agent
```

发布前验证：

```bash
npm run check --workspace @cocovs/shengsuanyun-coding-agent
npm pack --workspace @cocovs/shengsuanyun-coding-agent --dry-run
npm run check
git diff --check
```

## 版本与发布

这个 package 跟随官方 Pi 版本发布。当前依赖的官方 Pi 版本是 `0.75.5`。

正常发布 tag：

```bash
git tag shengsuanyun-agent-v0.75.5
git push origin shengsuanyun-agent-v0.75.5
```

同一个官方 Pi 版本上补发胜算云侧修复时，使用 prerelease 版本：

```bash
git tag shengsuanyun-agent-v0.75.5-shengsuanyun.1
git push origin shengsuanyun-agent-v0.75.5-shengsuanyun.1
```

GitHub Actions 会从 tag 中提取版本号，并发布 `@cocovs/shengsuanyun-coding-agent`。发布前需要在 GitHub Actions secrets 中配置 `NPM_TOKEN`。

## 上游同步

本仓库是官方 Pi 的胜算云分发版本。上游同步建议使用 rebase：

```bash
git remote add upstream https://github.com/earendil-works/pi.git
git fetch upstream
git rebase upstream/main
```

同步后至少验证：

```bash
npm install --ignore-scripts
npm run check
./node_modules/.bin/shengsuanyun-agent --print "只回复 OK"
```

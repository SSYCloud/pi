# 胜算云 Coding Agent 原型

这个 package 用最小改造方式验证两件事：

- 通过 Pi extension 改造启动页、状态栏、工作提示和模型状态展示。
- 通过 Pi custom provider 接入胜算云大模型网关。

## 本地运行

先在仓库根目录安装依赖：

```bash
npm install --ignore-scripts
```

配置胜算云模型网关：

```bash
export SHENGSUANYUN_GATEWAY_BASE_URL="https://router.shengsuanyun.com/api/v1"
export SHENGSUANYUN_GATEWAY_API_KEY="..."
```

运行原型 CLI：

```bash
npm run dev --workspace @cocovs/shengsuanyun-coding-agent
```

这个命令会启动 `shengsuanyun-agent` wrapper，自动注入胜算云 extension、theme、provider 和默认模型。

构建 Pi 后，也可以直接运行 CLI：

```bash
npm run build
./node_modules/.bin/shengsuanyun-agent
```

默认启动模型是 `deepseek/deepseek-v4-pro`。如果要换模型，可以用环境变量：

```bash
SHENGSUANYUN_GATEWAY_MODEL=ali/qwen3-coder-plus ./node_modules/.bin/shengsuanyun-agent
```

查看注册到 Pi 的胜算云模型：

```bash
npm run list-models --workspace @cocovs/shengsuanyun-coding-agent
```

## 当前假设

- 胜算云网关先按 OpenAI Chat Completions 兼容协议接入，Pi provider 使用 `api: "openai-completions"`，实际调用路径是 `${SHENGSUANYUN_GATEWAY_BASE_URL}/chat/completions`。
- 模型列表默认从 `${SHENGSUANYUN_GATEWAY_BASE_URL}/models` 动态获取，解析 `GET /api/v1/models` 返回的 OpenAI 兼容格式。
- 动态模型发现只注册 `support_apis` 包含 `/chat/completions` 的模型；Claude Messages、OpenAI Responses、Gemini 等协议后续需要拆成独立 provider 或按模型单独配置。
- 如果网关模型列表拉取失败，才回退到 `SHENGSUANYUN_GATEWAY_MODELS`。该变量使用逗号分隔，单项格式为 `model-id=显示名`；显示名可省略。
- 如果未配置 `SHENGSUANYUN_GATEWAY_BASE_URL`，原型默认使用生产网关 `https://router.shengsuanyun.com/api/v1`。
- `https://www.shengsuanyun.com/` 是产品前端站点；当前模型调用网关走 `https://router.shengsuanyun.com/api/v1`。
- 如果模型列表接口和调用接口不是同一个 base URL，可以用 `SHENGSUANYUN_GATEWAY_MODELS_URL` 覆盖模型列表地址。

## 协议边界

当前原型不会自动把不同模型切到不同协议。这个限制是有意保留的：Pi 的 `api` 决定请求体、流式响应解析、tool calling 格式和兼容性选项，不能只靠同一份模型列表安全混用。

后续多协议支持建议拆为：

- `shengsuanyun-openai`：`/v1/chat/completions` -> `openai-completions`
- `shengsuanyun-responses`：`/v1/responses` -> `openai-responses`
- `shengsuanyun-claude`：`/v1/messages` -> `anthropic-messages`
- `shengsuanyun-gemini`：Gemini 兼容路径 -> `google-generative-ai`

## 版本与发布

这个 package 跟随官方 Pi 版本发布。当前依赖的官方 Pi 版本是 `0.75.5`，所以胜算云 CLI 包版本也是 `0.75.5`。

发布 tag 使用独立前缀：

```bash
git tag shengsuanyun-agent-v0.75.5
git push origin shengsuanyun-agent-v0.75.5
```

GitHub Actions 会从 tag 中提取版本号，并发布 `@cocovs/shengsuanyun-coding-agent@0.75.5`。

如果同一个官方 Pi 版本上需要补发胜算云侧修复，使用 prerelease 版本：

```bash
git tag shengsuanyun-agent-v0.75.5-shengsuanyun.1
git push origin shengsuanyun-agent-v0.75.5-shengsuanyun.1
```

上游同步建议使用 rebase：

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

## 下一步验证

- 用真实胜算云网关跑通一次代码阅读和 diff 建议。
- 判断品牌 UI 是否可以继续通过 extension/theme 覆盖，还是需要 fork `packages/coding-agent` 内部组件。

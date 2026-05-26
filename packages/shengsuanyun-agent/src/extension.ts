import type { ExtensionAPI, ProviderModelConfig, Theme } from "@earendil-works/pi-coding-agent";

const PROVIDER_ID = "shengsuanyun";
const PROVIDER_NAME = "胜算云模型网关";
const PROVIDER_PROTOCOL = "OpenAI Chat Completions";
const PROVIDER_API = "openai-completions";
const PROVIDER_CHAT_PATH = "/chat/completions";
const DEFAULT_BASE_URL = "https://router.shengsuanyun.com/api/v1";
const API_KEY_ENV = "SHENGSUANYUN_GATEWAY_API_KEY";
const BASE_URL_ENV = "SHENGSUANYUN_GATEWAY_BASE_URL";
const MODELS_ENV = "SHENGSUANYUN_GATEWAY_MODELS";
const MODELS_URL_ENV = "SHENGSUANYUN_GATEWAY_MODELS_URL";

function parseModelList(value: string | undefined): ProviderModelConfig[] {
	const modelSpecs = value
		?.split(",")
		.map((item) => item.trim())
		.filter((item) => item.length > 0);

	if (!modelSpecs || modelSpecs.length === 0) {
		return [
			{
				id: "gateway-default",
				name: "胜算云网关默认模型",
				reasoning: true,
				input: ["text", "image"],
				cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
				contextWindow: 128000,
				maxTokens: 8192,
				compat: {
					supportsDeveloperRole: false,
					supportsReasoningEffort: true,
					supportsUsageInStreaming: true,
					maxTokensField: "max_tokens",
				},
			},
		];
	}

	return modelSpecs.map((spec) => {
		const [idPart, namePart] = spec.split("=", 2);
		const id = idPart.trim();
		const name = namePart?.trim() || id;
		return {
			id,
			name,
			reasoning: true,
			input: ["text", "image"],
			cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
			contextWindow: 128000,
			maxTokens: 8192,
			compat: {
				supportsDeveloperRole: false,
				supportsReasoningEffort: true,
				supportsUsageInStreaming: true,
				maxTokensField: "max_tokens",
			},
		};
	});
}

interface GatewayModelInfo {
	id?: unknown;
	api_name?: unknown;
	name?: unknown;
	context_window?: unknown;
	max_tokens?: unknown;
	architecture?: {
		input?: unknown;
		output?: unknown;
	};
	support_apis?: unknown;
}

interface GatewayModelsResponse {
	success?: unknown;
	data?: unknown;
	object?: unknown;
}

function numberOrDefault(value: unknown, fallback: number): number {
	return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}

function stringOrUndefined(value: unknown): string | undefined {
	return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function supportsChatCompletions(value: unknown): boolean {
	if (!Array.isArray(value)) return true;
	const apis = value.filter((item): item is string => typeof item === "string");
	if (apis.length === 0) return true;
	return apis.some((api) => api.includes("/chat/completions"));
}

function supportsImageInput(model: GatewayModelInfo): boolean {
	const input = stringOrUndefined(model.architecture?.input)?.toLowerCase();
	return input?.includes("image") ?? false;
}

function toProviderModelConfig(model: GatewayModelInfo): ProviderModelConfig | undefined {
	if (!supportsChatCompletions(model.support_apis)) return undefined;

	const id = stringOrUndefined(model.id) ?? stringOrUndefined(model.api_name);
	if (!id) return undefined;

	return {
		id,
		name: stringOrUndefined(model.name) ?? id,
		reasoning: true,
		input: supportsImageInput(model) ? ["text", "image"] : ["text"],
		cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
		contextWindow: numberOrDefault(model.context_window, 128000),
		maxTokens: numberOrDefault(model.max_tokens, 8192),
		compat: {
			supportsDeveloperRole: false,
			supportsReasoningEffort: true,
			supportsUsageInStreaming: true,
			maxTokensField: "max_tokens",
		},
	};
}

function resolveGatewayBaseUrl(): string {
	return (process.env[BASE_URL_ENV] ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
}

function resolveModelsUrl(baseUrl: string): string {
	return process.env[MODELS_URL_ENV] ?? `${baseUrl}/models`;
}

async function fetchGatewayModels(baseUrl: string): Promise<ProviderModelConfig[]> {
	const headers: Record<string, string> = { accept: "application/json" };
	const apiKey = process.env[API_KEY_ENV];
	if (apiKey) {
		headers.authorization = `Bearer ${apiKey}`;
	}

	const response = await fetch(resolveModelsUrl(baseUrl), { headers });
	if (!response.ok) {
		throw new Error(`HTTP ${response.status}`);
	}

	const payload = (await response.json()) as GatewayModelsResponse;
	const data = Array.isArray(payload.data) ? payload.data : [];
	const models = data
		.map((item) => toProviderModelConfig(item as GatewayModelInfo))
		.filter((model): model is ProviderModelConfig => model !== undefined);

	if (models.length === 0) {
		throw new Error("empty model list");
	}

	return models;
}

function headerLines(theme: Theme): string[] {
	const accent = (text: string) => theme.fg("accent", text);
	const muted = (text: string) => theme.fg("muted", text);
	const dim = (text: string) => theme.fg("dim", text);

	return [
		"",
		accent("  SHENGSUANYUN Coding Agent"),
		muted("  胜算云大模型网关驱动的终端 Coding Agent 原型"),
		dim("  Provider: shengsuanyun  Model: use /model or Ctrl+L to switch"),
		"",
	];
}

export default async function shengsuanyunExtension(pi: ExtensionAPI): Promise<void> {
	const baseUrl = resolveGatewayBaseUrl();
	let models = parseModelList(process.env[MODELS_ENV]);
	try {
		models = await fetchGatewayModels(baseUrl);
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error);
		console.error(`Failed to fetch Shengsuanyun gateway models, using fallback models: ${reason}`);
	}

	pi.registerProvider(PROVIDER_ID, {
		name: PROVIDER_NAME,
		baseUrl,
		apiKey: API_KEY_ENV,
		authHeader: true,
		api: PROVIDER_API,
		models,
	});

	pi.on("session_start", async (_event, ctx) => {
		if (!ctx.hasUI) return;

		ctx.ui.setTitle("胜算云 Coding Agent");
		ctx.ui.setWorkingMessage("胜算云模型网关正在生成响应");
		ctx.ui.setHiddenThinkingLabel("推理过程已折叠");
		ctx.ui.setStatus("shengsuanyun", PROVIDER_NAME);
		ctx.ui.setHeader((_tui, theme) => ({
			render: () => headerLines(theme),
			invalidate: () => {},
		}));
	});

	pi.on("model_select", async (event, ctx) => {
		if (!ctx.hasUI) return;
		const modelRef = `${event.model.provider}/${event.model.id}`;
		ctx.ui.setStatus("model", modelRef);
		if (event.source !== "restore") {
			ctx.ui.notify(`当前模型: ${modelRef}`, "info");
		}
	});

	pi.registerCommand("shengsuanyun", {
		description: "Show Shengsuanyun provider prototype status",
		handler: async (_args, ctx) => {
			const modelIds = models.map((model) => model.id).join(", ");
			ctx.ui.notify(
				`${PROVIDER_NAME}: ${baseUrl}${PROVIDER_CHAT_PATH}; protocol=${PROVIDER_PROTOCOL}; models=${modelIds}`,
				"info",
			);
		},
	});
}

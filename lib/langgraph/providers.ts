import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGroq } from "@langchain/groq";
import type { ApiKeys } from "@/lib/types";
import { DEFAULT_GLM_MODEL } from "@/constants/glm-models";

export type Provider = "openai" | "claude" | "groq" | "openrouter" | "glm";

interface LLMOptions {
  jsonMode?: boolean;
}

export function resolveProviderKeys(keys: Partial<ApiKeys>): Partial<ApiKeys> {
  const serverGlmKey = process.env.DEFAULT_GLM_KEY || "";
  return {
    ...keys,
    openrouter: keys.openrouter || process.env.DEFAULT_OPENROUTER_KEY || "",
    glm: keys.glm || serverGlmKey,
    glmModel: keys.glm
      ? keys.glmModel || DEFAULT_GLM_MODEL
      : process.env.DEFAULT_GLM_MODEL || keys.glmModel || DEFAULT_GLM_MODEL,
  };
}

export function getMissingProviderKeyError(
  provider: Provider,
  keys: Partial<ApiKeys>,
): string | null {
  const requirements: Record<Provider, { key: keyof ApiKeys; label: string }> =
    {
      openrouter: { key: "openrouter", label: "OpenRouter" },
      openai: { key: "openai", label: "OpenAI" },
      claude: { key: "anthropic", label: "Anthropic" },
      groq: { key: "groq", label: "Groq" },
      glm: { key: "glm", label: "GLM" },
    };
  const requirement = requirements[provider];
  return keys[requirement.key]
    ? null
    : `${requirement.label} API key is missing. Open Settings and enter your key.`;
}

export function getLLM(
  provider: Provider,
  keys: Partial<ApiKeys>,
  options: LLMOptions = {},
) {
  switch (provider) {
    case "openai":
      return new ChatOpenAI({
        model: "gpt-4o-mini",
        temperature: 0.7,
        maxTokens: 1200,
        apiKey: keys.openai,
      });
    case "claude":
      return new ChatAnthropic({
        model: "claude-haiku-4-5-20251001",
        temperature: 0.7,
        maxTokens: 1200,
        anthropicApiKey: keys.anthropic,
      });
    case "groq":
      return new ChatGroq({
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        maxTokens: 1200,
        apiKey: keys.groq,
      });
    case "openrouter":
      return new ChatOpenAI({
        model: keys.openrouterModel || "openai/gpt-4o-mini",
        temperature: 0.7,
        maxTokens: 1200,
        apiKey: keys.openrouter,
        configuration: {
          baseURL: "https://openrouter.ai/api/v1",
          defaultHeaders: {
            "HTTP-Referer": "https://swot-explorer.vercel.app",
            "X-Title": "SWOT Prompt Explorer",
          },
        },
      });
    case "glm":
      const glmModel = keys.glmModel || DEFAULT_GLM_MODEL;
      const isGlm53 = glmModel.startsWith("glm-5.3");
      return new ChatOpenAI({
        model: glmModel,
        temperature: isGlm53 ? 1 : 0.7,
        maxTokens: 8192,
        apiKey: keys.glm,
        modelKwargs: {
          ...(isGlm53
            ? { reasoning_effort: "low" }
            : { thinking: { type: "disabled" } }),
          ...(options.jsonMode
            ? { response_format: { type: "json_object" } }
            : {}),
        },
        configuration: {
          baseURL:
            process.env.DEFAULT_GLM_BASE_URL ||
            "https://open.bigmodel.cn/api/coding/paas/v4",
        },
      });
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

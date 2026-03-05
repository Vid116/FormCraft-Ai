import { FORM_GENERATION_PROMPT, RESPONSE_SUMMARY_PROMPT } from "./prompts";
import type { FormField, FormResponse } from "../types/form";

interface AIProvider {
  generate(prompt: string, systemPrompt: string): Promise<string>;
}

const DEFAULT_AI_TIMEOUT_MS = 45_000;
const OPENAI_COMPAT_FORM_PROMPT = `Return ONLY valid JSON:
{
  "title": "short title",
  "welcome_title": "short welcome title",
  "welcome_description": "1 short sentence",
  "submit_message": "short thank you",
  "fields": [
    {
      "id": "field_1",
      "type": "short_text|long_text|email|number|phone|url|multiple_choice|checkbox|dropdown|rating|date",
      "label": "question",
      "required": true,
      "placeholder": "",
      "options": [{"id":"opt_1","label":"Option","value":"option"}],
      "validation": {"min":1,"max":5},
      "order": 0
    }
  ]
}
Rules:
- Return 4-8 fields only
- Keep labels concise
- Use rating only when needed
- Include options only for multiple_choice/checkbox/dropdown
- No markdown, no explanation`;

function getProviderMode(): string {
  return process.env.AI_PROVIDER ?? "sdk";
}

function getTimeoutMs(): number {
  const raw = Number(process.env.AI_REQUEST_TIMEOUT_MS ?? DEFAULT_AI_TIMEOUT_MS);
  if (!Number.isFinite(raw) || raw < 5_000) return DEFAULT_AI_TIMEOUT_MS;
  return Math.floor(raw);
}

function createTimeoutController(timeoutMs: number): { controller: AbortController; cleanup: () => void } {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, cleanup: () => clearTimeout(timeout) };
}

export function getAIProviderMode(): string {
  return getProviderMode();
}

// --- DEV: Claude Code CLI Provider (uses your subscription via --print) ---
class ClaudeCLIProvider implements AIProvider {
  async generate(prompt: string, systemPrompt: string): Promise<string> {
    const { spawn } = await import("child_process");

    const fullPrompt = `${systemPrompt}\n\n${prompt}`;

    return new Promise((resolve, reject) => {
      // Use shell: true so Windows can resolve "claude" from PATH
      const child = spawn("claude", ["--print"], {
        shell: true,
        timeout: 120_000,
        cwd: process.cwd(),
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data: Buffer) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data: Buffer) => {
        stderr += data.toString();
      });

      child.on("error", (err: Error) => {
        reject(new Error(`Claude CLI error: ${err.message}`));
      });

      child.on("close", (code: number | null) => {
        if (code !== 0) {
          reject(new Error(`Claude CLI exited with code ${code}: ${stderr}`));
        } else {
          resolve(stdout.trim());
        }
      });

      // Pipe prompt via stdin (avoids command-line length limits)
      child.stdin.write(fullPrompt);
      child.stdin.end();
    });
  }
}

// --- PROD: Anthropic API Provider ---
class AnthropicAPIProvider implements AIProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generate(prompt: string, systemPrompt: string): Promise<string> {
    const timeoutMs = getTimeoutMs();
    const { controller, cleanup } = createTimeoutController(timeoutMs);
    let response: Response;

    try {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: "user", content: prompt }],
        }),
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Anthropic API timeout after ${timeoutMs}ms`);
      }
      throw error;
    } finally {
      cleanup();
    }

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0]?.text ?? "";
  }
}

// --- PROD: OpenAI-compatible API Provider (e.g. Modal) ---
class OpenAICompatProvider implements AIProvider {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private maxTokens: number;

  constructor(apiKey: string, baseUrl: string, model: string, maxTokens: number) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.model = model;
    this.maxTokens = maxTokens;
  }

  async generate(prompt: string, systemPrompt: string): Promise<string> {
    const timeoutMs = getTimeoutMs();
    const { controller, cleanup } = createTimeoutController(timeoutMs);
    let response: Response;

    try {
      response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: this.maxTokens,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
        }),
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`OpenAI-compatible API timeout after ${timeoutMs}ms`);
      }
      throw error;
    } finally {
      cleanup();
    }

    if (!response.ok) {
      throw new Error(`OpenAI-compatible API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
      return content
        .map((part: unknown) =>
          typeof part === "object" &&
          part !== null &&
          "text" in part &&
          typeof (part as { text?: unknown }).text === "string"
            ? (part as { text: string }).text
            : ""
        )
        .join("")
        .trim();
    }

    return "";
  }
}

// --- Factory ---
function getProvider(): AIProvider {
  const mode = getProviderMode();

  if (mode === "api") {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("ANTHROPIC_API_KEY is required when AI_PROVIDER=api");
    return new AnthropicAPIProvider(key);
  }

  if (mode === "openai_compat") {
    const key = process.env.OPENAI_COMPAT_API_KEY;
    const baseUrl = process.env.OPENAI_COMPAT_BASE_URL;
    const model = process.env.OPENAI_COMPAT_MODEL;
    const rawMaxTokens = Number(process.env.OPENAI_COMPAT_MAX_TOKENS ?? 500);
    const maxTokens = Number.isFinite(rawMaxTokens) && rawMaxTokens >= 256
      ? Math.floor(rawMaxTokens)
      : 500;

    if (!key) throw new Error("OPENAI_COMPAT_API_KEY is required when AI_PROVIDER=openai_compat");
    if (!baseUrl) throw new Error("OPENAI_COMPAT_BASE_URL is required when AI_PROVIDER=openai_compat");
    if (!model) throw new Error("OPENAI_COMPAT_MODEL is required when AI_PROVIDER=openai_compat");

    return new OpenAICompatProvider(key, baseUrl, model, maxTokens);
  }

  return new ClaudeCLIProvider();
}

// --- Public API ---

export interface GeneratedForm {
  title: string;
  welcome_title: string;
  welcome_description: string;
  submit_message: string;
  fields: FormField[];
}

export async function generateFormFromDescription(description: string): Promise<GeneratedForm> {
  const startedAt = Date.now();
  const mode = getProviderMode();
  console.info(`[AI] generate_form start provider=${mode} prompt_chars=${description.length}`);

  const boundedDescription = description.slice(0, 600);
  const systemPrompt = mode === "openai_compat" ? OPENAI_COMPAT_FORM_PROMPT : FORM_GENERATION_PROMPT;

  const provider = getProvider();
  let result = "";
  try {
    result = await provider.generate(boundedDescription, systemPrompt);
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    console.error(`[AI] generate_form failed provider=${mode} duration_ms=${durationMs}`, error);
    throw error;
  }

  // Extract JSON object from the response
  const jsonMatch = result.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    const durationMs = Date.now() - startedAt;
    console.error(`[AI] generate_form invalid_json provider=${mode} duration_ms=${durationMs} result_chars=${result.length}`);
    throw new Error("AI did not return valid JSON");
  }

  const parsed = JSON.parse(jsonMatch[0]);
  const durationMs = Date.now() - startedAt;
  console.info(`[AI] generate_form success provider=${mode} duration_ms=${durationMs} result_chars=${result.length}`);

  return {
    title: parsed.title ?? description.slice(0, 60),
    welcome_title: parsed.welcome_title ?? "We'd love to hear from you!",
    welcome_description: parsed.welcome_description ?? "Your feedback helps us improve. This only takes a minute.",
    submit_message: parsed.submit_message ?? "Thank you for your response!",
    fields: parsed.fields ?? [],
  };
}

export async function summarizeResponses(
  formTitle: string,
  fields: FormField[],
  responses: FormResponse[]
): Promise<string> {
  const startedAt = Date.now();
  const mode = getProviderMode();
  const provider = getProvider();

  const prompt = `Form: "${formTitle}"
Fields: ${JSON.stringify(fields.map((f) => ({ label: f.label, type: f.type })))}
Responses (${responses.length} total): ${JSON.stringify(responses.slice(0, 50).map((r) => r.answers))}`;

  console.info(`[AI] summarize start provider=${mode} form="${formTitle}" responses=${responses.length}`);
  try {
    const summary = await provider.generate(prompt, RESPONSE_SUMMARY_PROMPT);
    const durationMs = Date.now() - startedAt;
    console.info(`[AI] summarize success provider=${mode} duration_ms=${durationMs} summary_chars=${summary.length}`);
    return summary;
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    console.error(`[AI] summarize failed provider=${mode} duration_ms=${durationMs}`, error);
    throw error;
  }
}

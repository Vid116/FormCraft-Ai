import { FORM_GENERATION_PROMPT, RESPONSE_SUMMARY_PROMPT } from "./prompts";
import type { FormField, FormResponse } from "../types/form";

interface AIProvider {
  generate(prompt: string, systemPrompt: string): Promise<string>;
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
    const response = await fetch("https://api.anthropic.com/v1/messages", {
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
    });

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

  constructor(apiKey: string, baseUrl: string, model: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.model = model;
  }

  async generate(prompt: string, systemPrompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4096,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      }),
    });

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
  const mode = process.env.AI_PROVIDER ?? "sdk";

  if (mode === "api") {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("ANTHROPIC_API_KEY is required when AI_PROVIDER=api");
    return new AnthropicAPIProvider(key);
  }

  if (mode === "openai_compat") {
    const key = process.env.OPENAI_COMPAT_API_KEY;
    const baseUrl = process.env.OPENAI_COMPAT_BASE_URL;
    const model = process.env.OPENAI_COMPAT_MODEL;

    if (!key) throw new Error("OPENAI_COMPAT_API_KEY is required when AI_PROVIDER=openai_compat");
    if (!baseUrl) throw new Error("OPENAI_COMPAT_BASE_URL is required when AI_PROVIDER=openai_compat");
    if (!model) throw new Error("OPENAI_COMPAT_MODEL is required when AI_PROVIDER=openai_compat");

    return new OpenAICompatProvider(key, baseUrl, model);
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
  const provider = getProvider();
  const result = await provider.generate(description, FORM_GENERATION_PROMPT);

  // Extract JSON object from the response
  const jsonMatch = result.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("AI did not return valid JSON");
  }

  const parsed = JSON.parse(jsonMatch[0]);

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
  const provider = getProvider();

  const prompt = `Form: "${formTitle}"
Fields: ${JSON.stringify(fields.map((f) => ({ label: f.label, type: f.type })))}
Responses (${responses.length} total): ${JSON.stringify(responses.slice(0, 50).map((r) => r.answers))}`;

  return provider.generate(prompt, RESPONSE_SUMMARY_PROMPT);
}

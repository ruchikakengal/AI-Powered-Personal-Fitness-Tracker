export type ChatRole = "user" | "bot";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

function parseJsonLoose(text: string): unknown {
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return null;
  const candidate = text.slice(firstBrace, lastBrace + 1);
  return JSON.parse(candidate);
}

function getGeminiApiKey(apiKey?: string): string | undefined {
  type ImportMetaEnv = { readonly VITE_GEMINI_API_KEY?: string };
  type ImportMetaShape = { readonly env?: ImportMetaEnv };

  const key =
    apiKey ??
    (typeof import.meta !== "undefined" ? (import.meta as unknown as ImportMetaShape).env?.VITE_GEMINI_API_KEY : undefined);
  return key;
}

type GeminiPart = { readonly text?: string };
type GeminiCandidate = {
  readonly content?: { readonly parts?: GeminiPart[] };
  readonly output?: string;
};
type GeminiResponse = {
  readonly candidates?: GeminiCandidate[];
};

function extractTextFromGeminiResponse(json: GeminiResponse): string {
  return (
    json?.candidates?.[0]?.content?.parts?.map((p) => p.text).filter(Boolean)[0] ??
    json?.candidates?.[0]?.content?.parts?.[0]?.text ??
    json?.candidates?.[0]?.output ??
    ""
  );
}

export async function getGeminiChatReply(args: {
  apiKey?: string;
  messages: ChatMessage[];
}): Promise<string> {
  const apiKey = getGeminiApiKey(args.apiKey);
  if (!apiKey) {
    throw new Error("Missing Gemini API key. Set `VITE_GEMINI_API_KEY` in your environment (e.g. `.env`).");
  }

  // Keep the context bounded to avoid huge payloads.
  const contextMessages = args.messages.slice(-10);

  const systemPrompt =
    "You are FitPulse AI assistant. Answer fitness-related questions clearly and safely. If the question is unrelated to fitness/health, politely steer back to fitness topics. Provide actionable guidance without medical claims.";

  const contents: Array<{ readonly role: "user" | "model"; readonly parts: Array<{ readonly text: string }> }> = [
    { role: "user", parts: [{ text: systemPrompt }] },
    ...contextMessages.map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("model" as const),
      parts: [{ text: m.content }],
    })),
  ];

  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

  const res = await fetch(`${url}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.5,
        topP: 0.9,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gemini API error (${res.status}). ${text}`);
  }

  const json = (await res.json()) as GeminiResponse;
  const reply = extractTextFromGeminiResponse(json).trim();

  if (!reply) {
    throw new Error("Gemini returned an empty response.");
  }

  // Gemini may wrap the response in JSON-like structures; handle gracefully.
  const parsed = parseJsonLoose(reply);
  if (parsed && typeof parsed === "object" && "reply" in parsed && typeof (parsed as Record<string, unknown>).reply === "string") {
    return (parsed as Record<string, unknown>).reply;
  }

  return reply;
}


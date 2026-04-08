export type WorkoutGoal = "weight_loss" | "muscle_gain" | "fitness";

export interface WorkoutDay {
  day: number; // 1-7
  title: string;
  intensity: string;
  durationMinutes: number;
  schedule: string[]; // e.g. ["Warm-up: ...", "Main: ...", "Cool-down: ..."]
}

export interface WorkoutPlan {
  goal: WorkoutGoal;
  days: WorkoutDay[];
  notes?: string;
}

export interface UserWorkoutProfile {
  age: number;
  gender: "male" | "female";
  heightCm: number;
  weightKg: number;
  heartRate: number;
  bodyTemp: number;
  duration: number; // preferred workout duration in minutes
}

function parseJsonLoose(text: string): unknown {
  // Gemini can sometimes wrap JSON in extra text. Extract the first { ... } block.
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return null;
  const candidate = text.slice(firstBrace, lastBrace + 1);
  return JSON.parse(candidate);
}

export async function generateWorkoutPlanGemini(args: {
  apiKey?: string;
  goal: WorkoutGoal;
  profile: UserWorkoutProfile;
}): Promise<WorkoutPlan> {
  type ImportMetaEnv = { readonly VITE_GEMINI_API_KEY?: string };
  type ImportMetaShape = { readonly env?: ImportMetaEnv };
  const apiKey =
    args.apiKey ??
    (typeof import.meta !== "undefined" ? (import.meta as unknown as ImportMetaShape).env?.VITE_GEMINI_API_KEY : undefined);

  if (!apiKey) {
    throw new Error(
      "Missing Gemini API key. Set `VITE_GEMINI_API_KEY` in your environment (e.g. `.env`).",
    );
  }

  const goalHuman =
    args.goal === "weight_loss" ? "weight loss" : args.goal === "muscle_gain" ? "muscle gain" : "general fitness";

  const profile = args.profile;

  const prompt = [
    `You are a fitness coach. Create a safe, realistic 7-day workout plan for the user.`,
    `Goal: ${goalHuman}.`,
    ``,
    `User profile (use it to personalize exercise selection, intensity, and duration):`,
    `- Age: ${profile.age}`,
    `- Gender: ${profile.gender}`,
    `- Height (cm): ${profile.heightCm}`,
    `- Weight (kg): ${profile.weightKg}`,
    `- Resting/typical heart rate input: ${profile.heartRate} bpm`,
    `- Body temperature input: ${profile.bodyTemp} C (for context only)`,
    `- Preferred workout duration: ~${profile.duration} minutes per session`,
    ``,
    `Requirements:`,
    `1) 7 days total, numbered 1..7.`,
    `2) Include a sensible mix of strength + cardio/mobility depending on goal.`,
    `3) Keep intensity appropriate for a general fitness user. Use these intensity levels: Low, Moderate, High.`,
    `4) Make durations per day close to the user's preferred duration (within ~±15 minutes).`,
    `5) Avoid extreme workouts; include warm-up and cool-down.`,
    ``,
    `Return ONLY valid JSON (no markdown, no backticks) with this schema:`,
    `{`,
    `  "goal": "${args.goal}",`,
    `  "days": [`,
    `    {`,
    `      "day": 1,`,
    `      "title": "string",`,
    `      "intensity": "Low|Moderate|High",`,
    `      "durationMinutes": number,`,
    `      "schedule": ["Warm-up: ...", "Main: ...", "Cool-down: ..."]`,
    `    }`,
    `  ],`,
    `  "notes": "optional string"`,
    `}`,
  ].join("\n");

  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

  const res = await fetch(`${url}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        topP: 0.9,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gemini API error (${res.status}). ${text}`);
  }

  type GeminiPart = { readonly text?: string };
  type GeminiResponse = {
    readonly candidates?: Array<{
      readonly content?: { readonly parts?: Array<GeminiPart> };
      readonly output?: string;
    }>;
  };
  const json = (await res.json()) as GeminiResponse;

  const candidateText =
    json?.candidates?.[0]?.content?.parts?.map((p) => p.text).filter(Boolean)[0] ??
    json?.candidates?.[0]?.content?.parts?.[0]?.text ??
    json?.candidates?.[0]?.output ??
    "";

  const parsed = typeof candidateText === "string" ? parseJsonLoose(candidateText) : null;

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Gemini returned an unexpected response format (failed to parse JSON).");
  }

  const plan = parsed as WorkoutPlan;

  // Basic shape validation.
  if (!Array.isArray(plan.days) || plan.days.length !== 7) {
    throw new Error("Gemini returned a workout plan with an unexpected number of days.");
  }

  return plan;
}


import { calculateBMI, getBMICategory } from "@/lib/fitness-utils";

export type DietGoal = "weight_loss" | "muscle_gain" | "fitness";

export interface DietMeal {
  meal: string;
  items: string[];
  calories: number;
}

export interface DietMacros {
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface DietDay {
  day: number; // 1..7
  title: string;
  calorieTarget: number;
  macros: DietMacros;
  meals: DietMeal[];
}

export interface DietPlan {
  goal: DietGoal;
  bmi: number;
  bmiCategory: string;
  days: DietDay[];
  notes?: string;
}

export interface UserDietProfile {
  age: number;
  gender: "male" | "female";
  heightCm: number;
  weightKg: number;
}

function parseJsonLoose(text: string): unknown {
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return null;
  const candidate = text.slice(firstBrace, lastBrace + 1);
  return JSON.parse(candidate);
}

export async function generateDietPlanGemini(args: { goal: DietGoal; profile: UserDietProfile; apiKey?: string }): Promise<DietPlan> {
  type ImportMetaEnv = { readonly VITE_GEMINI_API_KEY?: string };
  type ImportMetaShape = { readonly env?: ImportMetaEnv };
  const apiKey =
    args.apiKey ??
    (typeof import.meta !== "undefined" ? (import.meta as unknown as ImportMetaShape).env?.VITE_GEMINI_API_KEY : undefined);

  if (!apiKey) {
    throw new Error("Missing Gemini API key. Set `VITE_GEMINI_API_KEY` in your environment (e.g. `.env`).");
  }

  const bmi = calculateBMI(args.profile.weightKg, args.profile.heightCm);
  const bmiCategory = getBMICategory(bmi);

  const goalHuman =
    args.goal === "weight_loss" ? "weight loss" : args.goal === "muscle_gain" ? "muscle gain" : "general fitness";

  const prompt = [
    "You are a nutrition coach. Create a safe, realistic 7-day diet plan.",
    `Goal: ${goalHuman}.`,
    `User BMI (for personalization): ${bmi.toFixed(1)} (${bmiCategory}).`,
    "",
    `User profile:`,
    `- Age: ${args.profile.age}`,
    `- Gender: ${args.profile.gender}`,
    `- Height (cm): ${args.profile.heightCm}`,
    `- Weight (kg): ${args.profile.weightKg}`,
    "",
    "Requirements:",
    "1) Exactly 7 days total. Days must be numbered 1..7.",
    "2) Each day must include 3 meals: Breakfast, Lunch, Dinner (snacks are optional).",
    "3) Include calorieTarget and macros for each day. Use macros in grams: proteinG, carbsG, fatG.",
    "4) Use sensible foods and quantities. Avoid extreme diets.",
    "",
    "Return ONLY valid JSON (no markdown, no backticks) with this exact schema:",
    "{",
    '  "goal": "weight_loss|muscle_gain|fitness",',
    '  "bmi": number,',
    '  "bmiCategory": "string",',
    '  "days": [',
    "    {",
    '      "day": number,',
    '      "title": "string",',
    '      "calorieTarget": number,',
    '      "macros": { "proteinG": number, "carbsG": number, "fatG": number },',
    '      "meals": [',
    '        { "meal": "string", "items": ["string"], "calories": number },',
    "        ...",
    "      ]",
    "    }",
    "  ],",
    '  "notes": "optional string"',
    "}",
  ].join("\n");

  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

  const res = await fetch(`${url}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.5,
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

  const plan = parsed as DietPlan;

  if (!Array.isArray(plan.days) || plan.days.length !== 7) {
    throw new Error("Gemini returned a diet plan with an unexpected number of days.");
  }

  // Lightweight shape validation to prevent UI crashes on unexpected JSON.
  const isFiniteNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
  const isString = (v: unknown): v is string => typeof v === "string";

  for (const d of plan.days) {
    if (!isFiniteNumber(d.calorieTarget) || !isFiniteNumber(d.day)) {
      throw new Error("Gemini returned an invalid diet day shape.");
    }
    if (!d.macros || !isFiniteNumber(d.macros.proteinG) || !isFiniteNumber(d.macros.carbsG) || !isFiniteNumber(d.macros.fatG)) {
      throw new Error("Gemini returned diet macros with an invalid shape.");
    }
    if (!Array.isArray(d.meals) || d.meals.length < 3) {
      throw new Error("Gemini returned diet meals with an invalid shape.");
    }
    for (const m of d.meals) {
      if (!isString(m.meal) || !Array.isArray(m.items) || m.items.some((x) => !isString(x)) || !isFiniteNumber(m.calories)) {
        throw new Error("Gemini returned a diet meal with an invalid shape.");
      }
    }
  }

  return plan;
}


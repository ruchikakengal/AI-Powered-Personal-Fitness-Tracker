export interface ExerciseApiItem {
  name: string;
  type: string;
  muscle: string;
  equipment: string;
  difficulty: string;
  instructions: string;
}

export interface CaloriesApiItem {
  name: string;
  calories_per_hour: number;
  duration_minutes: number;
  total_calories: number;
}

function getApiNinjasKey(): string | undefined {
  type ImportMetaEnv = { readonly VITE_API_NINJAS_KEY?: string };
  type ImportMetaShape = { readonly env?: ImportMetaEnv };
  const meta = import.meta as unknown as ImportMetaShape;
  return meta.env?.VITE_API_NINJAS_KEY;
}

function ensureKey() {
  const key = getApiNinjasKey();
  if (!key) {
    throw new Error("Missing `VITE_API_NINJAS_KEY` in .env for Fitness API requests.");
  }
  return key;
}

async function handleJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Fitness API error (${res.status}). ${text}`);
  }
  return (await res.json()) as T;
}

export async function fetchExercises(params: { muscle?: string; type?: string; name?: string }): Promise<ExerciseApiItem[]> {
  const key = ensureKey();
  const url = new URL("https://api.api-ninjas.com/v1/exercises");
  if (params.muscle) url.searchParams.set("muscle", params.muscle);
  if (params.type) url.searchParams.set("type", params.type);
  if (params.name) url.searchParams.set("name", params.name);

  const res = await fetch(url.toString(), {
    headers: { "X-Api-Key": key },
  });

  return handleJson<ExerciseApiItem[]>(res);
}

export async function fetchCaloriesBurned(params: {
  activity: string;
  weightKg: number;
  durationMinutes: number;
}): Promise<CaloriesApiItem[]> {
  const key = ensureKey();
  const url = new URL("https://api.api-ninjas.com/v1/caloriesburned");
  url.searchParams.set("activity", params.activity);
  url.searchParams.set("weight", String(Math.max(1, Math.round(params.weightKg * 2.20462))));
  url.searchParams.set("duration", String(Math.max(1, Math.round(params.durationMinutes))));

  const res = await fetch(url.toString(), {
    headers: { "X-Api-Key": key },
  });

  return handleJson<CaloriesApiItem[]>(res);
}


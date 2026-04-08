import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Clock,
  Flame,
  Home,
  Heart,
  Menu,
  Sparkles,
  Scale,
  Ruler,
  Thermometer,
  TrendingUp,
  Utensils,
  MessageCircle,
  User,
  Zap,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import ThemeToggle from "@/components/ThemeToggle";

import { calculateBMI, calculateFitnessResults, generateWeeklyData, getBMICategory, type UserData, type FitnessResults } from '@/lib/fitness-utils';
import { generateWorkoutPlanGemini, type WorkoutGoal, type WorkoutPlan } from "@/lib/gemini-workout-generator";
import { generateDietPlanGemini, type DietGoal, type DietPlan } from "@/lib/gemini-diet-planner";
import { completeWorkoutForToday, getGamificationStateForCurrentUser, type GamificationState, type WorkoutStreakBadge } from "@/lib/gamification-store";
import { fetchCaloriesBurned, fetchExercises, type CaloriesApiItem, type ExerciseApiItem } from "@/lib/fitness-api";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Footer from '@/components/Footer';

const defaultData: UserData = { age: 25, gender: 'male', heightCm: 175, weightKg: 70, heartRate: 85, bodyTemp: 37.0, duration: 30 };

export default function Dashboard() {
  const location = useLocation();
  const [formData, setFormData] = useState<UserData>(defaultData);
  const [results, setResults] = useState<FitnessResults | null>(null);
  const [weeklyData] = useState(generateWeeklyData);
  const [loading, setLoading] = useState(false);

  // Goal tracking state (local to browser)
  const GOAL_STORAGE_KEY = "fitpulse:goal:v1";
  const [goalType, setGoalType] = useState<"weight_loss" | "muscle_gain">("weight_loss");
  const [targetWeight, setTargetWeight] = useState<number>(65);
  const [targetDate, setTargetDate] = useState<string>("");
  const [startWeight, setStartWeight] = useState<number | null>(null);

  const [goal, setGoal] = useState<WorkoutGoal>("weight_loss");
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [dietGoal, setDietGoal] = useState<DietGoal>("weight_loss");
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [dietLoading, setDietLoading] = useState(false);
  const [dietError, setDietError] = useState<string | null>(null);

  const [dietProfile, setDietProfile] = useState({
    age: defaultData.age,
    weightKg: defaultData.weightKg,
    heightCm: defaultData.heightCm,
  });

  // Gamification state (Firestore-backed)
  const [gamification, setGamification] = useState<GamificationState | null>(null);
  const [gamificationLoading, setGamificationLoading] = useState(false);
  const [gamificationActionLoading, setGamificationActionLoading] = useState(false);
  const [gamificationError, setGamificationError] = useState<string | null>(null);
  const [todayCompleted, setTodayCompleted] = useState(false);

  // Fitness API state
  const [exerciseQuery, setExerciseQuery] = useState({ muscle: "chest", type: "strength", name: "" });
  const [exerciseData, setExerciseData] = useState<ExerciseApiItem[]>([]);
  const [apiCalories, setApiCalories] = useState<CaloriesApiItem[]>([]);
  const [fitnessApiLoading, setFitnessApiLoading] = useState(false);
  const [fitnessApiError, setFitnessApiError] = useState<string | null>(null);

  // Load existing goal on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(GOAL_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        goalType: "weight_loss" | "muscle_gain";
        targetWeight: number;
        targetDate: string;
        startWeight: number;
      };
      if (!parsed || typeof parsed !== "object") return;
      if (parsed.goalType) setGoalType(parsed.goalType);
      if (typeof parsed.targetWeight === "number") setTargetWeight(parsed.targetWeight);
      if (typeof parsed.startWeight === "number") setStartWeight(parsed.startWeight);
      if (typeof parsed.targetDate === "string") setTargetDate(parsed.targetDate);
    } catch {
      // ignore corrupted goal data
    }
  }, []);

  // Load gamification on mount
  useEffect(() => {
    const load = async () => {
      setGamificationLoading(true);
      setGamificationError(null);
      try {
        const res = await getGamificationStateForCurrentUser();
        setGamification(res.gamification);
        setTodayCompleted(res.todayCompleted);
      } catch (e) {
        setGamificationError(e instanceof Error ? e.message : "Failed to load gamification.");
      } finally {
        setGamificationLoading(false);
      }
    };

    void load();
  }, []);

  // Persist goal when it changes
  const persistGoal = (next: {
    goalType: "weight_loss" | "muscle_gain";
    targetWeight: number;
    targetDate: string;
    startWeight: number | null;
  }) => {
    const safeStart = next.startWeight ?? formData.weightKg;
    setStartWeight(safeStart);
    localStorage.setItem(
      GOAL_STORAGE_KEY,
      JSON.stringify({
        goalType: next.goalType,
        targetWeight: next.targetWeight,
        targetDate: next.targetDate,
        startWeight: safeStart,
      }),
    );
  };

  const handleAnalyze = () => {
    setLoading(true);
    setTimeout(() => {
      setResults(calculateFitnessResults(formData));
      setLoading(false);
    }, 800);
  };

  const handleGenerateWorkoutPlan = async () => {
    setAiError(null);
    setAiLoading(true);
    try {
      const plan = await generateWorkoutPlanGemini({
        goal,
        profile: formData,
      });
      setWorkoutPlan(plan);
    } catch (e) {
      setWorkoutPlan(null);
      setAiError(e instanceof Error ? e.message : "Failed to generate workout plan.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateDietPlan = async () => {
    setDietError(null);
    setDietLoading(true);
    try {
      // Calculate BMI locally (required), then send inputs + BMI context to Gemini.
      const bmi = calculateBMI(dietProfile.weightKg, dietProfile.heightCm);
      const bmiCategory = getBMICategory(bmi);

      const plan = await generateDietPlanGemini({
        goal: dietGoal,
        profile: {
          age: dietProfile.age,
          gender: formData.gender,
          heightCm: dietProfile.heightCm,
          weightKg: dietProfile.weightKg,
        },
      });

      // Ensure UI still has local BMI context, even if Gemini returns slightly different precision.
      if (plan.bmi == null || plan.bmiCategory == null) {
        setDietPlan({ ...plan, bmi, bmiCategory } as DietPlan);
      } else {
        setDietPlan(plan);
      }
    } catch (e) {
      setDietPlan(null);
      setDietError(e instanceof Error ? e.message : "Failed to generate diet plan.");
    } finally {
      setDietLoading(false);
    }
  };

  const handleCompleteWorkoutToday = async () => {
    setGamificationError(null);
    setGamificationActionLoading(true);
    try {
      const res = await completeWorkoutForToday();
      setGamification(res.gamification);
      setTodayCompleted(true);
    } catch (e) {
      setGamificationError(e instanceof Error ? e.message : "Failed to complete today's workout.");
    } finally {
      setGamificationActionLoading(false);
    }
  };

  const handleFetchFitnessApiData = async () => {
    setFitnessApiError(null);
    setFitnessApiLoading(true);
    try {
      const [exercises, calories] = await Promise.all([
        fetchExercises({
          muscle: exerciseQuery.muscle || undefined,
          type: exerciseQuery.type || undefined,
          name: exerciseQuery.name || undefined,
        }),
        fetchCaloriesBurned({
          activity: exerciseQuery.type || "exercise",
          weightKg: formData.weightKg,
          durationMinutes: formData.duration,
        }),
      ]);
      setExerciseData(exercises.slice(0, 6));
      setApiCalories(calories);
    } catch (e) {
      setFitnessApiError(e instanceof Error ? e.message : "Failed to fetch fitness API data.");
      setExerciseData([]);
      setApiCalories([]);
    } finally {
      setFitnessApiLoading(false);
    }
  };

  const update = (field: keyof UserData, value: number | string) => {
    setFormData((p) => ({ ...p, [field]: value }));
  };

  const inputClass = "w-full bg-secondary/50 border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";

  const navItems = useMemo(
    () => [
      { label: "Home", path: "/", icon: Home },
      { label: "Dashboard", path: "/dashboard", icon: Activity },
      { label: "Recommendations", path: "/recommendations", icon: Utensils },
      { label: "Chatbot", path: "/chatbot", icon: MessageCircle },
    ],
    [],
  );

  const SidebarNav = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex h-full flex-col gap-5">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <div className="font-heading font-bold text-lg gradient-text">FitPulse</div>
            <div className="text-xs text-muted-foreground">Your fitness workspace</div>
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-2">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={[
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary",
              ].join(" ")}
            >
              <Icon className="w-4 h-4" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <div className="glass-card rounded-2xl p-4">
          <div className="text-xs text-muted-foreground mb-2">Quick tip</div>
          <div className="font-medium mb-1">Update your metrics before analyzing.</div>
          <div className="text-xs text-muted-foreground">We use your inputs to generate the charts.</div>
        </div>
      </div>
    </div>
  );

  const weightValue = `${formData.weightKg} kg`;
  const caloriesValue = results?.caloriesBurned != null ? `${Math.round(results.caloriesBurned)} kcal` : "-- kcal";
  const workoutsValue = results?.activityIntensity
    ? `${formData.duration} min • ${results.activityIntensity}`
    : `${formData.duration} min`;

  const dietBmi = calculateBMI(dietProfile.weightKg, dietProfile.heightCm);
  const dietBmiCategory = getBMICategory(dietBmi);

  // Goal tracking derived values
  const goalStartWeight = startWeight ?? formData.weightKg;
  const currentWeight = formData.weightKg;
  const isWeightLoss = goalType === "weight_loss";
  const totalDelta = isWeightLoss ? goalStartWeight - targetWeight : targetWeight - goalStartWeight;
  const currentDelta = isWeightLoss ? goalStartWeight - currentWeight : currentWeight - goalStartWeight;

  const progressRaw = totalDelta > 0 ? currentDelta / totalDelta : 0;
  const progressPct = Math.max(0, Math.min(1, progressRaw)) * 100;

  let remainingDays: number | null = null;
  if (targetDate) {
    const today = new Date();
    const end = new Date(targetDate);
    const diffMs = end.getTime() - today.getTime();
    remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="min-h-screen pt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-20 h-[calc(100vh-5rem)] glass-card rounded-3xl p-5 overflow-hidden">
              <SidebarNav />
            </div>
          </aside>

          {/* Main */}
          <main className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start sm:items-center justify-between gap-4 mb-6">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-1">
                  Fitness <span className="gradient-text">Dashboard</span>
                </h1>
                <p className="text-muted-foreground max-w-2xl">
                  Update your metrics and get AI-powered fitness insights.
                </p>
              </motion.div>

              <div className="flex items-center gap-2">
                {/* Mobile Sidebar Trigger */}
                <div className="lg:hidden">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="icon" className="rounded-full">
                        <Menu className="w-4 h-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0">
                      <div className="p-5 h-full">
                        <SidebarNav />
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>

                <ThemeToggle />
              </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="glass-card rounded-3xl p-5"
                whileHover={{ y: -4, scale: 1.01 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-muted-foreground">Weight</div>
                  <Scale className="w-5 h-5 text-chart-blue" />
                </div>
                <div className="font-heading text-3xl font-bold">{weightValue}</div>
                <div className="text-xs text-muted-foreground mt-1">Current input</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card rounded-3xl p-5"
                whileHover={{ y: -4, scale: 1.01 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-muted-foreground">Calories</div>
                  <Flame className="w-5 h-5 text-chart-orange" />
                </div>
                <div className="font-heading text-3xl font-bold">{caloriesValue}</div>
                <div className="text-xs text-muted-foreground mt-1">Estimated burn</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="glass-card rounded-3xl p-5"
                whileHover={{ y: -4, scale: 1.01 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-muted-foreground">Workouts</div>
                  <Activity className="w-5 h-5 text-chart-green" />
                </div>
                <div className="font-heading text-3xl font-bold">{workoutsValue}</div>
                <div className="text-xs text-muted-foreground mt-1">Duration & intensity</div>
              </motion.div>
            </div>

            {/* Goal Tracker */}
            <section className="glass-card rounded-3xl p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
                <div className="space-y-2">
                  <h2 className="font-heading text-xl sm:text-2xl font-bold">Goal Tracker</h2>
                  <p className="text-muted-foreground text-sm max-w-xl">
                    Set a weight-focused goal and track your progress over time based on your current weight input.
                  </p>
                  <div className="text-xs text-muted-foreground">
                    Start:&nbsp;
                    <span className="font-medium text-foreground">
                      {goalStartWeight.toFixed(1)} kg
                    </span>
                    &nbsp;• Current:&nbsp;
                    <span className="font-medium text-foreground">
                      {currentWeight.toFixed(1)} kg
                    </span>
                    &nbsp;• Target:&nbsp;
                    <span className="font-medium text-foreground">
                      {targetWeight.toFixed(1)} kg
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:items-end w-full lg:w-auto">
                  <div className="flex-1 min-w-[160px]">
                    <label className="text-xs text-muted-foreground mb-1 block">Goal type</label>
                    <select
                      value={goalType}
                      onChange={(e) => {
                        const nextType = e.target.value as "weight_loss" | "muscle_gain";
                        setGoalType(nextType);
                        persistGoal({
                          goalType: nextType,
                          targetWeight,
                          targetDate,
                          startWeight,
                        });
                      }}
                      className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="weight_loss">Weight loss</option>
                      <option value="muscle_gain">Muscle gain</option>
                    </select>
                  </div>

                  <div className="flex-1 min-w-[140px]">
                    <label className="text-xs text-muted-foreground mb-1 block">Target weight (kg)</label>
                    <input
                      type="number"
                      value={targetWeight}
                      onChange={(e) => {
                        const next = Number(e.target.value) || 0;
                        setTargetWeight(next);
                        persistGoal({
                          goalType,
                          targetWeight: next,
                          targetDate,
                          startWeight,
                        });
                      }}
                      className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  <div className="flex-1 min-w-[160px]">
                    <label className="text-xs text-muted-foreground mb-1 block">Target date</label>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => {
                        const next = e.target.value;
                        setTargetDate(next);
                        persistGoal({
                          goalType,
                          targetWeight,
                          targetDate: next,
                          startWeight,
                        });
                      }}
                      className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div>
                    Progress:&nbsp;
                    <span className="text-foreground font-semibold">
                      {Number.isFinite(progressPct) ? progressPct.toFixed(0) : 0}%
                    </span>
                  </div>
                  <div>
                    {remainingDays != null
                      ? remainingDays >= 0
                        ? `${remainingDays} day${remainingDays === 1 ? "" : "s"} remaining`
                        : `${Math.abs(remainingDays)} day${Math.abs(remainingDays) === 1 ? "" : "s"} past target`
                      : "No target date set"}
                  </div>
                </div>

                <div className="h-3 w-full rounded-full bg-secondary/60 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(0, Math.min(100, Number.isFinite(progressPct) ? progressPct : 0))}%`,
                      background: "var(--gradient-primary)",
                    }}
                  />
                </div>
              </div>
            </section>

            {/* Gamification */}
            <section className="glass-card rounded-3xl p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
                <div className="space-y-1">
                  <h2 className="font-heading text-xl sm:text-2xl font-bold">Gamification</h2>
                  <p className="text-muted-foreground text-sm max-w-xl">
                    Complete workouts to earn points, build streaks, and unlock badges.
                  </p>
                </div>

                <Button
                  onClick={() => void handleCompleteWorkoutToday()}
                  disabled={todayCompleted || gamificationActionLoading || gamificationLoading}
                  className="rounded-xl px-5 font-semibold"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  {gamificationActionLoading || gamificationLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Updating...
                    </span>
                  ) : todayCompleted ? (
                    "Workout completed"
                  ) : (
                    "Complete workout today"
                  )}
                </Button>
              </div>

              {gamificationError && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-xl p-3 mb-4">
                  {gamificationError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                <div className="glass-card rounded-3xl p-5">
                  <div className="text-sm text-muted-foreground">Current streak</div>
                  <div className="font-heading text-3xl font-bold mt-1">{gamification?.streak.current ?? 0} days</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Last: {gamification?.streak.lastWorkoutDate ?? "—"}
                  </div>
                </div>

                <div className="glass-card rounded-3xl p-5">
                  <div className="text-sm text-muted-foreground">Points & Level</div>
                  <div className="font-heading text-3xl font-bold mt-1">{gamification?.points ?? 0} pts</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Level {gamification?.level ?? 1}
                  </div>
                </div>

                <div className="glass-card rounded-3xl p-5">
                  <div className="text-sm text-muted-foreground">Progress</div>
                  <div className="mt-3">
                    {(() => {
                      const level = gamification?.level ?? 1;
                      const points = gamification?.points ?? 0;
                      const pointsInto = points - (level - 1) * 100;
                      const pct = Math.max(0, Math.min(100, (pointsInto / 100) * 100));
                      return (
                        <>
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                            <span>to next level</span>
                            <span className="text-foreground font-semibold">{pct.toFixed(0)}%</span>
                          </div>
                          <div className="h-3 w-full rounded-full bg-secondary/60 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${pct}%`,
                                background: "var(--gradient-primary)",
                              }}
                            />
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">Badges</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(["Beginner", "Consistent", "Pro"] as WorkoutStreakBadge[]).map((b) => {
                    const achieved = gamification?.badges?.includes(b) ?? false;
                    const meta =
                      b === "Beginner"
                        ? { desc: "Complete 1 workout", color: "text-chart-blue" }
                        : b === "Consistent"
                          ? { desc: "Streak of 7 days", color: "text-chart-green" }
                          : { desc: "Streak of 21 days or 500 pts", color: "text-chart-orange" };

                    return (
                      <div
                        key={b}
                        className={`glass-card rounded-3xl p-4 ${
                          achieved ? "border border-primary/20" : "opacity-80"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className={`font-heading font-semibold ${achieved ? meta.color : "text-muted-foreground"}`}>
                              {b}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">{meta.desc}</div>
                          </div>
                          <div
                            className={`text-xs px-3 py-1.5 rounded-full border ${
                              achieved ? "bg-primary/15 border-primary/30 text-primary" : "bg-secondary/40 border-border text-muted-foreground"
                            }`}
                          >
                            {achieved ? "Unlocked" : "Locked"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Fitness API Integration */}
            <section className="glass-card rounded-3xl p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
                <div>
                  <h2 className="font-heading text-xl sm:text-2xl font-bold">Live Exercise API</h2>
                  <p className="text-muted-foreground mt-1">
                    Fetch exercise suggestions and calories burned estimates from an external fitness API.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <input
                  value={exerciseQuery.muscle}
                  onChange={(e) => setExerciseQuery((p) => ({ ...p, muscle: e.target.value }))}
                  placeholder="muscle (e.g. chest)"
                  className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <input
                  value={exerciseQuery.type}
                  onChange={(e) => setExerciseQuery((p) => ({ ...p, type: e.target.value }))}
                  placeholder="type (e.g. strength)"
                  className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <input
                  value={exerciseQuery.name}
                  onChange={(e) => setExerciseQuery((p) => ({ ...p, name: e.target.value }))}
                  placeholder="name (optional)"
                  className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <Button
                onClick={() => void handleFetchFitnessApiData()}
                disabled={fitnessApiLoading}
                className="rounded-xl px-5 font-semibold"
                style={{ background: "var(--gradient-primary)" }}
              >
                {fitnessApiLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Loading...
                  </span>
                ) : (
                  "Fetch exercise + calories"
                )}
              </Button>

              {fitnessApiError && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-xl p-3 mt-4">
                  {fitnessApiError}
                </div>
              )}

              {fitnessApiLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="glass-card rounded-3xl p-5 h-40"
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  ))}
                </div>
              )}

              {!fitnessApiLoading && (exerciseData.length > 0 || apiCalories.length > 0) && (
                <div className="mt-5 space-y-5">
                  {apiCalories.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {apiCalories.slice(0, 3).map((c, idx) => (
                        <motion.div
                          key={`${c.name}-${idx}`}
                          className="glass-card rounded-3xl p-5"
                          whileHover={{ y: -4, scale: 1.01 }}
                        >
                          <div className="text-xs text-muted-foreground">Calories burned</div>
                          <div className="font-heading text-2xl font-bold mt-1">{c.total_calories} kcal</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {c.name} • {c.duration_minutes} min
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {exerciseData.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {exerciseData.map((ex, idx) => (
                        <motion.div
                          key={`${ex.name}-${idx}`}
                          className="glass-card rounded-3xl p-5"
                          whileHover={{ y: -4, scale: 1.01 }}
                        >
                          <div className="text-xs text-muted-foreground">{ex.muscle} • {ex.type}</div>
                          <div className="font-heading font-semibold mt-1">{ex.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">Difficulty: {ex.difficulty}</div>
                          <div className="text-sm text-foreground/90 mt-3 line-clamp-4">{ex.instructions}</div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* AI Workout Generator */}
            <section className="glass-card rounded-3xl p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
                <div>
                  <h2 className="font-heading text-xl sm:text-2xl font-bold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    AI Workout Generator
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    Pick a goal and generate a personalized 7-day plan based on your current metrics.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:items-end w-full lg:w-auto">
                  <div className="flex-1 min-w-[220px]">
                    <label className="text-xs text-muted-foreground mb-1 block">Goal</label>
                    <select
                      value={goal}
                      onChange={(e) => setGoal(e.target.value as WorkoutGoal)}
                      className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="weight_loss">Weight loss</option>
                      <option value="muscle_gain">Muscle gain</option>
                      <option value="fitness">Fitness</option>
                    </select>
                  </div>

                  <Button
                    onClick={handleGenerateWorkoutPlan}
                    disabled={aiLoading}
                    className="rounded-xl px-5 font-semibold"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    {aiLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Generating...
                      </span>
                    ) : (
                      "Generate 7-day plan"
                    )}
                  </Button>
                </div>
              </div>

              {aiError && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-xl p-3">
                  {aiError}
                </div>
              )}

              {workoutPlan && (
                <div className="mt-5">
                  <div className="text-xs text-muted-foreground mb-3">
                    Goal:{" "}
                    {goal === "weight_loss"
                      ? "Weight loss"
                      : goal === "muscle_gain"
                        ? "Muscle gain"
                        : "Fitness"}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {workoutPlan.days.map((d) => (
                      <div key={d.day} className="glass-card rounded-3xl p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-xs text-muted-foreground">Day {d.day}</div>
                            <div className="font-heading font-semibold mt-1">{d.title}</div>
                          </div>
                          <div className="text-xs px-3 py-1.5 rounded-full bg-secondary/40 border border-border">
                            {d.intensity}
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground mt-2">Duration: {d.durationMinutes} min</div>

                        <div className="mt-3 space-y-2">
                          {d.schedule.map((s, i) => (
                            <div key={i} className="text-sm text-foreground/90">
                              • {s}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {workoutPlan.notes && (
                    <div className="mt-5 glass-card rounded-3xl p-5">
                      <div className="text-xs text-muted-foreground mb-2">Coach notes</div>
                      <div className="text-sm text-foreground/90 whitespace-pre-line">{workoutPlan.notes}</div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* AI Diet Planner */}
            <section className="glass-card rounded-3xl p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
                <div>
                  <h2 className="font-heading text-xl sm:text-2xl font-bold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    AI Diet Planner
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    Choose your goal and generate a 7-day meal plan based on your BMI.
                  </p>
                  <div className="mt-3 text-sm text-muted-foreground">
                    BMI: <span className="text-foreground font-medium">{dietBmi.toFixed(1)}</span>{" "}
                    <span className="text-muted-foreground">({dietBmiCategory})</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:items-end w-full lg:w-auto">
                  <div className="flex-1 min-w-[220px]">
                    <label className="text-xs text-muted-foreground mb-1 block">Age</label>
                    <input
                      type="number"
                      value={dietProfile.age}
                      onChange={(e) => setDietProfile((p) => ({ ...p, age: +e.target.value }))}
                      className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  <div className="flex-1 min-w-[220px]">
                    <label className="text-xs text-muted-foreground mb-1 block">Height (cm)</label>
                    <input
                      type="number"
                      value={dietProfile.heightCm}
                      onChange={(e) => setDietProfile((p) => ({ ...p, heightCm: +e.target.value }))}
                      className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  <div className="flex-1 min-w-[220px]">
                    <label className="text-xs text-muted-foreground mb-1 block">Weight (kg)</label>
                    <input
                      type="number"
                      value={dietProfile.weightKg}
                      onChange={(e) => setDietProfile((p) => ({ ...p, weightKg: +e.target.value }))}
                      className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  <div className="flex-1 min-w-[220px]">
                    <label className="text-xs text-muted-foreground mb-1 block">Goal</label>
                    <select
                      value={dietGoal}
                      onChange={(e) => setDietGoal(e.target.value as DietGoal)}
                      className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="weight_loss">Weight loss</option>
                      <option value="muscle_gain">Muscle gain</option>
                      <option value="fitness">Fitness</option>
                    </select>
                  </div>

                  <Button
                    onClick={handleGenerateDietPlan}
                    disabled={dietLoading}
                    className="rounded-xl px-5 font-semibold"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    {dietLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Generating...
                      </span>
                    ) : (
                      "Generate 7-day diet"
                    )}
                  </Button>
                </div>
              </div>

              {dietError && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-xl p-3">
                  {dietError}
                </div>
              )}

              {dietPlan && (
                <div className="mt-5">
                  <div className="text-xs text-muted-foreground mb-3">
                    Goal:{" "}
                    {dietGoal === "weight_loss"
                      ? "Weight loss"
                      : dietGoal === "muscle_gain"
                        ? "Muscle gain"
                        : "Fitness"}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {dietPlan.days.map((d) => (
                      <div key={d.day} className="glass-card rounded-3xl p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-xs text-muted-foreground">Day {d.day}</div>
                            <div className="font-heading font-semibold mt-1">{d.title}</div>
                          </div>
                          <div className="text-xs px-3 py-1.5 rounded-full bg-secondary/40 border border-border">
                            {d.calorieTarget} kcal
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <div className="text-xs px-2 py-1 rounded-full bg-secondary/40 border border-border">P {d.macros.proteinG}g</div>
                          <div className="text-xs px-2 py-1 rounded-full bg-secondary/40 border border-border">C {d.macros.carbsG}g</div>
                          <div className="text-xs px-2 py-1 rounded-full bg-secondary/40 border border-border">F {d.macros.fatG}g</div>
                        </div>

                        <div className="mt-4 space-y-4">
                          {d.meals.map((m) => (
                            <div key={m.meal} className="space-y-2">
                              <div className="flex items-center justify-between gap-3">
                                <div className="text-sm font-semibold">{m.meal}</div>
                                <div className="text-xs text-muted-foreground">{m.calories} kcal</div>
                              </div>
                              <div className="text-sm text-foreground/90">
                                {m.items.join(", ")}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {dietPlan.notes && (
                    <div className="mt-5 glass-card rounded-3xl p-5">
                      <div className="text-xs text-muted-foreground mb-2">Coach notes</div>
                      <div className="text-sm text-foreground/90 whitespace-pre-line">{dietPlan.notes}</div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Input Form */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 }}
                className="glass-card rounded-3xl p-6 lg:col-span-1"
              >
                <h2 className="font-heading font-semibold text-lg mb-5 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" /> Health Data
                </h2>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Age</label>
                      <input
                        type="number"
                        value={formData.age}
                        onChange={(e) => update("age", +e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Gender</label>
                      <select value={formData.gender} onChange={(e) => update("gender", e.target.value)} className={inputClass}>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Ruler className="w-3 h-3" /> Height (cm)
                      </label>
                      <input
                        type="number"
                        value={formData.heightCm}
                        onChange={(e) => update("heightCm", +e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Scale className="w-3 h-3" /> Weight (kg)
                      </label>
                      <input
                        type="number"
                        value={formData.weightKg}
                        onChange={(e) => update("weightKg", +e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Heart className="w-3 h-3" /> Heart Rate (bpm)
                    </label>
                    <input
                      type="number"
                      value={formData.heartRate}
                      onChange={(e) => update("heartRate", +e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Thermometer className="w-3 h-3" /> Body Temp (°C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.bodyTemp}
                      onChange={(e) => update("bodyTemp", +e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Workout Duration (min)
                    </label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => update("duration", +e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <Button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="w-full rounded-xl font-semibold mt-2"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Analyzing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Analyze
                      </span>
                    )}
                  </Button>
                </div>
              </motion.div>

              {/* Right Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Analysis Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    {
                      label: "BMI",
                      value: results?.bmi ?? "--",
                      sub: results?.bmiCategory ?? "",
                      Icon: Scale,
                      color: "text-chart-blue",
                    },
                    {
                      label: "Heart Zone",
                      value: results ? `${formData.heartRate}` : "--",
                      sub: results?.heartRateZone ?? "",
                      Icon: Heart,
                      color: "text-chart-pink",
                    },
                    {
                      label: "Intensity",
                      value: results?.activityIntensity ?? "--",
                      sub: "level",
                      Icon: Activity,
                      color: "text-chart-green",
                    },
                  ].map((s) => (
                    <div key={s.label} className="glass-card rounded-3xl p-5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-muted-foreground">{s.label}</div>
                        <s.Icon className={`w-5 h-5 ${s.color}`} />
                      </div>
                      <div className="font-heading text-2xl font-bold">{s.value}</div>
                      <div className="text-xs text-muted-foreground">{s.sub || " "}</div>
                    </div>
                  ))}
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-3xl p-6">
                    <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" /> Weekly Calories
                    </h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={weeklyData}>
                        <defs>
                          <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(262 83% 64%)" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="hsl(262 83% 64%)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(230 15% 20%)" />
                        <XAxis dataKey="day" tick={{ fill: "hsl(220 10% 55%)", fontSize: 12 }} axisLine={false} />
                        <YAxis tick={{ fill: "hsl(220 10% 55%)", fontSize: 12 }} axisLine={false} />
                        <Tooltip contentStyle={{ background: "hsl(230 20% 12%)", border: "1px solid hsl(230 15% 20%)", borderRadius: "8px", color: "#fff" }} />
                        <Area type="monotone" dataKey="calories" stroke="hsl(262 83% 64%)" fill="url(#calGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-3xl p-6">
                    <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-accent" /> Weekly Activity
                    </h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(230 15% 20%)" />
                        <XAxis dataKey="day" tick={{ fill: "hsl(220 10% 55%)", fontSize: 12 }} axisLine={false} />
                        <YAxis tick={{ fill: "hsl(220 10% 55%)", fontSize: 12 }} axisLine={false} />
                        <Tooltip contentStyle={{ background: "hsl(230 20% 12%)", border: "1px solid hsl(230 15% 20%)", borderRadius: "8px", color: "#fff" }} />
                        <Bar dataKey="duration" fill="hsl(330 80% 62%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </motion.div>
                </div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-3xl p-6">
                  <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-chart-pink" /> Weekly Heart Rate
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={weeklyData}>
                      <defs>
                        <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(330 80% 62%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(330 80% 62%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(230 15% 20%)" />
                      <XAxis dataKey="day" tick={{ fill: "hsl(220 10% 55%)", fontSize: 12 }} axisLine={false} />
                      <YAxis tick={{ fill: "hsl(220 10% 55%)", fontSize: 12 }} axisLine={false} />
                      <Tooltip contentStyle={{ background: "hsl(230 20% 12%)", border: "1px solid hsl(230 15% 20%)", borderRadius: "8px", color: "#fff" }} />
                      <Area type="monotone" dataKey="heartRate" stroke="hsl(330 80% 62%)" fill="url(#hrGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </motion.div>
              </div>
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}

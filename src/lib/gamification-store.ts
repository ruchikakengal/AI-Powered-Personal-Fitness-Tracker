import { getDb } from "@/lib/firebase";
import { getGamificationUserId } from "@/lib/user-identity";

import { doc, getDoc, runTransaction, serverTimestamp, Timestamp, type FieldValue } from "firebase/firestore";

export type WorkoutStreakBadge = "Beginner" | "Consistent" | "Pro";

export interface GamificationState {
  points: number;
  level: number;
  badges: WorkoutStreakBadge[];
  workoutsCompletedTotal: number;
  streak: {
    current: number;
    lastWorkoutDate: string | null; // YYYY-MM-DD local time
  };
  lastUpdatedAt?: Timestamp | FieldValue;
}

const DEFAULT_STATE: GamificationState = {
  points: 0,
  level: 1,
  badges: [],
  workoutsCompletedTotal: 0,
  streak: {
    current: 0,
    lastWorkoutDate: null,
  },
};

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function toLocalISODate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function computeLevel(points: number): number {
  // 0..99 => 1, 100..199 => 2, etc.
  return Math.floor(points / 100) + 1;
}

function computeBadges(state: Pick<GamificationState, "workoutsCompletedTotal" | "streak" | "points">): WorkoutStreakBadge[] {
  const unlocked: WorkoutStreakBadge[] = [];

  if (state.workoutsCompletedTotal >= 1) unlocked.push("Beginner");
  if (state.streak.current >= 7) unlocked.push("Consistent");
  if (state.streak.current >= 21 || state.points >= 500) unlocked.push("Pro");

  return unlocked;
}

function clampFiniteNumber(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return fallback;
}

function parseGamificationStateFromDoc(docData: unknown): GamificationState {
  const data = typeof docData === "object" && docData ? (docData as Record<string, unknown>) : {};

  const streakObj = typeof data.streak === "object" && data.streak ? (data.streak as Record<string, unknown>) : {};

  const streakCurrent = clampFiniteNumber(streakObj?.current, DEFAULT_STATE.streak.current);
  const lastWorkoutDate =
    typeof streakObj?.lastWorkoutDate === "string" ? (streakObj.lastWorkoutDate as string) : DEFAULT_STATE.streak.lastWorkoutDate;

  const points = clampFiniteNumber(data.points, DEFAULT_STATE.points);
  const workoutsCompletedTotal = clampFiniteNumber(data.workoutsCompletedTotal, DEFAULT_STATE.workoutsCompletedTotal);
  const level = clampFiniteNumber(data.level, computeLevel(points));

  const badgesRaw = data.badges;
  const badges: WorkoutStreakBadge[] = Array.isArray(badgesRaw)
    ? badgesRaw.filter((b: unknown): b is WorkoutStreakBadge => b === "Beginner" || b === "Consistent" || b === "Pro")
    : [];

  const lastUpdatedAt = data.lastUpdatedAt as Timestamp | FieldValue | undefined;

  // Recompute to be safe/consistent.
  const computedLevel = computeLevel(points);
  const computedBadges = computeBadges({
    workoutsCompletedTotal,
    streak: { current: streakCurrent, lastWorkoutDate },
    points,
  });

  return {
    points,
    level: level > 0 ? level : computedLevel,
    badges: computedBadges.length ? computedBadges : badges,
    workoutsCompletedTotal,
    streak: {
      current: streakCurrent,
      lastWorkoutDate,
    },
    lastUpdatedAt,
  };
}

export interface CompleteWorkoutResult {
  alreadyCompleted: boolean;
  today: string; // YYYY-MM-DD
  gamification: GamificationState;
  pointsAwarded: number;
}

export async function getGamificationStateForCurrentUser(): Promise<{ userId: string; gamification: GamificationState; todayCompleted: boolean }> {
  const userId = await getGamificationUserId();
  const today = toLocalISODate(new Date());
  const db = getDb();

  const gamRef = doc(db, "users", userId, "gamification");
  const dailyRef = doc(db, "users", userId, "dailyWorkouts", today);

  const [gamSnap, dailySnap] = await Promise.all([getDoc(gamRef), getDoc(dailyRef)]);

  const gamification = gamSnap.exists() ? parseGamificationStateFromDoc(gamSnap.data()) : DEFAULT_STATE;
  const todayCompleted = dailySnap.exists();

  return { userId, gamification, todayCompleted };
}

export async function completeWorkoutForToday(): Promise<CompleteWorkoutResult> {
  const userId = await getGamificationUserId();
  const db = getDb();

  const todayDate = new Date();
  const today = toLocalISODate(todayDate);
  const yesterday = toLocalISODate(addDays(todayDate, -1));

  const gamRef = doc(db, "users", userId, "gamification");
  const dailyRef = doc(db, "users", userId, "dailyWorkouts", today);

  return runTransaction(db, async (tx) => {
    const dailySnap = await tx.get(dailyRef);
    if (dailySnap.exists()) {
      const gamSnap = await tx.get(gamRef);
      const gamification = gamSnap.exists() ? parseGamificationStateFromDoc(gamSnap.data()) : DEFAULT_STATE;
      return {
        alreadyCompleted: true,
        today,
        gamification,
        pointsAwarded: 0,
      };
    }

    const gamSnap = await tx.get(gamRef);
    const previous = gamSnap.exists() ? parseGamificationStateFromDoc(gamSnap.data()) : DEFAULT_STATE;

    const previousLastDate = previous.streak.lastWorkoutDate;
    let nextStreak = previous.streak.current;

    if (previousLastDate === today) {
      // Should not happen if daily doc didn't exist, but keep safe.
      nextStreak = previous.streak.current;
    } else if (previousLastDate === yesterday) {
      nextStreak = previous.streak.current + 1;
    } else {
      nextStreak = 1;
    }

    const basePoints = 10;
    const streakBonus = Math.floor(Math.max(0, nextStreak - 1) / 5) * 5; // +5 for every 5 streak days (after day 1)
    const pointsAwarded = basePoints + streakBonus;

    const nextPoints = previous.points + pointsAwarded;
    const nextWorkoutsTotal = previous.workoutsCompletedTotal + 1;

    const nextLevel = computeLevel(nextPoints);
    const nextBadges = computeBadges({
      workoutsCompletedTotal: nextWorkoutsTotal,
      streak: { current: nextStreak, lastWorkoutDate: today },
      points: nextPoints,
    });

    const nextGamification: GamificationState = {
      points: nextPoints,
      level: nextLevel,
      badges: nextBadges,
      workoutsCompletedTotal: nextWorkoutsTotal,
      streak: {
        current: nextStreak,
        lastWorkoutDate: today,
      },
      lastUpdatedAt: serverTimestamp(),
    };

    tx.set(dailyRef, {
      completedAt: serverTimestamp(),
      pointsAwarded,
    });

    tx.set(
      gamRef,
      {
        points: nextGamification.points,
        level: nextGamification.level,
        badges: nextGamification.badges,
        workoutsCompletedTotal: nextGamification.workoutsCompletedTotal,
        streak: nextGamification.streak,
        lastUpdatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    return {
      alreadyCompleted: false,
      today,
      gamification: nextGamification,
      pointsAwarded,
    };
  });
}


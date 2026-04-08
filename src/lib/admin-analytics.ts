import { getDb } from "@/lib/firebase";
import {
  collection,
  collectionGroup,
  getDocs,
  query,
  Timestamp,
  where,
} from "firebase/firestore";

export interface AdminAnalytics {
  totalUsers: number;
  activeUsers: number;
  popularWorkouts: Array<{ workout: string; count: number }>;
}

function dateDaysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function parseUserIdFromPath(path: string): string | null {
  // Expected: users/{uid}/...
  const parts = path.split("/");
  if (parts.length < 2) return null;
  if (parts[0] !== "users") return null;
  return parts[1] ?? null;
}

export async function fetchAdminAnalytics(): Promise<AdminAnalytics> {
  const db = getDb();

  // Total users = count of docs under `users`.
  const usersSnap = await getDocs(collection(db, "users"));
  const totalUsers = usersSnap.size;

  // Active users = unique users with daily workout completion in last 7 days.
  const since = Timestamp.fromDate(dateDaysAgo(7));
  const recentDailyQ = query(collectionGroup(db, "dailyWorkouts"), where("completedAt", ">=", since));
  const recentDailySnap = await getDocs(recentDailyQ);
  const activeUserSet = new Set<string>();
  recentDailySnap.forEach((docSnap) => {
    const uid = parseUserIdFromPath(docSnap.ref.path);
    if (uid) activeUserSet.add(uid);
  });
  const activeUsers = activeUserSet.size;

  // Popular workouts = top completed task titles from planner tasks.
  const completedTasksQ = query(collectionGroup(db, "tasks"), where("completed", "==", true));
  const completedTasksSnap = await getDocs(completedTasksQ);
  const counts = new Map<string, number>();

  completedTasksSnap.forEach((docSnap) => {
    const data = docSnap.data() as Record<string, unknown>;
    const title = typeof data.title === "string" ? data.title.trim() : "";
    if (!title) return;
    counts.set(title, (counts.get(title) ?? 0) + 1);
  });

  const popularWorkouts = Array.from(counts.entries())
    .map(([workout, count]) => ({ workout, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return {
    totalUsers,
    activeUsers,
    popularWorkouts,
  };
}


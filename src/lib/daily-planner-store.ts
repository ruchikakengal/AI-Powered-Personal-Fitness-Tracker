import { getDb } from "@/lib/firebase";
import { getGamificationUserId } from "@/lib/user-identity";

import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Timestamp,
} from "firebase/firestore";

export interface DailyTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt?: Timestamp;
  completedAt?: Timestamp;
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

export function toLocalISODate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function tasksCollectionPath(userId: string, date: string) {
  return collection(getDb(), "users", userId, "dailyPlans", date, "tasks");
}

export async function listTasks(date: string): Promise<DailyTask[]> {
  const userId = await getGamificationUserId();
  const q = query(tasksCollectionPath(userId, date), orderBy("createdAt", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as unknown as Record<string, unknown>;
    return {
      id: d.id,
      title: typeof data.title === "string" ? data.title : "",
      completed: !!data.completed,
      createdAt: data.createdAt,
      completedAt: data.completedAt,
    };
  });
}

export async function addTask(date: string, title: string): Promise<void> {
  const userId = await getGamificationUserId();
  const trimmed = title.trim();
  if (!trimmed) return;

  await addDoc(tasksCollectionPath(userId, date), {
    title: trimmed,
    completed: false,
    createdAt: serverTimestamp(),
  });
}

export async function setTaskCompleted(date: string, taskId: string, completed: boolean): Promise<void> {
  const userId = await getGamificationUserId();
  const ref = doc(getDb(), "users", userId, "dailyPlans", date, "tasks", taskId);
  await updateDoc(ref, {
    completed,
    completedAt: completed ? serverTimestamp() : null,
  });
}


import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Circle, Calendar as CalendarIcon, Plus } from "lucide-react";

import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

import { addTask, listTasks, setTaskCompleted, toLocalISODate, type DailyTask } from "@/lib/daily-planner-store";

export default function Planner() {
  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [showCalendar, setShowCalendar] = useState(false);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");

  const dateKey = useMemo(() => toLocalISODate(selectedDate), [selectedDate]);
  const completedCount = tasks.filter((t) => t.completed).length;

  const refresh = async () => {
    setLoading(true);
    setErr(null);
    try {
      const items = await listTasks(dateKey);
      setTasks(items);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey]);

  const onAdd = async () => {
    const title = newTitle.trim();
    if (!title) return;
    setNewTitle("");
    try {
      await addTask(dateKey, title);
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to add task.");
    }
  };

  const toggle = async (task: DailyTask) => {
    try {
      await setTaskCompleted(dateKey, task.id, !task.completed);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t)));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to update task.");
    }
  };

  return (
    <div className="min-h-screen pt-20 flex flex-col">
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-6 flex-1">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
          <div>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold">
              Daily <span className="gradient-text">Workout Planner</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Today’s tasks with a checklist and optional calendar view.
            </p>
            <div className="text-xs text-muted-foreground mt-2">
              Date: <span className="text-foreground font-medium">{dateKey}</span> • Completed:{" "}
              <span className="text-foreground font-medium">{completedCount}</span> / {tasks.length}
            </div>
          </div>

          <Button
            variant="outline"
            className="rounded-xl h-11 px-4"
            onClick={() => setShowCalendar((v) => !v)}
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            {showCalendar ? "Hide calendar" : "Show calendar"}
          </Button>
        </div>

        {showCalendar && (
          <div className="glass-card rounded-3xl p-4 sm:p-5 mb-6">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              className="mx-auto"
            />
          </div>
        )}

        <div className="glass-card rounded-3xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center mb-5">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Add a task (e.g., 20 min walk, Stretching, Push-ups)"
              className="flex-1 bg-secondary/50 border border-border rounded-xl px-4 py-3 text-base sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <Button
              onClick={() => void onAdd()}
              className="rounded-xl h-12 sm:h-11 px-5 font-semibold"
              style={{ background: "var(--gradient-primary)" }}
              disabled={!newTitle.trim()}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>

          {err && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-xl p-3 mb-4">
              {err}
            </div>
          )}

          <div className="space-y-2">
            {loading && (
              <div className="text-sm text-muted-foreground">Loading tasks…</div>
            )}

            {!loading && tasks.length === 0 && (
              <div className="text-sm text-muted-foreground">
                No tasks yet. Add a few workouts for {dateKey}.
              </div>
            )}

            {tasks.map((t) => (
              <button
                key={t.id}
                onClick={() => void toggle(t)}
                className="w-full flex items-start gap-3 rounded-2xl px-4 py-4 sm:py-3 text-left bg-secondary/30 border border-border hover:border-primary/30 hover:bg-secondary/40 transition-colors touch-manipulation"
              >
                <div className="mt-0.5">
                  {t.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-chart-green" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1">
                  <div className={`font-medium ${t.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {t.title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Status: {t.completed ? "Completed" : "Pending"}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}


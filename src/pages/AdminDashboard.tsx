import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, UserCheck, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import Footer from "@/components/Footer";
import { fetchAdminAnalytics, type AdminAnalytics } from "@/lib/admin-analytics";

const PIE_COLORS = ["hsl(262 83% 64%)", "hsl(330 80% 62%)", "hsl(200 80% 55%)", "hsl(160 70% 50%)"];

export default function AdminDashboard() {
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminAnalytics();
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load admin analytics.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const chartUsers = [
    { name: "Total Users", value: data?.totalUsers ?? 0 },
    { name: "Active Users", value: data?.activeUsers ?? 0 },
  ];

  return (
    <div className="min-h-screen pt-20 flex flex-col">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6 flex-1">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold">
              Admin <span className="gradient-text">Dashboard</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Firebase-based analytics for users and workout engagement.
            </p>
          </div>

          <button
            onClick={() => void load()}
            className="rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-sm font-medium hover:bg-secondary transition-colors"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-xl p-3 mb-5">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <motion.div className="glass-card rounded-3xl p-5" whileHover={{ y: -4, scale: 1.01 }}>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" /> Total users
            </div>
            <div className="font-heading text-3xl font-bold mt-2">{loading ? "…" : data?.totalUsers ?? 0}</div>
          </motion.div>

          <motion.div className="glass-card rounded-3xl p-5" whileHover={{ y: -4, scale: 1.01 }}>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <UserCheck className="w-4 h-4" /> Active users (7d)
            </div>
            <div className="font-heading text-3xl font-bold mt-2">{loading ? "…" : data?.activeUsers ?? 0}</div>
          </motion.div>

          <motion.div className="glass-card rounded-3xl p-5" whileHover={{ y: -4, scale: 1.01 }}>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Activity ratio
            </div>
            <div className="font-heading text-3xl font-bold mt-2">
              {loading || !data || data.totalUsers === 0
                ? "0%"
                : `${Math.round((data.activeUsers / data.totalUsers) * 100)}%`}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card rounded-3xl p-6">
            <h2 className="font-heading font-semibold mb-4">Users Overview</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartUsers}>
                <XAxis dataKey="name" tick={{ fill: "hsl(220 10% 55%)", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(220 10% 55%)", fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(262 83% 64%)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card rounded-3xl p-6">
            <h2 className="font-heading font-semibold mb-4">Popular Workouts</h2>
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading workout stats…</div>
            ) : !data || data.popularWorkouts.length === 0 ? (
              <div className="text-sm text-muted-foreground">No completed workout task data yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={data.popularWorkouts}
                    dataKey="count"
                    nameKey="workout"
                    innerRadius={50}
                    outerRadius={95}
                    paddingAngle={2}
                  >
                    {data.popularWorkouts.map((_, idx) => (
                      <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}

            {data && data.popularWorkouts.length > 0 && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {data.popularWorkouts.map((w) => (
                  <div key={w.workout} className="text-xs text-muted-foreground flex items-center justify-between">
                    <span className="truncate mr-3">{w.workout}</span>
                    <span className="font-medium text-foreground">{w.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}


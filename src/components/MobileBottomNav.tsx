import { Link, useLocation } from "react-router-dom";
import { Home, BarChart3, CalendarCheck2, MessageCircle } from "lucide-react";

const items = [
  { label: "Home", path: "/", icon: Home },
  { label: "Dash", path: "/dashboard", icon: BarChart3 },
  { label: "Plan", path: "/planner", icon: CalendarCheck2 },
  { label: "Chat", path: "/chatbot", icon: MessageCircle },
];

export default function MobileBottomNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-4xl px-3 pb-3">
        <div className="glass-card rounded-2xl border border-border/50 overflow-hidden">
          <div className="grid grid-cols-4">
            {items.map((it) => {
              const active = location.pathname === it.path;
              const Icon = it.icon;
              return (
                <Link
                  key={it.path}
                  to={it.path}
                  className={[
                    "flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors touch-manipulation",
                    active ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  <Icon className="w-5 h-5" />
                  <span>{it.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}


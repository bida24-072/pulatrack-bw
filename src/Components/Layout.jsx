import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, ArrowLeftRight, PiggyBank, PieChart, Target } from "lucide-react";
import { motion } from "framer-motion";

const NAV = [
  { path: "/", label: "Home", icon: LayoutDashboard },
  { path: "/transactions", label: "Activity", icon: ArrowLeftRight },
  { path: "/budgets", label: "Budgets", icon: Target },
  { path: "/goals", label: "Goals", icon: PiggyBank },
  { path: "/insights", label: "Insights", icon: PieChart },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <div className="mx-auto max-w-md min-h-screen relative pb-24">
        <Outlet />
      </div>

      <nav className="fixed bottom-0 inset-x-0 z-40">
        <div className="mx-auto max-w-md px-4 pb-4">
          <div className="flex items-center justify-around rounded-3xl bg-white/90 backdrop-blur-xl border border-teal-900/5 shadow-[0_8px_30px_rgba(13,148,136,0.12)] px-2 py-2">
            {NAV.map((item) => {
              const active = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="relative flex flex-col items-center gap-1 px-2.5 py-2 rounded-2xl"
                >
                  {active && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-primary/10 rounded-2xl"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <Icon
                    className={`relative w-5 h-5 transition-colors ${
                      active ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <span
                    className={`relative text-[10px] font-medium transition-colors ${
                      active ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}

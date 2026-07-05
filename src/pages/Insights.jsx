import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { format, parseISO, subMonths, isSameMonth, startOfMonth } from "date-fns";
import { formatPula, categoryMeta, sumBy } from "@/lib/finance";
import CategoryIcon from "@/components/CategoryIcon";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

export default function Insights() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Transaction.list("-date").then((t) => {
      setTransactions(t);
      setLoading(false);
    });
  }, []);

  const now = new Date();
  const months = Array.from({ length: 6 }).map((_, i) => startOfMonth(subMonths(now, 5 - i)));

  const trend = months.map((m) => {
    const tx = transactions.filter((t) => t.date && isSameMonth(parseISO(t.date), m));
    return {
      label: format(m, "MMM"),
      income: sumBy(tx, (t) => t.type === "income"),
      expense: sumBy(tx, (t) => t.type === "expense"),
    };
  });

  const monthTx = transactions.filter((t) => t.date && isSameMonth(parseISO(t.date), now));
  const income = sumBy(monthTx, (t) => t.type === "income");
  const expense = sumBy(monthTx, (t) => t.type === "expense");
  const saved = income - expense;

  const byCat = {};
  monthTx.filter((t) => t.type === "expense").forEach((t) => {
    byCat[t.category] = (byCat[t.category] || 0) + Number(t.amount || 0);
  });
  const catList = Object.entries(byCat)
    .map(([name, value]) => ({ name, value, ...categoryMeta("expense", name) }))
    .sort((a, b) => b.value - a.value);

  const stats = [
    { label: "Income", value: income, icon: TrendingUp, color: "#10b981" },
    { label: "Expenses", value: expense, icon: TrendingDown, color: "#ef4444" },
    { label: "Saved", value: saved, icon: Wallet, color: "#0d9488" },
  ];

  if (loading) {
    return (
      <div className="px-5 pt-8 space-y-4">
        <div className="h-8 w-32 bg-secondary/60 rounded-lg animate-pulse" />
        <div className="h-40 rounded-3xl bg-secondary/60 animate-pulse" />
        <div className="h-56 rounded-3xl bg-secondary/60 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="px-5 pt-8">
      <h1 className="text-2xl font-bold font-display text-foreground mb-1">Insights</h1>
      <p className="text-sm text-muted-foreground mb-5">{format(now, "MMMM yyyy")}</p>

      <div className="grid grid-cols-3 gap-2 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white p-3 border border-teal-900/5">
            <s.icon className="w-4 h-4 mb-2" style={{ color: s.color }} />
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
            <p className="text-sm font-bold text-foreground leading-tight">{formatPula(s.value, { decimals: 0 })}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl bg-white p-5 border border-teal-900/5 shadow-sm mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">Income vs Expenses</h2>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trend} barGap={2}>
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip
                cursor={{ fill: "#f1f5f9" }}
                formatter={(v) => formatPula(v, { decimals: 0 })}
                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: 12 }}
              />
              <Bar dataKey="income" radius={[6, 6, 0, 0]} fill="#10b981" />
              <Bar dataKey="expense" radius={[6, 6, 0, 0]} fill="#f43f5e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 justify-center mt-3">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Income</span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" />Expenses</span>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-5 border border-teal-900/5 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground mb-4">Top spending categories</h2>
        {catList.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No expenses this month.</p>
        ) : (
          <div className="space-y-4">
            {catList.slice(0, 6).map((c) => {
              const pct = Math.round((c.value / expense) * 100);
              return (
                <div key={c.name}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: c.color + "22" }}>
                      <CategoryIcon name={c.icon} className="w-3.5 h-3.5" style={{ color: c.color }} />
                    </span>
                    <span className="text-sm text-foreground flex-1">{c.name}</span>
                    <span className="text-sm font-semibold">{formatPula(c.value, { decimals: 0 })}</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: c.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

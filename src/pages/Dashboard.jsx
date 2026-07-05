import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, AlertTriangle, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { format, isSameMonth, parseISO } from "date-fns";
import { formatPula, sumBy, categoryMeta } from "@/lib/finance";
import CategoryIcon from "@/components/CategoryIcon";
import TransactionForm from "@/components/transactions/TransactionForm";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [user, setUser] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = async () => {
    const [txs, me, buds] = await Promise.all([
      base44.entities.Transaction.list("-date"),
      base44.auth.me().catch(() => null),
      base44.entities.Budget.list(),
    ]);
    setTransactions(txs);
    setUser(me);
    setBudgets(buds);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const now = new Date();
  const monthTx = transactions.filter((t) => t.date && isSameMonth(parseISO(t.date), now));
  const income = sumBy(monthTx, (t) => t.type === "income");
  const expenses = sumBy(monthTx, (t) => t.type === "expense");
  const balance = sumBy(transactions, (t) => t.type === "income") - sumBy(transactions, (t) => t.type === "expense");

  const byCategory = {};
  monthTx.filter((t) => t.type === "expense").forEach((t) => {
    byCategory[t.category] = (byCategory[t.category] || 0) + Number(t.amount || 0);
  });
  const pieData = Object.entries(byCategory)
    .map(([name, value]) => ({ name, value, color: categoryMeta("expense", name).color }))
    .sort((a, b) => b.value - a.value);

  const budgetAlerts = budgets
    .map((b) => {
      const spent = byCategory[b.category] || 0;
      const pct = (spent / b.monthly_limit) * 100;
      const over = spent > b.monthly_limit;
      return { ...b, spent, pct, over, near: pct >= 80 && !over };
    })
    .filter((b) => b.over || b.near)
    .sort((a, b) => b.pct - a.pct);

  const handleAdd = async (data) => {
    await base44.entities.Transaction.create(data);
    setOpen(false);
    load();
  };

  const firstName = user?.full_name?.split(" ")[0] || "there";
  const navigate = useNavigate();

  return (
    <div className="px-5 pt-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-sm text-muted-foreground">Dumela, {firstName} 👋</p>
          <h1 className="text-2xl font-bold font-display text-foreground">PulaTrack</h1>
        </div>
      </div>

      {/* Balance card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-700 via-teal-600 to-emerald-600 p-6 text-white shadow-[0_12px_40px_rgba(13,148,136,0.35)]"
      >
        <div className="absolute -right-8 -top-10 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -right-2 top-16 w-24 h-24 rounded-full bg-white/10" />
        <p className="text-sm text-white/80 relative">Total balance</p>
        <p className="text-4xl font-bold font-display mt-1 relative">{formatPula(balance)}</p>
        <div className="flex gap-3 mt-6 relative">
          <div className="flex-1 rounded-2xl bg-white/15 backdrop-blur px-4 py-3">
            <p className="text-xs text-white/80">Income</p>
            <p className="text-lg font-semibold">{formatPula(income, { decimals: 0 })}</p>
          </div>
          <div className="flex-1 rounded-2xl bg-white/15 backdrop-blur px-4 py-3">
            <p className="text-xs text-white/80">Expenses</p>
            <p className="text-lg font-semibold">{formatPula(expenses, { decimals: 0 })}</p>
          </div>
        </div>
        <p className="text-[11px] text-white/70 mt-3 relative">This month · {format(now, "MMMM yyyy")}</p>
      </motion.div>

      {/* Budget alerts */}
      {budgetAlerts.length > 0 && (
        <div className="mt-6 rounded-3xl bg-white p-5 border border-teal-900/5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Budget alerts</h2>
            <button onClick={() => navigate("/budgets")} className="text-xs text-primary font-medium flex items-center">
              All <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {budgetAlerts.slice(0, 3).map((b) => {
              const meta = categoryMeta("expense", b.category);
              const barColor = b.over ? "#ef4444" : "#f59e0b";
              return (
                <div key={b.id}>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5" style={{ color: barColor }} />
                    <span className="text-xs font-medium text-foreground flex-1 truncate">{b.category}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatPula(b.spent, { decimals: 0 })} / {formatPula(b.monthly_limit, { decimals: 0 })}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, b.pct)}%`, backgroundColor: barColor }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Spending breakdown */}
      {pieData.length > 0 && (
        <div className="mt-6 rounded-3xl bg-white p-5 border border-teal-900/5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground mb-3">Spending this month</h2>
          <div className="flex items-center gap-4">
            <div className="w-28 h-28 relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={34} outerRadius={52} paddingAngle={2} stroke="none">
                    {pieData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] text-muted-foreground">Total</span>
                <span className="text-xs font-bold">{formatPula(expenses, { decimals: 0 })}</span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              {pieData.slice(0, 4).map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-xs text-foreground/80 flex-1 truncate">{d.name}</span>
                  <span className="text-xs font-semibold">{formatPula(d.value, { decimals: 0 })}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">Recent activity</h2>
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-secondary/60 animate-pulse" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-10 rounded-3xl bg-white border border-teal-900/5">
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Tap + to add your first one.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.slice(0, 6).map((t) => {
              const meta = categoryMeta(t.type, t.category);
              return (
                <div key={t.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 border border-teal-900/5">
                  <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: meta.color + "22" }}>
                    <CategoryIcon name={meta.icon} className="w-5 h-5" style={{ color: meta.color }} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{t.category}</p>
                    <p className="text-xs text-muted-foreground truncate">{t.note || format(parseISO(t.date), "d MMM yyyy")}</p>
                  </div>
                  <p className={`text-sm font-semibold ${t.type === "income" ? "text-emerald-600" : "text-foreground"}`}>
                    {t.type === "income" ? "+" : "-"}{formatPula(t.amount, { decimals: 0 })}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-1/2 translate-x-[172px] z-40 w-14 h-14 rounded-full bg-primary text-white shadow-[0_8px_24px_rgba(13,148,136,0.45)] flex items-center justify-center active:scale-95 transition-transform"
      >
        <Plus className="w-7 h-7" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Add transaction</DialogTitle>
          </DialogHeader>
          <TransactionForm onSubmit={handleAdd} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

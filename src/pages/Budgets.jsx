import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { isSameMonth, parseISO } from "date-fns";
import { EXPENSE_CATEGORIES, categoryMeta } from "@/lib/finance";
import BudgetRow from "@/components/budgets/BudgetRow";
import CategoryIcon from "@/components/CategoryIcon";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removeCat, setRemoveCat] = useState(null);

  const load = async () => {
    const [b, tx] = await Promise.all([
      base44.entities.Budget.list(),
      base44.entities.Transaction.list("-date"),
    ]);
    setBudgets(b);
    setTransactions(tx);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const now = new Date();
  const monthExpenses = transactions.filter(
    (t) => t.type === "expense" && t.date && isSameMonth(parseISO(t.date), now)
  );

  const spentFor = (cat) =>
    monthExpenses.filter((t) => t.category === cat).reduce((s, t) => s + Number(t.amount || 0), 0);

  const budgetFor = (cat) => budgets.find((b) => b.category === cat);

  const handleSave = async (cat, limit) => {
    const existing = budgetFor(cat);
    if (existing) {
      await base44.entities.Budget.update(existing.id, { monthly_limit: limit });
    } else {
      await base44.entities.Budget.create({ category: cat, monthly_limit: limit });
    }
    load();
  };

  const handleRemove = async () => {
    const b = budgetFor(removeCat);
    if (b) await base44.entities.Budget.delete(b.id);
    setRemoveCat(null);
    load();
  };

  const budgetCats = budgets.map((b) => b.category);
  const spentCats = EXPENSE_CATEGORIES.filter((c) => spentFor(c.name) > 0).map((c) => c.name);
  const activeCats = [...new Set([...budgetCats, ...spentCats])];
  const inactiveCats = EXPENSE_CATEGORIES.filter((c) => !activeCats.includes(c.name));

  return (
    <div className="px-5 pt-8">
      <h1 className="text-2xl font-bold font-display text-foreground mb-1">Budgets</h1>
      <p className="text-sm text-muted-foreground mb-5">Monthly spending limits per category</p>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-24 rounded-2xl bg-secondary/60 animate-pulse" />)}
        </div>
      ) : (
        <>
          {activeCats.length > 0 && (
            <div className="space-y-3 mb-6">
              {activeCats.map((cat) => (
                <BudgetRow
                  key={cat}
                  meta={categoryMeta("expense", cat)}
                  spent={spentFor(cat)}
                  budget={budgetFor(cat)}
                  onSave={(limit) => handleSave(cat, limit)}
                  onRemove={() => setRemoveCat(cat)}
                />
              ))}
            </div>
          )}

          {inactiveCats.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 px-1">Set a limit for another category</p>
              <div className="grid grid-cols-4 gap-2">
                {inactiveCats.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => handleSave(c.name, 0).then(() => {})}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-secondary/60 border border-transparent hover:border-primary/30 transition-all"
                  >
                    <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: c.color + "22" }}>
                      <CategoryIcon name={c.icon} className="w-4 h-4" style={{ color: c.color }} />
                    </span>
                    <span className="text-[10px] leading-tight text-center text-foreground/80">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeCats.length === 0 && inactiveCats.length === 0 && (
            <div className="text-center py-16 rounded-3xl bg-white border border-teal-900/5">
              <p className="text-sm text-muted-foreground">Tap a category above to set a limit.</p>
            </div>
          )}
        </>
      )}

      <AlertDialog open={!!removeCat} onOpenChange={(o) => !o && setRemoveCat(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove budget for {removeCat}?</AlertDialogTitle>
            <AlertDialogDescription>Your transactions stay — only the limit is removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} className="rounded-xl bg-rose-500 hover:bg-rose-600">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

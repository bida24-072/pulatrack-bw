import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/finance";
import CategoryIcon from "@/components/CategoryIcon";
import { format } from "date-fns";

export default function TransactionForm({ initial, onSubmit, onCancel }) {
  const [type, setType] = useState(initial?.type || "expense");
  const [amount, setAmount] = useState(initial?.amount?.toString() || "");
  const [category, setCategory] = useState(initial?.category || "");
  const [note, setNote] = useState(initial?.note || "");
  const [date, setDate] = useState(initial?.date || format(new Date(), "yyyy-MM-dd"));
  const [saving, setSaving] = useState(false);

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !category) return;
    setSaving(true);
    await onSubmit({ type, amount: parseFloat(amount), category, note, date });
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-2 p-1 bg-secondary rounded-2xl">
        {["expense", "income"].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setType(t); setCategory(""); }}
            className={`py-2.5 rounded-xl text-sm font-semibold capitalize transition-all ${
              type === t
                ? t === "income"
                  ? "bg-emerald-500 text-white shadow"
                  : "bg-rose-500 text-white shadow"
                : "text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="text-center py-2">
        <div className="flex items-center justify-center gap-1">
          <span className="text-2xl font-semibold text-muted-foreground mt-1">P</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            autoFocus
            className="w-40 text-center text-4xl font-bold bg-transparent outline-none font-display text-foreground placeholder:text-muted-foreground/40"
          />
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2 px-1">Category</p>
        <div className="grid grid-cols-4 gap-2">
          {categories.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => setCategory(c.name)}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl border transition-all ${
                category === c.name
                  ? "border-primary bg-primary/5"
                  : "border-transparent bg-secondary/60"
              }`}
            >
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ backgroundColor: c.color + "22" }}
              >
                <CategoryIcon name={c.icon} className="w-4 h-4" style={{ color: c.color }} />
              </span>
              <span className="text-[10px] leading-tight text-center text-foreground/80">{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl" />
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note (optional)"
          rows={2}
          className="rounded-xl resize-none"
        />
      </div>

      <div className="flex gap-3 pt-1">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1 rounded-xl">
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={saving || !amount || !category}
          className="flex-1 rounded-xl bg-primary hover:bg-primary/90"
        >
          {saving ? "Saving..." : initial ? "Update" : "Add"}
        </Button>
      </div>
    </form>
  );
}

import React, { useState } from "react";
import { Check, AlertTriangle, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatPula } from "@/lib/finance";
import CategoryIcon from "@/components/CategoryIcon";

export default function BudgetRow({ meta, spent, budget, onSave, onRemove }) {
  const [editing, setEditing] = useState(!budget);
  const [value, setValue] = useState(budget?.monthly_limit?.toString() || "");
  const [saving, setSaving] = useState(false);

  const limit = budget?.monthly_limit || 0;
  const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
  const over = limit > 0 && spent > limit;
  const near = limit > 0 && pct >= 80 && !over;

  const barColor = over ? "#ef4444" : near ? "#f59e0b" : meta.color;

  const handleSave = async () => {
    const num = parseFloat(value);
    if (!num || num <= 0) return;
    setSaving(true);
    await onSave(num);
    setSaving(false);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="rounded-2xl bg-white p-4 border border-teal-900/5">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: meta.color + "22" }}>
            <CategoryIcon name={meta.icon} className="w-4 h-4" style={{ color: meta.color }} />
          </span>
          <span className="text-sm font-medium text-foreground flex-1">{meta.name}</span>
          <span className="text-xs text-muted-foreground">Spent {formatPula(spent, { decimals: 0 })}</span>
        </div>
        <div className="flex gap-2">
          <Input
            type="number"
            step="0.01"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Monthly limit (P)"
            className="rounded-xl"
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          <Button size="icon" onClick={handleSave} disabled={saving || !value} className="rounded-xl bg-primary hover:bg-primary/90 shrink-0">
            <Check className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-4 border border-teal-900/5">
      <div className="flex items-center gap-3 mb-2">
        <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: meta.color + "22" }}>
          <CategoryIcon name={meta.icon} className="w-4 h-4" style={{ color: meta.color }} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground truncate">{meta.name}</span>
            {over && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full">
                <AlertTriangle className="w-2.5 h-2.5" /> Over
              </span>
            )}
            {near && (
              <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                Near limit
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatPula(spent, { decimals: 0 })} of {formatPula(limit, { decimals: 0 })}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold" style={{ color: over ? "#ef4444" : near ? "#f59e0b" : "#0d9488" }}>
            {over ? `+${formatPula(spent - limit, { decimals: 0 })}` : formatPula(limit - spent, { decimals: 0 })}
          </p>
          <p className="text-[10px] text-muted-foreground">{over ? "over" : "left"}</p>
        </div>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: barColor }} />
      </div>
      <div className="flex justify-end gap-1 mt-2">
        <button onClick={() => setEditing(true)} className="text-[11px] text-primary font-medium px-2 py-1">Edit</button>
        <button onClick={onRemove} className="text-[11px] text-muted-foreground px-2 py-1 flex items-center gap-0.5">
          <X className="w-3 h-3" /> Remove
        </button>
      </div>
    </div>
  );
}

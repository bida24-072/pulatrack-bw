
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const COLORS = ["#0d9488", "#0ea5e9", "#8b5cf6", "#f59e0b", "#ec4899", "#ef4444"];

export default function GoalForm({ initial, onSubmit, onCancel }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [target, setTarget] = useState(initial?.target_amount?.toString() || "");
  const [saved, setSaved] = useState(initial?.saved_amount?.toString() || "0");
  const [targetDate, setTargetDate] = useState(initial?.target_date || "");
  const [color, setColor] = useState(initial?.color || COLORS[0]);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !target) return;
    setBusy(true);
    await onSubmit({
      title,
      target_amount: parseFloat(target),
      saved_amount: parseFloat(saved || "0"),
      target_date: targetDate || undefined,
      color,
    });
    setBusy(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Goal name</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. New laptop" className="rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Target (P)</Label>
          <Input type="number" step="0.01" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="5000" className="rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label>Saved (P)</Label>
          <Input type="number" step="0.01" value={saved} onChange={(e) => setSaved(e.target.value)} placeholder="0" className="rounded-xl" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Target date (optional)</Label>
        <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="rounded-xl" />
      </div>
      <div className="space-y-1.5">
        <Label>Color</Label>
        <div className="flex gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full transition-transform ${color === c ? "ring-2 ring-offset-2 ring-foreground scale-110" : ""}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1 rounded-xl">Cancel</Button>
        )}
        <Button type="submit" disabled={busy || !title || !target} className="flex-1 rounded-xl bg-primary hover:bg-primary/90">
          {busy ? "Saving..." : initial ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}

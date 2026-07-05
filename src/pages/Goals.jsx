import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format, parseISO } from "date-fns";
import { formatPula, categoryMeta } from "@/lib/finance";
import CategoryIcon from "@/components/CategoryIcon";
import TransactionForm from "@/components/transactions/TransactionForm";

const FILTERS = ["all", "income", "expense"];

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const load = async () => {
    const txs = await base44.entities.Transaction.list("-date");
    setTransactions(txs);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (data) => {
    if (editing) {
      await base44.entities.Transaction.update(editing.id, data);
    } else {
      await base44.entities.Transaction.create(data);
    }
    setOpen(false);
    setEditing(null);
    load();
  };

  const handleDelete = async () => {
    await base44.entities.Transaction.delete(deleteId);
    setDeleteId(null);
    load();
  };

  const filtered = transactions.filter((t) => {
    if (filter !== "all" && t.type !== filter) return false;
    if (search && !`${t.category} ${t.note || ""}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const grouped = filtered.reduce((acc, t) => {
    const key = t.date ? format(parseISO(t.date), "EEEE, d MMM yyyy") : "Undated";
    (acc[key] = acc[key] || []).push(t);
    return acc;
  }, {});

  return (
    <div className="px-5 pt-8">
      <h1 className="text-2xl font-bold font-display text-foreground mb-4">Activity</h1>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search transactions"
          className="pl-9 rounded-2xl bg-white"
        />
      </div>

      <div className="grid grid-cols-3 gap-2 p-1 bg-secondary rounded-2xl mb-5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
              filter === f ? "bg-white text-primary shadow-sm" : "text-muted-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-16 rounded-2xl bg-secondary/60 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-3xl bg-white border border-teal-900/5">
          <p className="text-sm text-muted-foreground">No transactions found.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([day, items]) => (
            <div key={day}>
              <p className="text-xs font-medium text-muted-foreground mb-2 px-1">{day}</p>
              <div className="space-y-2">
                {items.map((t) => {
                  const meta = categoryMeta(t.type, t.category);
                  return (
                    <div key={t.id} className="group flex items-center gap-3 rounded-2xl bg-white p-3 border border-teal-900/5">
                      <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: meta.color + "22" }}>
                        <CategoryIcon name={meta.icon} className="w-5 h-5" style={{ color: meta.color }} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{t.category}</p>
                        {t.note && <p className="text-xs text-muted-foreground truncate">{t.note}</p>}
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${t.type === "income" ? "text-emerald-600" : "text-foreground"}`}>
                          {t.type === "income" ? "+" : "-"}{formatPula(t.amount, { decimals: 0 })}
                        </p>
                        <div className="flex gap-2 justify-end mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditing(t); setOpen(true); }}>
                            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                          <button onClick={() => setDeleteId(t.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => { setEditing(null); setOpen(true); }}
        className="fixed bottom-24 right-1/2 translate-x-[172px] z-40 w-14 h-14 rounded-full bg-primary text-white shadow-[0_8px_24px_rgba(13,148,136,0.45)] flex items-center justify-center active:scale-95 transition-transform"
      >
        <Plus className="w-7 h-7" />
      </button>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit transaction" : "Add transaction"}</DialogTitle>
          </DialogHeader>
          <TransactionForm initial={editing} onSubmit={handleSubmit} onCancel={() => { setOpen(false); setEditing(null); }} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-rose-500 hover:bg-rose-600">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

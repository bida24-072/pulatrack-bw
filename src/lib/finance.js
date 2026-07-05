
// Shared finance helpers for PulaTrack

export const EXPENSE_CATEGORIES = [
  { name: "Groceries", icon: "ShoppingCart", color: "#0d9488" },
  { name: "Transport", icon: "Car", color: "#0ea5e9" },
  { name: "Rent", icon: "Home", color: "#8b5cf6" },
  { name: "Utilities", icon: "Zap", color: "#f59e0b" },
  { name: "Airtime & Data", icon: "Smartphone", color: "#ec4899" },
  { name: "Dining", icon: "Utensils", color: "#ef4444" },
  { name: "Healthcare", icon: "HeartPulse", color: "#14b8a6" },
  { name: "Education", icon: "GraduationCap", color: "#6366f1" },
  { name: "Entertainment", icon: "Music", color: "#f97316" },
  { name: "Family Support", icon: "Users", color: "#a855f7" },
  { name: "Other", icon: "MoreHorizontal", color: "#64748b" },
];

export const INCOME_CATEGORIES = [
  { name: "Salary", icon: "Briefcase", color: "#0d9488" },
  { name: "Business", icon: "Store", color: "#0ea5e9" },
  { name: "Freelance", icon: "Laptop", color: "#8b5cf6" },
  { name: "Gift", icon: "Gift", color: "#ec4899" },
  { name: "Investment", icon: "TrendingUp", color: "#f59e0b" },
  { name: "Other", icon: "MoreHorizontal", color: "#64748b" },
];

export function categoryMeta(type, name) {
  const list = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return list.find((c) => c.name === name) || { name: name || "Other", icon: "MoreHorizontal", color: "#64748b" };
}

export function formatPula(amount, { decimals = 2 } = {}) {
  const value = Number(amount || 0);
  return `P${value.toLocaleString("en-BW", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function sumBy(items, predicate) {
  return items.filter(predicate).reduce((acc, t) => acc + Number(t.amount || 0), 0);
}

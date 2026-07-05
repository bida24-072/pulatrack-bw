import React from "react";
import {
  ShoppingCart, Car, Home, Zap, Smartphone, Utensils, HeartPulse,
  GraduationCap, Music, Users, MoreHorizontal, Briefcase, Store,
  Laptop, Gift, TrendingUp,
} from "lucide-react";

const ICONS = {
  ShoppingCart, Car, Home, Zap, Smartphone, Utensils, HeartPulse,
  GraduationCap, Music, Users, MoreHorizontal, Briefcase, Store,
  Laptop, Gift, TrendingUp,
};

export default function CategoryIcon({ name, className, style }) {
  const Icon = ICONS[name] || MoreHorizontal;
  return <Icon className={className} style={style} />;
}

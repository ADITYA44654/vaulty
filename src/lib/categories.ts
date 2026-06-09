import {
  Globe, Smartphone, Mail, Flame, Crosshair, Instagram, Facebook, Youtube,
  MessageCircle, Sparkles, type LucideIcon,
} from "lucide-react";

export interface CategoryDef {
  id: string;
  label: string;
  icon: LucideIcon;
  gradient: string;
}

export const CATEGORIES: CategoryDef[] = [
  { id: "website",   label: "Website",         icon: Globe,         gradient: "from-violet-500 to-fuchsia-500" },
  { id: "app",       label: "App",             icon: Smartphone,    gradient: "from-sky-500 to-cyan-400" },
  { id: "google",    label: "Google",          icon: Mail,          gradient: "from-rose-500 to-amber-400" },
  { id: "freefire",  label: "Free Fire",       icon: Flame,         gradient: "from-orange-500 to-red-500" },
  { id: "pubg",      label: "PUBG / BGMI",     icon: Crosshair,     gradient: "from-yellow-500 to-orange-500" },
  { id: "instagram", label: "Instagram",       icon: Instagram,     gradient: "from-pink-500 to-purple-500" },
  { id: "facebook",  label: "Facebook",        icon: Facebook,      gradient: "from-blue-600 to-indigo-500" },
  { id: "youtube",   label: "YouTube",         icon: Youtube,       gradient: "from-red-600 to-rose-500" },
  { id: "discord",   label: "Discord",         icon: MessageCircle, gradient: "from-indigo-500 to-violet-500" },
  { id: "custom",    label: "Custom",          icon: Sparkles,      gradient: "from-emerald-500 to-teal-400" },
];

export function getCategory(id: string): CategoryDef {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}

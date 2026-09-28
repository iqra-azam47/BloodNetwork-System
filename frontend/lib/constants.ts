export const INPUT_CLASSES =
  "bg-white text-slate-900 border border-slate-300 placeholder-slate-400 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 rounded-xl px-4 py-2.5 outline-none transition-all w-full text-sm font-medium";

export const SELECT_CLASSES =
  "bg-white text-slate-900 border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 rounded-xl px-4 py-2.5 outline-none transition-all w-full text-sm font-medium cursor-pointer";

export const TEXTAREA_CLASSES =
  "bg-white text-slate-900 border border-slate-300 placeholder-slate-400 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 rounded-xl p-4 outline-none transition-all w-full text-sm font-medium resize-y";

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export const ROLE_NAMES: Record<number, string> = {
  0: "Blood Donor",
  1: "Hospital Facility",
  2: "Regional Blood Bank",
  3: "Platform Administrator",
};

export const URGENCY_LABELS: Record<number, { label: string; color: string; badge: string }> = {
  0: { label: "Critical", color: "text-rose-600", badge: "bg-rose-100 text-rose-700 border-rose-200" },
  1: { label: "Urgent", color: "text-amber-600", badge: "bg-amber-100 text-amber-700 border-amber-200" },
  2: { label: "Standard", color: "text-emerald-600", badge: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};

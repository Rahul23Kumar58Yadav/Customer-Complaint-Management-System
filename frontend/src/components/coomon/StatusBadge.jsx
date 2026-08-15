const COLORS = {
  gray: "bg-gray-100 text-gray-700 border-gray-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  yellow: "bg-amber-50 text-amber-700 border-amber-200",
  orange: "bg-orange-50 text-orange-700 border-orange-200",
  red: "bg-red-50 text-red-700 border-red-200",
  purple: "bg-purple-50 text-purple-700 border-purple-200",
};

const SIZES = {
  sm: "text-[10px] px-1.5 py-0.5",
  md: "text-xs px-2.5 py-1",
};

export default function StatusBadge({ children, color = "gray", size = "md", dot = false, className = "" }) {
  return (
    <span
  className={`inline-flex items-center gap-1.5 font-semibold border rounded-full
    ${COLORS[color] || COLORS.gray} ${SIZES[size] || SIZES.md} ${className}`}
>
  {dot && <span className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_0_3px_currentColor,0_0_0_3px] shadow-current/10" />}
  {children}
</span>
  );
}
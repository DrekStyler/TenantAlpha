type BadgeVariant = "default" | "success" | "warning" | "error" | "gold";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    default: "bg-navy-100 text-navy-700 ring-1 ring-inset ring-navy-200",
    success: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
    warning: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
    error: "bg-red-50 text-red-600 ring-1 ring-inset ring-red-200",
    gold: "bg-gold-400/15 text-gold-600 ring-1 ring-inset ring-gold-300/40",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

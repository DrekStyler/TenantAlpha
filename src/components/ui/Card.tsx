interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({ children, className = "", padding = "md" }: CardProps) {
  const paddings = { none: "", sm: "p-5 sm:p-6", md: "p-6 sm:p-8", lg: "p-8 sm:p-10" };
  return (
    <div
      className={`rounded-xl border border-navy-100 bg-white shadow-sm ${paddings[padding]} ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-navy-900">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-sm text-navy-500">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

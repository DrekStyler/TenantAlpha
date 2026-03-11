export function ROIHighlightCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-navy-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-navy-900">{value}</p>
      <p className="mt-0.5 text-xs text-navy-400">{description}</p>
    </div>
  );
}

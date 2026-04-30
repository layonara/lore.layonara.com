// Common section frame for the detail page. Keeps headers consistent and
// gives every panel the same parchment-toned card treatment.

import { cn } from "@/lib/cn";

export function Section({
  title,
  subtitle,
  children,
  className,
  bodyClassName,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  action?: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-forge-border bg-forge-surface/60 backdrop-blur-sm",
        className,
      )}
    >
      <header className="flex items-baseline justify-between gap-3 border-b border-forge-border/60 px-5 py-3.5">
        <div className="min-w-0">
          <h2 className="font-heading text-lg text-forge-text">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-forge-text-secondary">{subtitle}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </header>
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

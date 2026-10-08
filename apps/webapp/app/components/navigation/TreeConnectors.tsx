import { cn } from "~/utils/cn";

// Connectors fill the 32px row while retaining the sidebar's 18px icon column.
// Keeping the vertical line inside the viewBox lets adjacent rows meet without scaled gaps.
export function TreeConnectorBranch({ className }: { className?: string }) {
  return (
    <svg className={cn(className, "h-8 w-4.5 text-border-bright")} viewBox="0 0 18 32" fill="none">
      <line x1="9" y1="0" x2="9" y2="32" stroke="currentColor" strokeWidth="1" />
      <line x1="9" y1="16" x2="18" y2="16" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export function TreeConnectorEnd({ className }: { className?: string }) {
  return (
    <svg className={cn(className, "h-8 w-4.5 text-border-bright")} viewBox="0 0 18 32" fill="none">
      <line x1="9" y1="0" x2="9" y2="16" stroke="currentColor" strokeWidth="1" />
      <line x1="9" y1="16" x2="18" y2="16" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

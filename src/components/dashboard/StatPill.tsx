import type { LucideIcon } from 'lucide-react';

// Compact Stat Pill component for mobile
export function StatPill({ icon: Icon, value, label }: { icon: LucideIcon; value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 p-2 bg-card rounded-lg border border-border">
      <Icon className="w-4 h-4 text-primary" />
      <span className="text-lg font-bold leading-tight">{value}</span>
      <span className="text-[10px] text-muted-foreground leading-tight">{label}</span>
    </div>
  );
}

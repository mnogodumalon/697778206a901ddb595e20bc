import type { GewohnheitenVerwaltung } from '@/types/app';
import { formatTimeInvested } from './utils';
import { getYear } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Timer } from 'lucide-react';

// Time Invested Bar Component - Shows time with animated progress bar
function TimeInvestedBar({
  habitName,
  minutes,
  maxMinutes,
  color,
}: {
  habitName: string;
  minutes: number;
  maxMinutes: number;
  color: string;
}) {
  const { display } = formatTimeInvested(minutes);
  const percentage = maxMinutes > 0 ? Math.min((minutes / maxMinutes) * 100, 100) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium truncate flex-1 mr-2">{habitName}</span>
        <span className="text-primary font-semibold tabular-nums">{display}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Mobile Time Invested Row
function MobileTimeRow({
  habitName,
  minutes,
  maxMinutes,
}: {
  habitName: string;
  minutes: number;
  maxMinutes: number;
}) {
  const { shortDisplay } = formatTimeInvested(minutes);
  const percentage = maxMinutes > 0 ? Math.min((minutes / maxMinutes) * 100, 100) : 0;

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{habitName}</p>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary transition-all duration-700"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      <span className="text-xs font-semibold text-primary tabular-nums w-12 text-right">{shortDisplay}</span>
    </div>
  );
}

// Time Invested Section for Desktop
export function TimeInvestedSection({
  habits,
  timePerHabit,
}: {
  habits: GewohnheitenVerwaltung[];
  timePerHabit: Map<string, number>;
}) {
  // Sort habits by time invested (descending)
  const sortedHabits = [...habits].sort((a, b) => {
    const timeA = timePerHabit.get(a.record_id) || 0;
    const timeB = timePerHabit.get(b.record_id) || 0;
    return timeB - timeA;
  });

  // Find max time for scaling the bars
  const maxTime = Math.max(...Array.from(timePerHabit.values()), 1);

  // Total time
  const totalMinutes = Array.from(timePerHabit.values()).reduce((sum, t) => sum + t, 0);
  const { display: totalDisplay } = formatTimeInvested(totalMinutes);

  // Color palette for bars
  const colors = [
    'bg-gradient-to-r from-emerald-500 to-emerald-400',
    'bg-gradient-to-r from-cyan-500 to-cyan-400',
    'bg-gradient-to-r from-violet-500 to-violet-400',
    'bg-gradient-to-r from-amber-500 to-amber-400',
    'bg-gradient-to-r from-rose-500 to-rose-400',
    'bg-gradient-to-r from-blue-500 to-blue-400',
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Timer className="w-5 h-5 text-primary" />
            Investierte Zeit
          </CardTitle>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{totalDisplay}</p>
            <p className="text-xs text-muted-foreground">Gesamt {getYear(new Date())}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedHabits.map((habit, index) => (
          <TimeInvestedBar
            key={habit.record_id}
            habitName={habit.fields.gewohnheit_name || 'Unbenannt'}
            minutes={timePerHabit.get(habit.record_id) || 0}
            maxMinutes={maxTime}
            color={colors[index % colors.length]}
          />
        ))}
      </CardContent>
    </Card>
  );
}

// Compact Time Invested Card for Mobile
export function MobileTimeCard({
  habits,
  timePerHabit,
}: {
  habits: GewohnheitenVerwaltung[];
  timePerHabit: Map<string, number>;
}) {
  const sortedHabits = [...habits].sort((a, b) => {
    const timeA = timePerHabit.get(a.record_id) || 0;
    const timeB = timePerHabit.get(b.record_id) || 0;
    return timeB - timeA;
  });

  const maxTime = Math.max(...Array.from(timePerHabit.values()), 1);
  const totalMinutes = Array.from(timePerHabit.values()).reduce((sum, t) => sum + t, 0);
  const { display: totalDisplay } = formatTimeInvested(totalMinutes);

  return (
    <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/20">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Timer className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Investierte Zeit</p>
              <p className="text-lg font-bold text-primary">{totalDisplay}</p>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {sortedHabits.slice(0, 4).map((habit) => (
            <MobileTimeRow
              key={habit.record_id}
              habitName={habit.fields.gewohnheit_name || 'Unbenannt'}
              minutes={timePerHabit.get(habit.record_id) || 0}
              maxMinutes={maxTime}
            />
          ))}
          {sortedHabits.length > 4 && (
            <p className="text-xs text-muted-foreground text-center pt-1">
              +{sortedHabits.length - 4} weitere
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

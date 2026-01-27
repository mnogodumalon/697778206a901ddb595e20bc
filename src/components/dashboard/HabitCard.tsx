import type { GewohnheitenVerwaltung, TaeglicheEintraege } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import { getTodayDate, calculateStreak } from './utils';
import { getDayOfYear } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Flame, TrendingUp } from 'lucide-react';

// Compact Habit Row for mobile
export function HabitRow({
  habit,
  entries,
  onToggleToday,
}: {
  habit: GewohnheitenVerwaltung;
  entries: TaeglicheEintraege[];
  onToggleToday: (habitId: string, currentStatus: boolean, entryId?: string) => void;
}) {
  const todayStr = getTodayDate();

  const todayEntry = entries.find(entry => {
    const habitId = extractRecordId(entry.fields.gewohnheit);
    const entryDate = entry.fields.datum?.split('T')[0];
    return habitId === habit.record_id && entryDate === todayStr && entry.fields.ausgefuehrt;
  });
  const isCompletedToday = !!todayEntry;

  // Calculate streak for this habit
  const habitStreak = calculateStreak(entries.filter(entry => {
    const habitId = extractRecordId(entry.fields.gewohnheit);
    return habitId === habit.record_id;
  }));

  return (
    <div
      className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
      onClick={() => onToggleToday(habit.record_id, isCompletedToday, todayEntry?.record_id)}
    >
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
          isCompletedToday
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        <Check className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm truncate">{habit.fields.gewohnheit_name}</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Flame className="w-3 h-3" />
          <span>{habitStreak} Tage</span>
        </div>
      </div>
    </div>
  );
}

// Desktop Habit Card
export function HabitCard({
  habit,
  entries,
  onToggleToday,
}: {
  habit: GewohnheitenVerwaltung;
  entries: TaeglicheEintraege[];
  onToggleToday: (habitId: string, currentStatus: boolean, entryId?: string) => void;
}) {
  const todayStr = getTodayDate();

  const todayEntry = entries.find(entry => {
    const habitId = extractRecordId(entry.fields.gewohnheit);
    const entryDate = entry.fields.datum?.split('T')[0];
    return habitId === habit.record_id && entryDate === todayStr && entry.fields.ausgefuehrt;
  });
  const isCompletedToday = !!todayEntry;

  const habitEntries = entries.filter(entry => {
    const habitId = extractRecordId(entry.fields.gewohnheit);
    return habitId === habit.record_id && entry.fields.ausgefuehrt;
  });
  const uniqueDays = new Set(habitEntries.map(e => e.fields.datum?.split('T')[0])).size;
  const daysSinceStart = getDayOfYear(new Date());
  const consistencyRate = Math.round((uniqueDays / daysSinceStart) * 100);

  const habitStreak = calculateStreak(entries.filter(entry => {
    const habitId = extractRecordId(entry.fields.gewohnheit);
    return habitId === habit.record_id;
  }));

  return (
    <Card
      className="hover:border-primary/50 transition-colors cursor-pointer"
      onClick={() => onToggleToday(habit.record_id, isCompletedToday, todayEntry?.record_id)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1 min-w-0 pr-3">
            <h3 className="font-medium truncate">{habit.fields.gewohnheit_name}</h3>
            {habit.fields.beschreibung && (
              <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                {habit.fields.beschreibung}
              </p>
            )}
          </div>
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              isCompletedToday
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            <Check className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <TrendingUp className="w-4 h-4" />
            <span>{consistencyRate}%</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Flame className="w-4 h-4" />
            <span>{habitStreak} Tage</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

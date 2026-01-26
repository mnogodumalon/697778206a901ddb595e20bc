import { useState, useEffect, useMemo } from 'react';
import type { GewohnheitenVerwaltung, TaeglicheEintraege } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { format, parseISO, addDays, startOfYear, endOfYear, getDayOfYear, getYear, differenceInDays, eachDayOfInterval, isBefore, isAfter, isToday as isDateToday } from 'date-fns';
import { de } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Flame, Plus, Settings, Check, AlertCircle, RefreshCw, TrendingUp, Target, Award, Quote, Clock, Timer } from 'lucide-react';

// Get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

// Format minutes to hours and minutes in a beautiful way
function formatTimeInvested(minutes: number): { hours: number; mins: number; display: string; shortDisplay: string } {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return { hours, mins, display: `${mins} Minuten`, shortDisplay: `${mins}m` };
  } else if (mins === 0) {
    return { hours, mins, display: `${hours} ${hours === 1 ? 'Stunde' : 'Stunden'}`, shortDisplay: `${hours}h` };
  } else {
    return { hours, mins, display: `${hours}h ${mins}m`, shortDisplay: `${hours}h ${mins}m` };
  }
}

// Calculate time invested per habit
function calculateTimePerHabit(entries: TaeglicheEintraege[], habits: GewohnheitenVerwaltung[]): Map<string, number> {
  const timeMap = new Map<string, number>();

  // Initialize all habits with 0
  habits.forEach(habit => {
    timeMap.set(habit.record_id, 0);
  });

  // Sum up time for each habit
  entries.forEach(entry => {
    if (entry.fields.ausgefuehrt && entry.fields.investierte_zeit_minuten) {
      const habitId = extractRecordId(entry.fields.gewohnheit);
      if (habitId) {
        const current = timeMap.get(habitId) || 0;
        timeMap.set(habitId, current + entry.fields.investierte_zeit_minuten);
      }
    }
  });

  return timeMap;
}

// Calculate streak (consecutive days with at least one completed habit)
function calculateStreak(entries: TaeglicheEintraege[]): number {
  const completedDates = new Set<string>();
  entries.forEach(entry => {
    if (entry.fields.ausgefuehrt && entry.fields.datum) {
      completedDates.add(entry.fields.datum.split('T')[0]);
    }
  });

  let streak = 0;
  let currentDate = new Date();

  const todayStr = format(currentDate, 'yyyy-MM-dd');
  if (!completedDates.has(todayStr)) {
    currentDate = addDays(currentDate, -1);
  }

  while (true) {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    if (completedDates.has(dateStr)) {
      streak++;
      currentDate = addDays(currentDate, -1);
    } else {
      break;
    }
  }

  return streak;
}

// Calculate longest streak ever
function calculateLongestStreak(entries: TaeglicheEintraege[]): number {
  const completedDates = new Set<string>();
  entries.forEach(entry => {
    if (entry.fields.ausgefuehrt && entry.fields.datum) {
      completedDates.add(entry.fields.datum.split('T')[0]);
    }
  });

  if (completedDates.size === 0) return 0;

  const sortedDates = Array.from(completedDates).sort();
  let longestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = parseISO(sortedDates[i - 1]);
    const currDate = parseISO(sortedDates[i]);
    const diff = differenceInDays(currDate, prevDate);

    if (diff === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return longestStreak;
}

// Calculate FULL year overview data (including future days)
function getFullYearData(entries: TaeglicheEintraege[], habits: GewohnheitenVerwaltung[]): Array<{ date: string; completion: number; count: number; isFuture: boolean; isToday: boolean }> {
  const today = new Date();
  const yearStart = startOfYear(today);
  const yearEnd = endOfYear(today);
  const totalHabits = habits.length || 1;

  // Create map of completions per day
  const completionMap = new Map<string, number>();
  entries.forEach(entry => {
    if (entry.fields.ausgefuehrt && entry.fields.datum) {
      const dateStr = entry.fields.datum.split('T')[0];
      completionMap.set(dateStr, (completionMap.get(dateStr) || 0) + 1);
    }
  });

  // Generate data for ENTIRE year
  const days = eachDayOfInterval({ start: yearStart, end: yearEnd });
  return days.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const count = completionMap.get(dateStr) || 0;
    const completion = Math.min(Math.round((count / totalHabits) * 100), 100);
    const isFuture = isAfter(date, today);
    const isToday = isDateToday(date);
    return { date: dateStr, completion, count, isFuture, isToday };
  });
}

// Calculate overall consistency (days with at least one habit completed / total days)
function calculateConsistency(entries: TaeglicheEintraege[]): { rate: number; activeDays: number; totalDays: number } {
  const completedDates = new Set<string>();
  entries.forEach(entry => {
    if (entry.fields.ausgefuehrt && entry.fields.datum) {
      completedDates.add(entry.fields.datum.split('T')[0]);
    }
  });

  const totalDays = getDayOfYear(new Date());
  const activeDays = completedDates.size;
  const rate = Math.round((activeDays / totalDays) * 100);

  return { rate, activeDays, totalDays };
}

// Loading state component
function LoadingState() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-40 w-full mb-4 rounded-lg" />
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Error state component
function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Fehler beim Laden</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-4">{error.message}</p>
          <Button variant="outline" onClick={onRetry} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Erneut versuchen
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}

// Empty state component
function EmptyState({ onAddHabit }: { onAddHabit: () => void }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-accent flex items-center justify-center">
          <Check className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Keine Gewohnheiten</h2>
        <p className="text-muted-foreground mb-6">
          Starte mit dem Tracken deiner ersten Gewohnheit.
        </p>
        <Button onClick={onAddHabit} className="gap-2">
          <Plus className="h-4 w-4" />
          Erste Gewohnheit hinzufügen
        </Button>
      </div>
    </div>
  );
}

// Helper to get color for completion
function getCompletionColor(day: { completion: number; isFuture: boolean } | null) {
  if (!day) return 'bg-transparent';
  if (day.isFuture) return 'bg-muted/30';
  if (day.completion === 0) return 'bg-muted';
  if (day.completion < 25) return 'bg-primary/20';
  if (day.completion < 50) return 'bg-primary/40';
  if (day.completion < 75) return 'bg-primary/60';
  if (day.completion < 100) return 'bg-primary/80';
  return 'bg-primary';
}

// Desktop Year Grid - proper GitHub-style with month labels
function DesktopYearGrid({ data, habits }: { data: Array<{ date: string; completion: number; count: number; isFuture: boolean; isToday: boolean }>; habits: GewohnheitenVerwaltung[] }) {
  // Group by weeks
  const weeks: Array<{ days: Array<typeof data[0] | null>; firstDayMonth: number }> = [];
  let currentWeek: Array<typeof data[0] | null> = [];

  // Pad the beginning
  const firstDay = data[0] ? parseISO(data[0].date) : new Date();
  const firstDayOfWeek = firstDay.getDay();
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push(null);
  }

  data.forEach((day) => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      // Find first non-null day to determine month
      const firstNonNull = currentWeek.find(d => d !== null);
      const monthNum = firstNonNull ? parseISO(firstNonNull.date).getMonth() : 0;
      weeks.push({ days: currentWeek, firstDayMonth: monthNum });
      currentWeek = [];
    }
  });

  // Pad the last week
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    const firstNonNull = currentWeek.find(d => d !== null);
    const monthNum = firstNonNull ? parseISO(firstNonNull.date).getMonth() : 11;
    weeks.push({ days: currentWeek, firstDayMonth: monthNum });
  }

  // Calculate month label positions
  const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  const monthPositions: Array<{ month: string; startWeek: number }> = [];
  let lastMonth = -1;
  weeks.forEach((week, idx) => {
    if (week.firstDayMonth !== lastMonth) {
      monthPositions.push({ month: months[week.firstDayMonth], startWeek: idx });
      lastMonth = week.firstDayMonth;
    }
  });

  const cellSize = 11;
  const gap = 2;
  const totalWidth = weeks.length * (cellSize + gap);

  return (
    <div className="w-full">
      {/* Month labels */}
      <div className="relative h-4 mb-1 ml-5" style={{ width: totalWidth }}>
        {monthPositions.map((pos, idx) => (
          <span
            key={pos.month + idx}
            className="absolute text-[10px] text-muted-foreground"
            style={{ left: pos.startWeek * (cellSize + gap) }}
          >
            {pos.month}
          </span>
        ))}
      </div>
      <div className="flex gap-[2px]">
        {/* Day labels */}
        <div className="flex flex-col gap-[2px] text-[9px] text-muted-foreground pr-0.5 w-4">
          <span style={{ height: cellSize }}></span>
          <span style={{ height: cellSize }} className="flex items-center">M</span>
          <span style={{ height: cellSize }}></span>
          <span style={{ height: cellSize }} className="flex items-center">M</span>
          <span style={{ height: cellSize }}></span>
          <span style={{ height: cellSize }} className="flex items-center">F</span>
          <span style={{ height: cellSize }}></span>
        </div>
        {/* Grid */}
        <div className="flex gap-[2px]">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[2px]">
              {week.days.map((day, dayIndex) => (
                <TooltipProvider key={dayIndex} delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        style={{ width: cellSize, height: cellSize }}
                        className={`rounded-[2px] transition-colors ${getCompletionColor(day)} ${
                          day?.isToday ? 'ring-1 ring-primary ring-offset-1 ring-offset-background' : ''
                        }`}
                      />
                    </TooltipTrigger>
                    {day && (
                      <TooltipContent side="top" className="text-xs">
                        <p className="font-medium">{format(parseISO(day.date), 'd. MMMM', { locale: de })}</p>
                        {day.isFuture ? (
                          <p className="text-muted-foreground">Zukünftig</p>
                        ) : (
                          <p className="text-muted-foreground">{day.count}/{habits.length} ({day.completion}%)</p>
                        )}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Mobile Year Grid - 12 month blocks in a grid layout (no scrolling!)
function MobileYearGrid({ data, habits }: { data: Array<{ date: string; completion: number; count: number; isFuture: boolean; isToday: boolean }>; habits: GewohnheitenVerwaltung[] }) {
  // Group data by month
  const monthsData: Array<Array<typeof data[0]>> = Array.from({ length: 12 }, () => []);
  data.forEach(day => {
    const month = parseISO(day.date).getMonth();
    monthsData[month].push(day);
  });

  const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

  return (
    <div className="grid grid-cols-4 gap-2">
      {monthsData.map((days, monthIndex) => (
        <div key={monthIndex} className="bg-muted/20 rounded-md p-1.5">
          <p className="text-[9px] text-muted-foreground mb-1 font-medium">{monthNames[monthIndex]}</p>
          <div className="grid grid-cols-7 gap-[1px]">
            {/* Pad beginning of month to correct weekday */}
            {days[0] && Array.from({ length: parseISO(days[0].date).getDay() }, (_, i) => (
              <div key={`pad-${i}`} className="w-2 h-2" />
            ))}
            {days.map((day, dayIndex) => (
              <TooltipProvider key={dayIndex} delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={`w-2 h-2 rounded-[1px] ${getCompletionColor(day)} ${
                        day.isToday ? 'ring-1 ring-primary' : ''
                      }`}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <p className="font-medium">{format(parseISO(day.date), 'd. MMM', { locale: de })}</p>
                    {day.isFuture ? (
                      <p className="text-muted-foreground">Zukünftig</p>
                    ) : (
                      <p className="text-muted-foreground">{day.count}/{habits.length}</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Compact Stat Pill component for mobile
function StatPill({ icon: Icon, value, label }: { icon: typeof Flame; value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 p-2 bg-card rounded-lg border border-border">
      <Icon className="w-4 h-4 text-primary" />
      <span className="text-lg font-bold leading-tight">{value}</span>
      <span className="text-[10px] text-muted-foreground leading-tight">{label}</span>
    </div>
  );
}

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
  const { display, shortDisplay } = formatTimeInvested(minutes);
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
function TimeInvestedSection({
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
function MobileTimeCard({
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

// Add Entry Dialog component
function AddEntryDialog({
  habits,
  open,
  onOpenChange,
  onSuccess,
}: {
  habits: GewohnheitenVerwaltung[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [selectedHabit, setSelectedHabit] = useState<string>('');
  const [completed, setCompleted] = useState(true);
  const [timeSpent, setTimeSpent] = useState<string>('30');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHabit) return;

    setSubmitting(true);
    try {
      await LivingAppsService.createTaeglicheEintraegeEntry({
        datum: getTodayDate(),
        gewohnheit: createRecordUrl(APP_IDS.GEWOHNHEITEN_VERWALTUNG, selectedHabit),
        ausgefuehrt: completed,
        investierte_zeit_minuten: parseInt(timeSpent) || 0,
      });

      setSelectedHabit('');
      setCompleted(true);
      setTimeSpent('30');
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      console.error('Failed to create entry:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Eintrag hinzufügen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="habit">Gewohnheit</Label>
            <Select value={selectedHabit} onValueChange={setSelectedHabit}>
              <SelectTrigger id="habit">
                <SelectValue placeholder="Wähle eine Gewohnheit..." />
              </SelectTrigger>
              <SelectContent>
                {habits.map(habit => (
                  <SelectItem key={habit.record_id} value={habit.record_id}>
                    {habit.fields.gewohnheit_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Investierte Zeit (Minuten)</Label>
            <div className="flex gap-2">
              {[15, 30, 45, 60].map(time => (
                <Button
                  key={time}
                  type="button"
                  variant={timeSpent === String(time) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeSpent(String(time))}
                >
                  {time}
                </Button>
              ))}
            </div>
            <Input
              id="time"
              type="number"
              min="0"
              value={timeSpent}
              onChange={e => setTimeSpent(e.target.value)}
              placeholder="Minuten"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="completed"
              checked={completed}
              onCheckedChange={(checked) => setCompleted(checked === true)}
            />
            <Label htmlFor="completed" className="cursor-pointer">
              Gewohnheit heute ausgeführt
            </Label>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Abbrechen
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!selectedHabit || submitting}>
              {submitting ? 'Speichern...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Compact Habit Row for mobile
function HabitRow({
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
function HabitCard({
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

// Main Dashboard component
export default function Dashboard() {
  const [habits, setHabits] = useState<GewohnheitenVerwaltung[]>([]);
  const [entries, setEntries] = useState<TaeglicheEintraege[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [habitsData, entriesData] = await Promise.all([
        LivingAppsService.getGewohnheitenVerwaltung(),
        LivingAppsService.getTaeglicheEintraege(),
      ]);
      setHabits(habitsData);
      setEntries(entriesData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unbekannter Fehler'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const todayStr = getTodayDate();

  // Calculate consistency metrics
  const consistency = useMemo(() => calculateConsistency(entries), [entries]);
  const currentStreak = useMemo(() => calculateStreak(entries), [entries]);
  const longestStreak = useMemo(() => calculateLongestStreak(entries), [entries]);
  const fullYearData = useMemo(() => getFullYearData(entries, habits), [entries, habits]);

  // Total completions this year
  const totalCompletions = useMemo(() => {
    return entries.filter(e => e.fields.ausgefuehrt).length;
  }, [entries]);

  // Time invested per habit
  const timePerHabit = useMemo(() => calculateTimePerHabit(entries, habits), [entries, habits]);

  // Handle toggling habit completion for today
  const handleToggleToday = async (habitId: string, isCurrentlyCompleted: boolean, entryId?: string) => {
    try {
      if (isCurrentlyCompleted && entryId) {
        await LivingAppsService.deleteTaeglicheEintraegeEntry(entryId);
      } else {
        await LivingAppsService.createTaeglicheEintraegeEntry({
          datum: todayStr,
          gewohnheit: createRecordUrl(APP_IDS.GEWOHNHEITEN_VERWALTUNG, habitId),
          ausgefuehrt: true,
          investierte_zeit_minuten: 0,
        });
      }
      fetchData();
    } catch (err) {
      console.error('Failed to toggle habit:', err);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={fetchData} />;
  if (habits.length === 0) return <EmptyState onAddHabit={() => setDialogOpen(true)} />;

  return (
    <div className="min-h-screen bg-background">
      {/* ===== MOBILE LAYOUT ===== */}
      <div className="md:hidden">
        {/* Compact Header */}
        <header className="flex items-center justify-between px-4 py-3 sticky top-0 bg-background/95 backdrop-blur z-10 border-b border-border">
          <h1 className="text-lg font-semibold">{getYear(new Date())}</h1>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </header>

        <div className="px-4 py-3 space-y-4">
          {/* Seneca Quote - Compact, elegant one-liner with icon */}
          <div className="flex items-start gap-2 text-muted-foreground">
            <Quote className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary/60" />
            <p className="text-xs italic leading-relaxed">
              „Es ist nicht wenig Zeit, die wir haben, sondern es ist viel Zeit, die wir nicht nutzen." <span className="text-primary/60">— Seneca</span>
            </p>
          </div>

          {/* Year Grid - HERO element on mobile - special 12-month grid view */}
          <Card className="bg-card/50">
            <CardContent className="p-3">
              <MobileYearGrid data={fullYearData} habits={habits} />
            </CardContent>
          </Card>

          {/* Compact Stats Row */}
          <div className="grid grid-cols-4 gap-2">
            <StatPill icon={TrendingUp} value={`${consistency.rate}%`} label="Konsistenz" />
            <StatPill icon={Flame} value={currentStreak} label="Serie" />
            <StatPill icon={Award} value={longestStreak} label="Rekord" />
            <StatPill icon={Target} value={totalCompletions} label="Gesamt" />
          </div>

          {/* Time Invested Card - Mobile */}
          <MobileTimeCard habits={habits} timePerHabit={timePerHabit} />

          {/* Habits List */}
          <div className="space-y-2 pb-20">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Heute</h2>
            {habits.map(habit => (
              <HabitRow
                key={habit.record_id}
                habit={habit}
                entries={entries}
                onToggleToday={handleToggleToday}
              />
            ))}
          </div>
        </div>

        {/* Fixed Bottom Action Button */}
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-background/95 backdrop-blur border-t border-border">
          <Button
            className="w-full h-11 text-sm gap-2"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Eintrag hinzufügen
          </Button>
        </div>
      </div>

      {/* ===== DESKTOP LAYOUT ===== */}
      <div className="hidden md:block">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Header */}
          <header className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Gewohnheitstracker</h1>
              <p className="text-muted-foreground mt-1 flex items-center gap-2">
                <Quote className="w-4 h-4" />
                <span className="italic">„Es ist nicht wenig Zeit, die wir haben, sondern es ist viel Zeit, die wir nicht nutzen."</span>
                <span className="text-primary">— Seneca</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button className="gap-2" onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4" />
                Eintrag hinzufügen
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </header>

          {/* Year Overview Card */}
          <Card className="mb-8">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Jahresübersicht {getYear(new Date())}</CardTitle>
            </CardHeader>
            <CardContent>
              <DesktopYearGrid data={fullYearData} habits={habits} />
              {/* Legend */}
              <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground justify-end">
                <span>Weniger</span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-sm bg-muted" />
                  <div className="w-3 h-3 rounded-sm bg-primary/20" />
                  <div className="w-3 h-3 rounded-sm bg-primary/40" />
                  <div className="w-3 h-3 rounded-sm bg-primary/60" />
                  <div className="w-3 h-3 rounded-sm bg-primary/80" />
                  <div className="w-3 h-3 rounded-sm bg-primary" />
                </div>
                <span>Mehr</span>
                <span className="border-l border-border pl-3">Zukünftig</span>
                <div className="w-3 h-3 rounded-sm bg-muted/30" />
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Konsistenz</p>
                  <p className="text-xl font-bold">{consistency.rate}%</p>
                  <p className="text-xs text-muted-foreground">{consistency.activeDays}/{consistency.totalDays} Tage</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Aktuelle Serie</p>
                  <p className="text-xl font-bold">{currentStreak} Tage</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Award className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Längste Serie</p>
                  <p className="text-xl font-bold">{longestStreak} Tage</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Abgeschlossen</p>
                  <p className="text-xl font-bold">{totalCompletions}</p>
                  <p className="text-xs text-muted-foreground">dieses Jahr</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Time Invested Section - Desktop */}
          <div className="mb-8">
            <TimeInvestedSection habits={habits} timePerHabit={timePerHabit} />
          </div>

          {/* Habits Grid */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Deine Gewohnheiten</h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {habits.map(habit => (
                <HabitCard
                  key={habit.record_id}
                  habit={habit}
                  entries={entries}
                  onToggleToday={handleToggleToday}
                />
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Add Entry Dialog */}
      <AddEntryDialog
        habits={habits}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchData}
      />
    </div>
  );
}

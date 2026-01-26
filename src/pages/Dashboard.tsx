import { useState, useEffect, useMemo } from 'react';
import type { GewohnheitenVerwaltung, TaeglicheEintraege } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { format, parseISO, startOfWeek, addDays, startOfYear, getDayOfYear, getYear, differenceInDays, eachDayOfInterval, subDays } from 'date-fns';
import { de } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar, Flame, Plus, Settings, Check, AlertCircle, RefreshCw, TrendingUp, Target, Award } from 'lucide-react';

// Get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  return format(new Date(), 'yyyy-MM-dd');
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

// Calculate year overview data (GitHub-style contribution grid)
function getYearData(entries: TaeglicheEintraege[], habits: GewohnheitenVerwaltung[]): Array<{ date: string; completion: number; count: number }> {
  const today = new Date();
  const yearStart = startOfYear(today);
  const totalHabits = habits.length || 1;

  // Create map of completions per day
  const completionMap = new Map<string, number>();
  entries.forEach(entry => {
    if (entry.fields.ausgefuehrt && entry.fields.datum) {
      const dateStr = entry.fields.datum.split('T')[0];
      completionMap.set(dateStr, (completionMap.get(dateStr) || 0) + 1);
    }
  });

  // Generate data for each day of the year up to today
  const days = eachDayOfInterval({ start: yearStart, end: today });
  return days.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const count = completionMap.get(dateStr) || 0;
    const completion = Math.min(Math.round((count / totalHabits) * 100), 100);
    return { date: dateStr, completion, count };
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

  const today = new Date();
  const yearStart = startOfYear(today);
  const totalDays = getDayOfYear(today);
  const activeDays = completedDates.size;
  const rate = Math.round((activeDays / totalDays) * 100);

  return { rate, activeDays, totalDays };
}

// Loading state component
function LoadingState() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Skeleton className="h-24 w-full mb-8 rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-48 w-full rounded-lg mb-8" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
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
          Starte mit dem Tracken deiner ersten Gewohnheit und baue positive Routinen auf.
        </p>
        <Button onClick={onAddHabit} className="gap-2">
          <Plus className="h-4 w-4" />
          Erste Gewohnheit hinzufügen
        </Button>
      </div>
    </div>
  );
}

// Year Grid Component (GitHub-style contribution graph)
function YearGrid({ data, habits }: { data: Array<{ date: string; completion: number; count: number }>; habits: GewohnheitenVerwaltung[] }) {
  // Group by weeks for the grid
  const weeks: Array<Array<{ date: string; completion: number; count: number } | null>> = [];
  let currentWeek: Array<{ date: string; completion: number; count: number } | null> = [];

  // Pad the beginning of the year to align with weekdays
  const firstDay = data[0] ? parseISO(data[0].date) : new Date();
  const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push(null);
  }

  data.forEach((day) => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  // Pad the last week
  while (currentWeek.length > 0 && currentWeek.length < 7) {
    currentWeek.push(null);
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const getColor = (completion: number) => {
    if (completion === 0) return 'bg-muted';
    if (completion < 25) return 'bg-primary/20';
    if (completion < 50) return 'bg-primary/40';
    if (completion < 75) return 'bg-primary/60';
    if (completion < 100) return 'bg-primary/80';
    return 'bg-primary';
  };

  const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  const today = new Date();
  const currentMonth = today.getMonth();

  return (
    <div className="overflow-x-auto pb-2">
      {/* Month labels */}
      <div className="flex mb-1 text-xs text-muted-foreground">
        <div className="w-6" /> {/* Spacer for day labels */}
        {months.slice(0, currentMonth + 1).map((month) => (
          <div key={month} className="flex-1 min-w-0 text-center">{month}</div>
        ))}
      </div>
      <div className="flex gap-0.5">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 text-xs text-muted-foreground pr-1">
          <span className="h-3 leading-3"></span>
          <span className="h-3 leading-3">Mo</span>
          <span className="h-3 leading-3"></span>
          <span className="h-3 leading-3">Mi</span>
          <span className="h-3 leading-3"></span>
          <span className="h-3 leading-3">Fr</span>
          <span className="h-3 leading-3"></span>
        </div>
        {/* Grid */}
        <div className="flex gap-0.5">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-0.5">
              {week.map((day, dayIndex) => (
                <TooltipProvider key={dayIndex} delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={`w-3 h-3 rounded-sm transition-colors ${
                          day ? getColor(day.completion) : 'bg-transparent'
                        }`}
                      />
                    </TooltipTrigger>
                    {day && (
                      <TooltipContent side="top" className="text-xs">
                        <p className="font-medium">{format(parseISO(day.date), 'd. MMMM yyyy', { locale: de })}</p>
                        <p className="text-muted-foreground">{day.count} von {habits.length} erledigt ({day.completion}%)</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          ))}
        </div>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground justify-end">
        <span>Weniger</span>
        <div className="flex gap-0.5">
          <div className="w-3 h-3 rounded-sm bg-muted" />
          <div className="w-3 h-3 rounded-sm bg-primary/20" />
          <div className="w-3 h-3 rounded-sm bg-primary/40" />
          <div className="w-3 h-3 rounded-sm bg-primary/60" />
          <div className="w-3 h-3 rounded-sm bg-primary/80" />
          <div className="w-3 h-3 rounded-sm bg-primary" />
        </div>
        <span>Mehr</span>
      </div>
    </div>
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

// Habit Card component
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

  // Check if completed today
  const todayEntry = entries.find(entry => {
    const habitId = extractRecordId(entry.fields.gewohnheit);
    const entryDate = entry.fields.datum?.split('T')[0];
    return habitId === habit.record_id && entryDate === todayStr && entry.fields.ausgefuehrt;
  });
  const isCompletedToday = !!todayEntry;

  // Calculate overall consistency for this habit
  const habitEntries = entries.filter(entry => {
    const habitId = extractRecordId(entry.fields.gewohnheit);
    return habitId === habit.record_id && entry.fields.ausgefuehrt;
  });
  const uniqueDays = new Set(habitEntries.map(e => e.fields.datum?.split('T')[0])).size;
  const daysSinceStart = getDayOfYear(new Date());
  const consistencyRate = Math.round((uniqueDays / daysSinceStart) * 100);

  // Calculate streak for this habit
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

// Stat Card component
function StatCard({ icon: Icon, label, value, subtext }: { icon: typeof Flame; label: string; value: string | number; subtext?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-semibold">{value}</p>
            {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
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
  const yearData = useMemo(() => getYearData(entries, habits), [entries, habits]);

  // Total completions this year
  const totalCompletions = useMemo(() => {
    return entries.filter(e => e.fields.ausgefuehrt).length;
  }, [entries]);

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
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        {/* Header with Seneca Quote */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl md:text-3xl font-semibold">Gewohnheitstracker</h1>
            <div className="flex items-center gap-2">
              <Button className="gap-2" onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Eintrag hinzufügen</span>
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Seneca Quote */}
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-6">
              <blockquote className="text-lg md:text-xl italic text-foreground/90 leading-relaxed">
                „Es ist nicht wenig Zeit, die wir haben, sondern es ist viel Zeit, die wir nicht nutzen."
              </blockquote>
              <p className="text-sm text-muted-foreground mt-3">― Seneca</p>
            </CardContent>
          </Card>
        </header>

        {/* Consistency Stats */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Deine Konsistenz {getYear(new Date())}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <StatCard
              icon={TrendingUp}
              label="Konsistenz"
              value={`${consistency.rate}%`}
              subtext={`${consistency.activeDays} von ${consistency.totalDays} Tagen`}
            />
            <StatCard
              icon={Flame}
              label="Aktuelle Serie"
              value={`${currentStreak} Tage`}
            />
            <StatCard
              icon={Award}
              label="Längste Serie"
              value={`${longestStreak} Tage`}
            />
            <StatCard
              icon={Target}
              label="Abgeschlossen"
              value={totalCompletions}
              subtext="Gewohnheiten dieses Jahr"
            />
          </div>
        </section>

        {/* Year Overview */}
        <section className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Jahresübersicht {getYear(new Date())}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <YearGrid data={yearData} habits={habits} />
            </CardContent>
          </Card>
        </section>

        {/* Habits Grid */}
        <section className="pb-24 md:pb-8">
          <h2 className="text-lg font-semibold mb-4">Deine Gewohnheiten</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
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

        {/* Mobile Fixed Bottom Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border md:hidden">
          <Button
            className="w-full h-12 text-base gap-2"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="w-5 h-5" />
            Eintrag hinzufügen
          </Button>
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

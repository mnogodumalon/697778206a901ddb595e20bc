import { useState, useEffect, useMemo } from 'react';
import type { GewohnheitenVerwaltung, TaeglicheEintraege } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { format, parseISO, formatDistance, startOfWeek, addDays, isToday, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, Flame, Plus, Settings, Check, AlertCircle, RefreshCw } from 'lucide-react';

// Helper function to format time duration
function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} Min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

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

  // Check if today has entries, if not start from yesterday
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

// Get week data for chart
function getWeekData(entries: TaeglicheEintraege[], habits: GewohnheitenVerwaltung[]): Array<{ day: string; dayFull: string; completion: number; date: string }> {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Start on Monday
  const totalHabits = habits.length || 1; // Avoid division by zero

  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const dateStr = format(date, 'yyyy-MM-dd');

    const completedToday = entries.filter(entry => {
      const entryDate = entry.fields.datum?.split('T')[0];
      return entryDate === dateStr && entry.fields.ausgefuehrt;
    }).length;

    const completion = Math.round((completedToday / totalHabits) * 100);

    return {
      day: format(date, 'EEEEEE', { locale: de }), // Short day name
      dayFull: format(date, 'EEEE', { locale: de }), // Full day name
      completion: Math.min(completion, 100),
      date: dateStr,
    };
  });
}

// Loading state component
function LoadingState() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>

      {/* Hero skeleton */}
      <div className="flex flex-col items-center mb-8">
        <Skeleton className="h-48 w-48 rounded-full mb-4" />
        <Skeleton className="h-6 w-32" />
      </div>

      {/* Stats skeleton */}
      <div className="flex gap-4 justify-center mb-8">
        <Skeleton className="h-10 w-32 rounded-full" />
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>

      {/* Chart skeleton */}
      <Skeleton className="h-48 w-full rounded-lg mb-8" />

      {/* List skeleton */}
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
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

// Circular progress ring component
function CircularProgress({ percentage, size = 200 }: { percentage: number; size?: number }) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          style={{
            filter: percentage === 100 ? 'drop-shadow(0 0 8px hsl(152 35% 45% / 0.5))' : 'none',
          }}
        />
      </svg>
      {/* Inner content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-light text-foreground">{percentage}%</span>
        <span className="text-sm text-muted-foreground">Heute erledigt</span>
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

// Habit Card component for the list
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

  // Calculate weekly completion
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEntries = entries.filter(entry => {
    const habitId = extractRecordId(entry.fields.gewohnheit);
    if (habitId !== habit.record_id) return false;
    const entryDate = entry.fields.datum ? parseISO(entry.fields.datum.split('T')[0]) : null;
    if (!entryDate) return false;
    return entryDate >= weekStart && entry.fields.ausgefuehrt;
  });
  const weeklyCompletion = Math.round((weekEntries.length / 7) * 100);

  return (
    <div
      className="p-4 bg-card rounded-lg border border-border hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onToggleToday(habit.record_id, isCompletedToday, todayEntry?.record_id)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground truncate">{habit.fields.gewohnheit_name}</h3>
          <p className="text-sm text-muted-foreground">
            Ziel: {habit.fields.zielzeit_minuten || 0} Min/Tag
          </p>
        </div>
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            isCompletedToday
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          <Check className="w-5 h-5" />
        </div>
      </div>
      <Progress value={weeklyCompletion} className="h-2" />
      <p className="text-xs text-muted-foreground mt-1">{weeklyCompletion}% diese Woche</p>
    </div>
  );
}

// Recent Entry Item (for desktop)
function RecentEntryItem({
  entry,
  habitName,
}: {
  entry: TaeglicheEintraege;
  habitName: string;
}) {
  const timeAgo = entry.createdat
    ? formatDistance(parseISO(entry.createdat), new Date(), { addSuffix: true, locale: de })
    : '';

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-0 hover:bg-accent/50 transition-colors px-2 -mx-2 rounded">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
        entry.fields.ausgefuehrt ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
      }`}>
        <Check className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{habitName}</p>
        <p className="text-xs text-muted-foreground">{timeAgo}</p>
      </div>
      {entry.fields.investierte_zeit_minuten && (
        <Badge variant="secondary" className="text-xs">
          {entry.fields.investierte_zeit_minuten} Min
        </Badge>
      )}
    </div>
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

  // Create habit lookup map
  const habitMap = useMemo(() => {
    const map = new Map<string, GewohnheitenVerwaltung>();
    habits.forEach(habit => map.set(habit.record_id, habit));
    return map;
  }, [habits]);

  // Calculate KPIs
  const todayStr = getTodayDate();

  const todayEntries = useMemo(() => {
    return entries.filter(entry => entry.fields.datum?.split('T')[0] === todayStr);
  }, [entries, todayStr]);

  const completedToday = useMemo(() => {
    const completedHabitIds = new Set<string>();
    todayEntries.forEach(entry => {
      if (entry.fields.ausgefuehrt) {
        const habitId = extractRecordId(entry.fields.gewohnheit);
        if (habitId) completedHabitIds.add(habitId);
      }
    });
    return completedHabitIds.size;
  }, [todayEntries]);

  const completionPercentage = habits.length > 0
    ? Math.round((completedToday / habits.length) * 100)
    : 0;

  const timeToday = useMemo(() => {
    return todayEntries.reduce((sum, entry) => sum + (entry.fields.investierte_zeit_minuten || 0), 0);
  }, [todayEntries]);

  const streak = useMemo(() => calculateStreak(entries), [entries]);

  const weekData = useMemo(() => getWeekData(entries, habits), [entries, habits]);

  const recentEntries = useMemo(() => {
    return [...entries]
      .sort((a, b) => new Date(b.createdat).getTime() - new Date(a.createdat).getTime())
      .slice(0, 8);
  }, [entries]);

  // Handle toggling habit completion for today
  const handleToggleToday = async (habitId: string, isCurrentlyCompleted: boolean, entryId?: string) => {
    try {
      if (isCurrentlyCompleted && entryId) {
        // Mark as not completed (delete the entry)
        await LivingAppsService.deleteTaeglicheEintraegeEntry(entryId);
      } else {
        // Create new entry marking as completed
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

  const formattedDate = format(new Date(), 'EEEE, d. MMMM', { locale: de });

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-4 h-14 border-b border-border sticky top-0 bg-background z-10">
          <h1 className="text-lg font-semibold">Gewohnheitstracker</h1>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </header>

        {/* Hero Section */}
        <div className="flex flex-col items-center py-8 px-4">
          <CircularProgress percentage={completionPercentage} size={200} />
          <p className="mt-4 text-base font-medium capitalize">{formattedDate}</p>
        </div>

        {/* Quick Stats Row */}
        <div className="flex gap-3 justify-center px-4 mb-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-accent rounded-full">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{formatMinutes(timeToday)} heute</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-accent rounded-full">
            <Flame className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{streak} Tage Streak</span>
          </div>
        </div>

        {/* Weekly Chart Card */}
        <div className="px-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Diese Woche</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekData}>
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-md">
                              <p className="text-sm font-medium">{payload[0].payload.dayFull}</p>
                              <p className="text-sm text-muted-foreground">{payload[0].value}% erledigt</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="completion"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Habits List */}
        <div className="px-4 pb-24">
          <h2 className="text-base font-semibold mb-3">Deine Gewohnheiten</h2>
          <div className="space-y-2">
            {habits.map(habit => (
              <HabitCard
                key={habit.record_id}
                habit={habit}
                entries={entries}
                onToggleToday={handleToggleToday}
              />
            ))}
          </div>
        </div>

        {/* Fixed Bottom Action Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
          <Button
            className="w-full h-12 text-base gap-2"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="w-5 h-5" />
            Eintrag hinzufügen
          </Button>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block">
        {/* Header */}
        <header className="flex items-center justify-between px-8 h-[72px] border-b border-border sticky top-0 bg-background z-10">
          <h1 className="text-2xl font-semibold">Gewohnheitstracker</h1>
          <div className="flex items-center gap-3">
            <Button className="gap-2" onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4" />
              Eintrag hinzufügen
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Main Content - 3 Column Layout */}
        <div className="flex h-[calc(100vh-72px)]">
          {/* Left Column - Hero & Stats (280px) */}
          <aside className="w-[280px] p-6 border-r border-border overflow-y-auto">
            <div className="flex flex-col items-center">
              <CircularProgress percentage={completionPercentage} size={180} />
              <p className="mt-4 text-base font-medium capitalize">{formattedDate}</p>
            </div>

            <div className="mt-6 space-y-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Zeit heute</p>
                      <p className="text-xl font-semibold">{formatMinutes(timeToday)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                      <Flame className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Aktuelle Serie</p>
                      <p className="text-xl font-semibold">{streak} Tage</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Center Column - Chart & Habits Grid (flex-1) */}
          <main className="flex-1 p-6 overflow-y-auto">
            {/* Chart Card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Wochenübersicht</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weekData}>
                      <defs>
                        <linearGradient id="colorCompletion" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="dayFull"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-md">
                                <p className="text-sm font-medium">{payload[0].payload.dayFull}</p>
                                <p className="text-sm text-muted-foreground">{payload[0].value}% erledigt</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="completion"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#colorCompletion)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Habits Grid */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Deine Gewohnheiten</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {habits.map(habit => {
                  const todayEntry = entries.find(entry => {
                    const habitId = extractRecordId(entry.fields.gewohnheit);
                    const entryDate = entry.fields.datum?.split('T')[0];
                    return habitId === habit.record_id && entryDate === todayStr && entry.fields.ausgefuehrt;
                  });
                  const isCompletedToday = !!todayEntry;

                  // Weekly completion dots
                  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
                  const weekDots = Array.from({ length: 7 }, (_, i) => {
                    const date = addDays(weekStart, i);
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const hasEntry = entries.some(entry => {
                      const entryHabitId = extractRecordId(entry.fields.gewohnheit);
                      const entryDate = entry.fields.datum?.split('T')[0];
                      return entryHabitId === habit.record_id && entryDate === dateStr && entry.fields.ausgefuehrt;
                    });
                    return { date: dateStr, completed: hasEntry, isToday: dateStr === todayStr };
                  });

                  const weeklyCompletion = Math.round((weekDots.filter(d => d.completed).length / 7) * 100);

                  return (
                    <Card
                      key={habit.record_id}
                      className="hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                      onClick={() => handleToggleToday(habit.record_id, isCompletedToday, todayEntry?.record_id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0 pr-3">
                            <h3 className="font-medium truncate">{habit.fields.gewohnheit_name}</h3>
                            {habit.fields.beschreibung && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {habit.fields.beschreibung}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              Ziel: {habit.fields.zielzeit_minuten || 0} Min/Tag
                            </p>
                          </div>
                          {/* Mini progress ring */}
                          <div className="relative w-12 h-12 flex-shrink-0">
                            <svg width={48} height={48} className="transform -rotate-90">
                              <circle
                                cx={24}
                                cy={24}
                                r={20}
                                fill="none"
                                stroke="hsl(var(--muted))"
                                strokeWidth={4}
                              />
                              <circle
                                cx={24}
                                cy={24}
                                r={20}
                                fill="none"
                                stroke="hsl(var(--primary))"
                                strokeWidth={4}
                                strokeLinecap="round"
                                strokeDasharray={125.6}
                                strokeDashoffset={125.6 - (weeklyCompletion / 100) * 125.6}
                                className="transition-all duration-500"
                              />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                              {weeklyCompletion}%
                            </span>
                          </div>
                        </div>
                        {/* Week dots */}
                        <div className="flex gap-1.5 justify-center">
                          {weekDots.map((dot, i) => (
                            <div
                              key={i}
                              className={`w-4 h-4 rounded-full transition-colors ${
                                dot.completed
                                  ? 'bg-primary'
                                  : dot.isToday
                                  ? 'bg-accent border-2 border-primary'
                                  : 'bg-muted'
                              }`}
                            />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </main>

          {/* Right Column - Recent Entries (320px) */}
          <aside className="w-[320px] p-6 border-l border-border overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Letzte Einträge</h2>
            <div>
              {recentEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Noch keine Einträge vorhanden
                </p>
              ) : (
                recentEntries.map(entry => {
                  const habitId = extractRecordId(entry.fields.gewohnheit);
                  const habit = habitId ? habitMap.get(habitId) : null;
                  return (
                    <RecentEntryItem
                      key={entry.record_id}
                      entry={entry}
                      habitName={habit?.fields.gewohnheit_name || 'Unbekannt'}
                    />
                  );
                })
              )}
            </div>
          </aside>
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

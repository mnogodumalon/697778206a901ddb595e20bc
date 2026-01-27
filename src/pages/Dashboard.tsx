import { useState, useEffect, useMemo } from 'react';
import type { GewohnheitenVerwaltung, TaeglicheEintraege } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, createRecordUrl } from '@/services/livingAppsService';
import { getYear } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Flame, Plus, Settings, TrendingUp, Target, Award, Quote } from 'lucide-react';

// Import all dashboard components
import {
  getTodayDate,
  calculateTimePerHabit,
  calculateStreak,
  calculateLongestStreak,
  getFullYearData,
  calculateConsistency,
  DesktopYearGrid,
  MobileYearGrid,
  StatPill,
  TimeInvestedSection,
  MobileTimeCard,
  HabitCard,
  HabitRow,
  AddEntryDialog,
  LoadingState,
  ErrorState,
  EmptyState,
} from '@/components/dashboard';

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

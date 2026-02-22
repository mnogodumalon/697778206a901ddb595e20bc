import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichTaeglicheEintraege } from '@/lib/enrich';
import { LivingAppsService, createRecordUrl, extractRecordId } from '@/services/livingAppsService';
import { APP_IDS } from '@/types/app';
import type { GewohnheitenVerwaltung, TaeglicheEintraege } from '@/types/app';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertCircle, CheckCircle2, Circle, Plus, Pencil, Trash2, Clock, Target, TrendingUp, Flame, ChevronRight
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { format, subDays, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const TODAY = format(new Date(), 'yyyy-MM-dd');

// --- Types ---
interface HabitForm {
  gewohnheit_name: string;
  beschreibung: string;
  zielzeit_minuten: string;
}

// --- Main Dashboard ---
export default function DashboardOverview() {
  const {
    gewohnheitenVerwaltung, taeglicheEintraege,
    gewohnheitenVerwaltungMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const enrichedEintraege = enrichTaeglicheEintraege(taeglicheEintraege, { gewohnheitenVerwaltungMap });

  // Dialog state
  const [habitDialogOpen, setHabitDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<GewohnheitenVerwaltung | null>(null);
  const [deleteHabitId, setDeleteHabitId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [habitForm, setHabitForm] = useState<HabitForm>({ gewohnheit_name: '', beschreibung: '', zielzeit_minuten: '' });

  // Today's entries per habit
  const todayEntriesMap = useMemo(() => {
    const m = new Map<string, TaeglicheEintraege>();
    taeglicheEintraege.forEach(e => {
      if (e.fields.datum === TODAY) {
        const hId = extractRecordId(e.fields.gewohnheit);
        if (hId) m.set(hId, e);
      }
    });
    return m;
  }, [taeglicheEintraege]);

  // Stats
  const totalHabits = gewohnheitenVerwaltung.length;
  const doneTodayCount = useMemo(() => {
    let count = 0;
    todayEntriesMap.forEach(e => { if (e.fields.ausgefuehrt) count++; });
    return count;
  }, [todayEntriesMap]);

  const totalMinutesToday = useMemo(() => {
    let sum = 0;
    todayEntriesMap.forEach(e => { sum += e.fields.investierte_zeit_minuten ?? 0; });
    return sum;
  }, [todayEntriesMap]);

  // Streak: days in a row with at least 1 habit done
  const streak = useMemo(() => {
    let count = 0;
    for (let i = 0; i < 30; i++) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const hasAny = taeglicheEintraege.some(e => e.fields.datum === d && e.fields.ausgefuehrt);
      if (hasAny) count++;
      else if (i > 0) break; // only break if not today (today might not be done yet)
    }
    return count;
  }, [taeglicheEintraege]);

  // Last 7 days chart data
  const weekData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
      const label = format(subDays(new Date(), 6 - i), 'EEE', { locale: de });
      const done = taeglicheEintraege.filter(e => e.fields.datum === d && e.fields.ausgefuehrt).length;
      const total = gewohnheitenVerwaltung.length;
      return { day: label, done, total, date: d };
    });
  }, [taeglicheEintraege, gewohnheitenVerwaltung]);

  // Toggle habit done for today
  const handleToggleHabit = async (habit: GewohnheitenVerwaltung) => {
    const existing = todayEntriesMap.get(habit.record_id);
    setSaving(true);
    try {
      if (existing) {
        const newVal = !existing.fields.ausgefuehrt;
        await LivingAppsService.updateTaeglicheEintraegeEntry(existing.record_id, {
          ausgefuehrt: newVal,
        });
      } else {
        await LivingAppsService.createTaeglicheEintraegeEntry({
          datum: TODAY,
          gewohnheit: createRecordUrl(APP_IDS.GEWOHNHEITEN_VERWALTUNG, habit.record_id),
          ausgefuehrt: true,
          investierte_zeit_minuten: habit.fields.zielzeit_minuten ?? 0,
        });
      }
      fetchAll();
    } finally {
      setSaving(false);
    }
  };

  // Update invested time
  const handleTimeUpdate = async (habit: GewohnheitenVerwaltung, minutes: number) => {
    const existing = todayEntriesMap.get(habit.record_id);
    try {
      if (existing) {
        await LivingAppsService.updateTaeglicheEintraegeEntry(existing.record_id, {
          investierte_zeit_minuten: minutes,
        });
      } else {
        await LivingAppsService.createTaeglicheEintraegeEntry({
          datum: TODAY,
          gewohnheit: createRecordUrl(APP_IDS.GEWOHNHEITEN_VERWALTUNG, habit.record_id),
          ausgefuehrt: false,
          investierte_zeit_minuten: minutes,
        });
      }
      fetchAll();
    } catch {}
  };

  // Habit CRUD
  const openCreateHabit = () => {
    setEditingHabit(null);
    setHabitForm({ gewohnheit_name: '', beschreibung: '', zielzeit_minuten: '' });
    setHabitDialogOpen(true);
  };

  const openEditHabit = (h: GewohnheitenVerwaltung) => {
    setEditingHabit(h);
    setHabitForm({
      gewohnheit_name: h.fields.gewohnheit_name ?? '',
      beschreibung: h.fields.beschreibung ?? '',
      zielzeit_minuten: String(h.fields.zielzeit_minuten ?? ''),
    });
    setHabitDialogOpen(true);
  };

  const handleSaveHabit = async () => {
    setSaving(true);
    try {
      const fields = {
        gewohnheit_name: habitForm.gewohnheit_name,
        beschreibung: habitForm.beschreibung || undefined,
        zielzeit_minuten: habitForm.zielzeit_minuten ? Number(habitForm.zielzeit_minuten) : undefined,
      };
      if (editingHabit) {
        await LivingAppsService.updateGewohnheitenVerwaltungEntry(editingHabit.record_id, fields);
      } else {
        await LivingAppsService.createGewohnheitenVerwaltungEntry(fields);
      }
      fetchAll();
      setHabitDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHabit = async () => {
    if (!deleteHabitId) return;
    setSaving(true);
    try {
      await LivingAppsService.deleteGewohnheitenVerwaltungEntry(deleteHabitId);
      fetchAll();
      setDeleteHabitId(null);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  const completionPct = totalHabits > 0 ? Math.round((doneTodayCount / totalHabits) * 100) : 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {format(new Date(), 'EEEE, d. MMMM', { locale: de })}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {doneTodayCount === 0
              ? 'Leg los — deine Gewohnheiten warten!'
              : doneTodayCount === totalHabits
              ? 'Alle Gewohnheiten erledigt! 🎉'
              : `${doneTodayCount} von ${totalHabits} erledigt`}
          </p>
        </div>
        <Button onClick={openCreateHabit} size="sm" className="gap-2">
          <Plus size={14} />
          Neue Gewohnheit
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target size={13} className="text-primary" />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Heute</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{doneTodayCount}<span className="text-sm font-normal text-muted-foreground">/{totalHabits}</span></div>
          <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>

        <div className="bg-card border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Flame size={13} className="text-orange-500" />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Serie</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{streak}<span className="text-sm font-normal text-muted-foreground"> Tage</span></div>
          <p className="text-xs text-muted-foreground mt-1">aktuelle Streak</p>
        </div>

        <div className="bg-card border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Clock size={13} className="text-emerald-500" />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Zeit heute</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{totalMinutesToday}<span className="text-sm font-normal text-muted-foreground"> min</span></div>
          <p className="text-xs text-muted-foreground mt-1">investiert</p>
        </div>

        <div className="bg-card border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <TrendingUp size={13} className="text-violet-500" />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fortschritt</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{completionPct}<span className="text-sm font-normal text-muted-foreground">%</span></div>
          <p className="text-xs text-muted-foreground mt-1">heute erledigt</p>
        </div>
      </div>

      {/* Main Layout: habit board + chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Habit Checklist — hero */}
        <div className="lg:col-span-2 bg-card border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-foreground text-base">Heutige Gewohnheiten</h2>
            <Badge variant="secondary" className="text-xs">{doneTodayCount}/{totalHabits}</Badge>
          </div>

          {gewohnheitenVerwaltung.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                <Target size={20} className="text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">Noch keine Gewohnheiten</p>
              <p className="text-sm text-muted-foreground max-w-xs">Erstelle deine erste Gewohnheit und starte deinen Tracker.</p>
              <Button size="sm" variant="outline" onClick={openCreateHabit} className="gap-2 mt-1">
                <Plus size={13} />
                Gewohnheit erstellen
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {gewohnheitenVerwaltung.map(habit => {
                const entry = todayEntriesMap.get(habit.record_id);
                const done = entry?.fields.ausgefuehrt ?? false;
                const investedMin = entry?.fields.investierte_zeit_minuten ?? 0;
                const goalMin = habit.fields.zielzeit_minuten ?? 0;
                const progress = goalMin > 0 ? Math.min(100, Math.round((investedMin / goalMin) * 100)) : null;

                return (
                  <li key={habit.record_id} className={`group flex items-center gap-4 px-5 py-4 transition-colors ${done ? 'bg-primary/5' : 'hover:bg-muted/30'}`}>
                    {/* Check button */}
                    <button
                      onClick={() => handleToggleHabit(habit)}
                      disabled={saving}
                      className="shrink-0 transition-transform active:scale-90"
                      aria-label={done ? 'Als unerledigt markieren' : 'Als erledigt markieren'}
                    >
                      {done
                        ? <CheckCircle2 size={26} className="text-primary" />
                        : <Circle size={26} className="text-muted-foreground/50 hover:text-primary/60 transition-colors" />
                      }
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium text-sm ${done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {habit.fields.gewohnheit_name ?? '—'}
                        </span>
                        {done && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Erledigt</Badge>}
                      </div>
                      {habit.fields.beschreibung && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{habit.fields.beschreibung}</p>
                      )}
                      {/* Time progress bar */}
                      {goalMin > 0 && (
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${done ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                              style={{ width: `${progress ?? 0}%` }}
                            />
                          </div>
                          <TimeInput
                            value={investedMin}
                            goal={goalMin}
                            onChange={m => handleTimeUpdate(habit, m)}
                          />
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => openEditHabit(habit)}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Bearbeiten"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteHabitId(habit.record_id)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        aria-label="Löschen"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-4">
          {/* 7-day bar chart */}
          <div className="bg-card border rounded-2xl p-5">
            <h3 className="font-semibold text-sm text-foreground mb-4">Letzte 7 Tage</h3>
            {gewohnheitenVerwaltung.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-xs text-muted-foreground">Keine Daten</div>
            ) : (
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={weekData} barSize={18}>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <YAxis hide domain={[0, Math.max(totalHabits, 1)]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => [`${v} erledigt`, '']}
                    labelFormatter={(l) => l}
                    cursor={{ fill: 'var(--muted)', radius: 4 }}
                  />
                  <Bar dataKey="done" radius={[4, 4, 0, 0]}>
                    {weekData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.date === TODAY ? 'var(--primary)' : entry.done > 0 ? 'var(--primary)' : 'var(--muted)'}
                        opacity={entry.date === TODAY ? 1 : entry.done > 0 ? 0.5 : 0.25}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Habit details / goal overview */}
          {gewohnheitenVerwaltung.length > 0 && (
            <div className="bg-card border rounded-2xl p-5">
              <h3 className="font-semibold text-sm text-foreground mb-3">Zielzeiten</h3>
              <div className="space-y-3">
                {gewohnheitenVerwaltung.slice(0, 5).map(habit => {
                  const entry = todayEntriesMap.get(habit.record_id);
                  const invested = entry?.fields.investierte_zeit_minuten ?? 0;
                  const goal = habit.fields.zielzeit_minuten ?? 0;
                  const pct = goal > 0 ? Math.min(100, Math.round((invested / goal) * 100)) : 0;
                  const done = entry?.fields.ausgefuehrt ?? false;
                  return (
                    <div key={habit.record_id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-medium truncate max-w-[120px] ${done ? 'text-primary' : 'text-foreground'}`}>
                          {habit.fields.gewohnheit_name ?? '—'}
                        </span>
                        {goal > 0 ? (
                          <span className="text-muted-foreground shrink-0">{invested}/{goal} min</span>
                        ) : (
                          <span className="text-muted-foreground shrink-0">kein Ziel</span>
                        )}
                      </div>
                      {goal > 0 && (
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${done ? 'bg-primary' : 'bg-primary/40'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
                {gewohnheitenVerwaltung.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    +{gewohnheitenVerwaltung.length - 5} weitere
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Habit Create/Edit Dialog */}
      <Dialog open={habitDialogOpen} onOpenChange={setHabitDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingHabit ? 'Gewohnheit bearbeiten' : 'Neue Gewohnheit'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="habit-name">Name der Gewohnheit *</Label>
              <Input
                id="habit-name"
                placeholder="z. B. Morgenmeditation"
                value={habitForm.gewohnheit_name}
                onChange={e => setHabitForm(f => ({ ...f, gewohnheit_name: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="habit-desc">Beschreibung</Label>
              <Textarea
                id="habit-desc"
                placeholder="Worum geht es bei dieser Gewohnheit?"
                rows={2}
                value={habitForm.beschreibung}
                onChange={e => setHabitForm(f => ({ ...f, beschreibung: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="habit-time">Zielzeit pro Tag (Minuten)</Label>
              <Input
                id="habit-time"
                type="number"
                min={1}
                placeholder="z. B. 30"
                value={habitForm.zielzeit_minuten}
                onChange={e => setHabitForm(f => ({ ...f, zielzeit_minuten: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHabitDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSaveHabit} disabled={saving || !habitForm.gewohnheit_name.trim()}>
              {saving ? 'Speichern...' : editingHabit ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteHabitId} onOpenChange={v => !v && setDeleteHabitId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Gewohnheit löschen?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Diese Aktion kann nicht rückgängig gemacht werden.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteHabitId(null)}>Abbrechen</Button>
            <Button variant="destructive" onClick={handleDeleteHabit} disabled={saving}>
              {saving ? 'Löschen...' : 'Löschen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Inline time input component
function TimeInput({ value, goal, onChange }: { value: number; goal: number; onChange: (m: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [temp, setTemp] = useState(String(value));

  const commit = () => {
    const parsed = parseInt(temp, 10);
    if (!isNaN(parsed) && parsed >= 0) onChange(parsed);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        className="w-14 text-xs border rounded px-1 py-0.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        type="number"
        min={0}
        value={temp}
        onChange={e => setTemp(e.target.value)}
        onBlur={commit}
        onKeyDown={e => e.key === 'Enter' && commit()}
        autoFocus
      />
    );
  }

  return (
    <button
      className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0 tabular-nums"
      onClick={() => { setTemp(String(value)); setEditing(true); }}
    >
      {value}/{goal} min
    </button>
  );
}

// --- Skeleton & Error ---
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <AlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">{error.message}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>Erneut versuchen</Button>
    </div>
  );
}

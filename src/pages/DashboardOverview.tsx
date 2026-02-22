import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichTaeglicheEintraege } from '@/lib/enrich';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { APP_IDS } from '@/types/app';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle2, Circle, Clock, Plus, Flame, Target, TrendingUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, parseISO, subDays, isToday } from 'date-fns';
import { de } from 'date-fns/locale';

const TODAY = format(new Date(), 'yyyy-MM-dd');

export default function DashboardOverview() {
  const {
    gewohnheitenVerwaltung,
    taeglicheEintraege,
    gewohnheitenVerwaltungMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const enrichedEintraege = enrichTaeglicheEintraege(taeglicheEintraege, { gewohnheitenVerwaltungMap });

  const [saving, setSaving] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  // Today's entries per habit
  const todayEntriesMap = useMemo(() => {
    const m = new Map<string, typeof enrichedEintraege[0]>();
    enrichedEintraege.forEach(e => {
      if (e.fields.datum === TODAY) {
        const id = extractRecordId(e.fields.gewohnheit);
        if (id) m.set(id, e);
      }
    });
    return m;
  }, [enrichedEintraege]);

  // Stats
  const totalHabits = gewohnheitenVerwaltung.length;
  const completedToday = Array.from(todayEntriesMap.values()).filter(e => e.fields.ausgefuehrt).length;
  const progressPct = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

  // Streak per habit: consecutive days done
  const streakMap = useMemo(() => {
    const m = new Map<string, number>();
    gewohnheitenVerwaltung.forEach(h => {
      let streak = 0;
      let d = new Date();
      while (true) {
        const dateStr = format(d, 'yyyy-MM-dd');
        const entry = enrichedEintraege.find(e => {
          const eid = extractRecordId(e.fields.gewohnheit);
          return eid === h.record_id && e.fields.datum === dateStr && e.fields.ausgefuehrt;
        });
        if (entry) { streak++; d = subDays(d, 1); }
        else break;
      }
      m.set(h.record_id, streak);
    });
    return m;
  }, [gewohnheitenVerwaltung, enrichedEintraege]);

  // Last 7 days chart data
  const weekData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const done = enrichedEintraege.filter(e => e.fields.datum === dateStr && e.fields.ausgefuehrt).length;
      return {
        day: format(d, 'EEE', { locale: de }),
        done,
        isToday: dateStr === TODAY,
      };
    });
  }, [enrichedEintraege]);

  const totalMinutesToday = Array.from(todayEntriesMap.values())
    .reduce((sum, e) => sum + (e.fields.investierte_zeit_minuten ?? 0), 0);

  const handleToggle = async (habitId: string) => {
    setSaving(habitId);
    try {
      const existing = todayEntriesMap.get(habitId);
      if (existing) {
        await LivingAppsService.updateTaeglicheEintraegeEntry(existing.record_id, {
          ausgefuehrt: !existing.fields.ausgefuehrt,
        });
      } else {
        await LivingAppsService.createTaeglicheEintraegeEntry({
          datum: TODAY,
          gewohnheit: createRecordUrl(APP_IDS.GEWOHNHEITEN_VERWALTUNG, habitId),
          ausgefuehrt: true,
          investierte_zeit_minuten: gewohnheitenVerwaltungMap.get(habitId)?.fields.zielzeit_minuten ?? 0,
        });
      }
      await fetchAll();
    } finally {
      setSaving(null);
    }
  };

  const handleAddHabit = async (name: string, beschreibung: string, zielzeit: number) => {
    await LivingAppsService.createGewohnheitenVerwaltungEntry({
      gewohnheit_name: name,
      beschreibung,
      zielzeit_minuten: zielzeit,
    });
    await fetchAll();
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 font-[Outfit,sans-serif]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-700 text-foreground tracking-tight">
            {format(new Date(), 'EEEE', { locale: de })},
            <span className="font-300 text-muted-foreground ml-2">
              {format(new Date(), 'd. MMMM', { locale: de })}
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {completedToday === totalHabits && totalHabits > 0
              ? '🎉 Alle Gewohnheiten erledigt!'
              : `${completedToday} von ${totalHabits} Gewohnheiten heute erledigt`}
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="gap-2 shrink-0"
          size="sm"
        >
          <Plus size={14} />
          Neue Gewohnheit
        </Button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card rounded-2xl p-4 border border-border shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 mb-1">
            <Target size={14} className="text-primary" />
            <span className="text-xs font-500 text-muted-foreground uppercase tracking-wide">Heute</span>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-3xl font-700 text-foreground leading-none">{progressPct}</span>
            <span className="text-base font-500 text-muted-foreground mb-0.5">%</span>
          </div>
          <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPct}%`,
                background: 'var(--gradient-success)',
              }}
            />
          </div>
        </div>

        <div className="bg-card rounded-2xl p-4 border border-border shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 mb-1">
            <Flame size={14} className="text-orange-500" />
            <span className="text-xs font-500 text-muted-foreground uppercase tracking-wide">Max. Streak</span>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-3xl font-700 text-foreground leading-none">
              {Math.max(0, ...Array.from(streakMap.values()))}
            </span>
            <span className="text-base font-500 text-muted-foreground mb-0.5">Tage</span>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-4 border border-border shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={14} className="text-blue-500" />
            <span className="text-xs font-500 text-muted-foreground uppercase tracking-wide">Zeit heute</span>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-3xl font-700 text-foreground leading-none">{totalMinutesToday}</span>
            <span className="text-base font-500 text-muted-foreground mb-0.5">Min</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Habit checklist — hero */}
        <div className="lg:col-span-3 bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-600 text-foreground">Heutige Gewohnheiten</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Tippe zum Abhaken</p>
          </div>
          {gewohnheitenVerwaltung.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 px-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Plus size={20} className="text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                Noch keine Gewohnheiten. Füge deine erste Gewohnheit hinzu!
              </p>
              <Button variant="outline" size="sm" onClick={() => setShowAddModal(true)}>
                Gewohnheit erstellen
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {gewohnheitenVerwaltung.map(habit => {
                const entry = todayEntriesMap.get(habit.record_id);
                const done = entry?.fields.ausgefuehrt ?? false;
                const isSaving = saving === habit.record_id;
                const streak = streakMap.get(habit.record_id) ?? 0;
                const ziel = habit.fields.zielzeit_minuten;

                return (
                  <li key={habit.record_id}>
                    <button
                      onClick={() => handleToggle(habit.record_id)}
                      disabled={isSaving}
                      className={`
                        w-full flex items-center gap-4 px-5 py-4 text-left
                        transition-colors duration-150 cursor-pointer
                        ${done ? 'bg-primary/5 hover:bg-primary/8' : 'hover:bg-muted/50'}
                        ${isSaving ? 'opacity-50' : ''}
                      `}
                    >
                      <div className={`shrink-0 transition-transform duration-200 ${isSaving ? 'scale-75' : ''}`}>
                        {done
                          ? <CheckCircle2 size={24} className="text-primary" />
                          : <Circle size={24} className="text-border" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-500 text-sm leading-tight ${done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {habit.fields.gewohnheit_name ?? 'Unbenannte Gewohnheit'}
                        </p>
                        {habit.fields.beschreibung && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {habit.fields.beschreibung}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 flex items-center gap-3">
                        {ziel != null && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock size={11} />
                            {ziel} Min
                          </span>
                        )}
                        {streak > 0 && (
                          <span className="text-xs font-600 flex items-center gap-1 text-orange-500">
                            <Flame size={11} />
                            {streak}
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Weekly chart */}
          <div className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={14} className="text-primary" />
              <h3 className="font-600 text-sm text-foreground">Diese Woche</h3>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={weekData} barSize={16} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontFamily: 'Outfit' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontFamily: 'Outfit',
                  }}
                  formatter={(v: number) => [`${v} erledigt`, '']}
                  labelStyle={{ color: 'var(--foreground)' }}
                />
                <Bar dataKey="done" radius={[6, 6, 0, 0]}>
                  {weekData.map((d, i) => (
                    <Cell
                      key={i}
                      fill={d.isToday ? 'var(--primary)' : 'var(--muted)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Habit streaks */}
          <div className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Flame size={14} className="text-orange-500" />
              <h3 className="font-600 text-sm text-foreground">Streaks</h3>
            </div>
            {gewohnheitenVerwaltung.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Keine Gewohnheiten</p>
            ) : (
              <ul className="space-y-2.5">
                {gewohnheitenVerwaltung.map(h => {
                  const streak = streakMap.get(h.record_id) ?? 0;
                  const maxStreak = Math.max(1, ...Array.from(streakMap.values()));
                  return (
                    <li key={h.record_id} className="flex items-center gap-3">
                      <span className="text-xs font-500 text-foreground truncate flex-1 min-w-0">
                        {h.fields.gewohnheit_name ?? '—'}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-orange-400 transition-all duration-500"
                            style={{ width: `${(streak / maxStreak) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-600 text-orange-500 w-8 text-right">{streak}d</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Add Habit Modal */}
      {showAddModal && (
        <AddHabitModal
          onSave={handleAddHabit}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}

function AddHabitModal({
  onSave,
  onClose,
}: {
  onSave: (name: string, beschreibung: string, zielzeit: number) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [beschreibung, setBeschreibung] = useState('');
  const [zielzeit, setZielzeit] = useState(15);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(name.trim(), beschreibung.trim(), zielzeit);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <form
        onSubmit={handleSubmit}
        className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-sm p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-700 text-foreground">Neue Gewohnheit</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-600 text-muted-foreground uppercase tracking-wide block mb-1.5">
              Name der Gewohnheit *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="z.B. Morgenmeditation"
              className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-600 text-muted-foreground uppercase tracking-wide block mb-1.5">
              Beschreibung
            </label>
            <textarea
              value={beschreibung}
              onChange={e => setBeschreibung(e.target.value)}
              placeholder="Was möchtest du mit dieser Gewohnheit erreichen?"
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-600 text-muted-foreground uppercase tracking-wide block mb-1.5">
              Zielzeit pro Tag (Minuten)
            </label>
            <input
              type="number"
              min={1}
              max={480}
              value={zielzeit}
              onChange={e => setZielzeit(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit" className="flex-1" disabled={saving || !name.trim()}>
            {saving ? 'Speichern…' : 'Erstellen'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Skeleton className="lg:col-span-3 h-72 rounded-2xl" />
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </div>
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

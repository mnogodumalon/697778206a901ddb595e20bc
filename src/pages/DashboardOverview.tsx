import { useEffect, useState, useMemo, useCallback } from 'react';
import { format, parseISO, subDays, isToday } from 'date-fns';
import { de } from 'date-fns/locale';
import { Check, Plus, Clock, Target, Calendar, TrendingUp, Pencil, Trash2, X, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { APP_IDS } from '@/types/app';
import type { GewohnheitenVerwaltung, TaeglicheEintraege } from '@/types/app';

// --- Types ---
interface EntryDialogState {
  open: boolean;
  mode: 'create' | 'edit';
  entryId?: string;
  habitId?: string;
  ausgefuehrt: boolean;
  investierte_zeit_minuten: string;
  datum: string;
}

// --- Circular Progress Ring ---
function ProgressRing({
  percent,
  size = 52,
  stroke = 5,
  done = false,
}: {
  percent: number;
  size?: number;
  stroke?: number;
  done?: boolean;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = Math.min(percent, 100);
  const offset = circumference - (filled / 100) * circumference;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={done ? 'var(--primary)' : 'oklch(0.70 0.08 155)'}
        strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
    </svg>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Guten Morgen';
  if (h < 18) return 'Guten Tag';
  return 'Guten Abend';
}

export default function DashboardOverview() {
  const [habits, setHabits] = useState<GewohnheitenVerwaltung[]>([]);
  const [entries, setEntries] = useState<TaeglicheEintraege[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const [dialog, setDialog] = useState<EntryDialogState>({
    open: false,
    mode: 'create',
    ausgefuehrt: true,
    investierte_zeit_minuten: '',
    datum: todayStr,
  });

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [h, e] = await Promise.all([
        LivingAppsService.getGewohnheitenVerwaltung(),
        LivingAppsService.getTaeglicheEintraege(),
      ]);
      setHabits(h);
      setEntries(e);
    } catch {
      setError('Daten konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const todayEntryByHabit = useMemo(() => {
    const map = new Map<string, TaeglicheEintraege>();
    entries.forEach((e) => {
      const d = e.fields.datum?.split('T')[0];
      if (d !== todayStr) return;
      const hId = extractRecordId(e.fields.gewohnheit);
      if (!hId) return;
      const existing = map.get(hId);
      if (!existing || e.fields.ausgefuehrt) map.set(hId, e);
    });
    return map;
  }, [entries, todayStr]);

  const todayDoneCount = useMemo(() => {
    let count = 0;
    habits.forEach((h) => {
      if (todayEntryByHabit.get(h.record_id)?.fields.ausgefuehrt) count++;
    });
    return count;
  }, [habits, todayEntryByHabit]);

  const chartData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const label = format(date, 'EEE', { locale: de }).slice(0, 2);
      const count = entries.filter((e) => e.fields.datum?.split('T')[0] === dateStr && e.fields.ausgefuehrt === true).length;
      return { label, count, isToday: isToday(date) };
    });
  }, [entries]);

  const recentEntries = useMemo(() => {
    const habitMap = new Map(habits.map((h) => [h.record_id, h]));
    return [...entries]
      .sort((a, b) => b.createdat.localeCompare(a.createdat))
      .slice(0, 5)
      .map((e) => {
        const hId = extractRecordId(e.fields.gewohnheit);
        return { ...e, habitName: hId ? (habitMap.get(hId)?.fields.gewohnheit_name ?? '—') : '—' };
      });
  }, [entries, habits]);

  const handleToggleHabit = useCallback(async (habit: GewohnheitenVerwaltung) => {
    const existing = todayEntryByHabit.get(habit.record_id);
    setSaving(true);
    try {
      if (existing) {
        await LivingAppsService.updateTaeglicheEintraegeEntry(existing.record_id, {
          ausgefuehrt: !existing.fields.ausgefuehrt,
        });
        setEntries((prev) =>
          prev.map((e) => e.record_id === existing.record_id
            ? { ...e, fields: { ...e.fields, ausgefuehrt: !existing.fields.ausgefuehrt } }
            : e)
        );
      } else {
        const fields = {
          datum: todayStr,
          gewohnheit: createRecordUrl(APP_IDS.GEWOHNHEITEN_VERWALTUNG, habit.record_id),
          ausgefuehrt: true,
          investierte_zeit_minuten: habit.fields.zielzeit_minuten ?? 0,
        };
        const created = await LivingAppsService.createTaeglicheEintraegeEntry(fields);
        if (created?.record_id) {
          setEntries((prev) => [...prev, {
            record_id: created.record_id,
            createdat: created.createdat ?? new Date().toISOString(),
            updatedat: null,
            fields: created.fields ?? fields,
          }]);
        } else {
          await loadData();
        }
      }
    } catch {
      setError('Eintrag konnte nicht gespeichert werden.');
    } finally {
      setSaving(false);
    }
  }, [todayEntryByHabit, todayStr, loadData]);

  const handleEditEntry = useCallback((habit: GewohnheitenVerwaltung) => {
    const existing = todayEntryByHabit.get(habit.record_id);
    if (!existing) return;
    setDialog({
      open: true,
      mode: 'edit',
      entryId: existing.record_id,
      habitId: habit.record_id,
      ausgefuehrt: existing.fields.ausgefuehrt ?? false,
      investierte_zeit_minuten: String(existing.fields.investierte_zeit_minuten ?? ''),
      datum: existing.fields.datum?.split('T')[0] ?? todayStr,
    });
  }, [todayEntryByHabit, todayStr]);

  const handleOpenCreate = useCallback((habitId?: string) => {
    setDialog({ open: true, mode: 'create', habitId, ausgefuehrt: true, investierte_zeit_minuten: '', datum: todayStr });
  }, [todayStr]);

  const handleSave = useCallback(async () => {
    if (!dialog.habitId) return;
    setSaving(true);
    try {
      const fields = {
        datum: dialog.datum,
        gewohnheit: createRecordUrl(APP_IDS.GEWOHNHEITEN_VERWALTUNG, dialog.habitId),
        ausgefuehrt: dialog.ausgefuehrt,
        investierte_zeit_minuten: dialog.investierte_zeit_minuten ? Number(dialog.investierte_zeit_minuten) : undefined,
      };
      if (dialog.mode === 'edit' && dialog.entryId) {
        await LivingAppsService.updateTaeglicheEintraegeEntry(dialog.entryId, fields);
      } else {
        await LivingAppsService.createTaeglicheEintraegeEntry(fields);
      }
      await loadData();
      setDialog((d) => ({ ...d, open: false }));
    } catch {
      setError('Eintrag konnte nicht gespeichert werden.');
    } finally {
      setSaving(false);
    }
  }, [dialog, loadData]);

  const handleDelete = useCallback(async (entryId: string) => {
    setDeleting(entryId);
    try {
      await LivingAppsService.deleteTaeglicheEintraegeEntry(entryId);
      setEntries((prev) => prev.filter((e) => e.record_id !== entryId));
      setDialog((d) => ({ ...d, open: false }));
    } catch {
      setError('Eintrag konnte nicht gelöscht werden.');
    } finally {
      setDeleting(null);
    }
  }, []);

  const todayFormatted = format(new Date(), 'EEEE, d. MMMM', { locale: de });

  if (loading) {
    return (
      <div className="space-y-6">
        <div><Skeleton className="h-8 w-64 mb-2" /><Skeleton className="h-5 w-48" /></div>
        <div className="flex gap-3">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-36 rounded-full" />)}</div>
        <div className="lg:grid lg:grid-cols-5 lg:gap-6 space-y-4 lg:space-y-0">
          <div className="lg:col-span-3 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
          <div className="lg:col-span-2 space-y-4"><Skeleton className="h-32 rounded-xl" /><Skeleton className="h-48 rounded-xl" /></div>
        </div>
      </div>
    );
  }

  if (error && habits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="flex items-center gap-2 text-destructive"><AlertCircle size={20} /><span className="font-semibold">{error}</span></div>
        <Button variant="outline" onClick={loadData}>Erneut versuchen</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 lg:pb-0">
      {/* Error banner */}
      {error && habits.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 text-sm">
          <AlertCircle size={16} /><span className="flex-1">{error}</span>
          <button onClick={() => setError(null)}><X size={14} /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">{getGreeting()}</p>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-foreground capitalize">{todayFormatted}</h1>
        </div>
        <Button onClick={() => handleOpenCreate()} className="hidden lg:flex items-center gap-2 shadow-sm" disabled={saving}>
          <Plus size={16} />Eintrag hinzufügen
        </Button>
      </div>

      {/* KPI pills */}
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {[
          { icon: <Target size={14} />, label: 'Heute', value: `${todayDoneCount} / ${habits.length}`, accent: todayDoneCount === habits.length && habits.length > 0 },
          { icon: <Calendar size={14} />, label: 'Gewohnheiten', value: habits.length, accent: false },
          { icon: <TrendingUp size={14} />, label: 'Einträge gesamt', value: entries.length, accent: false },
        ].map((kpi, i) => (
          <div key={i}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-semibold whitespace-nowrap transition-colors ${
              kpi.accent ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border'
            }`}
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <span className={kpi.accent ? 'text-primary-foreground/70' : 'text-muted-foreground'}>{kpi.icon}</span>
            <span>{kpi.label}:</span>
            <span className="font-extrabold">{kpi.value}</span>
          </div>
        ))}
      </div>

      {/* Main layout */}
      <div className="lg:grid lg:grid-cols-5 lg:gap-6 space-y-6 lg:space-y-0">

        {/* LEFT — Habit Board */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Heute</h2>
            <Badge variant="secondary" className="text-xs font-semibold">{todayDoneCount} / {habits.length} erledigt</Badge>
          </div>

          {habits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 bg-card rounded-2xl border border-border">
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                <Target size={22} className="text-primary" />
              </div>
              <p className="font-semibold text-foreground">Noch keine Gewohnheiten</p>
              <p className="text-sm text-muted-foreground text-center max-w-xs">Erstelle deine erste Gewohnheit unter "Gewohnheiten-Verwaltung"</p>
            </div>
          ) : (
            habits.map((habit, idx) => {
              const entry = todayEntryByHabit.get(habit.record_id);
              const done = entry?.fields.ausgefuehrt === true;
              const timeInvested = entry?.fields.investierte_zeit_minuten ?? 0;
              const timeGoal = habit.fields.zielzeit_minuten ?? 0;
              const percent = timeGoal > 0 ? Math.round((timeInvested / timeGoal) * 100) : done ? 100 : 0;

              return (
                <div
                  key={habit.record_id}
                  className={`group relative flex items-center gap-4 p-4 rounded-2xl border bg-card transition-all duration-200 hover:shadow-md ${
                    done ? 'border-l-[4px] border-l-primary border-border' : 'border-border'
                  }`}
                  style={{ boxShadow: 'var(--shadow-card)', animationDelay: `${idx * 50}ms` }}
                >
                  {/* Toggle */}
                  <button
                    onClick={() => handleToggleHabit(habit)}
                    disabled={saving}
                    className={`flex-shrink-0 w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                      done ? 'bg-primary border-primary text-primary-foreground' : 'border-border hover:border-primary bg-transparent text-transparent hover:text-primary/40'
                    }`}
                    aria-label={done ? 'Als unerledigt markieren' : 'Als erledigt markieren'}
                  >
                    <Check size={16} strokeWidth={3} />
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-base truncate ${done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                      {habit.fields.gewohnheit_name ?? 'Unbenannte Gewohnheit'}
                    </p>
                    {habit.fields.beschreibung && (
                      <p className="text-sm text-muted-foreground truncate mt-0.5">{habit.fields.beschreibung}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {timeGoal > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock size={11} />{timeGoal} Min Ziel
                        </span>
                      )}
                      {done && timeInvested > 0 && (
                        <Badge variant="secondary" className="text-xs font-semibold bg-accent text-accent-foreground py-0 px-2 h-5">
                          {timeInvested} Min
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Progress ring */}
                  <div className="flex-shrink-0 flex flex-col items-center gap-0.5">
                    <ProgressRing percent={percent} size={48} stroke={5} done={done} />
                    <span className="text-xs text-muted-foreground font-semibold">{percent}%</span>
                  </div>

                  {/* Edit on hover */}
                  {done && entry && (
                    <button
                      onClick={() => handleEditEntry(habit)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                    >
                      <Pencil size={13} />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT — Analytics */}
        <div className="lg:col-span-2 space-y-4">
          <Button onClick={() => handleOpenCreate()} className="hidden lg:flex w-full items-center gap-2 shadow-sm" disabled={saving}>
            <Plus size={16} />Eintrag hinzufügen
          </Button>

          {/* 7-day chart */}
          <div className="bg-card rounded-2xl border border-border p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={15} className="text-primary" />
              <h3 className="font-bold text-sm text-foreground">Letzte 7 Tage</h3>
            </div>
            <div className="h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barCategoryGap="30%">
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontFamily: 'Nunito Sans' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'var(--muted)', radius: 6 }}
                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', fontFamily: 'Nunito Sans', color: 'var(--foreground)' }}
                    formatter={(value: number) => [`${value} erledigt`, '']}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="var(--primary)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent entries */}
          <div className="bg-card rounded-2xl border border-border p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={15} className="text-primary" />
              <h3 className="font-bold text-sm text-foreground">Letzte Einträge</h3>
            </div>
            {recentEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Noch keine Einträge</p>
            ) : (
              <div className="space-y-2">
                {recentEntries.map((entry) => (
                  <div key={entry.record_id} className="flex items-center gap-3 py-2 px-1 rounded-lg hover:bg-muted transition-colors">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${entry.fields.ausgefuehrt ? 'bg-primary' : 'bg-border'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{entry.habitName}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.fields.datum ? format(parseISO(entry.fields.datum), 'dd.MM.yyyy', { locale: de }) : '—'}
                        {entry.fields.investierte_zeit_minuten ? ` · ${entry.fields.investierte_zeit_minuten} Min` : ''}
                      </p>
                    </div>
                    <Badge variant={entry.fields.ausgefuehrt ? 'default' : 'secondary'}
                      className={`text-xs flex-shrink-0 ${entry.fields.ausgefuehrt ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {entry.fields.ausgefuehrt ? '✓' : '—'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => handleOpenCreate()}
        disabled={saving}
        className="lg:hidden fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-3.5 rounded-full font-bold text-sm active:scale-95 transition-all"
        style={{ boxShadow: '0 8px 24px -4px oklch(0.55 0.10 155 / 0.4)' }}
      >
        <Plus size={18} />Eintrag
      </button>

      {/* Dialog */}
      <Dialog open={dialog.open} onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-bold">{dialog.mode === 'edit' ? 'Eintrag bearbeiten' : 'Eintrag hinzufügen'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Gewohnheit</Label>
              <Select value={dialog.habitId ?? ''} onValueChange={(v) => setDialog((d) => ({ ...d, habitId: v }))}>
                <SelectTrigger><SelectValue placeholder="Gewohnheit wählen…" /></SelectTrigger>
                <SelectContent>
                  {habits.map((h) => (
                    <SelectItem key={h.record_id} value={h.record_id}>
                      {h.fields.gewohnheit_name ?? 'Unbenannt'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Datum</Label>
              <Input type="date" value={dialog.datum} onChange={(e) => setDialog((d) => ({ ...d, datum: e.target.value }))} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Investierte Zeit (Minuten)</Label>
              <Input type="number" min="0" placeholder="z.B. 30" value={dialog.investierte_zeit_minuten}
                onChange={(e) => setDialog((d) => ({ ...d, investierte_zeit_minuten: e.target.value }))} />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDialog((d) => ({ ...d, ausgefuehrt: !d.ausgefuehrt }))}
                className={`w-10 h-6 rounded-full relative transition-colors duration-200 ${dialog.ausgefuehrt ? 'bg-primary' : 'bg-border'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${dialog.ausgefuehrt ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
              <Label className="text-sm font-semibold cursor-pointer" onClick={() => setDialog((d) => ({ ...d, ausgefuehrt: !d.ausgefuehrt }))}>
                Gewohnheit ausgeführt
              </Label>
            </div>

            <div className="flex gap-2 pt-2">
              {dialog.mode === 'edit' && dialog.entryId && (
                <Button variant="destructive" size="sm"
                  onClick={() => dialog.entryId && handleDelete(dialog.entryId)}
                  disabled={deleting === dialog.entryId} className="mr-auto gap-1">
                  <Trash2 size={14} />{deleting === dialog.entryId ? 'Löschen…' : 'Löschen'}
                </Button>
              )}
              <Button variant="outline" onClick={() => setDialog((d) => ({ ...d, open: false }))} className="flex-1">Abbrechen</Button>
              <Button onClick={handleSave} disabled={saving || !dialog.habitId} className="flex-1">
                {saving ? 'Speichern…' : 'Speichern'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { GewohnheitenVerwaltung, TaeglicherCheckIn, TaeglicheEintraege } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [gewohnheitenVerwaltung, setGewohnheitenVerwaltung] = useState<GewohnheitenVerwaltung[]>([]);
  const [taeglicherCheckIn, setTaeglicherCheckIn] = useState<TaeglicherCheckIn[]>([]);
  const [taeglicheEintraege, setTaeglicheEintraege] = useState<TaeglicheEintraege[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [gewohnheitenVerwaltungData, taeglicherCheckInData, taeglicheEintraegeData] = await Promise.all([
        LivingAppsService.getGewohnheitenVerwaltung(),
        LivingAppsService.getTaeglicherCheckIn(),
        LivingAppsService.getTaeglicheEintraege(),
      ]);
      setGewohnheitenVerwaltung(gewohnheitenVerwaltungData);
      setTaeglicherCheckIn(taeglicherCheckInData);
      setTaeglicheEintraege(taeglicheEintraegeData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const gewohnheitenVerwaltungMap = useMemo(() => {
    const m = new Map<string, GewohnheitenVerwaltung>();
    gewohnheitenVerwaltung.forEach(r => m.set(r.record_id, r));
    return m;
  }, [gewohnheitenVerwaltung]);

  return { gewohnheitenVerwaltung, setGewohnheitenVerwaltung, taeglicherCheckIn, setTaeglicherCheckIn, taeglicheEintraege, setTaeglicheEintraege, loading, error, fetchAll, gewohnheitenVerwaltungMap };
}
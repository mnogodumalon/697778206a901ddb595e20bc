import type { EnrichedTaeglicheEintraege, EnrichedTaeglicherCheckIn } from '@/types/enriched';
import type { GewohnheitenVerwaltung, TaeglicheEintraege, TaeglicherCheckIn } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: string | undefined, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface TaeglicherCheckInMaps {
  gewohnheitenVerwaltungMap: Map<string, GewohnheitenVerwaltung>;
}

export function enrichTaeglicherCheckIn(
  taeglicherCheckIn: TaeglicherCheckIn[],
  maps: TaeglicherCheckInMaps
): EnrichedTaeglicherCheckIn[] {
  return taeglicherCheckIn.map(r => ({
    ...r,
    gewohnheitenName: resolveDisplay(r.fields.gewohnheiten, maps.gewohnheitenVerwaltungMap, 'gewohnheit_name'),
  }));
}

interface TaeglicheEintraegeMaps {
  gewohnheitenVerwaltungMap: Map<string, GewohnheitenVerwaltung>;
}

export function enrichTaeglicheEintraege(
  taeglicheEintraege: TaeglicheEintraege[],
  maps: TaeglicheEintraegeMaps
): EnrichedTaeglicheEintraege[] {
  return taeglicheEintraege.map(r => ({
    ...r,
    gewohnheitName: resolveDisplay(r.fields.gewohnheit, maps.gewohnheitenVerwaltungMap, 'gewohnheit_name'),
  }));
}

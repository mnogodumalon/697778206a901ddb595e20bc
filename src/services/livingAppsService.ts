// AUTOMATICALLY GENERATED SERVICE
import { APP_IDS } from '@/types/app';
import type { GewohnheitenVerwaltung, TaeglicherCheckIn, TaeglicheEintraege } from '@/types/app';

// Base Configuration
const API_BASE_URL = 'https://my.living-apps.de/rest';

// --- HELPER FUNCTIONS ---
export function extractRecordId(url: string | null | undefined): string | null {
  if (!url) return null;
  // Extrahiere die letzten 24 Hex-Zeichen mit Regex
  const match = url.match(/([a-f0-9]{24})$/i);
  return match ? match[1] : null;
}

export function createRecordUrl(appId: string, recordId: string): string {
  return `https://my.living-apps.de/rest/apps/${appId}/records/${recordId}`;
}

async function callApi(method: string, endpoint: string, data?: any) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  // Nutze Session Cookies für Auth
    body: data ? JSON.stringify(data) : undefined
  });
  if (!response.ok) throw new Error(await response.text());
  // DELETE returns often empty body or simple status
  if (method === 'DELETE') return true;
  return response.json();
}

export class LivingAppsService {
  // --- GEWOHNHEITEN_VERWALTUNG ---
  static async getGewohnheitenVerwaltung(): Promise<GewohnheitenVerwaltung[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.GEWOHNHEITEN_VERWALTUNG}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getGewohnheitenVerwaltungEntry(id: string): Promise<GewohnheitenVerwaltung | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.GEWOHNHEITEN_VERWALTUNG}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createGewohnheitenVerwaltungEntry(fields: GewohnheitenVerwaltung['fields']) {
    return callApi('POST', `/apps/${APP_IDS.GEWOHNHEITEN_VERWALTUNG}/records`, { fields });
  }
  static async updateGewohnheitenVerwaltungEntry(id: string, fields: Partial<GewohnheitenVerwaltung['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.GEWOHNHEITEN_VERWALTUNG}/records/${id}`, { fields });
  }
  static async deleteGewohnheitenVerwaltungEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.GEWOHNHEITEN_VERWALTUNG}/records/${id}`);
  }

  // --- TAEGLICHER_CHECK_IN ---
  static async getTaeglicherCheckIn(): Promise<TaeglicherCheckIn[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.TAEGLICHER_CHECK_IN}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getTaeglicherCheckInEntry(id: string): Promise<TaeglicherCheckIn | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.TAEGLICHER_CHECK_IN}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createTaeglicherCheckInEntry(fields: TaeglicherCheckIn['fields']) {
    return callApi('POST', `/apps/${APP_IDS.TAEGLICHER_CHECK_IN}/records`, { fields });
  }
  static async updateTaeglicherCheckInEntry(id: string, fields: Partial<TaeglicherCheckIn['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.TAEGLICHER_CHECK_IN}/records/${id}`, { fields });
  }
  static async deleteTaeglicherCheckInEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.TAEGLICHER_CHECK_IN}/records/${id}`);
  }

  // --- TAEGLICHE_EINTRAEGE ---
  static async getTaeglicheEintraege(): Promise<TaeglicheEintraege[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.TAEGLICHE_EINTRAEGE}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getTaeglicheEintraegeEntry(id: string): Promise<TaeglicheEintraege | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.TAEGLICHE_EINTRAEGE}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createTaeglicheEintraegeEntry(fields: TaeglicheEintraege['fields']) {
    return callApi('POST', `/apps/${APP_IDS.TAEGLICHE_EINTRAEGE}/records`, { fields });
  }
  static async updateTaeglicheEintraegeEntry(id: string, fields: Partial<TaeglicheEintraege['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.TAEGLICHE_EINTRAEGE}/records/${id}`, { fields });
  }
  static async deleteTaeglicheEintraegeEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.TAEGLICHE_EINTRAEGE}/records/${id}`);
  }

}
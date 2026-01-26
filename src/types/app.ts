// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export interface GewohnheitenVerwaltung {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    gewohnheit_name?: string;
    beschreibung?: string;
    zielzeit_minuten?: number;
  };
}

export interface TaeglicheEintraege {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    datum?: string; // Format: YYYY-MM-DD oder ISO String
    gewohnheit?: string; // applookup -> URL zu 'GewohnheitenVerwaltung' Record
    ausgefuehrt?: boolean;
    investierte_zeit_minuten?: number;
  };
}

export interface TaeglicherCheckIn {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    checkin_datum?: string; // Format: YYYY-MM-DD oder ISO String
    gewohnheiten?: string; // applookup -> URL zu 'GewohnheitenVerwaltung' Record
    zeit_investiert?: number;
  };
}

export const APP_IDS = {
  GEWOHNHEITEN_VERWALTUNG: '6977780b11cf88a3f882fc82',
  TAEGLICHE_EINTRAEGE: '6977780f2a7f74f1d8d9089e',
  TAEGLICHER_CHECK_IN: '6977780f1b1ce9da85700886',
} as const;

// Helper Types for creating new records
export type CreateGewohnheitenVerwaltung = GewohnheitenVerwaltung['fields'];
export type CreateTaeglicheEintraege = TaeglicheEintraege['fields'];
export type CreateTaeglicherCheckIn = TaeglicherCheckIn['fields'];
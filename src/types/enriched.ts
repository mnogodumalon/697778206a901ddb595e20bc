import type { TaeglicheEintraege, TaeglicherCheckIn } from './app';

export type EnrichedTaeglicherCheckIn = TaeglicherCheckIn & {
  gewohnheitenName: string;
};

export type EnrichedTaeglicheEintraege = TaeglicheEintraege & {
  gewohnheitName: string;
};

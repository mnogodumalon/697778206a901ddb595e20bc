import type { GewohnheitenVerwaltung, TaeglicheEintraege } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import { format, parseISO, addDays, startOfYear, endOfYear, getDayOfYear, differenceInDays, eachDayOfInterval, isAfter, isToday as isDateToday } from 'date-fns';

// Type for year data
export type YearDayData = {
  date: string;
  completion: number;
  count: number;
  isFuture: boolean;
  isToday: boolean;
};

// Get today's date in YYYY-MM-DD format
export function getTodayDate(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

// Format minutes to hours and minutes in a beautiful way
export function formatTimeInvested(minutes: number): { hours: number; mins: number; display: string; shortDisplay: string } {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return { hours, mins, display: `${mins} Minuten`, shortDisplay: `${mins}m` };
  } else if (mins === 0) {
    return { hours, mins, display: `${hours} ${hours === 1 ? 'Stunde' : 'Stunden'}`, shortDisplay: `${hours}h` };
  } else {
    return { hours, mins, display: `${hours}h ${mins}m`, shortDisplay: `${hours}h ${mins}m` };
  }
}

// Calculate time invested per habit
export function calculateTimePerHabit(entries: TaeglicheEintraege[], habits: GewohnheitenVerwaltung[]): Map<string, number> {
  const timeMap = new Map<string, number>();

  // Initialize all habits with 0
  habits.forEach(habit => {
    timeMap.set(habit.record_id, 0);
  });

  // Sum up time for each habit
  entries.forEach(entry => {
    if (entry.fields.ausgefuehrt && entry.fields.investierte_zeit_minuten) {
      const habitId = extractRecordId(entry.fields.gewohnheit);
      if (habitId) {
        const current = timeMap.get(habitId) || 0;
        timeMap.set(habitId, current + entry.fields.investierte_zeit_minuten);
      }
    }
  });

  return timeMap;
}

// Calculate streak (consecutive days with at least one completed habit)
export function calculateStreak(entries: TaeglicheEintraege[]): number {
  const completedDates = new Set<string>();
  entries.forEach(entry => {
    if (entry.fields.ausgefuehrt && entry.fields.datum) {
      completedDates.add(entry.fields.datum.split('T')[0]);
    }
  });

  let streak = 0;
  let currentDate = new Date();

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

// Calculate longest streak ever
export function calculateLongestStreak(entries: TaeglicheEintraege[]): number {
  const completedDates = new Set<string>();
  entries.forEach(entry => {
    if (entry.fields.ausgefuehrt && entry.fields.datum) {
      completedDates.add(entry.fields.datum.split('T')[0]);
    }
  });

  if (completedDates.size === 0) return 0;

  const sortedDates = Array.from(completedDates).sort();
  let longestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = parseISO(sortedDates[i - 1]);
    const currDate = parseISO(sortedDates[i]);
    const diff = differenceInDays(currDate, prevDate);

    if (diff === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return longestStreak;
}

// Calculate FULL year overview data (including future days)
export function getFullYearData(entries: TaeglicheEintraege[], habits: GewohnheitenVerwaltung[]): YearDayData[] {
  const today = new Date();
  const yearStart = startOfYear(today);
  const yearEnd = endOfYear(today);
  const totalHabits = habits.length || 1;

  // Create map of completions per day
  const completionMap = new Map<string, number>();
  entries.forEach(entry => {
    if (entry.fields.ausgefuehrt && entry.fields.datum) {
      const dateStr = entry.fields.datum.split('T')[0];
      completionMap.set(dateStr, (completionMap.get(dateStr) || 0) + 1);
    }
  });

  // Generate data for ENTIRE year
  const days = eachDayOfInterval({ start: yearStart, end: yearEnd });
  return days.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const count = completionMap.get(dateStr) || 0;
    const completion = Math.min(Math.round((count / totalHabits) * 100), 100);
    const isFuture = isAfter(date, today);
    const isToday = isDateToday(date);
    return { date: dateStr, completion, count, isFuture, isToday };
  });
}

// Calculate overall consistency (days with at least one habit completed / total days)
export function calculateConsistency(entries: TaeglicheEintraege[]): { rate: number; activeDays: number; totalDays: number } {
  const completedDates = new Set<string>();
  entries.forEach(entry => {
    if (entry.fields.ausgefuehrt && entry.fields.datum) {
      completedDates.add(entry.fields.datum.split('T')[0]);
    }
  });

  const totalDays = getDayOfYear(new Date());
  const activeDays = completedDates.size;
  const rate = Math.round((activeDays / totalDays) * 100);

  return { rate, activeDays, totalDays };
}

// Helper to get color for completion
export function getCompletionColor(day: { completion: number; isFuture: boolean } | null): string {
  if (!day) return 'bg-transparent';
  if (day.isFuture) return 'bg-muted/30';
  if (day.completion === 0) return 'bg-muted';
  if (day.completion < 25) return 'bg-primary/20';
  if (day.completion < 50) return 'bg-primary/40';
  if (day.completion < 75) return 'bg-primary/60';
  if (day.completion < 100) return 'bg-primary/80';
  return 'bg-primary';
}

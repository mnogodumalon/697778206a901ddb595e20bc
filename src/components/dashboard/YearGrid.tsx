import type { GewohnheitenVerwaltung } from '@/types/app';
import type { YearDayData } from './utils';
import { getCompletionColor } from './utils';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Desktop Year Grid - proper GitHub-style with month labels
export function DesktopYearGrid({ data, habits }: { data: YearDayData[]; habits: GewohnheitenVerwaltung[] }) {
  // Group by weeks
  const weeks: Array<{ days: Array<YearDayData | null>; firstDayMonth: number }> = [];
  let currentWeek: Array<YearDayData | null> = [];

  // Pad the beginning
  const firstDay = data[0] ? parseISO(data[0].date) : new Date();
  const firstDayOfWeek = firstDay.getDay();
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push(null);
  }

  data.forEach((day) => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      // Find first non-null day to determine month
      const firstNonNull = currentWeek.find(d => d !== null);
      const monthNum = firstNonNull ? parseISO(firstNonNull.date).getMonth() : 0;
      weeks.push({ days: currentWeek, firstDayMonth: monthNum });
      currentWeek = [];
    }
  });

  // Pad the last week
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    const firstNonNull = currentWeek.find(d => d !== null);
    const monthNum = firstNonNull ? parseISO(firstNonNull.date).getMonth() : 11;
    weeks.push({ days: currentWeek, firstDayMonth: monthNum });
  }

  // Calculate month label positions
  const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  const monthPositions: Array<{ month: string; startWeek: number }> = [];
  let lastMonth = -1;
  weeks.forEach((week, idx) => {
    if (week.firstDayMonth !== lastMonth) {
      monthPositions.push({ month: months[week.firstDayMonth], startWeek: idx });
      lastMonth = week.firstDayMonth;
    }
  });

  const cellSize = 11;
  const gap = 2;
  const totalWidth = weeks.length * (cellSize + gap);

  return (
    <div className="w-full">
      {/* Month labels */}
      <div className="relative h-4 mb-1 ml-5" style={{ width: totalWidth }}>
        {monthPositions.map((pos, idx) => (
          <span
            key={pos.month + idx}
            className="absolute text-[10px] text-muted-foreground"
            style={{ left: pos.startWeek * (cellSize + gap) }}
          >
            {pos.month}
          </span>
        ))}
      </div>
      <div className="flex gap-[2px]">
        {/* Day labels */}
        <div className="flex flex-col gap-[2px] text-[9px] text-muted-foreground pr-0.5 w-4">
          <span style={{ height: cellSize }}></span>
          <span style={{ height: cellSize }} className="flex items-center">M</span>
          <span style={{ height: cellSize }}></span>
          <span style={{ height: cellSize }} className="flex items-center">M</span>
          <span style={{ height: cellSize }}></span>
          <span style={{ height: cellSize }} className="flex items-center">F</span>
          <span style={{ height: cellSize }}></span>
        </div>
        {/* Grid */}
        <div className="flex gap-[2px]">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[2px]">
              {week.days.map((day, dayIndex) => (
                <TooltipProvider key={dayIndex} delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        style={{ width: cellSize, height: cellSize }}
                        className={`rounded-[2px] transition-colors ${getCompletionColor(day)} ${
                          day?.isToday ? 'ring-1 ring-primary ring-offset-1 ring-offset-background' : ''
                        }`}
                      />
                    </TooltipTrigger>
                    {day && (
                      <TooltipContent side="top" className="text-xs">
                        <p className="font-medium">{format(parseISO(day.date), 'd. MMMM', { locale: de })}</p>
                        {day.isFuture ? (
                          <p className="text-muted-foreground">Zukünftig</p>
                        ) : (
                          <p className="text-muted-foreground">{day.count}/{habits.length} ({day.completion}%)</p>
                        )}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Mobile Year Grid - 12 month blocks in a grid layout (no scrolling!)
export function MobileYearGrid({ data, habits }: { data: YearDayData[]; habits: GewohnheitenVerwaltung[] }) {
  // Group data by month
  const monthsData: Array<Array<YearDayData>> = Array.from({ length: 12 }, () => []);
  data.forEach(day => {
    const month = parseISO(day.date).getMonth();
    monthsData[month].push(day);
  });

  const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

  return (
    <div className="grid grid-cols-4 gap-2">
      {monthsData.map((days, monthIndex) => (
        <div key={monthIndex} className="bg-muted/20 rounded-md p-1.5">
          <p className="text-[9px] text-muted-foreground mb-1 font-medium">{monthNames[monthIndex]}</p>
          <div className="grid grid-cols-7 gap-[1px]">
            {/* Pad beginning of month to correct weekday */}
            {days[0] && Array.from({ length: parseISO(days[0].date).getDay() }, (_, i) => (
              <div key={`pad-${i}`} className="w-2 h-2" />
            ))}
            {days.map((day, dayIndex) => (
              <TooltipProvider key={dayIndex} delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={`w-2 h-2 rounded-[1px] ${getCompletionColor(day)} ${
                        day.isToday ? 'ring-1 ring-primary' : ''
                      }`}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <p className="font-medium">{format(parseISO(day.date), 'd. MMM', { locale: de })}</p>
                    {day.isFuture ? (
                      <p className="text-muted-foreground">Zukünftig</p>
                    ) : (
                      <p className="text-muted-foreground">{day.count}/{habits.length}</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

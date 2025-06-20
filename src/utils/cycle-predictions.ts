import { PeriodLog } from '@/integrations/firebase/types';
import { addDays, differenceInDays, format } from 'date-fns';

export type { PeriodLog };

export interface CyclePrediction {
  periodStart: Date;
  periodEnd: Date;
  ovulationDate: Date;
  fertileStart: Date;
  fertileEnd: Date;
  cycleLength: number;
  isPrediction: boolean;
}

export const calculateCycleLength = (periodLogs: PeriodLog[]): number => {
  if (periodLogs.length < 2) return 28; // Default cycle length

  const startDates = periodLogs
    .filter(log => log.type === 'period_start')
    .map(log => new Date(log.startDate))
    .sort((a, b) => b.getTime() - a.getTime());

  if (startDates.length < 2) return 28;

  const differences: number[] = [];
  for (let i = 0; i < startDates.length - 1; i++) {
    const diff = differenceInDays(startDates[i], startDates[i + 1]);
    if (diff > 0) differences.push(diff);
  }

  if (differences.length === 0) return 28;

  const averageCycle = Math.round(
    differences.reduce((sum, diff) => sum + diff, 0) / differences.length
  );

  return averageCycle;
};

export const predictNextCycle = (periodLogs: PeriodLog[]): CyclePrediction => {
  const cycleLength = calculateCycleLength(periodLogs);
  const lastPeriodStart = new Date(
    periodLogs.find(log => log.type === 'period_start')?.startDate || new Date()
  );

  const nextPeriodStart = addDays(lastPeriodStart, cycleLength);
  const nextPeriodEnd = addDays(nextPeriodStart, 5); // Assuming 5-day period
  const ovulationDate = addDays(nextPeriodStart, -14); // Ovulation typically occurs 14 days before period
  const fertileStart = addDays(ovulationDate, -5); // Fertile window starts 5 days before ovulation
  const fertileEnd = addDays(ovulationDate, 1); // Fertile window ends 1 day after ovulation

  return {
    periodStart: nextPeriodStart,
    periodEnd: nextPeriodEnd,
    ovulationDate,
    fertileStart,
    fertileEnd,
    cycleLength,
    isPrediction: true
  };
};

export const getCycleInsights = (periodLogs: PeriodLog[]): string[] => {
  const insights: string[] = [];
  const cycleLength = calculateCycleLength(periodLogs);

  if (cycleLength < 21) {
    insights.push("Your cycle is shorter than average. Consider consulting a healthcare provider.");
  } else if (cycleLength > 35) {
    insights.push("Your cycle is longer than average. Consider consulting a healthcare provider.");
  }

  const regularCycles = periodLogs
    .filter(log => log.type === 'period_start')
    .map(log => new Date(log.startDate))
    .sort((a, b) => b.getTime() - a.getTime());

  if (regularCycles.length >= 3) {
    const variations = regularCycles.slice(0, 3).map((date, i, arr) => {
      if (i === 0) return 0;
      return Math.abs(differenceInDays(date, arr[i - 1]) - cycleLength);
    });

    const isRegular = variations.every(v => v <= 2);
    if (isRegular) {
      insights.push("Your cycle is very regular. This is a good sign of reproductive health.");
    } else {
      insights.push("Your cycle shows some variation. This is normal, but monitor for significant changes.");
    }
  }

  return insights;
};


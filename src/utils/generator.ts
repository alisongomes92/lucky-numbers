import { Lottery } from '../data/lotteries';

export interface GeneratedResult {
  numbers: number[];
  extraNumbers?: number[];
  extraLabels?: string[];
}

/**
 * Generates unique random numbers within a range
 */
function pickUniqueNumbers(min: number, max: number, count: number): number[] {
  const pool: number[] = [];
  for (let i = min; i <= max; i++) pool.push(i);

  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, count).sort((a, b) => a - b);
}

export function generateNumbers(lottery: Lottery): GeneratedResult {
  const numbers = pickUniqueNumbers(lottery.minNumber, lottery.maxNumber, lottery.pickCount);

  let extraNumbers: number[] | undefined;
  let extraLabels: string[] | undefined;

  if (lottery.extraPick) {
    const { min, max, count, options } = lottery.extraPick;
    extraNumbers = pickUniqueNumbers(min, max, count);
    if (options) {
      extraLabels = extraNumbers.map(n => options[n - 1]);
    }
  }

  return { numbers, extraNumbers, extraLabels };
}

export function formatNumber(num: number, lottery: Lottery): string {
  if (lottery.id === 'lotomania') {
    return num.toString().padStart(2, '0');
  }
  return num.toString().padStart(2, '0');
}

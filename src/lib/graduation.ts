/** Shared graduation countdown logic, used by both the React hero and the
 *  Astro-rendered timeline panel so the two can never disagree. */

export const GRADUATION_DATE = new Date('2027-05-02T00:00:00-04:00');

const toWholeDays = (ms: number) => Math.ceil(ms / (1000 * 60 * 60 * 24));

export interface Countdown {
  text: string;
  days: string;
}

export function graduationCountdown(now: Date = new Date()): Countdown {
  const diff = GRADUATION_DATE.getTime() - now.getTime();
  if (diff <= 0) return { text: 'graduated!', days: '0' };

  const totalDays = toWholeDays(diff);
  const months = Math.floor(totalDays / 30.44);
  const days = Math.max(0, Math.round(totalDays - months * 30.44));

  const text =
    months <= 0
      ? `${totalDays} day${totalDays === 1 ? '' : 's'}`
      : `${months} month${months === 1 ? '' : 's'} and ${days} day${days === 1 ? '' : 's'}`;

  return { text, days: String(totalDays) };
}

import confetti from 'canvas-confetti';
import { TRIP, ROUTE_DAYS } from './data';

export type TripPhase = 'before' | 'during' | 'after';

const MSK_OFFSET_MS = 3 * 3600_000; // Russia has no DST

function mskDayStamp(ms: number) {
  const d = new Date(ms + MSK_OFFSET_MS);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * Where we are relative to the trip. `day` is 1-based (1..5) and only
 * meaningful while the phase is 'during'.
 *
 * For previewing, the phase can be forced with ?phase=before|during|after
 * and the day with ?day=1..5.
 */
export function getTripState(now = Date.now()): { phase: TripPhase; day: number } {
  let phase: TripPhase;
  const depart = new Date(TRIP.departISO).getTime();
  const ret = new Date(TRIP.returnISO).getTime();

  if (now < depart) phase = 'before';
  else if (now > ret) phase = 'after';
  else phase = 'during';

  let day = 1;
  if (phase === 'during') {
    day = Math.round((mskDayStamp(now) - mskDayStamp(depart)) / 86_400_000) + 1;
    day = Math.min(Math.max(day, 1), ROUTE_DAYS.length);
  }

  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const forcedPhase = params.get('phase');
    if (forcedPhase === 'before' || forcedPhase === 'during' || forcedPhase === 'after') {
      phase = forcedPhase;
    }
    const forcedDay = Number(params.get('day'));
    if (forcedDay >= 1 && forcedDay <= ROUTE_DAYS.length) {
      day = forcedDay;
    }
  }

  return { phase, day };
}

/** Two-sided confetti burst in the site's palette. */
export function celebrate() {
  const colors = ['#c7e0cb', '#85AB8B', '#4b7a5a', '#ffffff'];
  const end = Date.now() + 2500;
  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors });
    confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

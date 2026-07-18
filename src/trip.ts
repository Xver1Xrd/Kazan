import confetti from 'canvas-confetti';
import { TRIP, ROUTE_DAYS } from './data';

export type TripPhase = 'before' | 'flight' | 'during' | 'after';

const MSK_OFFSET_MS = 3 * 3600_000; // Russia has no DST

function mskDayStamp(ms: number) {
  const d = new Date(ms + MSK_OFFSET_MS);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export type TripState = {
  phase: TripPhase;
  /** 1-based trip day, meaningful while phase is 'during' */
  day: number;
  /** 0..1 outbound flight progress, meaningful while phase is 'flight' */
  flightProgress: number;
};

/**
 * Where we are relative to the trip.
 *
 * For previewing, force with ?phase=before|flight|during|after,
 * ?day=1..5 and ?progress=0..1.
 */
export function getTripState(now = Date.now()): TripState {
  const depart = new Date(TRIP.departISO).getTime();
  const arrive = new Date(TRIP.arriveISO).getTime();
  const ret = new Date(TRIP.returnISO).getTime();

  let phase: TripPhase;
  if (now < depart) phase = 'before';
  else if (now <= arrive) phase = 'flight';
  else if (now <= ret) phase = 'during';
  else phase = 'after';

  let day = 1;
  if (phase === 'during') {
    day = Math.round((mskDayStamp(now) - mskDayStamp(depart)) / 86_400_000) + 1;
    day = Math.min(Math.max(day, 1), ROUTE_DAYS.length);
  }

  let flightProgress = Math.min(Math.max((now - depart) / (arrive - depart), 0), 1);

  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const forcedPhase = params.get('phase');
    if (forcedPhase === 'before' || forcedPhase === 'flight' || forcedPhase === 'during' || forcedPhase === 'after') {
      phase = forcedPhase;
    }
    const forcedDay = Number(params.get('day'));
    if (forcedDay >= 1 && forcedDay <= ROUTE_DAYS.length) {
      day = forcedDay;
    }
    const forcedProgress = Number(params.get('progress'));
    if (forcedProgress >= 0 && forcedProgress <= 1) {
      flightProgress = forcedProgress;
    }
  }

  return { phase, day, flightProgress };
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

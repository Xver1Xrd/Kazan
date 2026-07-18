import { useEffect } from 'react';
import { TRIP } from '../data';
import { getTripState } from '../trip';

const HEART_BIG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%92%9A%3C/text%3E%3C/svg%3E";
const HEART_SMALL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext x='15' y='.95em' font-size='66'%3E%F0%9F%92%9A%3C/text%3E%3C/svg%3E";

function setFavicon(href: string) {
  const link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
  if (link && link.href !== href) link.href = href;
}

function declineDays(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'день';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'дня';
  return 'дней';
}

/** Keeps the browser tab title in sync with the trip; favicon pulses while we fly. */
export default function LiveTitle() {
  useEffect(() => {
    const update = () => {
      const { phase, day } = getTripState();
      if (phase === 'before') {
        const msLeft = new Date(TRIP.departISO).getTime() - Date.now();
        const hoursLeft = Math.ceil(msLeft / 3_600_000);
        const daysLeft = Math.ceil(msLeft / 86_400_000);
        document.title =
          hoursLeft <= 24
            ? `✈ До вылета ${hoursLeft} ч — Казань вдвоём`
            : `✈ ${daysLeft} ${declineDays(daysLeft)} до Казани — Казань вдвоём`;
      } else if (phase === 'flight') {
        document.title = '🛫 Мы в небе — Казань вдвоём';
      } else if (phase === 'during') {
        document.title = `💚 Мы в Казани — день ${day} из 5`;
      } else {
        document.title = '💚 Казань вдвоём — мы там были';
      }
    };

    update();
    const titleId = setInterval(update, 30_000);

    // Favicon heartbeat while the plane is in the air.
    let big = true;
    const faviconId = setInterval(() => {
      if (getTripState().phase === 'flight') {
        setFavicon(big ? HEART_SMALL : HEART_BIG);
        big = !big;
      } else {
        setFavicon(HEART_BIG);
      }
    }, 800);

    return () => {
      clearInterval(titleId);
      clearInterval(faviconId);
    };
  }, []);

  return null;
}

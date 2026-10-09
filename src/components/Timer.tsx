import { useEffect, useState } from 'react';
import { formatClock } from '../lib/time';

interface TimerProps {
  startedAt: number;
  durationMs?: number;
}

export default function Timer({ startedAt, durationMs }: TimerProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const isCountdown = durationMs !== undefined;
  const value = isCountdown ? Math.max(0, durationMs - (now - startedAt)) : now - startedAt;
  const isLow = isCountdown && value < 60_000;

  return (
    <span
      className={`study-timer mono${isLow ? ' study-timer-low' : ''}`}
      aria-label={isCountdown ? 'Tiempo restante' : 'Tiempo transcurrido'}
    >
      {formatClock(value)}
    </span>
  );
}

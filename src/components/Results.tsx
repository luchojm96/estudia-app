import type { MissedAnswer } from '../types';
import { formatDurationLong } from '../lib/time';
import MissedList from './MissedList';

interface ResultsProps {
  score: number;
  total: number;
  missed: MissedAnswer[];
  elapsedMs: number | null;
  onRestartAll: () => void;
  onReviewMissed: () => void;
  onLoadAnother: () => void;
}

function scoreMessage(pct: number): string {
  if (pct >= 90) return 'Excelente';
  if (pct >= 70) return 'Bien hecho';
  if (pct >= 50) return 'Seguí así';
  return 'A practicar';
}

export default function Results({
  score,
  total,
  missed,
  elapsedMs,
  onRestartAll,
  onReviewMissed,
  onLoadAnother,
}: ResultsProps) {
  const pct = total === 0 ? 0 : Math.round((score / total) * 100);

  return (
    <div>
      <div className="card score-display">
        <div className="score-number mono">
          {score}/{total}
        </div>
        <div className="score-message">{scoreMessage(pct)}</div>
        {elapsedMs !== null && (
          <div className="muted mono time-taken">Tiempo: {formatDurationLong(elapsedMs)}</div>
        )}
      </div>

      <MissedList missed={missed} />

      <div className="btn-row">
        <button className="btn btn-primary" onClick={onRestartAll}>
          Reiniciar todas
        </button>
        {missed.length > 0 && (
          <button className="btn btn-secondary" onClick={onReviewMissed}>
            Repasar falladas
          </button>
        )}
        <button className="btn btn-ghost" onClick={onLoadAnother}>
          Cargar otro archivo
        </button>
      </div>
    </div>
  );
}

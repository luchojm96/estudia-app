import type { FlashcardResult } from '../types';
import { formatDurationLong } from '../lib/time';

interface FlashcardResultsProps {
  results: FlashcardResult[];
  elapsedMs: number | null;
  onRestartAll: () => void;
  onReviewUnknown: () => void;
  onLoadAnother: () => void;
}

function isSuccess(r: FlashcardResult): boolean {
  return r.kind === 'choice' ? r.known : r.completeness === 'completa';
}

export default function FlashcardResults({
  results,
  elapsedMs,
  onRestartAll,
  onReviewUnknown,
  onLoadAnother,
}: FlashcardResultsProps) {
  const total = results.length;
  const known = results.filter(isSuccess).length;
  const unknown = results.filter((r) => !isSuccess(r));

  return (
    <div>
      <div className="card score-display">
        <div className="score-number mono">
          {known}/{total}
        </div>
        <div className="score-message">Tarjetas dominadas</div>
        {elapsedMs !== null && (
          <div className="muted mono time-taken">Tiempo: {formatDurationLong(elapsedMs)}</div>
        )}
      </div>

      {unknown.length > 0 && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Para repasar</h3>
          {unknown.map((r, i) => (
            <div className="missed-item" key={i}>
              <p className="missed-question">{r.question}</p>
              {r.kind === 'choice' ? (
                <>
                  <div className="missed-answer-row correct-answer">
                    Respuesta: {r.options[r.correctIndex]}
                  </div>
                  {r.explanation && <p className="missed-explanation">{r.explanation}</p>}
                </>
              ) : (
                <>
                  <div className="missed-answer-row your-answer">Tu respuesta: {r.userAnswer}</div>
                  <div className="missed-answer-row correct-answer">
                    Respuesta esperada: {r.expectedAnswer}
                  </div>
                  {r.missingKeywords.length > 0 && (
                    <div className="keyword-chip-row">
                      {r.missingKeywords.map((kw) => (
                        <span className="keyword-chip keyword-chip-missing" key={kw}>
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="btn-row">
        <button className="btn btn-primary" onClick={onRestartAll}>
          Repasar todas otra vez
        </button>
        {unknown.length > 0 && (
          <button className="btn btn-secondary" onClick={onReviewUnknown}>
            Repasar las que no sabía
          </button>
        )}
        <button className="btn btn-ghost" onClick={onLoadAnother}>
          Cargar otro archivo
        </button>
      </div>
    </div>
  );
}

import type { ExamAnswer } from '../types';
import { formatDurationLong } from '../lib/time';

interface ExamResultsProps {
  answers: ExamAnswer[];
  choiceTotal: number;
  openTotal: number;
  elapsedMs: number | null;
  onLoadAnother: () => void;
}

function scoreMessage(pct: number): string {
  if (pct >= 90) return 'Excelente';
  if (pct >= 70) return 'Bien hecho';
  if (pct >= 50) return 'Seguí así';
  return 'A practicar';
}

export default function ExamResults({ answers, choiceTotal, openTotal, elapsedMs, onLoadAnother }: ExamResultsProps) {
  const choiceAnswers = answers.filter((a): a is Extract<ExamAnswer, { kind: 'choice' }> => a.kind === 'choice');
  const openAnswers = answers.filter((a): a is Extract<ExamAnswer, { kind: 'open' }> => a.kind === 'open');

  const choiceCorrect = choiceAnswers.filter((a) => a.correct).length;
  const openComplete = openAnswers.filter((a) => a.completeness === 'completa').length;

  const total = choiceTotal + openTotal;
  const score = total === 0 ? 0 : Math.round(((choiceCorrect + openComplete) / total) * 100);

  const missedChoice = choiceAnswers.filter((a) => !a.correct);
  const missedOpen = openAnswers.filter((a) => a.completeness !== 'completa');

  return (
    <div>
      <div className="card score-display">
        <div className="score-number mono">{score}/100</div>
        <div className="score-message">{scoreMessage(score)}</div>
        {elapsedMs !== null && (
          <div className="muted mono time-taken">Tiempo: {formatDurationLong(elapsedMs)}</div>
        )}
        <div className="muted" style={{ marginTop: 10 }}>
          {choiceTotal > 0 && <div>Opción múltiple: {choiceCorrect}/{choiceTotal}</div>}
          {openTotal > 0 && <div>Desarrollo: {openComplete}/{openTotal}</div>}
        </div>
      </div>

      {(missedChoice.length > 0 || missedOpen.length > 0) && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Preguntas falladas</h3>

          {missedChoice.map((m, i) => (
            <div className="missed-item" key={`c-${i}`}>
              <p className="missed-question">{m.question}</p>
              <div className="missed-answer-row your-answer">
                Tu respuesta: {m.yourIndex !== null ? m.options[m.yourIndex] : 'Sin responder'}
              </div>
              <div className="missed-answer-row correct-answer">
                Respuesta correcta: {m.options[m.correctIndex]}
              </div>
              {m.explanation && <p className="missed-explanation">{m.explanation}</p>}
            </div>
          ))}

          {missedOpen.map((m, i) => (
            <div className="missed-item" key={`o-${i}`}>
              <p className="missed-question">{m.question}</p>
              <div className="missed-answer-row your-answer">
                Tu respuesta: {m.userAnswer.trim() ? m.userAnswer : 'Sin responder'}
              </div>
              <div className="missed-answer-row correct-answer">Respuesta esperada: {m.expectedAnswer}</div>
              {m.missingKeywords.length > 0 && (
                <div className="keyword-chip-row">
                  {m.missingKeywords.map((kw) => (
                    <span className="keyword-chip keyword-chip-missing" key={kw}>
                      {kw}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="btn-row">
        <button className="btn btn-primary" onClick={onLoadAnother}>
          Cargar otro archivo
        </button>
      </div>
    </div>
  );
}

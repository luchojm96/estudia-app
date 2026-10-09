import type { MissedAnswer } from '../types';

interface MissedListProps {
  missed: MissedAnswer[];
}

export default function MissedList({ missed }: MissedListProps) {
  if (missed.length === 0) return null;

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Preguntas falladas</h3>
      {missed.map((m, i) => (
        <div className="missed-item" key={i}>
          <p className="missed-question">{m.question}</p>
          <div className="missed-answer-row your-answer">Tu respuesta: {m.options[m.yourIndex]}</div>
          <div className="missed-answer-row correct-answer">
            Respuesta correcta: {m.options[m.correctIndex]}
          </div>
          {m.explanation && <p className="missed-explanation">{m.explanation}</p>}
        </div>
      ))}
    </div>
  );
}

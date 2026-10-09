import type { ParsedQuestion, QuestionPatch } from '../types';

interface ReviewItemProps {
  question: ParsedQuestion;
  index: number;
  onChange: (id: string, patch: QuestionPatch) => void;
  onToggleInclude: (id: string) => void;
}

const LETTERS = 'ABCDEFGH';

export default function ReviewItem({ question, index, onChange, onToggleInclude }: ReviewItemProps) {
  function updateOptionText(optionIndex: number, text: string) {
    if (question.kind !== 'choice') return;
    const options = [...question.options];
    options[optionIndex] = text;
    onChange(question.id, { options });
  }

  function selectCorrect(optionIndex: number) {
    if (question.kind !== 'choice') return;
    onChange(question.id, {
      correctIndex: optionIndex,
      status: question.options.length < 2 ? 'error' : 'ok',
    });
  }

  function updateKeywords(text: string) {
    if (question.kind !== 'open') return;
    const keywords = text
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    onChange(question.id, { keywords, status: keywords.length > 0 ? 'ok' : 'error' });
  }

  return (
    <div className={`card review-item status-${question.status}`}>
      <div className="review-item-head">
        <span className="review-item-number mono">#{index + 1}</span>
        {question.status === 'review' && <span className="badge">revisar respuesta</span>}
        {question.status === 'error' && (
          <span className="badge badge-error">
            {question.kind === 'open' ? 'definí al menos una palabra clave' : '2+ opciones requeridas'}
          </span>
        )}
      </div>

      <textarea
        className="q-input"
        rows={2}
        value={question.question}
        onChange={(e) => onChange(question.id, { question: e.target.value })}
        aria-label={`Texto de la pregunta ${index + 1}`}
      />

      {question.kind === 'choice' ? (
        <div style={{ marginTop: 14 }}>
          {question.options.map((option, i) => (
            <div className="option-row" key={i}>
              <input
                type="radio"
                name={`correct-${question.id}`}
                checked={i === question.correctIndex}
                onChange={() => selectCorrect(i)}
                aria-label={`Marcar opción ${LETTERS[i] ?? i + 1} como correcta`}
              />
              <input
                className="q-input"
                value={option}
                onChange={(e) => updateOptionText(i, e.target.value)}
                aria-label={`Texto de la opción ${LETTERS[i] ?? i + 1}`}
              />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ marginTop: 14 }}>
          <label className="muted" style={{ fontSize: '0.85rem' }}>
            Respuesta esperada
          </label>
          <textarea
            className="q-input"
            rows={3}
            value={question.expectedAnswer}
            onChange={(e) => onChange(question.id, { expectedAnswer: e.target.value })}
            aria-label={`Respuesta esperada de la pregunta ${index + 1}`}
          />
          <label className="muted" style={{ fontSize: '0.85rem', marginTop: 10, display: 'block' }}>
            Palabras clave (separadas por coma)
          </label>
          <input
            className="q-input"
            value={question.keywords.join(', ')}
            onChange={(e) => updateKeywords(e.target.value)}
            aria-label={`Palabras clave de la pregunta ${index + 1}`}
          />
        </div>
      )}

      <div className="review-item-footer">
        <span className="muted" style={{ fontSize: '0.85rem' }}>
          {question.include ? 'Incluida en el estudio' : 'Excluida del estudio'}
        </span>
        <button className="btn btn-ghost" onClick={() => onToggleInclude(question.id)}>
          {question.include ? 'Excluir' : 'Incluir'}
        </button>
      </div>
    </div>
  );
}

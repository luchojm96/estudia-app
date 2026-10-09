import type { ParsedQuestion, QuestionPatch, StudyMode } from '../types';
import ReviewItem from './ReviewItem';
import ModeTabs from './ModeTabs';

interface ReviewListProps {
  questions: ParsedQuestion[];
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  studyMode: StudyMode;
  onChangeStudyMode: (mode: StudyMode) => void;
  onToggleShuffleQuestions: (value: boolean) => void;
  onToggleShuffleOptions: (value: boolean) => void;
  onUpdateQuestion: (id: string, patch: QuestionPatch) => void;
  onToggleInclude: (id: string) => void;
  onStart: () => void;
  onBack: () => void;
}

export default function ReviewList({
  questions,
  shuffleQuestions,
  shuffleOptions,
  studyMode,
  onChangeStudyMode,
  onToggleShuffleQuestions,
  onToggleShuffleOptions,
  onUpdateQuestion,
  onToggleInclude,
  onStart,
  onBack,
}: ReviewListProps) {
  const detected = questions.length;
  const ready = questions.filter((q) => q.status === 'ok').length;
  const toReview = questions.filter((q) => q.status === 'review').length;
  const canStart = questions.some((q) => q.include && q.status !== 'error');

  return (
    <div>
      <div className="review-header">
        <h2 style={{ margin: 0 }}>Revisá las preguntas</h2>
        <span className="review-counts">
          {detected} detectadas · {ready} listas · {toReview} por revisar
        </span>
      </div>

      {detected === 0 || !canStart ? (
        <div className="card empty-state">
          <p>No se detectó ninguna pregunta válida en el archivo.</p>
          <p className="muted">Revisá que el formato coincida con el esperado y volvé a intentar.</p>
          <button className="btn btn-secondary" onClick={onBack} style={{ marginTop: 12 }}>
            Cargar otro archivo
          </button>
        </div>
      ) : (
        <>
          <ModeTabs mode={studyMode} onChange={onChangeStudyMode} />

          <div className="review-options-row">
            <label>
              <input
                type="checkbox"
                checked={shuffleQuestions}
                onChange={(e) => onToggleShuffleQuestions(e.target.checked)}
              />
              Mezclar orden de preguntas
            </label>
            <label>
              <input
                type="checkbox"
                checked={shuffleOptions}
                onChange={(e) => onToggleShuffleOptions(e.target.checked)}
              />
              Mezclar orden de opciones
            </label>
          </div>

          {questions.map((q, i) => (
            <ReviewItem
              key={q.id}
              question={q}
              index={i}
              onChange={onUpdateQuestion}
              onToggleInclude={onToggleInclude}
            />
          ))}

          <div className="btn-row" style={{ marginTop: 8 }}>
            <button className="btn btn-primary" onClick={onStart} disabled={!canStart}>
              {studyMode === 'quiz' ? 'Empezar el quiz' : 'Estudiar con flashcards'}
            </button>
            <button className="btn btn-ghost" onClick={onBack}>
              Cargar otro archivo
            </button>
          </div>
        </>
      )}
    </div>
  );
}

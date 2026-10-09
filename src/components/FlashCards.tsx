import { useEffect, useState } from 'react';
import type { FlashcardResult, QuizQuestion } from '../types';
import { scoreOpenAnswer } from '../lib/keywordMatch';

interface FlashCardsProps {
  questions: QuizQuestion[];
  onFinish: (results: FlashcardResult[]) => void;
}

export default function FlashCards({ questions, onFinish }: FlashCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<FlashcardResult[]>([]);
  const [answerText, setAnswerText] = useState('');
  const [graded, setGraded] = useState<ReturnType<typeof scoreOpenAnswer> | null>(null);

  const current = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  function handleFlip() {
    if (current.kind !== 'choice') return;
    setFlipped(true);
  }

  function advance(result: FlashcardResult) {
    const nextResults = [...results, result];
    if (isLast) {
      onFinish(nextResults);
      return;
    }
    setResults(nextResults);
    setCurrentIndex((i) => i + 1);
    setFlipped(false);
    setAnswerText('');
    setGraded(null);
  }

  function handleRate(known: boolean) {
    if (current.kind !== 'choice' || !flipped) return;
    advance({
      kind: 'choice',
      question: current.question,
      options: current.options,
      correctIndex: current.correctIndex,
      explanation: current.explanation,
      known,
    });
  }

  function handleCheckAnswer() {
    if (current.kind !== 'open' || !answerText.trim()) return;
    setGraded(scoreOpenAnswer(answerText, current.keywords));
  }

  function handleConfirmCompleteness(completeness: 'completa' | 'incompleta') {
    if (current.kind !== 'open' || !graded) return;
    advance({
      kind: 'open',
      question: current.question,
      expectedAnswer: current.expectedAnswer,
      keywords: current.keywords,
      userAnswer: answerText,
      matchedKeywords: graded.matched,
      missingKeywords: graded.missing,
      completeness,
    });
  }

  useEffect(() => {
    if (current.kind !== 'choice') return;
    function onKeyDown(e: KeyboardEvent) {
      if (!flipped) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          handleFlip();
        }
        return;
      }
      if (e.key === '1') handleRate(false);
      if (e.key === '2') handleRate(true);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipped, currentIndex, current, results]);

  const progressPct =
    current.kind === 'choice'
      ? ((currentIndex + (flipped ? 1 : 0)) / questions.length) * 100
      : ((currentIndex + (graded ? 1 : 0)) / questions.length) * 100;

  return (
    <div>
      <div className="quiz-meta">
        <span>
          Carta {currentIndex + 1} / {questions.length}
        </span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      {current.kind === 'choice' ? (
        <>
          <div className="flashcard-stage">
            <div
              className={`flashcard-card${flipped ? ' is-flipped' : ''}`}
              onClick={() => !flipped && handleFlip()}
              role="button"
              tabIndex={0}
            >
              <div className="flashcard-face flashcard-front">
                <span className="flashcard-label mono">Pregunta</span>
                <p className="flashcard-question">{current.question}</p>
                <p className="muted flashcard-hint">Clic o espacio para ver la respuesta</p>
              </div>
              <div className="flashcard-face flashcard-back">
                <span className="flashcard-label mono">Respuesta</span>
                <p className="flashcard-answer">{current.options[current.correctIndex]}</p>
                {current.explanation && <p className="flashcard-explanation">{current.explanation}</p>}
              </div>
            </div>
          </div>

          {flipped && (
            <div className="btn-row flashcard-rate-row">
              <button className="btn btn-danger-ghost" onClick={() => handleRate(false)}>
                No la sé
              </button>
              <button className="btn btn-primary" onClick={() => handleRate(true)}>
                La sé
              </button>
            </div>
          )}

          <p className="kbd-hint">
            {flipped ? 'Atajos: 1 = No la sé · 2 = La sé' : 'Atajos: espacio o Enter para voltear'}
          </p>
        </>
      ) : (
        <div className="card" style={{ marginTop: 20 }}>
          <span className="flashcard-label mono">Pregunta de desarrollo</span>
          <p className="quiz-question">{current.question}</p>

          {!graded ? (
            <>
              <textarea
                className="q-input"
                rows={5}
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Escribí tu respuesta con tus propias palabras..."
                aria-label="Tu respuesta"
              />
              <div className="quiz-actions">
                <button className="btn btn-primary" onClick={handleCheckAnswer} disabled={!answerText.trim()}>
                  Comprobar respuesta
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="missed-answer-row your-answer">Tu respuesta: {answerText}</div>
              <div className="missed-answer-row correct-answer">Respuesta esperada: {current.expectedAnswer}</div>

              <div className="keyword-chip-row">
                {graded.matched.map((kw) => (
                  <span className="keyword-chip keyword-chip-matched" key={`m-${kw}`}>
                    ✓ {kw}
                  </span>
                ))}
                {graded.missing.map((kw) => (
                  <span className="keyword-chip keyword-chip-missing" key={`x-${kw}`}>
                    {kw}
                  </span>
                ))}
              </div>

              <div className={`feedback-panel ${graded.completeness === 'completa' ? 'correct' : 'incorrect'}`}>
                Sugerencia: {graded.completeness === 'completa' ? 'Completa' : 'Incompleta'} (
                {graded.matched.length}/{graded.matched.length + graded.missing.length} palabras clave)
              </div>

              <div className="btn-row flashcard-rate-row">
                <button
                  className={graded.completeness === 'incompleta' ? 'btn btn-danger-ghost' : 'btn btn-ghost'}
                  onClick={() => handleConfirmCompleteness('incompleta')}
                >
                  Incompleta
                </button>
                <button
                  className={graded.completeness === 'completa' ? 'btn btn-primary' : 'btn btn-secondary'}
                  onClick={() => handleConfirmCompleteness('completa')}
                >
                  Completa
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

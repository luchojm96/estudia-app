import { useEffect, useState } from 'react';
import type { ChoiceQuizQuestion, MissedAnswer } from '../types';
import QuizOption from './QuizOption';

interface QuizProps {
  questions: ChoiceQuizQuestion[];
  onFinish: (missed: MissedAnswer[], score: number) => void;
}

const LETTERS = 'ABCDEFGH';

export default function Quiz({ questions, onFinish }: QuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState<MissedAnswer[]>([]);

  const current = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const answered = selectedIndex !== null;

  function handleSelect(optionIndex: number) {
    if (answered) return;
    setSelectedIndex(optionIndex);
    const correct = optionIndex === current.correctIndex;
    if (correct) {
      setScore((s) => s + 1);
    } else {
      setMissed((m) => [
        ...m,
        {
          question: current.question,
          options: current.options,
          correctIndex: current.correctIndex,
          yourIndex: optionIndex,
          explanation: current.explanation,
        },
      ]);
    }
  }

  function handleNext() {
    if (!answered) return;
    if (isLast) {
      onFinish(missed, score);
      return;
    }
    setCurrentIndex((i) => i + 1);
    setSelectedIndex(null);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!answered) {
        const num = Number(e.key);
        if (num >= 1 && num <= current.options.length) {
          handleSelect(num - 1);
        }
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answered, currentIndex, current]);

  function optionStatus(optionIndex: number): 'default' | 'correct' | 'incorrect' | 'muted' {
    if (!answered) return 'default';
    if (optionIndex === current.correctIndex) return 'correct';
    if (optionIndex === selectedIndex) return 'incorrect';
    return 'muted';
  }

  const isCorrect = answered && selectedIndex === current.correctIndex;

  return (
    <div>
      <div className="quiz-meta">
        <span>
          Pregunta {currentIndex + 1} / {questions.length}
        </span>
        <span>{score} aciertos</span>
      </div>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${((currentIndex + (answered ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <p className="quiz-question">{current.question}</p>

        {current.options.map((option, i) => (
          <QuizOption
            key={i}
            letter={LETTERS[i] ?? String(i + 1)}
            text={option}
            status={optionStatus(i)}
            disabled={answered}
            onClick={() => handleSelect(i)}
          />
        ))}

        {answered && (
          <div
            className={`feedback-panel ${isCorrect ? 'correct' : 'incorrect'}`}
            aria-live="polite"
          >
            {isCorrect ? '¡Correcto!' : 'No es correcta'}
            {current.explanation && <div className="feedback-explanation">{current.explanation}</div>}
          </div>
        )}

        <div className="quiz-actions">
          <button className="btn btn-primary" onClick={handleNext} disabled={!answered}>
            {isLast ? 'Ver resultado' : 'Siguiente'}
          </button>
        </div>
      </div>

      <p className="kbd-hint">
        Atajos: teclas 1–{Math.min(current.options.length, 8)} para elegir · Enter o espacio para
        avanzar
      </p>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import type { ChoiceQuizQuestion, ExamAnswer, ExamChoiceAnswer, ExamOpenAnswer, OpenQuizQuestion } from '../types';
import { scoreOpenAnswer } from '../lib/keywordMatch';
import QuizOption from './QuizOption';

interface ExamProps {
  choiceQuestions: ChoiceQuizQuestion[];
  openQuestions: OpenQuizQuestion[];
  durationMs: number;
  startedAt: number;
  onFinish: (answers: ExamAnswer[]) => void;
}

const LETTERS = 'ABCDEFGH';

type Phase = 'choice' | 'open';

export default function Exam({ choiceQuestions, openQuestions, durationMs, startedAt, onFinish }: ExamProps) {
  const [phase, setPhase] = useState<Phase>(choiceQuestions.length > 0 ? 'choice' : 'open');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<ExamAnswer[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [graded, setGraded] = useState<ReturnType<typeof scoreOpenAnswer> | null>(null);
  const finishedRef = useRef(false);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const totalQuestions = choiceQuestions.length + openQuestions.length;
  const currentChoice = phase === 'choice' ? choiceQuestions[currentIndex] : undefined;
  const currentOpen = phase === 'open' ? openQuestions[currentIndex] : undefined;

  function finish(finalAnswers: ExamAnswer[]) {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish(finalAnswers);
  }

  function buildTimeoutAnswers(soFar: ExamAnswer[]): ExamAnswer[] {
    const result = [...soFar];
    const answeredChoiceCount = result.filter((a) => a.kind === 'choice').length;
    for (let i = answeredChoiceCount; i < choiceQuestions.length; i += 1) {
      const q = choiceQuestions[i];
      result.push({
        kind: 'choice',
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        yourIndex: null,
        explanation: q.explanation,
        correct: false,
      });
    }
    const answeredOpenCount = result.filter((a) => a.kind === 'open').length;
    for (let i = answeredOpenCount; i < openQuestions.length; i += 1) {
      const q = openQuestions[i];
      result.push({
        kind: 'open',
        question: q.question,
        expectedAnswer: q.expectedAnswer,
        keywords: q.keywords,
        userAnswer: '',
        matchedKeywords: [],
        missingKeywords: q.keywords,
        completeness: 'incompleta',
      });
    }
    return result;
  }

  useEffect(() => {
    const id = setInterval(() => {
      if (Date.now() - startedAt >= durationMs) {
        finish(buildTimeoutAnswers(answersRef.current));
      }
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startedAt, durationMs]);

  function advance(answer: ExamAnswer) {
    const next = [...answers, answer];
    setAnswers(next);
    setSelectedIndex(null);
    setAnswerText('');
    setGraded(null);

    const isLastInPhase =
      phase === 'choice' ? currentIndex === choiceQuestions.length - 1 : currentIndex === openQuestions.length - 1;

    if (isLastInPhase) {
      if (phase === 'choice' && openQuestions.length > 0) {
        setPhase('open');
        setCurrentIndex(0);
      } else {
        finish(next);
      }
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  function commitChoice() {
    if (!currentChoice || selectedIndex === null) return;
    const answer: ExamChoiceAnswer = {
      kind: 'choice',
      question: currentChoice.question,
      options: currentChoice.options,
      correctIndex: currentChoice.correctIndex,
      yourIndex: selectedIndex,
      explanation: currentChoice.explanation,
      correct: selectedIndex === currentChoice.correctIndex,
    };
    advance(answer);
  }

  function handleCheckAnswer() {
    if (!currentOpen || !answerText.trim()) return;
    setGraded(scoreOpenAnswer(answerText, currentOpen.keywords));
  }

  function commitOpen(completeness: 'completa' | 'incompleta') {
    if (!currentOpen || !graded) return;
    const answer: ExamOpenAnswer = {
      kind: 'open',
      question: currentOpen.question,
      expectedAnswer: currentOpen.expectedAnswer,
      keywords: currentOpen.keywords,
      userAnswer: answerText,
      matchedKeywords: graded.matched,
      missingKeywords: graded.missing,
      completeness,
    };
    advance(answer);
  }

  const progressPct = totalQuestions === 0 ? 0 : (answers.length / totalQuestions) * 100;
  const partLabel = phase === 'choice' ? 'Parte I: Opción múltiple' : 'Parte II: Desarrollo';
  const positionInPhase =
    phase === 'choice' ? `${currentIndex + 1} / ${choiceQuestions.length}` : `${currentIndex + 1} / ${openQuestions.length}`;

  return (
    <div>
      <div className="quiz-meta">
        <span className="mono">{partLabel}</span>
        <span>Pregunta {positionInPhase}</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      {currentChoice && (
        <div className="card" style={{ marginTop: 20 }}>
          <p className="quiz-question">{currentChoice.question}</p>

          {currentChoice.options.map((option, i) => (
            <QuizOption
              key={i}
              letter={LETTERS[i] ?? String(i + 1)}
              text={option}
              status={i === selectedIndex ? 'selected' : 'default'}
              disabled={false}
              onClick={() => setSelectedIndex(i)}
            />
          ))}

          <div className="quiz-actions">
            <button className="btn btn-primary" onClick={commitChoice} disabled={selectedIndex === null}>
              Siguiente
            </button>
          </div>
        </div>
      )}

      {currentOpen && (
        <div className="card" style={{ marginTop: 20 }}>
          <span className="flashcard-label mono">Pregunta de desarrollo</span>
          <p className="quiz-question">{currentOpen.question}</p>

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
              <div className="missed-answer-row correct-answer">Respuesta esperada: {currentOpen.expectedAnswer}</div>

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
                  onClick={() => commitOpen('incompleta')}
                >
                  Incompleta
                </button>
                <button
                  className={graded.completeness === 'completa' ? 'btn btn-primary' : 'btn btn-secondary'}
                  onClick={() => commitOpen('completa')}
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

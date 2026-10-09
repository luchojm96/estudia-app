import { useEffect, useState } from 'react';
import type {
  ChoiceQuizQuestion,
  ExamAnswer,
  ExamConfig,
  FlashcardResult,
  MissedAnswer,
  OpenQuizQuestion,
  ParsedQuestion,
  QuestionPatch,
  QuizQuestion,
  Screen,
  StoredQuizSet,
  StudyMode,
} from './types';
import { parseQuestionsFromText } from './lib/parseMarkdown';
import { parseJSONQuestions, JsonParseError } from './lib/parseJson';
import { shuffle } from './lib/shuffle';
import { persistSet, loadPersisted, clearPersisted } from './lib/storage';
import { computeFileAvailability, sampleQuestionsByFile } from './lib/examSampling';
import { demoQuestionsJson } from './data/demoQuestions';
import Landing from './components/Landing';
import ReviewList from './components/ReviewList';
import Quiz from './components/Quiz';
import Results from './components/Results';
import FlashCards from './components/FlashCards';
import FlashcardResults from './components/FlashcardResults';
import ExamSetup from './components/ExamSetup';
import Exam from './components/Exam';
import ExamResults from './components/ExamResults';
import ModeTabs from './components/ModeTabs';
import Timer from './components/Timer';

const STUDY_SCREENS: Screen[] = ['quiz', 'flashcards', 'results', 'flashcard-results'];
const IN_PROGRESS_SCREENS: Screen[] = ['quiz', 'flashcards', 'exam'];

function buildQuizSet(
  questions: ParsedQuestion[],
  shuffleQuestions: boolean,
  shuffleOptions: boolean,
): QuizQuestion[] {
  let list: QuizQuestion[] = questions
    .filter((q) => q.include && q.status !== 'error')
    .map((q): QuizQuestion =>
      q.kind === 'open'
        ? { kind: 'open', question: q.question, expectedAnswer: q.expectedAnswer, keywords: [...q.keywords] }
        : { kind: 'choice', question: q.question, options: [...q.options], correctIndex: q.correctIndex, explanation: q.explanation },
    );

  if (shuffleQuestions) list = shuffle(list);
  if (shuffleOptions) list = list.map((q) => (q.kind === 'choice' ? shuffleQuestionOptions(q) : q));

  return list;
}

function shuffleQuestionOptions(q: ChoiceQuizQuestion): ChoiceQuizQuestion {
  const order = shuffle(q.options.map((_, i) => i));
  const options = order.map((i) => q.options[i]);
  const correctIndex = order.indexOf(q.correctIndex);
  return { ...q, options, correctIndex };
}

function isChoiceQuizQuestion(q: QuizQuestion): q is ChoiceQuizQuestion {
  return q.kind === 'choice';
}

function toQuizQuestion(q: ParsedQuestion): QuizQuestion {
  return q.kind === 'open'
    ? { kind: 'open', question: q.question, expectedAnswer: q.expectedAnswer, keywords: [...q.keywords] }
    : { kind: 'choice', question: q.question, options: [...q.options], correctIndex: q.correctIndex, explanation: q.explanation };
}

async function parseFile(file: File): Promise<ParsedQuestion[]> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

  if (ext === 'json') {
    return parseJSONQuestions(await file.text());
  }
  if (ext === 'pdf') {
    const { extractPdfText } = await import('./lib/parsePdf');
    return parseQuestionsFromText(await extractPdfText(file));
  }
  if (ext === 'md' || ext === 'markdown' || ext === 'txt') {
    return parseQuestionsFromText(await file.text());
  }
  throw new Error('Formato de archivo no soportado. Usá .pdf, .md, .txt o .json.');
}

function buildSourceName(names: string[]): string {
  if (names.length === 1) return names[0];
  return `${names.length} archivos combinados: ${names.join(', ')}`;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [persisted, setPersisted] = useState<StoredQuizSet | null>(null);

  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [sourceName, setSourceName] = useState('');
  const [shuffleQuestionsOpt, setShuffleQuestionsOpt] = useState(false);
  const [shuffleOptionsOpt, setShuffleOptionsOpt] = useState(false);
  const [studyMode, setStudyMode] = useState<StudyMode>('quiz');

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizRunId, setQuizRunId] = useState(0);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState<MissedAnswer[]>([]);

  const [flashcardRunId, setFlashcardRunId] = useState(0);
  const [flashcardResults, setFlashcardResults] = useState<FlashcardResult[]>([]);

  const [studyStartedAt, setStudyStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);

  const [examQuestions, setExamQuestions] = useState<ParsedQuestion[]>([]);
  const [examChoiceQuestions, setExamChoiceQuestions] = useState<ChoiceQuizQuestion[]>([]);
  const [examOpenQuestions, setExamOpenQuestions] = useState<OpenQuizQuestion[]>([]);
  const [examDurationMs, setExamDurationMs] = useState(0);
  const [examStartedAt, setExamStartedAt] = useState<number | null>(null);
  const [examAnswers, setExamAnswers] = useState<ExamAnswer[]>([]);
  const [examElapsedMs, setExamElapsedMs] = useState<number | null>(null);

  useEffect(() => {
    setPersisted(loadPersisted());
  }, []);

  async function handleFilesSelected(files: File[]) {
    setLoading(true);
    setError(null);

    const allQuestions: ParsedQuestion[] = [];
    const failed: string[] = [];

    for (const file of files) {
      try {
        allQuestions.push(...(await parseFile(file)));
      } catch (e) {
        failed.push(file.name + (e instanceof JsonParseError ? ` (${e.message})` : ''));
      }
    }

    setLoading(false);

    if (allQuestions.length === 0) {
      setError(
        files.length === 1
          ? 'No se pudo procesar el archivo. Revisá el formato e intentá de nuevo.'
          : `No se pudo procesar ningún archivo: ${failed.join(', ')}`,
      );
      return;
    }

    if (failed.length > 0) {
      window.alert(
        `No se pudieron leer ${failed.length} archivo(s): ${failed.join(', ')}.\nSe cargaron las preguntas del resto.`,
      );
    }

    setQuestions(allQuestions);
    setSourceName(buildSourceName(files.map((f) => f.name)));
    setScreen('review');
  }

  function handleLoadDemo() {
    setError(null);
    const parsed = parseJSONQuestions(demoQuestionsJson);
    setQuestions(parsed);
    setSourceName('Preguntas de ejemplo');
    setScreen('review');
  }

  function handleContinue() {
    if (!persisted) return;
    const mode = persisted.lastMode ?? 'quiz';
    setStudyMode(mode);
    setQuizQuestions(persisted.questions);
    setStudyStartedAt(Date.now());
    setElapsedMs(null);
    if (mode === 'quiz') {
      setQuizRunId((id) => id + 1);
      setScore(0);
      setMissed([]);
      setScreen('quiz');
    } else {
      setFlashcardRunId((id) => id + 1);
      setScreen('flashcards');
    }
  }

  function handleDiscard() {
    clearPersisted();
    setPersisted(null);
  }

  function handleUpdateQuestion(id: string, patch: QuestionPatch) {
    setQuestions((qs) => qs.map((q) => (q.id === id ? ({ ...q, ...patch } as ParsedQuestion) : q)));
  }

  function handleToggleInclude(id: string) {
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, include: !q.include } : q)));
  }

  function handleStartStudy() {
    const set = buildQuizSet(questions, shuffleQuestionsOpt, shuffleOptionsOpt);
    persistSet({ sourceName, savedAt: Date.now(), questions: set, lastMode: studyMode });
    setPersisted({ sourceName, savedAt: Date.now(), questions: set, lastMode: studyMode });
    setQuizQuestions(set);
    setStudyStartedAt(Date.now());
    setElapsedMs(null);
    if (studyMode === 'quiz') {
      setQuizRunId((id) => id + 1);
      setScore(0);
      setMissed([]);
      setScreen('quiz');
    } else {
      setFlashcardRunId((id) => id + 1);
      setScreen('flashcards');
    }
  }

  function handleQuizFinish(missedAnswers: MissedAnswer[], finalScore: number) {
    setElapsedMs(studyStartedAt !== null ? Date.now() - studyStartedAt : null);
    setMissed(missedAnswers);
    setScore(finalScore);
    setScreen('results');
  }

  function handleRestartAll() {
    setQuizRunId((id) => id + 1);
    setScore(0);
    setMissed([]);
    setStudyStartedAt(Date.now());
    setElapsedMs(null);
    setScreen('quiz');
  }

  function handleReviewMissed() {
    const set: QuizQuestion[] = missed.map((m) => ({
      kind: 'choice',
      question: m.question,
      options: m.options,
      correctIndex: m.correctIndex,
      explanation: m.explanation,
    }));
    setQuizQuestions(set);
    setQuizRunId((id) => id + 1);
    setScore(0);
    setMissed([]);
    setStudyStartedAt(Date.now());
    setElapsedMs(null);
    setScreen('quiz');
  }

  function handleFlashcardsFinish(results: FlashcardResult[]) {
    setElapsedMs(studyStartedAt !== null ? Date.now() - studyStartedAt : null);
    setFlashcardResults(results);
    setScreen('flashcard-results');
  }

  function handleRestartFlashcards() {
    setFlashcardRunId((id) => id + 1);
    setStudyStartedAt(Date.now());
    setElapsedMs(null);
    setScreen('flashcards');
  }

  function handleReviewUnknownFlashcards() {
    const set: QuizQuestion[] = flashcardResults
      .filter((r) => (r.kind === 'choice' ? !r.known : r.completeness !== 'completa'))
      .map((r): QuizQuestion =>
        r.kind === 'open'
          ? { kind: 'open', question: r.question, expectedAnswer: r.expectedAnswer, keywords: r.keywords }
          : { kind: 'choice', question: r.question, options: r.options, correctIndex: r.correctIndex, explanation: r.explanation },
      );
    setQuizQuestions(set);
    setFlashcardRunId((id) => id + 1);
    setStudyStartedAt(Date.now());
    setElapsedMs(null);
    setScreen('flashcards');
  }

  function handleSwitchMode(mode: StudyMode) {
    if (mode === studyMode && STUDY_SCREENS.includes(screen)) return;
    setStudyMode(mode);
    setPersisted((p) => {
      if (!p) return p;
      const updated = { ...p, lastMode: mode };
      persistSet(updated);
      return updated;
    });
    setStudyStartedAt(Date.now());
    setElapsedMs(null);
    if (mode === 'quiz') {
      setQuizRunId((id) => id + 1);
      setScore(0);
      setMissed([]);
      setScreen('quiz');
    } else {
      setFlashcardRunId((id) => id + 1);
      setScreen('flashcards');
    }
  }

  function handleLoadAnother() {
    setQuestions([]);
    setQuizQuestions([]);
    setScore(0);
    setMissed([]);
    setFlashcardResults([]);
    setStudyMode('quiz');
    setStudyStartedAt(null);
    setElapsedMs(null);
    setError(null);
    setExamQuestions([]);
    setExamChoiceQuestions([]);
    setExamOpenQuestions([]);
    setExamAnswers([]);
    setExamStartedAt(null);
    setExamElapsedMs(null);
    setScreen('landing');
  }

  function handleGoHome() {
    if (IN_PROGRESS_SCREENS.includes(screen)) {
      const confirmed = window.confirm('¿Salir de la prueba? Se perderá el progreso actual.');
      if (!confirmed) return;
    }
    handleLoadAnother();
  }

  async function handleExamFilesSelected(files: File[]) {
    setLoading(true);
    setError(null);

    const allQuestions: ParsedQuestion[] = [];
    const failed: string[] = [];

    for (const file of files) {
      try {
        const parsed = await parseFile(file);
        allQuestions.push(...parsed.map((q) => ({ ...q, sourceFile: file.name })));
      } catch (e) {
        failed.push(file.name + (e instanceof JsonParseError ? ` (${e.message})` : ''));
      }
    }

    setLoading(false);

    if (allQuestions.length === 0) {
      setError(
        files.length === 1
          ? 'No se pudo procesar el archivo. Revisá el formato e intentá de nuevo.'
          : `No se pudo procesar ningún archivo: ${failed.join(', ')}`,
      );
      return;
    }

    if (failed.length > 0) {
      window.alert(
        `No se pudieron leer ${failed.length} archivo(s): ${failed.join(', ')}.\nSe cargaron las preguntas del resto.`,
      );
    }

    setExamQuestions(allQuestions);
    setScreen('exam-setup');
  }

  function handleExamConfigConfirm(config: ExamConfig) {
    const choicePool = examQuestions.filter(
      (q): q is Extract<ParsedQuestion, { kind: 'choice' }> =>
        q.kind === 'choice' && q.include && q.status !== 'error' && q.status !== 'review',
    );
    const openPool = examQuestions.filter(
      (q): q is Extract<ParsedQuestion, { kind: 'open' }> =>
        q.kind === 'open' && q.include && q.status !== 'error' && q.status !== 'review',
    );

    const choiceSampled = config.choice
      ? sampleQuestionsByFile(choicePool, config.choice.totalRequested, config.choice.filePercentages, 'choice')
      : { sampled: [] };
    const openSampled = config.open
      ? sampleQuestionsByFile(openPool, config.open.totalRequested, config.open.filePercentages, 'open')
      : { sampled: [] };

    setExamChoiceQuestions(choiceSampled.sampled.map(toQuizQuestion) as ChoiceQuizQuestion[]);
    setExamOpenQuestions(openSampled.sampled.map(toQuizQuestion) as OpenQuizQuestion[]);
    setExamDurationMs(config.durationMinutes * 60_000);
    setExamAnswers([]);
    setExamElapsedMs(null);
    setExamStartedAt(Date.now());
    setScreen('exam');
  }

  function handleExamFinish(answers: ExamAnswer[]) {
    setExamElapsedMs(examStartedAt !== null ? Date.now() - examStartedAt : null);
    setExamAnswers(answers);
    setScreen('exam-results');
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="app-title">
          <button type="button" className="app-title-btn" onClick={handleGoHome}>
            Estudi<span>a</span>
          </button>
        </h1>
        {screen !== 'exam' && IN_PROGRESS_SCREENS.includes(screen) && studyStartedAt !== null && (
          <Timer startedAt={studyStartedAt} />
        )}
        {screen === 'exam' && examStartedAt !== null && (
          <Timer startedAt={examStartedAt} durationMs={examDurationMs} />
        )}
      </header>

      {screen === 'landing' && (
        <Landing
          persisted={persisted}
          loading={loading}
          error={error}
          onFilesSelected={handleFilesSelected}
          onLoadDemo={handleLoadDemo}
          onContinue={handleContinue}
          onDiscard={handleDiscard}
          onExamFilesSelected={handleExamFilesSelected}
        />
      )}

      {screen === 'exam-setup' && (
        <ExamSetup
          choiceFiles={computeFileAvailability(examQuestions, 'choice')}
          openFiles={computeFileAvailability(examQuestions, 'open')}
          onStart={handleExamConfigConfirm}
          onBack={handleLoadAnother}
        />
      )}

      {screen === 'review' && (
        <ReviewList
          questions={questions}
          shuffleQuestions={shuffleQuestionsOpt}
          shuffleOptions={shuffleOptionsOpt}
          studyMode={studyMode}
          onChangeStudyMode={setStudyMode}
          onToggleShuffleQuestions={setShuffleQuestionsOpt}
          onToggleShuffleOptions={setShuffleOptionsOpt}
          onUpdateQuestion={handleUpdateQuestion}
          onToggleInclude={handleToggleInclude}
          onStart={handleStartStudy}
          onBack={handleLoadAnother}
        />
      )}

      {(screen === 'quiz' || screen === 'flashcards') && (
        <div className="study-toolbar">
          <ModeTabs mode={studyMode} onChange={handleSwitchMode} />
          <button className="btn btn-ghost" onClick={handleGoHome}>
            Salir
          </button>
        </div>
      )}

      {screen === 'exam' && (
        <div className="study-toolbar">
          <span className="mono muted">Examen en curso</span>
          <button className="btn btn-ghost" onClick={handleGoHome}>
            Salir
          </button>
        </div>
      )}

      {(screen === 'results' || screen === 'flashcard-results') && (
        <ModeTabs mode={studyMode} onChange={handleSwitchMode} />
      )}

      {screen === 'quiz' && (
        (() => {
          const choiceQuestions = quizQuestions.filter(isChoiceQuizQuestion);
          if (choiceQuestions.length === 0) {
            return (
              <div className="card empty-state">
                <p>Este set solo tiene preguntas de desarrollo.</p>
                <p className="muted">Usá el modo Flashcards para estudiarlas.</p>
                <button className="btn btn-secondary" onClick={() => handleSwitchMode('flashcards')} style={{ marginTop: 12 }}>
                  Ir a Flashcards
                </button>
              </div>
            );
          }
          return <Quiz key={quizRunId} questions={choiceQuestions} onFinish={handleQuizFinish} />;
        })()
      )}

      {screen === 'flashcards' && (
        <FlashCards key={flashcardRunId} questions={quizQuestions} onFinish={handleFlashcardsFinish} />
      )}

      {screen === 'results' && (
        <Results
          score={score}
          total={quizQuestions.length}
          missed={missed}
          elapsedMs={elapsedMs}
          onRestartAll={handleRestartAll}
          onReviewMissed={handleReviewMissed}
          onLoadAnother={handleLoadAnother}
        />
      )}

      {screen === 'flashcard-results' && (
        <FlashcardResults
          results={flashcardResults}
          elapsedMs={elapsedMs}
          onRestartAll={handleRestartFlashcards}
          onReviewUnknown={handleReviewUnknownFlashcards}
          onLoadAnother={handleLoadAnother}
        />
      )}

      {screen === 'exam' && examStartedAt !== null && (
        <Exam
          choiceQuestions={examChoiceQuestions}
          openQuestions={examOpenQuestions}
          durationMs={examDurationMs}
          startedAt={examStartedAt}
          onFinish={handleExamFinish}
        />
      )}

      {screen === 'exam-results' && (
        <ExamResults
          answers={examAnswers}
          choiceTotal={examChoiceQuestions.length}
          openTotal={examOpenQuestions.length}
          elapsedMs={examElapsedMs}
          onLoadAnother={handleLoadAnother}
        />
      )}
    </div>
  );
}

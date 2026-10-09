import type { StudyMode } from '../types';

interface ModeTabsProps {
  mode: StudyMode;
  onChange: (mode: StudyMode) => void;
}

export default function ModeTabs({ mode, onChange }: ModeTabsProps) {
  return (
    <div className="mode-tabs" role="tablist" aria-label="Modo de estudio">
      <button
        className={`mode-tab${mode === 'quiz' ? ' active' : ''}`}
        onClick={() => onChange('quiz')}
        role="tab"
        aria-selected={mode === 'quiz'}
        type="button"
      >
        Quiz
      </button>
      <button
        className={`mode-tab${mode === 'flashcards' ? ' active' : ''}`}
        onClick={() => onChange('flashcards')}
        role="tab"
        aria-selected={mode === 'flashcards'}
        type="button"
      >
        Flashcards
      </button>
    </div>
  );
}

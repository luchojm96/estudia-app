interface QuizOptionProps {
  letter: string;
  text: string;
  status: 'default' | 'correct' | 'incorrect' | 'muted' | 'selected';
  disabled: boolean;
  onClick: () => void;
}

export default function QuizOption({ letter, text, status, disabled, onClick }: QuizOptionProps) {
  const statusClass = status === 'default' ? '' : ` ${status}`;
  return (
    <button
      className={`quiz-option${statusClass}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span className="option-badge">{letter}</span>
      <span>{text}</span>
    </button>
  );
}

import { useMemo, useState } from 'react';
import type { ExamConfig } from '../types';
import { buildSamplePlan, type FileAvailability } from '../lib/examSampling';

interface ExamSetupProps {
  choiceFiles: FileAvailability[];
  openFiles: FileAvailability[];
  onStart: (config: ExamConfig) => void;
  onBack: () => void;
}

interface SectionState {
  totalRequested: number;
  filePercentages: Record<string, number>;
}

function equalSplit(files: FileAvailability[]): Record<string, number> {
  const n = files.length;
  const result: Record<string, number> = {};
  if (n === 0) return result;
  const base = Math.floor(100 / n);
  const remainder = 100 - base * n;
  files.forEach((f, i) => {
    result[f.sourceFile] = base + (i < remainder ? 1 : 0);
  });
  return result;
}

function defaultTotal(files: FileAvailability[]): number {
  const sum = files.reduce((s, f) => s + f.available, 0);
  return Math.max(1, Math.min(sum, 50));
}

function sumPercentages(pcts: Record<string, number>): number {
  return Object.values(pcts).reduce((s, v) => s + (Number.isFinite(v) ? v : 0), 0);
}

function SectionEditor({
  title,
  files,
  state,
  onChange,
}: {
  title: string;
  files: FileAvailability[];
  state: SectionState;
  onChange: (next: SectionState) => void;
}) {
  const plan = useMemo(
    () => buildSamplePlan(state.totalRequested, state.filePercentages, files),
    [state, files],
  );
  const pctSum = sumPercentages(state.filePercentages);
  const totalTake = plan.reduce((s, p) => s + p.take, 0);
  const shortfalls = plan.filter((p) => p.take < p.requested);

  function updatePct(sourceFile: string, value: number) {
    onChange({ ...state, filePercentages: { ...state.filePercentages, [sourceFile]: value } });
  }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>

      <label className="muted" style={{ fontSize: '0.85rem' }}>
        Cantidad total de preguntas
      </label>
      <input
        className="q-input"
        type="number"
        min={1}
        value={state.totalRequested}
        onChange={(e) => onChange({ ...state, totalRequested: Math.max(0, Number(e.target.value)) })}
      />

      <div style={{ marginTop: 14 }}>
        {files.map((f) => {
          const planItem = plan.find((p) => p.sourceFile === f.sourceFile);
          const short = Boolean(planItem && planItem.take < planItem.requested);
          return (
            <div className="option-row" key={f.sourceFile}>
              <span className="mono" style={{ flex: 1, fontSize: '0.85rem' }}>
                {f.sourceFile} <span className="muted">({f.available} disponibles)</span>
              </span>
              <input
                className="q-input"
                style={{ width: 80 }}
                type="number"
                min={0}
                max={100}
                value={state.filePercentages[f.sourceFile] ?? 0}
                onChange={(e) => updatePct(f.sourceFile, Number(e.target.value))}
                aria-label={`Porcentaje de ${f.sourceFile}`}
              />
              <span className="muted mono" style={{ width: 90, textAlign: 'right' }}>
                {planItem ? `${planItem.take}/${planItem.requested}` : '0/0'}
                {short && ' ⚠'}
              </span>
            </div>
          );
        })}
      </div>

      <div className="muted" style={{ marginTop: 8, fontSize: '0.85rem' }}>
        Suma de porcentajes: {pctSum}% {pctSum !== 100 && '(debe sumar 100%)'}
      </div>

      {shortfalls.length > 0 && (
        <div className="error-banner" style={{ marginTop: 10 }}>
          Se van a generar {totalTake} de {state.totalRequested} preguntas pedidas:{' '}
          {shortfalls
            .map((s) => {
              const available = files.find((f) => f.sourceFile === s.sourceFile)?.available ?? 0;
              return `${s.sourceFile} solo tiene ${available}`;
            })
            .join(', ')}
          .
        </div>
      )}
    </div>
  );
}

export default function ExamSetup({ choiceFiles, openFiles, onStart, onBack }: ExamSetupProps) {
  const [choiceState, setChoiceState] = useState<SectionState>(() => ({
    totalRequested: defaultTotal(choiceFiles),
    filePercentages: equalSplit(choiceFiles),
  }));
  const [openState, setOpenState] = useState<SectionState>(() => ({
    totalRequested: defaultTotal(openFiles),
    filePercentages: equalSplit(openFiles),
  }));
  const [durationMinutes, setDurationMinutes] = useState(60);

  const hasChoice = choiceFiles.length > 0;
  const hasOpen = openFiles.length > 0;

  const choicePctOk = !hasChoice || sumPercentages(choiceState.filePercentages) === 100;
  const openPctOk = !hasOpen || sumPercentages(openState.filePercentages) === 100;
  const canStart =
    choicePctOk &&
    openPctOk &&
    durationMinutes > 0 &&
    (!hasChoice || choiceState.totalRequested > 0) &&
    (!hasOpen || openState.totalRequested > 0);

  function handleStart() {
    onStart({
      choice: hasChoice ? choiceState : null,
      open: hasOpen ? openState : null,
      durationMinutes,
    });
  }

  return (
    <div>
      <h2>Configurá tu examen</h2>

      {hasChoice && (
        <SectionEditor title="Opción múltiple" files={choiceFiles} state={choiceState} onChange={setChoiceState} />
      )}
      {hasOpen && <SectionEditor title="Desarrollo" files={openFiles} state={openState} onChange={setOpenState} />}

      <div className="card">
        <label className="muted" style={{ fontSize: '0.85rem' }}>
          Duración del examen (minutos)
        </label>
        <input
          className="q-input"
          type="number"
          min={1}
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(Math.max(0, Number(e.target.value)))}
        />
      </div>

      <div className="btn-row" style={{ marginTop: 8 }}>
        <button className="btn btn-primary" onClick={handleStart} disabled={!canStart}>
          Empezar examen
        </button>
        <button className="btn btn-ghost" onClick={onBack}>
          Cargar otro archivo
        </button>
      </div>
    </div>
  );
}

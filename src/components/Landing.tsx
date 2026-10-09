import { useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import type { StoredQuizSet } from '../types';
import { formatRelativeTime } from '../lib/storage';

interface LandingProps {
  persisted: StoredQuizSet | null;
  loading: boolean;
  error: string | null;
  onFilesSelected: (files: File[]) => void;
  onLoadDemo: () => void;
  onContinue: () => void;
  onDiscard: () => void;
  onExamFilesSelected: (files: File[]) => void;
}

const ACCEPTED_EXTENSIONS = '.pdf,.md,.markdown,.txt,.json';

export default function Landing({
  persisted,
  loading,
  error,
  onFilesSelected,
  onLoadDemo,
  onContinue,
  onDiscard,
  onExamFilesSelected,
}: LandingProps) {
  const [dragging, setDragging] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const examInputRef = useRef<HTMLInputElement>(null);

  function handleExamInputChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length > 0) onExamFilesSelected(files);
  }

  function pickFiles(files: File[]) {
    if (files.length > 1) {
      setPendingFiles(files);
    } else if (files.length === 1) {
      onFilesSelected(files);
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    pickFiles(Array.from(e.dataTransfer.files ?? []));
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    pickFiles(Array.from(e.target.files ?? []));
    e.target.value = '';
  }

  function moveFile(index: number, direction: -1 | 1) {
    setPendingFiles((files) => {
      if (!files) return files;
      const target = index + direction;
      if (target < 0 || target >= files.length) return files;
      const next = [...files];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function removeFile(index: number) {
    setPendingFiles((files) => {
      if (!files) return files;
      const next = files.filter((_, i) => i !== index);
      return next.length > 0 ? next : null;
    });
  }

  function confirmOrder() {
    if (pendingFiles) onFilesSelected(pendingFiles);
    setPendingFiles(null);
  }

  if (pendingFiles) {
    return (
      <div>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Ordená tus archivos</h2>
          <p className="muted">
            Las preguntas del cuestionario van a seguir este mismo orden. Usá las flechas para
            moverlos.
          </p>
          <div className="file-order-list">
            {pendingFiles.map((file, i) => (
              <div className="file-order-item" key={`${file.name}-${i}`}>
                <span className="file-order-index mono">{i + 1}</span>
                <span className="file-order-name">{file.name}</span>
                <div className="file-order-actions">
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon"
                    onClick={() => moveFile(i, -1)}
                    disabled={i === 0}
                    aria-label={`Mover ${file.name} hacia arriba`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon"
                    onClick={() => moveFile(i, 1)}
                    disabled={i === pendingFiles.length - 1}
                    aria-label={`Mover ${file.name} hacia abajo`}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon"
                    onClick={() => removeFile(i)}
                    aria-label={`Quitar ${file.name}`}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="btn-row" style={{ marginTop: 16 }}>
            <button className="btn btn-primary" onClick={confirmOrder}>
              Combinar en este orden
            </button>
            <button className="btn btn-ghost" onClick={() => setPendingFiles(null)}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {persisted && (
        <div className="card continue-card">
          <div>
            <strong>{persisted.sourceName}</strong>
            <div className="muted mono" style={{ fontSize: '0.85rem', marginTop: 4 }}>
              {persisted.questions.length} preguntas · {formatRelativeTime(persisted.savedAt)}
            </div>
          </div>
          <div className="btn-row">
            <button className="btn btn-primary" onClick={onContinue}>
              Continuar
            </button>
            <button className="btn btn-ghost" onClick={onDiscard}>
              Descartar
            </button>
          </div>
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}

      <div
        className={`dropzone${dragging ? ' dragging' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
      >
        <p className="dropzone-title">
          {loading ? 'Procesando archivos…' : 'Subí tus archivos de preguntas'}
        </p>
        <p className="muted">
          Arrastrá y soltá uno o varios archivos acá, o hacé clic para elegirlos
        </p>
        <p className="muted mono" style={{ fontSize: '0.8rem', marginTop: 8 }}>
          .pdf · .md · .txt · .json
        </p>
        <p className="muted" style={{ fontSize: '0.8rem', marginTop: 8 }}>
          Podés elegir varios a la vez: se combinan en un solo cuestionario.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          multiple
          onChange={handleInputChange}
        />
      </div>

      <div className="btn-row" style={{ marginTop: 16, justifyContent: 'center' }}>
        <button className="btn btn-secondary" onClick={onLoadDemo}>
          Probar con preguntas de ejemplo
        </button>
        <button className="btn btn-secondary" onClick={() => examInputRef.current?.click()}>
          Simular examen
        </button>
        <input
          ref={examInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          multiple
          hidden
          onChange={handleExamInputChange}
        />
      </div>

      <details className="format-help">
        <summary>Formato que espera la app</summary>
        <p className="muted">Casillas Markdown:</p>
        <pre>{`1. ¿Cuál es la capital de Bolivia?
- [ ] La Paz
- [x] Sucre
- [ ] Santa Cruz
- [ ] Cochabamba
> Sucre es la capital constitucional.`}</pre>
        <p className="muted">Letras con asterisco:</p>
        <pre>{`1. ¿Cuál es la capital de Bolivia?
a) La Paz
b) Sucre *
c) Santa Cruz
d) Cochabamba
Explicación: Sucre es la capital constitucional.`}</pre>
        <p className="muted">JSON:</p>
        <pre>{`[
  {
    "question": "¿Cuál es la capital de Bolivia?",
    "options": ["La Paz", "Sucre", "Santa Cruz", "Cochabamba"],
    "correct": 1,
    "explanation": "Sucre es la capital constitucional."
  }
]`}</pre>
        <p className="muted">Preguntas de desarrollo (respuesta libre, para Flashcards):</p>
        <pre>{`1. Defina y diferencie las Pruebas Unitarias de las Pruebas de Integración.
> Respuesta esperada: texto de la respuesta completa...
> Palabras clave: unitarias, aislan, funcion, clase, integracion, interactuan, modulos, interfaces`}</pre>
        <p className="muted">
          "Palabras clave" es opcional: si no la escribís, la app las deriva automáticamente de la
          "Respuesta esperada" (y siempre las podés ajustar en la pantalla de revisión). Escribirlas
          a mano da mejor resultado en preguntas de "diferencie X de Y", donde la respuesta cubre dos
          ideas distintas.
        </p>
        <p className="muted">
          Para PDF, el documento debe tener las preguntas en texto plano con este mismo formato de
          numeración y opciones (no negrita/color) para que se detecten bien.
        </p>
      </details>
    </div>
  );
}

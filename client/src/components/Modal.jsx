import { useEffect, useRef } from 'react';

/** Accessible modal dialog: labelled, closes with Escape, focuses on open. */
export default function Modal({ title, onClose, children }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
      >
        <div className="mb-3 flex items-start justify-between gap-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="rounded p-1 text-2xl leading-none text-gray-500 hover:text-gray-900"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';

interface DeletionContextType {
  beginDeletion: (description: string) => boolean;
  endDeletion: () => void;
}

const DeletionContext = createContext<DeletionContextType | undefined>(undefined);

export const DeletionProvider = ({ children }: { children: ReactNode }) => {
  const [description, setDescription] = useState<string | null>(null);
  const deletingRef = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const beginDeletion = useCallback((message: string) => {
    // Block another request immediately, including clicks before React re-renders.
    if (deletingRef.current) return false;
    deletingRef.current = true;
    setDescription(message);
    return true;
  }, []);

  const endDeletion = useCallback(() => {
    deletingRef.current = false;
    setDescription(null);
  }, []);

  useEffect(() => {
    if (contentRef.current) contentRef.current.inert = description !== null;
    if (description === null) return;

    const previousFocus = document.activeElement;
    dialogRef.current?.focus();
    return () => {
      if (contentRef.current) contentRef.current.inert = false;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [description]);

  return (
    <DeletionContext.Provider value={{ beginDeletion, endDeletion }}>
      <div ref={contentRef} className="contents">
        {children}
      </div>
      {description !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-5 backdrop-blur-sm cursor-wait">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="deletion-title"
            aria-describedby="deletion-description"
            tabIndex={-1}
            className="w-full max-w-sm rounded-2xl bg-white px-7 py-8 text-center shadow-2xl outline-none"
          >
            <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
              <Loader2 size={72} strokeWidth={1.5} aria-hidden="true" className="absolute text-red-400 animate-spin motion-reduce:animate-none" />
              <Trash2 size={25} aria-hidden="true" className="text-red-500" />
            </div>
            <div role="status" aria-live="polite">
              <h2 id="deletion-title" className="text-xl font-semibold text-slate-900">Siliniyor…</h2>
              <p id="deletion-description" className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
            </div>
            <p className="mt-4 text-xs text-slate-400">Lütfen işlemin tamamlanmasını bekleyin.</p>
          </div>
        </div>
      )}
    </DeletionContext.Provider>
  );
};

export const useDeletionContext = () => {
  const context = useContext(DeletionContext);
  if (!context) throw new Error('useDeletionContext must be used within a DeletionProvider');
  return context;
};

import { Loader2 } from 'lucide-react';

export const PromptLoading = ({ message }: { message: string }) => (
  <div role="status" aria-live="polite" aria-busy="true" className="space-y-6">
    <div className="flex items-center justify-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-5 text-indigo-600">
      <Loader2 size={24} aria-hidden="true" className="shrink-0 animate-spin motion-reduce:animate-none" />
      <p className="text-sm font-medium">{message}</p>
    </div>
    <div aria-hidden="true" className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm animate-pulse motion-reduce:animate-none">
          <div className="h-40 bg-slate-200/70" />
          <div className="space-y-4 p-5">
            <div className="h-5 w-2/3 rounded bg-slate-200" />
            <div className="space-y-2 rounded-lg bg-slate-50 p-3">
              <div className="h-3 w-full rounded bg-slate-200" />
              <div className="h-3 w-5/6 rounded bg-slate-200" />
              <div className="h-3 w-3/4 rounded bg-slate-200" />
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <div className="h-7 w-20 rounded bg-slate-100" />
              <div className="h-7 w-12 rounded bg-slate-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

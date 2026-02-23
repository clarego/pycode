import { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, User } from 'lucide-react';

interface SubmitDialogProps {
  onSubmit: (studentName: string) => void;
  onClose: () => void;
  isSubmitting: boolean;
}

export default function SubmitDialog({ onSubmit, onClose, isSubmitting }: SubmitDialogProps) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={isSubmitting ? undefined : onClose} />

      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-50 rounded-lg">
              <Send size={18} className="text-sky-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800">Submit Your Work</h2>
              <p className="text-xs text-slate-500 mt-0.5">Enter your name to submit this session</p>
            </div>
          </div>
          {!isSubmitting && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label htmlFor="student-name" className="text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1.5">
              <User size={13} />
              Your Name
            </label>
            <input
              ref={inputRef}
              id="student-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jane Smith"
              disabled={isSubmitting}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all disabled:opacity-50"
              maxLength={100}
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim() || isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all bg-sky-600 text-white hover:bg-sky-500 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send size={15} />
                Submit
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

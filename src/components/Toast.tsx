import { useEffect } from 'react';
import { Check, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-slide-up">
      <div
        className={`flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
          type === 'success'
            ? 'bg-emerald-600 text-white'
            : 'bg-red-600 text-white'
        }`}
      >
        {type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
        {message}
        <button onClick={onClose} className="ml-2 p-0.5 hover:bg-white/20 rounded transition-colors">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

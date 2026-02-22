import { useState, useEffect } from 'react';
import { X, Key, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface ApiKeySettingsProps {
  apiKey: string;
  onSave: (key: string) => void;
  onClose: () => void;
}

export default function ApiKeySettings({ apiKey, onSave, onClose }: ApiKeySettingsProps) {
  const [inputValue, setInputValue] = useState(apiKey);
  const [validating, setValidating] = useState(false);
  const [validState, setValidState] = useState<'idle' | 'valid' | 'invalid'>('idle');

  useEffect(() => {
    setInputValue(apiKey);
    setValidState('idle');
  }, [apiKey]);

  async function handleValidateAndSave() {
    const key = inputValue.trim();
    if (!key) {
      onSave('');
      onClose();
      return;
    }
    setValidating(true);
    setValidState('idle');
    try {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (res.ok) {
        setValidState('valid');
        onSave(key);
        setTimeout(onClose, 700);
      } else {
        setValidState('invalid');
      }
    } catch {
      setValidState('invalid');
    } finally {
      setValidating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-600 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Key size={16} className="text-slate-300" />
            <h2 className="text-sm font-semibold text-white">OpenAI API Key</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded hover:bg-slate-700"
          >
            <X size={15} />
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          Provide your OpenAI API key to enable the "Explain Further" feature, which explains Python errors in plain language.
        </p>

        <div className="flex items-center gap-2 mb-4">
          <input
            type="password"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setValidState('idle');
            }}
            placeholder="sk-..."
            className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-slate-400 transition-colors font-mono"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleValidateAndSave();
              if (e.key === 'Escape') onClose();
            }}
          />
          {validState === 'valid' && <CheckCircle size={18} className="text-emerald-400 shrink-0" />}
          {validState === 'invalid' && <XCircle size={18} className="text-red-400 shrink-0" />}
        </div>

        {validState === 'invalid' && (
          <p className="text-xs text-red-400 mb-3">Invalid API key. Please check and try again.</p>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleValidateAndSave}
            disabled={validating}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors"
          >
            {validating ? <Loader2 size={13} className="animate-spin" /> : null}
            {validating ? 'Validating...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

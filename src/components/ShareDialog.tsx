import { useState } from 'react';
import { X, Copy, Check, Code2, Link2, Users } from 'lucide-react';

interface ShareDialogProps {
  shareUrl: string;
  embedCode: string;
  onClose: () => void;
}

export default function ShareDialog({ shareUrl, embedCode, onClose }: ShareDialogProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [copiedClass, setCopiedClass] = useState(false);

  async function copyToClipboard(text: string, setter: (v: boolean) => void) {
    try {
      await navigator.clipboard.writeText(text);
      setter(true);
      setTimeout(() => setter(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setter(true);
      setTimeout(() => setter(false), 2000);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-50 rounded-lg">
              <Link2 size={18} className="text-sky-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800">Share your code</h2>
              <p className="text-xs text-slate-500 mt-0.5">Anyone with the link can view and run this code</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">Share Link</label>
            <div className="flex gap-2">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 font-mono select-all"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={() => copyToClipboard(shareUrl, setCopiedLink)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  copiedLink
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-sky-600 text-white hover:bg-sky-500'
                }`}
              >
                {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                {copiedLink ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <button
            onClick={() => copyToClipboard(shareUrl, setCopiedClass)}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              copiedClass
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-800 text-white hover:bg-slate-700'
            }`}
          >
            {copiedClass ? <Check size={15} /> : <Users size={15} />}
            {copiedClass ? 'Link copied!' : 'Share with Class'}
          </button>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Code2 size={13} />
              Embed Code
            </label>
            <div className="relative">
              <textarea
                readOnly
                value={embedCode}
                rows={3}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 font-mono resize-none"
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              />
              <button
                onClick={() => copyToClipboard(embedCode, setCopiedEmbed)}
                className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-all ${
                  copiedEmbed
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                {copiedEmbed ? <Check size={11} /> : <Copy size={11} />}
                {copiedEmbed ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

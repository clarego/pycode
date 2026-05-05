import { useState, useEffect, useCallback } from 'react';
import { X, Copy, Check, Code2, Link2, Users, Trash2, EyeOff, Eye as EyeIcon, List, ExternalLink, RefreshCw, Pencil } from 'lucide-react';
import { deleteSnippet, unshareSnippet, reshareSnippet, getMySnippets, adminUpdateSnippet } from '../lib/snippets';
import type { CodeSnippet } from '../lib/snippets';

interface ShareDialogProps {
  shareUrl: string;
  embedCode: string;
  onClose: () => void;
  shareCode?: string;
  ownerUsername?: string;
}

type Tab = 'share' | 'myLinks';

export default function ShareDialog({ shareUrl, embedCode, onClose, shareCode, ownerUsername }: ShareDialogProps) {
  const [activeTab, setActiveTab] = useState<Tab>('share');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [copiedClass, setCopiedClass] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [unsharing, setUnsharing] = useState(false);
  const [done, setDone] = useState<'deleted' | 'unshared' | null>(null);
  const [hideCode, setHideCode] = useState(false);

  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [loadingSnippets, setLoadingSnippets] = useState(false);
  const [editingTitle, setEditingTitle] = useState<Record<string, string>>({});
  const [savingTitle, setSavingTitle] = useState<Record<string, boolean>>({});
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isOwner = !!(shareCode && ownerUsername);

  const loadMyLinks = useCallback(async () => {
    if (!ownerUsername) return;
    setLoadingSnippets(true);
    const data = await getMySnippets(ownerUsername);
    setSnippets(data);
    const titles: Record<string, string> = {};
    data.forEach((s) => { titles[s.share_id] = s.title || s.description || ''; });
    setEditingTitle(titles);
    setLoadingSnippets(false);
  }, [ownerUsername]);

  useEffect(() => {
    if (activeTab === 'myLinks') loadMyLinks();
  }, [activeTab, loadMyLinks]);

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

  async function handleDelete() {
    if (!shareCode || !ownerUsername) return;
    if (!confirm('Delete this shared link permanently? Anyone with the link will no longer be able to access it.')) return;
    setDeleting(true);
    await deleteSnippet(shareCode, ownerUsername);
    setDeleting(false);
    setDone('deleted');
  }

  async function handleUnshare() {
    if (!shareCode || !ownerUsername) return;
    setUnsharing(true);
    await unshareSnippet(shareCode, ownerUsername);
    setUnsharing(false);
    setDone('unshared');
  }

  async function handleTogglePublic(snippet: CodeSnippet) {
    setTogglingId(snippet.share_id);
    if (snippet.is_public) {
      await unshareSnippet(snippet.share_id, ownerUsername!);
    } else {
      await reshareSnippet(snippet.share_id, ownerUsername!);
    }
    setSnippets((prev) =>
      prev.map((s) => s.share_id === snippet.share_id ? { ...s, is_public: !s.is_public } : s)
    );
    setTogglingId(null);
  }

  async function handleSaveTitle(shareId: string) {
    if (!ownerUsername) return;
    setSavingTitle((prev) => ({ ...prev, [shareId]: true }));
    await adminUpdateSnippet(shareId, { description: editingTitle[shareId] ?? '' });
    setSnippets((prev) =>
      prev.map((s) => s.share_id === shareId ? { ...s, title: editingTitle[shareId] ?? '' } : s)
    );
    setSavingTitle((prev) => ({ ...prev, [shareId]: false }));
  }

  async function handleDeleteLink(shareId: string) {
    if (!ownerUsername) return;
    if (!confirm('Delete this link permanently?')) return;
    setDeletingId(shareId);
    await deleteSnippet(shareId, ownerUsername);
    setSnippets((prev) => prev.filter((s) => s.share_id !== shareId));
    setDeletingId(null);
  }

  if (done === 'deleted') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-red-600" />
            </div>
            <h2 className="text-base font-semibold text-slate-800 mb-2">Link deleted</h2>
            <p className="text-sm text-slate-500 mb-6">This shared link has been permanently removed.</p>
            <button onClick={onClose} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors">Close</button>
          </div>
        </div>
      </div>
    );
  }

  if (done === 'unshared') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <EyeOff size={20} className="text-amber-600" />
            </div>
            <h2 className="text-base font-semibold text-slate-800 mb-2">Link made private</h2>
            <p className="text-sm text-slate-500 mb-6">This link is now private. The URL no longer works publicly, but your code is still saved.</p>
            <button onClick={onClose} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors">Close</button>
          </div>
        </div>
      </div>
    );
  }

  const base = window.location.origin;

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

        {ownerUsername && (
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => setActiveTab('share')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
                activeTab === 'share'
                  ? 'text-sky-600 border-b-2 border-sky-500 bg-sky-50/50'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Link2 size={12} />
              Share Link
            </button>
            <button
              onClick={() => setActiveTab('myLinks')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
                activeTab === 'myLinks'
                  ? 'text-sky-600 border-b-2 border-sky-500 bg-sky-50/50'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <List size={12} />
              My Links
            </button>
          </div>
        )}

        {activeTab === 'share' && (
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                  <Code2 size={13} />
                  Embed Code
                </label>
                <button
                  type="button"
                  onClick={() => setHideCode(h => !h)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                    hideCode
                      ? 'bg-slate-800 border-slate-700 text-white'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {hideCode ? <EyeOff size={11} /> : <EyeIcon size={11} />}
                  {hideCode ? 'Code hidden' : 'Hide code'}
                </button>
              </div>
              {hideCode && (
                <p className="text-[11px] text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mb-2 leading-relaxed">
                  The embed will show <strong className="text-slate-600">output only</strong> — viewers won't see the source code.
                </p>
              )}
              <div className="relative">
                <textarea
                  readOnly
                  value={(() => {
                    if (!hideCode) return embedCode;
                    return embedCode.replace(/(src="[^"]+)(")/, '$1?hideCode=1$2');
                  })()}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 font-mono resize-none"
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                />
                <button
                  onClick={() => {
                    const code = hideCode
                      ? embedCode.replace(/(src="[^"]+)(")/, '$1?hideCode=1$2')
                      : embedCode;
                    copyToClipboard(code, setCopiedEmbed);
                  }}
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

            {isOwner && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-3">You own this link — manage its visibility:</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleUnshare}
                    disabled={unsharing || deleting}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <EyeOff size={13} />
                    {unsharing ? 'Unsharing...' : 'Make Private'}
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={unsharing || deleting}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={13} />
                    {deleting ? 'Deleting...' : 'Delete Link'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'myLinks' && (
          <div className="flex flex-col" style={{ maxHeight: '480px' }}>
            <div className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
              <p className="text-xs text-slate-500">All links shared by you</p>
              <button
                onClick={loadMyLinks}
                disabled={loadingSnippets}
                className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={11} className={loadingSnippets ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>

            <div className="overflow-y-auto px-5 pb-5">
              {loadingSnippets ? (
                <div className="flex items-center justify-center py-10 text-slate-400">
                  <RefreshCw size={16} className="animate-spin mr-2" />
                  <span className="text-xs">Loading…</span>
                </div>
              ) : snippets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                  <Link2 size={28} className="mb-2 opacity-40" />
                  <p className="text-xs">No shared links yet</p>
                </div>
              ) : (
                <div className="space-y-2.5 mt-1">
                  {snippets.map((snippet) => {
                    const titleChanged = (editingTitle[snippet.share_id] ?? '') !== snippet.title;
                    return (
                      <div
                        key={snippet.share_id}
                        className={`border rounded-xl p-3 ${snippet.is_public ? 'border-slate-200 bg-slate-50' : 'border-amber-200 bg-amber-50/40'}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                            /{snippet.share_id}
                          </span>
                          {snippet.is_public ? (
                            <span className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                              <EyeIcon size={8} /> Public
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                              <EyeOff size={8} /> Private
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 ml-auto">
                            {new Date(snippet.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <div className="relative flex-1">
                            <Pencil size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                              type="text"
                              placeholder="Add a name for this link…"
                              value={editingTitle[snippet.share_id] ?? ''}
                              onChange={(e) =>
                                setEditingTitle((prev) => ({ ...prev, [snippet.share_id]: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && titleChanged) handleSaveTitle(snippet.share_id);
                              }}
                              className="w-full pl-6 pr-2 py-1.5 text-[11px] border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-sky-400/50 focus:border-sky-400 placeholder:text-slate-300"
                            />
                          </div>
                          {titleChanged && (
                            <button
                              onClick={() => handleSaveTitle(snippet.share_id)}
                              disabled={savingTitle[snippet.share_id]}
                              className="px-2 py-1.5 text-[11px] font-medium bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors shrink-0 disabled:opacity-50"
                            >
                              {savingTitle[snippet.share_id] ? '…' : 'Save'}
                            </button>
                          )}
                          <a
                            href={`${base}/code/${snippet.share_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors shrink-0"
                            title="Open link"
                          >
                            <ExternalLink size={12} />
                          </a>
                          <button
                            onClick={() => handleTogglePublic(snippet)}
                            disabled={togglingId === snippet.share_id}
                            title={snippet.is_public ? 'Make private' : 'Make public'}
                            className={`p-1.5 rounded-lg transition-colors shrink-0 disabled:opacity-50 ${
                              snippet.is_public
                                ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                                : 'text-amber-600 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {snippet.is_public ? <EyeOff size={12} /> : <EyeIcon size={12} />}
                          </button>
                          <button
                            onClick={() => handleDeleteLink(snippet.share_id)}
                            disabled={deletingId === snippet.share_id}
                            title="Delete permanently"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0 disabled:opacity-50"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { Link2, Trash2, Eye, EyeOff, ExternalLink, RefreshCw, Search, Calendar, User, FileCode2, Code2, Check } from 'lucide-react';
import { getAllSnippets, adminUpdateSnippet, adminDeleteSnippet } from '../../lib/snippets';
import type { CodeSnippet } from '../../lib/snippets';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getFileNames(files: Record<string, string>): string {
  const names = Object.keys(files);
  if (names.length === 0) return 'No files';
  if (names.length === 1) return names[0];
  return `${names[0]} +${names.length - 1} more`;
}

export default function SharedLinksManager() {
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingDesc, setEditingDesc] = useState<Record<string, string>>({});
  const [savingDesc, setSavingDesc] = useState<Record<string, boolean>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [copiedEmbedId, setCopiedEmbedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getAllSnippets();
    setSnippets(data);
    const descs: Record<string, string> = {};
    data.forEach((s) => { descs[s.share_id] = s.description || ''; });
    setEditingDesc(descs);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = snippets.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.share_id.includes(q) ||
      (s.created_by || '').toLowerCase().includes(q) ||
      (s.description || '').toLowerCase().includes(q) ||
      Object.keys(s.files).some((f) => f.toLowerCase().includes(q))
    );
  });

  async function handleTogglePublic(snippet: CodeSnippet) {
    setTogglingId(snippet.share_id);
    await adminUpdateSnippet(snippet.share_id, { is_public: !snippet.is_public });
    setSnippets((prev) =>
      prev.map((s) => s.share_id === snippet.share_id ? { ...s, is_public: !s.is_public } : s)
    );
    setTogglingId(null);
  }

  async function handleSaveDescription(shareId: string) {
    setSavingDesc((prev) => ({ ...prev, [shareId]: true }));
    await adminUpdateSnippet(shareId, { description: editingDesc[shareId] ?? '' });
    setSnippets((prev) =>
      prev.map((s) => s.share_id === shareId ? { ...s, description: editingDesc[shareId] ?? '' } : s)
    );
    setSavingDesc((prev) => ({ ...prev, [shareId]: false }));
  }

  async function handleDelete(shareId: string) {
    if (!confirm('Permanently delete this shared link? This cannot be undone.')) return;
    setDeletingId(shareId);
    await adminDeleteSnippet(shareId);
    setSnippets((prev) => prev.filter((s) => s.share_id !== shareId));
    setDeletingId(null);
  }

  function copyEmbed(shareId: string) {
    const embedCode = `<iframe src="${window.location.origin}/embed/${shareId}" width="100%" height="500" frameborder="0" style="border:1px solid #e2e8f0;border-radius:8px;" allowfullscreen></iframe>`;
    navigator.clipboard.writeText(embedCode).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = embedCode;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    });
    setCopiedEmbedId(shareId);
    setTimeout(() => setCopiedEmbedId(null), 2000);
  }

  const base = window.location.origin;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Shared Links</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage all shared code snippets — add descriptions, disable or delete links.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by user, share code, file name or description…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <RefreshCw size={18} className="animate-spin mr-2" />
          <span className="text-sm">Loading shared links…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Link2 size={32} className="mb-3 opacity-40" />
          <p className="text-sm font-medium">No shared links found</p>
          {search && <p className="text-xs mt-1">Try a different search term</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((snippet) => {
            const descChanged = (editingDesc[snippet.share_id] ?? '') !== snippet.description;
            return (
              <div
                key={snippet.share_id}
                className={`bg-white border rounded-xl overflow-hidden transition-all ${
                  snippet.is_public ? 'border-slate-200' : 'border-amber-200 bg-amber-50/30'
                }`}
              >
                <div className="px-4 py-3 flex items-start gap-3">
                  <div className="mt-0.5 p-2 bg-slate-100 rounded-lg shrink-0">
                    <FileCode2 size={15} className="text-slate-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        /{snippet.share_id}
                      </span>
                      {snippet.is_public ? (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <Eye size={9} />
                          Public
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          <EyeOff size={9} />
                          Disabled
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[10px] text-slate-400">
                        <User size={9} />
                        {snippet.created_by || 'anonymous'}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Calendar size={9} />
                        {formatDate(snippet.created_at)}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-slate-400">
                        <FileCode2 size={9} />
                        {getFileNames(snippet.files)}
                      </span>
                    </div>

                    <input
                      type="text"
                      placeholder="Add a description…"
                      value={editingDesc[snippet.share_id] ?? ''}
                      onChange={(e) =>
                        setEditingDesc((prev) => ({ ...prev, [snippet.share_id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && descChanged) handleSaveDescription(snippet.share_id);
                      }}
                      className="w-full mt-1.5 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 placeholder:text-slate-300"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                    {descChanged && (
                      <button
                        onClick={() => handleSaveDescription(snippet.share_id)}
                        disabled={savingDesc[snippet.share_id]}
                        className="px-2.5 py-1.5 text-[11px] font-medium bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        {savingDesc[snippet.share_id] ? 'Saving…' : 'Save'}
                      </button>
                    )}

                    <a
                      href={`${base}/embed/${snippet.share_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                      title="Open embed"
                    >
                      <ExternalLink size={14} />
                    </a>

                    <button
                      onClick={() => copyEmbed(snippet.share_id)}
                      title="Copy embed code"
                      className={`p-1.5 rounded-lg transition-colors ${
                        copiedEmbedId === snippet.share_id
                          ? 'text-emerald-600 bg-emerald-50'
                          : 'text-slate-400 hover:text-sky-600 hover:bg-sky-50'
                      }`}
                    >
                      {copiedEmbedId === snippet.share_id ? <Check size={14} /> : <Code2 size={14} />}
                    </button>

                    <button
                      onClick={() => handleTogglePublic(snippet)}
                      disabled={togglingId === snippet.share_id}
                      title={snippet.is_public ? 'Disable link' : 'Enable link'}
                      className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                        snippet.is_public
                          ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                          : 'text-amber-600 hover:text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      {snippet.is_public ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>

                    <button
                      onClick={() => handleDelete(snippet.share_id)}
                      disabled={deletingId === snippet.share_id}
                      title="Delete permanently"
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <p className="text-xs text-slate-400 mt-4 text-right">
          {filtered.length} of {snippets.length} link{snippets.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

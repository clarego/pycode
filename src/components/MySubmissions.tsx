import { useState, useEffect, useCallback } from 'react';
import { Loader2, CheckCircle2, Clock, FileCheck, X, FileCode, MessageSquare, Code2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Submission {
  id: string;
  task_id: string | null;
  student_id: string;
  files: Record<string, string> | null;
  session_share_id: string | null;
  submitted_at: string;
  reviewed: boolean;
  feedback: string | null;
  tasks: { title: string } | null;
}

interface MySubmissionsProps {
  username: string;
  onClose: () => void;
}

export default function MySubmissions({ username, onClose }: MySubmissionsProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    const { data } = await supabase
      .from('task_submissions')
      .select('*, tasks(title)')
      .eq('student_id', username)
      .order('submitted_at', { ascending: false });
    setSubmissions((data as unknown as Submission[]) || []);
    setLoading(false);
  }, [username]);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <FileCheck size={16} className="text-slate-600" />
            <span className="text-sm font-semibold text-slate-700">My Submissions</span>
            {!loading && (
              <span className="text-xs text-slate-400">{submissions.length} total</span>
            )}
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-slate-400" size={20} />
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-16 text-sm text-slate-400">No submissions yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {submissions.map((sub) => {
                const isExpanded = expandedId === sub.id;
                const fileCount = sub.files ? Object.keys(sub.files).length : 0;
                return (
                  <div key={sub.id} className="px-5 py-3">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                      className="w-full text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {sub.tasks ? (
                            <span className="text-sm font-medium text-slate-800">{sub.tasks.title}</span>
                          ) : (
                            <span className="flex items-center gap-1 text-sm text-slate-500">
                              <Code2 size={12} />
                              Playground
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                            sub.reviewed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {sub.reviewed ? <CheckCircle2 size={9} /> : <Clock size={9} />}
                            {sub.reviewed ? 'Reviewed' : 'Pending'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-slate-400">
                          {new Date(sub.submitted_at).toLocaleString()}
                        </span>
                        {fileCount > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                            <FileCode size={9} />
                            {fileCount} file{fileCount !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="mt-3 space-y-2">
                        {sub.feedback ? (
                          <div className={`p-3 rounded-lg border ${
                            sub.reviewed
                              ? 'bg-emerald-50 border-emerald-200'
                              : 'bg-sky-50 border-sky-200'
                          }`}>
                            <div className="flex items-center gap-1.5 mb-1">
                              <MessageSquare size={11} className={sub.reviewed ? 'text-emerald-600' : 'text-sky-600'} />
                              <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                                sub.reviewed ? 'text-emerald-700' : 'text-sky-700'
                              }`}>
                                Teacher Feedback
                              </span>
                            </div>
                            <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{sub.feedback}</p>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No feedback yet.</p>
                        )}
                        {sub.session_share_id && (
                          <a
                            href={`/review/${sub.session_share_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-sky-600 hover:underline"
                          >
                            View session recording
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

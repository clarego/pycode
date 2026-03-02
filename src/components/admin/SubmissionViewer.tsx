import { useState, useEffect, useCallback } from 'react';
import { Loader2, CheckCircle2, Clock, Play, FileCheck, Eye, X, FileCode, MessageSquare, Code2, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface RedFlag {
  type: 'paste' | 'bulk_insert';
  chars: number;
  timestamp_ms: number;
  file: string;
}

interface Submission {
  id: string;
  task_id: string | null;
  student_id: string;
  files: Record<string, string> | null;
  session_share_id: string | null;
  submitted_at: string;
  reviewed: boolean;
  feedback: string | null;
  red_flags: RedFlag[] | null;
  tasks: { title: string; share_code: string } | null;
}

function FilesModal({ files, studentName, onClose }: { files: Record<string, string>; studentName: string; onClose: () => void }) {
  const filenames = Object.keys(files);
  const [activeFile, setActiveFile] = useState(filenames[0] || '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <FileCode size={16} className="text-slate-500" />
            <span className="text-sm font-semibold text-slate-700">{studentName}'s Files</span>
            <span className="text-xs text-slate-400">{filenames.length} file{filenames.length !== 1 ? 's' : ''}</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X size={16} />
          </button>
        </div>

        {filenames.length > 1 && (
          <div className="flex border-b border-slate-200 bg-slate-50 px-2 overflow-x-auto">
            {filenames.map((name) => (
              <button
                key={name}
                onClick={() => setActiveFile(name)}
                className={`px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeFile === name
                    ? 'border-sky-500 text-sky-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-auto p-0">
          <pre className="text-xs text-slate-700 font-mono leading-relaxed p-4 whitespace-pre-wrap break-words">
            {files[activeFile] || ''}
          </pre>
        </div>
      </div>
    </div>
  );
}

function FeedbackModal({ submission, onClose, onSave }: {
  submission: Submission;
  onClose: () => void;
  onSave: (id: string, feedback: string, reviewed: boolean) => Promise<void>;
}) {
  const [feedback, setFeedback] = useState(submission.feedback || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (markReviewed: boolean) => {
    setSaving(true);
    await onSave(submission.id, feedback, markReviewed);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-slate-600" />
            <span className="text-sm font-semibold text-slate-700">Feedback for {submission.student_id}</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X size={16} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {submission.red_flags && submission.red_flags.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle size={13} className="text-red-500" />
                <span className="text-xs font-semibold text-red-700">
                  {submission.red_flags.length} Suspicious Event{submission.red_flags.length !== 1 ? 's' : ''} Detected
                </span>
              </div>
              <div className="space-y-1">
                {submission.red_flags.map((f, i) => {
                  const mins = Math.floor(f.timestamp_ms / 60000);
                  const secs = Math.floor((f.timestamp_ms % 60000) / 1000);
                  return (
                    <div key={i} className="flex items-center gap-2 text-[11px] text-red-600">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        f.type === 'paste' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {f.type === 'paste' ? 'PASTE' : 'BULK'}
                      </span>
                      <span>{f.chars} chars in <span className="font-mono">{f.file}</span></span>
                      <span className="text-red-400">at {mins}:{secs.toString().padStart(2, '0')}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              {submission.tasks?.title ? `Task: ${submission.tasks.title}` : 'Playground submission'}
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Enter feedback, comments, or a grade..."
              rows={5}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Save & Mark Reviewed
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-medium rounded-lg transition-colors"
            >
              Save Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SubmissionViewerProps {
  filterUsername?: string;
}

export default function SubmissionViewer({ filterUsername }: SubmissionViewerProps = {}) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [viewingFiles, setViewingFiles] = useState<{ files: Record<string, string>; studentName: string } | null>(null);
  const [feedbackSub, setFeedbackSub] = useState<Submission | null>(null);

  const fetchSubmissions = useCallback(async () => {
    let query = supabase
      .from('task_submissions')
      .select('*, tasks(title, share_code)')
      .order('submitted_at', { ascending: false });

    if (filterUsername) {
      query = query.eq('student_id', filterUsername);
    }

    const { data } = await query;
    setSubmissions((data as unknown as Submission[]) || []);
    setLoading(false);
  }, [filterUsername]);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  const toggleReviewed = async (sub: Submission) => {
    setToggling(sub.id);
    await supabase
      .from('task_submissions')
      .update({ reviewed: !sub.reviewed })
      .eq('id', sub.id);
    await fetchSubmissions();
    setToggling(null);
  };

  const handleSaveFeedback = async (id: string, feedback: string, reviewed: boolean) => {
    await supabase
      .from('task_submissions')
      .update({ feedback, reviewed })
      .eq('id', id);
    await fetchSubmissions();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-slate-400" size={24} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <FileCheck size={20} className="text-slate-600" />
        <h2 className="text-lg font-semibold text-slate-800">Submissions</h2>
        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{submissions.length} total</span>
        <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-200">
          {submissions.filter(s => s.reviewed).length} reviewed
        </span>
      </div>

      {submissions.length === 0 ? (
        <div className="text-center py-16 text-sm text-slate-400">No submissions yet.</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Source</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Files</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Submitted</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {submissions.map((sub) => {
                const fileCount = sub.files ? Object.keys(sub.files).length : 0;
                return (
                  <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-slate-800">{sub.student_id}</span>
                    </td>
                    <td className="px-4 py-3">
                      {sub.tasks ? (
                        <span className="text-sm text-slate-600">{sub.tasks.title}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                          <Code2 size={11} />
                          Playground
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {fileCount > 0 ? (
                        <button
                          onClick={() => setViewingFiles({ files: sub.files!, studentName: sub.student_id })}
                          className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 hover:underline"
                        >
                          <FileCode size={12} />
                          {fileCount} file{fileCount !== 1 ? 's' : ''}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(sub.submitted_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full w-fit ${
                            sub.reviewed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {sub.reviewed ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                            {sub.reviewed ? 'Reviewed' : 'Pending'}
                          </span>
                          {sub.red_flags && sub.red_flags.length > 0 && (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 cursor-help"
                              title={sub.red_flags.map(f => {
                                const mins = Math.floor(f.timestamp_ms / 60000);
                                const secs = Math.floor((f.timestamp_ms % 60000) / 1000);
                                return `${f.type === 'paste' ? 'Paste' : 'Bulk insert'}: ${f.chars} chars in ${f.file} at ${mins}:${secs.toString().padStart(2, '0')}`;
                              }).join('\n')}
                            >
                              <AlertTriangle size={9} />
                              {sub.red_flags.length} flag{sub.red_flags.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        {sub.feedback && (
                          <span className="text-[10px] text-slate-400 truncate max-w-[120px]" title={sub.feedback}>
                            {sub.feedback}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {sub.session_share_id && (
                          <a
                            href={`/review/${sub.session_share_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2 py-1 text-xs text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                            title="Watch coding session playback"
                          >
                            <Play size={12} />
                            Playback
                          </a>
                        )}
                        <button
                          onClick={() => setFeedbackSub(sub)}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                          title="Add feedback"
                        >
                          <MessageSquare size={12} />
                          Feedback
                        </button>
                        <button
                          onClick={() => toggleReviewed(sub)}
                          disabled={toggling === sub.id}
                          className={`flex items-center gap-1 px-2 py-1 text-xs rounded-lg transition-colors ${
                            sub.reviewed
                              ? 'text-amber-600 hover:bg-amber-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {toggling === sub.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Eye size={12} />
                          )}
                          {sub.reviewed ? 'Unmark' : 'Mark Reviewed'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {viewingFiles && (
        <FilesModal
          files={viewingFiles.files}
          studentName={viewingFiles.studentName}
          onClose={() => setViewingFiles(null)}
        />
      )}

      {feedbackSub && (
        <FeedbackModal
          submission={feedbackSub}
          onClose={() => setFeedbackSub(null)}
          onSave={handleSaveFeedback}
        />
      )}
    </div>
  );
}

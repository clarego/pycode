import { useState, useEffect, useCallback } from 'react';
import { Loader2, CheckCircle2, Clock, Play, FileCheck, Eye, X, FileCode, MessageSquare, Code2, AlertTriangle, FileText, BookOpen, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { loadPdfAnnotation } from '../../lib/pdfAnnotations';
import type { AnnotationState } from '../../lib/pdfAnnotations';
import PdfAnnotator from '../pdf/PdfAnnotator';
import NotebookRenderer from '../notebook/NotebookRenderer';

interface ClassOption {
  id: string;
  name: string;
  members: string[];
}

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
  tasks: { title: string; share_code: string; task_files: { name: string; path: string }[] | null; file_name: string | null; file_path: string | null } | null;
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
          {activeFile.endsWith('.ipynb') ? (
            <NotebookRenderer content={files[activeFile] || ''} />
          ) : (
            <pre className="text-xs text-slate-700 font-mono leading-relaxed p-4 whitespace-pre-wrap break-words">
              {files[activeFile] || ''}
            </pre>
          )}
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

interface PdfAnnotationEntry {
  filename: string;
  pdfUrl: string;
  annotationState: AnnotationState;
  updatedAt: string;
}

function PdfAnnotationsModal({ submission, onClose }: {
  submission: Submission;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<PdfAnnotationEntry[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const pdfFiles: { name: string; path: string }[] = [];

      if (submission.tasks) {
        const taskFiles = submission.tasks.task_files ?? [];
        const singleFile = submission.tasks.file_name && submission.tasks.file_path
          ? [{ name: submission.tasks.file_name, path: submission.tasks.file_path }]
          : [];
        const allFiles = taskFiles.length > 0 ? taskFiles : singleFile;
        for (const f of allFiles) {
          if (f.name.toLowerCase().endsWith('.pdf')) {
            pdfFiles.push(f);
          }
        }
      }

      if (pdfFiles.length === 0) {
        setError('No PDF files found in this task.');
        setLoading(false);
        return;
      }

      const results: PdfAnnotationEntry[] = [];

      for (const pf of pdfFiles) {
        const annotation = await loadPdfAnnotation(submission.student_id, pf.name);
        if (!annotation) continue;

        const { data: urlData } = await supabase.storage
          .from('task-files')
          .createSignedUrl(pf.path, 3600);

        if (!urlData?.signedUrl) continue;

        results.push({
          filename: pf.name,
          pdfUrl: urlData.signedUrl,
          annotationState: annotation.annotation_state,
          updatedAt: annotation.updated_at,
        });
      }

      if (results.length === 0) {
        setError('This student has not saved any annotations yet.');
        setLoading(false);
        return;
      }

      setEntries(results);
      setLoading(false);
    }

    load();
  }, [submission]);

  const active = entries[activeIdx];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-slate-500" />
            <span className="text-sm font-semibold text-slate-700">
              PDF Annotations — {submission.student_id}
            </span>
            {entries.length > 1 && (
              <div className="flex gap-1 ml-2">
                {entries.map((e, i) => (
                  <button
                    key={e.filename}
                    onClick={() => setActiveIdx(i)}
                    className={`px-2 py-0.5 text-xs rounded transition-colors ${
                      i === activeIdx
                        ? 'bg-sky-100 text-sky-700 font-medium'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {e.filename}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 min-h-0">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Loader2 size={16} className="animate-spin" />
                Loading annotations…
              </div>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-slate-400 text-sm space-y-1">
                <FileText size={32} className="mx-auto opacity-40" />
                <p>{error}</p>
              </div>
            </div>
          ) : active ? (
            <PdfAnnotator
              pdfUrl={active.pdfUrl}
              filename={active.filename}
              initialState={active.annotationState}
              readOnly
            />
          ) : null}
        </div>

        {active && !loading && !error && (
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 shrink-0">
            <span className="text-xs text-slate-400">
              Last saved: {new Date(active.updatedAt).toLocaleString()}
            </span>
          </div>
        )}
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
  const [pdfSub, setPdfSub] = useState<Submission | null>(null);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    let query = supabase
      .from('task_submissions')
      .select('*, tasks(title, share_code, task_files, file_name, file_path)')
      .order('submitted_at', { ascending: false });

    if (filterUsername) {
      query = query.eq('student_id', filterUsername);
    }

    const { data } = await query;
    setSubmissions((data as unknown as Submission[]) || []);
    setLoading(false);
  }, [filterUsername]);

  const fetchClasses = useCallback(async () => {
    const [classRes, memberRes] = await Promise.all([
      supabase.from('classes').select('id, name').order('name', { ascending: true }),
      supabase.from('class_members').select('class_id, student_username'),
    ]);
    const memberMap: Record<string, string[]> = {};
    for (const m of (memberRes.data ?? [])) {
      if (!memberMap[m.class_id]) memberMap[m.class_id] = [];
      memberMap[m.class_id].push(m.student_username);
    }
    setClasses((classRes.data ?? []).map(c => ({ id: c.id, name: c.name, members: memberMap[c.id] ?? [] })));
  }, []);

  useEffect(() => {
    fetchSubmissions();
    if (!filterUsername) fetchClasses();
  }, [fetchSubmissions, fetchClasses, filterUsername]);

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

  function hasPdfFiles(sub: Submission): boolean {
    if (!sub.tasks) return false;
    const allFiles = sub.tasks.task_files ?? [];
    const single = sub.tasks.file_name ? [{ name: sub.tasks.file_name }] : [];
    const files = allFiles.length > 0 ? allFiles : single;
    return files.some(f => f.name.toLowerCase().endsWith('.pdf'));
  }

  const selectedClass = classes.find(c => c.id === selectedClassId) ?? null;
  const visibleSubmissions = selectedClass
    ? submissions.filter(s => selectedClass.members.includes(s.student_id))
    : submissions;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-slate-400" size={24} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <FileCheck size={20} className="text-slate-600" />
        <h2 className="text-lg font-semibold text-slate-800">Submissions</h2>
        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{visibleSubmissions.length} total</span>
        <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-200">
          {visibleSubmissions.filter(s => s.reviewed).length} reviewed
        </span>
      </div>

      {!filterUsername && classes.length > 0 && (
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mr-1">
            <BookOpen size={13} />
            Filter by class:
          </div>
          <button
            onClick={() => setSelectedClassId(null)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedClassId === null
                ? 'bg-slate-800 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users size={11} />
            All Students
          </button>
          {classes.map(cls => (
            <button
              key={cls.id}
              onClick={() => setSelectedClassId(cls.id === selectedClassId ? null : cls.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedClassId === cls.id
                  ? 'bg-sky-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <BookOpen size={11} />
              {cls.name}
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                selectedClassId === cls.id ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {submissions.filter(s => cls.members.includes(s.student_id)).length}
              </span>
            </button>
          ))}
        </div>
      )}

      {visibleSubmissions.length === 0 ? (
        <div className="text-center py-16 text-sm text-slate-400">
          {selectedClass ? `No submissions from ${selectedClass.name} yet.` : 'No submissions yet.'}
        </div>
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
              {visibleSubmissions.map((sub) => {
                const fileCount = sub.files ? Object.keys(sub.files).length : 0;
                const studentClasses = !filterUsername
                  ? classes.filter(c => c.members.includes(sub.student_id))
                  : [];
                return (
                  <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-slate-800">{sub.student_id}</span>
                        {studentClasses.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {studentClasses.map(c => (
                              <span key={c.id} className="inline-flex items-center gap-1 text-[10px] text-sky-600 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded font-medium">
                                <BookOpen size={8} />
                                {c.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
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
                        {hasPdfFiles(sub) && (
                          <button
                            onClick={() => setPdfSub(sub)}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="View student PDF annotations"
                          >
                            <FileText size={12} />
                            PDF
                          </button>
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

      {pdfSub && (
        <PdfAnnotationsModal
          submission={pdfSub}
          onClose={() => setPdfSub(null)}
        />
      )}
    </div>
  );
}

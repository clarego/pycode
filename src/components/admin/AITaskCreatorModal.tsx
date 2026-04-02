import { useState } from 'react';
import {
  X, Sparkles, Loader2, Check, ChevronRight, ChevronLeft,
  FileText, Users, BookOpen, Pencil, Eye, ArrowRight, Wand2, Trash2
} from 'lucide-react';

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

interface GeneratedFile {
  filename: string;
  type: string;
  purpose: string;
  content: string;
  kept: boolean;
}

interface ClassOption {
  id: string;
  name: string;
  members: string[];
}

interface StudentUser {
  username: string;
}

interface AITaskCreatorModalProps {
  students: StudentUser[];
  classes: ClassOption[];
  onClose: () => void;
  onConfirm: (title: string, instructions: string, files: GeneratedFile[], selectedStudents: string[]) => Promise<void>;
}

type Step = 'describe' | 'generating' | 'preview' | 'assign' | 'saving';

async function callAiGrading(body: Record<string, unknown>) {
  const res = await fetch(`${FUNCTIONS_URL}/ai-grading`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'AI request failed');
  return data;
}

export default function AITaskCreatorModal({ students, classes, onClose, onConfirm }: AITaskCreatorModalProps) {
  const [step, setStep] = useState<Step>('describe');
  const [adminDescription, setAdminDescription] = useState('');
  const [error, setError] = useState('');

  const [generatedTitle, setGeneratedTitle] = useState('');
  const [generatedInstructions, setGeneratedInstructions] = useState('');
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);

  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [assignTab, setAssignTab] = useState<'students' | 'classes'>('students');
  const [previewFile, setPreviewFile] = useState<GeneratedFile | null>(null);

  const handleGenerate = async () => {
    if (!adminDescription.trim()) return;
    setError('');
    setStep('generating');
    try {
      const result = await callAiGrading({
        action: 'generate_task_from_description',
        adminDescription: adminDescription.trim(),
      });
      setGeneratedTitle(result.title || '');
      setGeneratedInstructions(result.instructions || '');
      setGeneratedFiles(
        (result.files || []).map((f: Omit<GeneratedFile, 'kept'>) => ({ ...f, kept: true }))
      );
      setStep('preview');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to generate task');
      setStep('describe');
    }
  };

  const toggleFile = (idx: number) => {
    setGeneratedFiles(prev => prev.map((f, i) => i === idx ? { ...f, kept: !f.kept } : f));
  };

  const toggleStudent = (username: string) => {
    setSelectedStudents(prev => {
      const next = new Set(prev);
      if (next.has(username)) next.delete(username);
      else next.add(username);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedStudents.size === students.length) setSelectedStudents(new Set());
    else setSelectedStudents(new Set(students.map(s => s.username)));
  };

  const toggleClass = (cls: ClassOption) => {
    const allIn = cls.members.length > 0 && cls.members.every(m => selectedStudents.has(m));
    setSelectedStudents(prev => {
      const next = new Set(prev);
      if (allIn) cls.members.forEach(m => next.delete(m));
      else cls.members.forEach(m => next.add(m));
      return next;
    });
  };

  const handleConfirm = async () => {
    setStep('saving');
    try {
      await onConfirm(
        generatedTitle,
        generatedInstructions,
        generatedFiles.filter(f => f.kept),
        Array.from(selectedStudents)
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create task');
      setStep('assign');
    }
  };

  const keptFiles = generatedFiles.filter(f => f.kept);

  const fileTypeIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t === 'pdf') return '📄';
    if (t === 'py') return '🐍';
    if (t === 'csv') return '📊';
    if (t === 'html') return '🌐';
    return '📝';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={step !== 'generating' && step !== 'saving' ? onClose : undefined} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-sky-50 to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center">
              <Wand2 size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Create Task with AI</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {step === 'describe' && 'Describe what you want students to do'}
                {step === 'generating' && 'AI is thinking like a teacher...'}
                {step === 'preview' && 'Review and edit the generated task'}
                {step === 'assign' && 'Choose who to assign this task to'}
                {step === 'saving' && 'Creating and assigning task...'}
              </p>
            </div>
          </div>
          {step !== 'generating' && step !== 'saving' && (
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 px-6 py-3 border-b border-slate-100 bg-white">
          {(['describe', 'preview', 'assign'] as const).map((s, i) => {
            const labels = ['Describe', 'Preview', 'Assign'];
            const stepOrder = ['describe', 'generating', 'preview', 'assign', 'saving'];
            const currentIdx = stepOrder.indexOf(step);
            const thisIdx = stepOrder.indexOf(s);
            const isDone = currentIdx > thisIdx;
            const isActive = s === step || (step === 'generating' && s === 'describe');
            return (
              <div key={s} className="flex items-center">
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                  isDone ? 'text-emerald-700 bg-emerald-50' :
                  isActive ? 'text-sky-700 bg-sky-50' :
                  'text-slate-400'
                }`}>
                  {isDone ? <Check size={10} strokeWidth={3} /> : <span className="w-4 text-center">{i + 1}</span>}
                  {labels[i]}
                </div>
                {i < 2 && <ChevronRight size={12} className="text-slate-300 mx-1" />}
              </div>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">

          {/* Step: Describe */}
          {step === 'describe' && (
            <div className="px-6 py-5 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Describe the task</label>
                <p className="text-xs text-slate-400 mb-3">
                  Tell the AI what you want students to do. Be as brief or detailed as you like — the AI will figure out the rest and generate appropriate support materials.
                </p>
                <textarea
                  value={adminDescription}
                  onChange={e => setAdminDescription(e.target.value)}
                  placeholder="e.g. Write a Python program that reads a list of numbers from the user and calculates the mean, median, and mode. Students should handle edge cases like empty lists."
                  rows={6}
                  autoFocus
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 resize-y leading-relaxed"
                />
              </div>
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-xs font-medium text-amber-800 mb-1">What AI will generate for you:</p>
                <ul className="text-xs text-amber-700 space-y-1">
                  <li className="flex items-start gap-1.5"><span className="mt-0.5">•</span> A clear task title and student-facing instructions</li>
                  <li className="flex items-start gap-1.5"><span className="mt-0.5">•</span> Supporting files (reference guides, data files, starter templates) where appropriate</li>
                  <li className="flex items-start gap-1.5"><span className="mt-0.5">•</span> You can review, edit, and remove any files before assigning</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step: Generating */}
          {step === 'generating' && (
            <div className="flex flex-col items-center justify-center py-16 px-6 gap-5">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-sky-50 flex items-center justify-center">
                  <Sparkles size={28} className="text-sky-500" />
                </div>
                <div className="absolute -right-1 -bottom-1 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow">
                  <Loader2 size={14} className="text-sky-500 animate-spin" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-800">Generating your task...</p>
                <p className="text-xs text-slate-400 mt-1.5 max-w-xs leading-relaxed">
                  AI is thinking about what instructions, examples, and resources would best help your students succeed.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full max-w-xs">
                {['Writing task title and instructions', 'Deciding what support files students need', 'Generating file contents'].map((label, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 rounded-lg">
                    <Loader2 size={11} className="text-sky-400 animate-spin shrink-0" style={{ animationDelay: `${i * 0.3}s` }} />
                    <span className="text-xs text-slate-500">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step: Preview */}
          {step === 'preview' && (
            <div className="px-6 py-5 space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-600">Task Title</label>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1"><Pencil size={9} /> Editable</span>
                </div>
                <input
                  type="text"
                  value={generatedTitle}
                  onChange={e => setGeneratedTitle(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-600">Student Instructions</label>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1"><Pencil size={9} /> Editable</span>
                </div>
                <textarea
                  value={generatedInstructions}
                  onChange={e => setGeneratedInstructions(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 resize-y"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-600">
                    Generated Attachments
                    <span className="ml-1.5 text-[10px] text-slate-400 font-normal">
                      ({keptFiles.length} of {generatedFiles.length} selected)
                    </span>
                  </label>
                </div>
                {generatedFiles.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    AI determined no supporting files are needed for this task.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {generatedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className={`rounded-xl border p-3.5 transition-all ${
                          file.kept ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => toggleFile(idx)}
                            className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                              file.kept ? 'bg-sky-600 border-sky-600' : 'border-slate-300'
                            }`}
                          >
                            {file.kept && <Check size={9} className="text-white" strokeWidth={3} />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{fileTypeIcon(file.type)}</span>
                              <span className="text-xs font-medium text-slate-700 truncate">{file.filename}</span>
                              <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded uppercase shrink-0">{file.type}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{file.purpose}</p>
                          </div>
                          <button
                            onClick={() => setPreviewFile(previewFile?.filename === file.filename ? null : file)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors shrink-0 ${
                              previewFile?.filename === file.filename
                                ? 'bg-sky-100 text-sky-700'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            <Eye size={10} />
                            Preview
                          </button>
                        </div>

                        {previewFile?.filename === file.filename && (
                          <div className="mt-3 ml-7">
                            <pre className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed font-mono">
                              {file.content}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step: Assign */}
          {step === 'assign' && (
            <div className="px-6 py-5 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
              )}

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs font-semibold text-slate-700 mb-0.5">{generatedTitle}</p>
                <p className="text-[11px] text-slate-400 line-clamp-2">{generatedInstructions}</p>
                {keptFiles.length > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    <FileText size={10} className="text-slate-400" />
                    <span className="text-[10px] text-slate-400">{keptFiles.length} attachment{keptFiles.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Assign to</label>
                <div className="flex border border-slate-200 rounded-lg overflow-hidden mb-3">
                  <button
                    onClick={() => setAssignTab('students')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
                      assignTab === 'students' ? 'bg-sky-50 text-sky-600 border-b-2 border-sky-500' : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Users size={12} /> Students
                  </button>
                  <button
                    onClick={() => setAssignTab('classes')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
                      assignTab === 'classes' ? 'bg-sky-50 text-sky-600 border-b-2 border-sky-500' : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <BookOpen size={12} /> Classes
                  </button>
                </div>

                {assignTab === 'students' ? (
                  students.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-4">No students found</p>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-1.5">
                        <button onClick={selectAll} className="text-xs text-sky-600 hover:text-sky-700 font-medium">
                          {selectedStudents.size === students.length ? 'Deselect all' : 'Select all'}
                        </button>
                        <span className="text-xs text-slate-400">{selectedStudents.size} selected</span>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-xl max-h-52 overflow-y-auto p-1">
                        {students.map(s => (
                          <label
                            key={s.username}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                              selectedStudents.has(s.username) ? 'bg-sky-50' : 'hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedStudents.has(s.username)}
                              onChange={() => toggleStudent(s.username)}
                              className="w-3.5 h-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500/30"
                            />
                            <span className="text-sm text-slate-700">{s.username}</span>
                          </label>
                        ))}
                      </div>
                    </>
                  )
                ) : (
                  classes.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-4">No classes found. Create classes first.</p>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-xl max-h-52 overflow-y-auto p-1">
                      {classes.map(cls => {
                        const allIn = cls.members.length > 0 && cls.members.every(m => selectedStudents.has(m));
                        const someIn = cls.members.some(m => selectedStudents.has(m));
                        return (
                          <button
                            key={cls.id}
                            onClick={() => toggleClass(cls)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                              allIn ? 'bg-sky-50' : someIn ? 'bg-amber-50' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                              allIn ? 'bg-sky-600 border-sky-600' : someIn ? 'bg-amber-400 border-amber-400' : 'border-slate-300'
                            }`}>
                              {(allIn || someIn) && <Check size={9} className="text-white" strokeWidth={3} />}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-slate-700">{cls.name}</div>
                              <div className="text-[10px] text-slate-400">
                                {cls.members.length} student{cls.members.length !== 1 ? 's' : ''}
                                {someIn && !allIn && ` · ${cls.members.filter(m => selectedStudents.has(m)).length} selected`}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )
                )}
              </div>

              <p className="text-[11px] text-slate-400 text-center">
                You can also assign students later. Leave empty to save as unassigned.
              </p>
            </div>
          )}

          {/* Step: Saving */}
          {step === 'saving' && (
            <div className="flex flex-col items-center justify-center py-16 px-6 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 flex items-center justify-center">
                <Loader2 size={24} className="text-sky-500 animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-800">Creating task...</p>
                <p className="text-xs text-slate-400 mt-1">Uploading files and assigning to students</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'generating' && step !== 'saving' && (
          <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
            {step === 'describe' && (
              <>
                <button onClick={onClose} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={!adminDescription.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  <Sparkles size={14} />
                  Generate Task
                  <ArrowRight size={14} />
                </button>
              </>
            )}

            {step === 'preview' && (
              <>
                <button
                  onClick={() => setStep('describe')}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <ChevronLeft size={14} />
                  Back
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerate}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <Sparkles size={11} />
                    Regenerate
                  </button>
                  <button
                    onClick={() => setStep('assign')}
                    disabled={!generatedTitle.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-medium rounded-xl transition-colors"
                  >
                    Continue
                    <ChevronRight size={14} />
                  </button>
                </div>
              </>
            )}

            {step === 'assign' && (
              <>
                <button
                  onClick={() => setStep('preview')}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <ChevronLeft size={14} />
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  <Check size={14} />
                  {selectedStudents.size > 0
                    ? `Assign to ${selectedStudents.size} student${selectedStudents.size !== 1 ? 's' : ''}`
                    : 'Create Task'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

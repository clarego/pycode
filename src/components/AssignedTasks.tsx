import { useState, useEffect, useCallback } from 'react';
import { ClipboardList, Loader2, ExternalLink, CheckCircle2, Clock, FileText, ChevronDown, ChevronUp, Sparkles, Award, Calendar, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AssignedTask {
  task_id: string;
  tasks: {
    id: string;
    share_code: string;
    title: string;
    description: string;
    task_files: { name: string; path: string }[];
    deadline: string | null;
  };
}

interface SubmissionStatus {
  task_id: string;
  reviewed: boolean;
  feedback: string | null;
  submitted_at: string;
  ai_grade: string | null;
  grade: string | null;
  grade_overridden: boolean;
}

interface AssignedTasksProps {
  username: string;
}

export default function AssignedTasks({ username }: AssignedTasksProps) {
  const [assignments, setAssignments] = useState<AssignedTask[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, SubmissionStatus>>({});
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  const fetch = useCallback(async () => {
    const [{ data: assignData }, { data: subData }] = await Promise.all([
      supabase
        .from('task_assignments')
        .select('task_id, tasks(id, share_code, title, description, task_files, deadline)')
        .eq('student_id', username),
      supabase
        .from('task_submissions')
        .select('task_id, reviewed, feedback, submitted_at, ai_grade, grade, grade_overridden')
        .eq('student_id', username)
        .not('task_id', 'is', null),
    ]);

    setAssignments((assignData as unknown as AssignedTask[]) || []);

    const subMap: Record<string, SubmissionStatus> = {};
    for (const s of (subData || [])) {
      subMap[s.task_id] = s as SubmissionStatus;
    }
    setSubmissions(subMap);
    setLoading(false);
  }, [username]);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-3">
        <Loader2 className="animate-spin text-slate-400" size={14} />
      </div>
    );
  }

  if (assignments.length === 0) return null;

  const now = new Date();
  const pending = assignments.filter(a => !submissions[a.task_id]);
  const submitted = assignments.filter(a => submissions[a.task_id] && !submissions[a.task_id].reviewed);
  const reviewed = assignments.filter(a => submissions[a.task_id]?.reviewed);

  const overdueCount = pending.filter(a => {
    const dl = a.tasks?.deadline;
    return dl && new Date(dl) < now;
  }).length;

  return (
    <div className="bg-slate-900 border-b border-slate-700/60">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-2 text-left hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ClipboardList size={13} className="text-sky-400" />
          <span className="text-xs font-semibold text-sky-300">My Tasks</span>
          {overdueCount > 0 && (
            <span className="animate-pulse text-[10px] bg-red-500/25 text-red-300 px-1.5 py-0.5 rounded-full border border-red-500/40 font-semibold">
              {overdueCount} overdue!
            </span>
          )}
          {pending.length > 0 && (
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full border border-amber-500/30">
              {pending.length} pending
            </span>
          )}
          {submitted.length > 0 && (
            <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded-full border border-sky-500/30">
              {submitted.length} submitted
            </span>
          )}
          {reviewed.length > 0 && (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full border border-emerald-500/30">
              {reviewed.length} reviewed
            </span>
          )}
        </div>
        {collapsed ? <ChevronDown size={13} className="text-slate-500" /> : <ChevronUp size={13} className="text-slate-500" />}
      </button>

      {!collapsed && (
        <div className="px-4 pb-3 space-y-1.5">
          {assignments.map((a) => {
            const task = a.tasks;
            if (!task) return null;
            const sub = submissions[a.task_id];
            const fileCount = task.task_files?.length || 0;
            const deadlineDate = task.deadline ? new Date(task.deadline) : null;
            const isOverdue = !sub && deadlineDate && deadlineDate < now;

            return (
              <a
                key={a.task_id}
                href={`/task/${task.share_code}`}
                className={`flex items-center justify-between gap-3 px-3 py-2 border rounded-lg transition-colors group ${
                  isOverdue
                    ? 'bg-red-900/20 hover:bg-red-900/30 border-red-700/50 animate-pulse'
                    : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    sub?.reviewed ? 'bg-emerald-400' : sub ? 'bg-sky-400' : isOverdue ? 'bg-red-400' : 'bg-amber-400'
                  }`} />
                  <span className={`text-xs truncate ${isOverdue ? 'text-red-200 font-semibold' : 'text-slate-200'}`}>{task.title}</span>
                  {fileCount > 0 && (
                    <span className="flex items-center gap-0.5 text-[10px] text-slate-500 shrink-0">
                      <FileText size={9} />
                      {fileCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {deadlineDate && !sub && (
                    <span className={`flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      isOverdue
                        ? 'bg-red-900/50 text-red-300 border border-red-700/50'
                        : 'bg-amber-900/30 text-amber-400 border border-amber-700/40'
                    }`}>
                      {isOverdue ? <AlertCircle size={8} /> : <Calendar size={8} />}
                      {isOverdue ? 'Overdue' : `Due ${deadlineDate.toLocaleDateString()}`}
                    </span>
                  )}
                  {sub?.reviewed && (sub.grade_overridden && sub.grade ? (
                    <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-sky-900/40 text-sky-300 border border-sky-700/50">
                      <Award size={8} />
                      {sub.grade.split('\n')[0]}
                    </span>
                  ) : sub.ai_grade ? (
                    <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-900/40 text-amber-300 border border-amber-700/50">
                      <Sparkles size={8} />
                      {sub.ai_grade.split('\n')[0]}
                    </span>
                  ) : null)}
                  {sub ? (
                    <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${
                      sub.reviewed
                        ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50'
                        : 'bg-sky-900/40 text-sky-300 border border-sky-700/50'
                    }`}>
                      {sub.reviewed ? <CheckCircle2 size={8} /> : <Clock size={8} />}
                      {sub.reviewed ? 'Reviewed' : 'Submitted'}
                    </span>
                  ) : (
                    <span className={`text-[10px] ${isOverdue ? 'text-red-400 font-semibold' : 'text-amber-400/80'}`}>
                      {isOverdue ? 'Overdue!' : 'Not started'}
                    </span>
                  )}
                  <ExternalLink size={11} className="text-slate-500 group-hover:text-slate-300 transition-colors" />
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

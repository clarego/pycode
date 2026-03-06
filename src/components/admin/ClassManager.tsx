import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Loader2, X, Pencil, Trash2, Users, UserPlus, UserMinus,
  GraduationCap, CheckCircle2, AlertCircle, BookOpen, ChevronDown, ChevronRight,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const STANDALONE_URL = 'https://qfitpwdrswvnbmzvkoyd.supabase.co';
const STANDALONE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmaXRwd2Ryc3d2bmJtenZrb3lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNTc4NTIsImV4cCI6MjA3NjkzMzg1Mn0.owLaj3VrcyR7_LW9xMwOTTFQupbDKlvAlVwYtbidiNE';

interface ClassRow {
  id: string;
  name: string;
  description: string;
  created_at: string;
  members: string[];
}

async function fetchAllStudents(): Promise<string[]> {
  const res = await fetch(
    `${STANDALONE_URL}/rest/v1/users_login?select=username,is_admin&order=username.asc`,
    {
      headers: {
        apikey: STANDALONE_ANON_KEY,
        Authorization: `Bearer ${STANDALONE_ANON_KEY}`,
      },
    }
  );
  if (!res.ok) return [];
  const data: { username: string; is_admin: boolean }[] = await res.json();
  return data.filter(u => !u.is_admin).map(u => u.username);
}

function ClassFormModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: { id: string; name: string; description: string };
  onClose: () => void;
  onSave: (name: string, description: string) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Class name is required'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave(name.trim(), description.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save class');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 pt-6 pb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-800">
              {initial ? 'Edit Class' : 'New Class'}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle size={14} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Class Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Period 1, Year 10, Group A"
                autoFocus
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Description <span className="text-slate-400 font-normal">(optional)</span></label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="e.g. Monday morning Python class"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-xl transition-colors disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                {saving ? 'Saving...' : initial ? 'Save Changes' : 'Create Class'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function ManageMembersModal({
  cls,
  allStudents,
  onClose,
  onSave,
}: {
  cls: ClassRow;
  allStudents: string[];
  onClose: () => void;
  onSave: (classId: string, members: string[]) => Promise<void>;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(cls.members));
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const filtered = allStudents.filter(s =>
    s.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (username: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(username)) next.delete(username);
      else next.add(username);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await onSave(cls.id, Array.from(selected));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save members');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden" style={{ maxHeight: '80vh' }}>
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Manage Members</h2>
              <p className="text-sm text-slate-500 mt-0.5">{cls.name}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="px-6 pt-4 shrink-0">
          {error && (
            <div className="flex items-center gap-2 p-3 mb-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle size={14} className="shrink-0" />
              {error}
            </div>
          )}
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search students..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all mb-3"
          />
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>{selected.size} selected</span>
            <div className="flex gap-3">
              <button
                onClick={() => setSelected(new Set(allStudents))}
                className="text-sky-600 hover:text-sky-800 font-medium transition-colors"
              >
                Select all
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="text-slate-400 hover:text-slate-600 font-medium transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-6 pb-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No students found</p>
          ) : (
            <div className="space-y-1">
              {filtered.map(username => (
                <button
                  key={username}
                  onClick={() => toggle(username)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                    selected.has(username)
                      ? 'bg-sky-50 text-sky-800 border border-sky-200'
                      : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                    selected.has(username) ? 'bg-sky-600 border-sky-600' : 'border-slate-300'
                  }`}>
                    {selected.has(username) && <X size={10} className="text-white" strokeWidth={3} />}
                  </div>
                  <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-white">{username[0].toUpperCase()}</span>
                  </div>
                  {username}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 shrink-0">
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-xl transition-colors disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              {saving ? 'Saving...' : 'Save Members'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClassManager() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [allStudents, setAllStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRow | null>(null);
  const [managingClass, setManagingClass] = useState<ClassRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [studentsResult, classesResult, membersResult] = await Promise.all([
        fetchAllStudents(),
        supabase.from('classes').select('id, name, description, created_at').order('created_at', { ascending: true }),
        supabase.from('class_members').select('class_id, student_username'),
      ]);

      setAllStudents(studentsResult);

      const memberMap: Record<string, string[]> = {};
      for (const m of (membersResult.data ?? [])) {
        if (!memberMap[m.class_id]) memberMap[m.class_id] = [];
        memberMap[m.class_id].push(m.student_username);
      }

      const rows: ClassRow[] = (classesResult.data ?? []).map(c => ({
        ...c,
        members: memberMap[c.id] ?? [],
      }));

      setClasses(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (name: string, description: string) => {
    const { error: err } = await supabase
      .from('classes')
      .insert({ name, description });
    if (err) throw err;
    await fetchData();
  };

  const handleEdit = async (name: string, description: string) => {
    if (!editingClass) return;
    const { error: err } = await supabase
      .from('classes')
      .update({ name, description })
      .eq('id', editingClass.id);
    if (err) throw err;
    await fetchData();
  };

  const handleDelete = async (classId: string) => {
    const { error: err } = await supabase
      .from('classes')
      .delete()
      .eq('id', classId);
    if (err) throw err;
    setDeletingId(null);
    await fetchData();
  };

  const handleSaveMembers = async (classId: string, members: string[]) => {
    const cls = classes.find(c => c.id === classId);
    const current = new Set(cls?.members ?? []);
    const next = new Set(members);

    const toAdd = members.filter(m => !current.has(m));
    const toRemove = (cls?.members ?? []).filter(m => !next.has(m));

    if (toRemove.length > 0) {
      const { error: delErr } = await supabase
        .from('class_members')
        .delete()
        .eq('class_id', classId)
        .in('student_username', toRemove);
      if (delErr) throw delErr;
    }

    if (toAdd.length > 0) {
      const { error: insErr } = await supabase
        .from('class_members')
        .insert(toAdd.map(u => ({ class_id: classId, student_username: u })));
      if (insErr) throw insErr;
    }

    await fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-slate-400" size={24} />
      </div>
    );
  }

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BookOpen size={20} className="text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-800">Classes</h2>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
              {classes.length} {classes.length === 1 ? 'class' : 'classes'}
            </span>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            <Plus size={14} />
            New Class
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}

        {classes.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen size={24} className="text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium mb-1">No classes yet</p>
            <p className="text-sm text-slate-400 mb-5">Create a class to group students and assign tasks faster.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <Plus size={14} />
              Create your first class
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {classes.map(cls => (
              <div key={cls.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-4 px-5 py-4">
                  <button
                    onClick={() => setExpandedId(expandedId === cls.id ? null : cls.id)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
                      <GraduationCap size={18} className="text-sky-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 truncate">{cls.name}</span>
                        {expandedId === cls.id
                          ? <ChevronDown size={14} className="text-slate-400 shrink-0" />
                          : <ChevronRight size={14} className="text-slate-400 shrink-0" />
                        }
                      </div>
                      {cls.description && (
                        <p className="text-xs text-slate-500 truncate mt-0.5">{cls.description}</p>
                      )}
                    </div>
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      <Users size={11} />
                      {cls.members.length} {cls.members.length === 1 ? 'student' : 'students'}
                    </span>
                    <button
                      onClick={() => setManagingClass(cls)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors"
                    >
                      <UserPlus size={12} />
                      Members
                    </button>
                    <button
                      onClick={() => setEditingClass(cls)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit class"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeletingId(cls.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete class"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {expandedId === cls.id && (
                  <div className="border-t border-slate-100 px-5 py-4">
                    {cls.members.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-slate-400">No students in this class yet.</p>
                        <button
                          onClick={() => setManagingClass(cls)}
                          className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-sky-600 hover:text-sky-800 transition-colors"
                        >
                          <UserPlus size={12} />
                          Add students
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {cls.members.sort().map(username => (
                          <span
                            key={username}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
                          >
                            <div className="w-4 h-4 rounded-full bg-slate-600 flex items-center justify-center">
                              <span className="text-[9px] font-bold text-white">{username[0].toUpperCase()}</span>
                            </div>
                            {username}
                            <button
                              onClick={async () => {
                                const newMembers = cls.members.filter(m => m !== username);
                                await handleSaveMembers(cls.id, newMembers);
                              }}
                              className="text-slate-300 hover:text-red-500 transition-colors ml-0.5"
                              title={`Remove ${username}`}
                            >
                              <UserMinus size={11} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <ClassFormModal
          onClose={() => setShowCreate(false)}
          onSave={handleCreate}
        />
      )}

      {editingClass && (
        <ClassFormModal
          initial={editingClass}
          onClose={() => setEditingClass(null)}
          onSave={handleEdit}
        />
      )}

      {managingClass && (
        <ManageMembersModal
          cls={managingClass}
          allStudents={allStudents}
          onClose={() => setManagingClass(null)}
          onSave={handleSaveMembers}
        />
      )}

      {deletingId && (() => {
        const cls = classes.find(c => c.id === deletingId)!;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeletingId(null)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <h3 className="font-bold text-slate-800 mb-2">Delete Class</h3>
              <p className="text-sm text-slate-600 mb-5">
                Are you sure you want to delete <span className="font-semibold">{cls.name}</span>? This will remove all {cls.members.length} member{cls.members.length !== 1 ? 's' : ''} from the class.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeletingId(null)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deletingId)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}

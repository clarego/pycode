import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Loader2, X, Check, Users, Shield, GraduationCap, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { createUser, updateUser, deleteUsers } from '../../lib/api';

interface Profile {
  id: string;
  username: string;
  role: 'admin' | 'student';
  created_at: string;
}

interface UserRow {
  username: string;
  taskCount: number;
  lastActive: string | null;
}

interface Props {
  onSelectUser?: (username: string) => void;
}

export default function UserManagement({ onSelectUser }: Props) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRows, setUserRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'admin' | 'student'>('student');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const [profilesRes, progressRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: true }),
      supabase
        .from('module_progress')
        .select('username, completed_at')
        .order('completed_at', { ascending: false }),
    ]);

    const profileList = (profilesRes.data as Profile[]) || [];
    setProfiles(profileList);

    const progressData = progressRes.data || [];
    const usernameMap: Record<string, { count: number; lastActive: string | null }> = {};
    for (const row of progressData) {
      if (!usernameMap[row.username]) {
        usernameMap[row.username] = { count: 0, lastActive: row.completed_at };
      }
      usernameMap[row.username].count++;
    }

    const knownUsernames = new Set(profileList.map(p => p.username.toLowerCase()));
    const extraUsernames = Object.keys(usernameMap).filter(
      u => !knownUsernames.has(u.toLowerCase())
    );

    const rows: UserRow[] = Object.entries(usernameMap).map(([username, data]) => ({
      username,
      taskCount: data.count,
      lastActive: data.lastActive,
    }));

    if (!usernameMap['guest'] && !knownUsernames.has('guest')) {
      extraUsernames.push('guest');
    }

    extraUsernames.forEach(u => {
      if (!rows.find(r => r.username === u)) {
        rows.push({ username: u, taskCount: 0, lastActive: null });
      }
    });

    setUserRows(rows.sort((a, b) => a.username.localeCompare(b.username)));
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUsername.trim() || !formPassword) return;
    setSaving(true);
    setError('');
    try {
      await createUser(formUsername.trim(), formPassword, formRole);
      setShowCreate(false);
      setFormUsername('');
      setFormPassword('');
      setFormRole('student');
      await fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSaving(true);
    setError('');
    try {
      const updates: { username?: string; password?: string } = {};
      if (formUsername.trim() && formUsername.trim() !== editingUser.username) {
        updates.username = formUsername.trim();
      }
      if (formPassword) {
        updates.password = formPassword;
      }
      if (Object.keys(updates).length > 0) {
        await updateUser(editingUser.id, updates);
      }
      setEditingUser(null);
      setFormUsername('');
      setFormPassword('');
      await fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (selected.size === 0) return;
    setDeleting(true);
    try {
      await deleteUsers(Array.from(selected));
      setSelected(new Set());
      await fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete users');
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === profiles.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(profiles.map(u => u.id)));
    }
  };

  const getProfileForUsername = (username: string) =>
    profiles.find(p => p.username.toLowerCase() === username.toLowerCase());

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-slate-400" size={24} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users size={20} className="text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-800">User Management</h2>
          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
            {userRows.length} users
          </span>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium rounded-lg transition-colors border border-red-200"
            >
              {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              Delete {selected.size} selected
            </button>
          )}
          <button
            onClick={() => { setShowCreate(true); setError(''); setFormUsername(''); setFormPassword(''); setFormRole('student'); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors"
          >
            <Plus size={13} />
            Add User
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {(showCreate || editingUser) && (
        <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700">
              {editingUser ? `Edit: ${editingUser.username}` : 'Create New User'}
            </h3>
            <button
              onClick={() => { setShowCreate(false); setEditingUser(null); setError(''); }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X size={16} />
            </button>
          </div>
          <form onSubmit={editingUser ? handleUpdate : handleCreate} className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">Username</label>
              <input
                type="text"
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                placeholder={editingUser ? editingUser.username : 'Username'}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Password {editingUser && <span className="text-slate-400">(leave blank to keep)</span>}
              </label>
              <input
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder={editingUser ? 'New password' : 'Password'}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
              />
            </div>
            {!editingUser && (
              <div className="w-36">
                <label className="block text-xs font-medium text-slate-600 mb-1">Role</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as 'admin' | 'student')}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
                >
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}
            <button
              type="submit"
              disabled={saving || (!editingUser && (!formUsername.trim() || !formPassword))}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {editingUser ? 'Update' : 'Create'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 grid grid-cols-12 gap-3">
          <div className="col-span-1 flex items-center">
            <input
              type="checkbox"
              checked={selected.size === profiles.length && profiles.length > 0}
              onChange={toggleAll}
              className="rounded border-slate-300"
            />
          </div>
          <div className="col-span-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Username</div>
          <div className="col-span-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</div>
          <div className="col-span-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tasks Done</div>
          <div className="col-span-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Active</div>
          <div className="col-span-1"></div>
        </div>

        <div className="divide-y divide-slate-100">
          {userRows.map((row) => {
            const profile = getProfileForUsername(row.username);
            const isGuest = row.username === 'guest';

            return (
              <div
                key={row.username}
                className={`grid grid-cols-12 gap-3 items-center px-4 py-3 hover:bg-slate-50 transition-colors ${
                  profile && selected.has(profile.id) ? 'bg-sky-50/50' : ''
                }`}
              >
                <div className="col-span-1">
                  {profile ? (
                    <input
                      type="checkbox"
                      checked={selected.has(profile.id)}
                      onChange={() => toggleSelect(profile.id)}
                      className="rounded border-slate-300"
                    />
                  ) : (
                    <div className="w-4 h-4" />
                  )}
                </div>

                <div className="col-span-4 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-white">{row.username[0].toUpperCase()}</span>
                  </div>
                  <button
                    onClick={() => onSelectUser?.(row.username)}
                    className="group flex items-center gap-1 text-sm font-medium text-sky-700 hover:text-sky-900 hover:underline transition-colors"
                  >
                    {row.username}
                    <ChevronRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>

                <div className="col-span-2">
                  {isGuest ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200">
                      <GraduationCap size={10} />
                      guest
                    </span>
                  ) : profile ? (
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                      profile.role === 'admin'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-sky-50 text-sky-700 border border-sky-200'
                    }`}>
                      {profile.role === 'admin' ? <Shield size={10} /> : <GraduationCap size={10} />}
                      {profile.role}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-50 text-slate-400 border border-slate-200">
                      <GraduationCap size={10} />
                      student
                    </span>
                  )}
                </div>

                <div className="col-span-2">
                  <span className="text-sm text-slate-600">{row.taskCount > 0 ? row.taskCount : '—'}</span>
                </div>

                <div className="col-span-2 text-xs text-slate-500">
                  {row.lastActive ? new Date(row.lastActive).toLocaleDateString() : '—'}
                </div>

                <div className="col-span-1 flex justify-end">
                  {profile && (
                    <button
                      onClick={() => {
                        setEditingUser(profile);
                        setFormUsername(profile.username);
                        setFormPassword('');
                        setShowCreate(false);
                        setError('');
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {userRows.length === 0 && (
          <div className="text-center py-10 text-sm text-slate-400">No users found</div>
        )}
      </div>
    </div>
  );
}

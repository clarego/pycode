import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Loader2, X, Check, Users, Shield, GraduationCap } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { createUser, updateUser, deleteUsers } from '../../lib/api';

interface Profile {
  id: string;
  username: string;
  role: 'admin' | 'student';
  created_at: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<Profile[]>([]);
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
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });
    setUsers((data as Profile[]) || []);
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
    if (selected.size === users.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(users.map(u => u.id)));
    }
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users size={20} className="text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-800">User Management</h2>
          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{users.length} users</span>
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
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={selected.size === users.length && users.length > 0}
                  onChange={toggleAll}
                  className="rounded border-slate-300"
                />
              </th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Username</th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
              <th className="w-20 px-3 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className={`hover:bg-slate-50 transition-colors ${selected.has(u.id) ? 'bg-sky-50/50' : ''}`}>
                <td className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(u.id)}
                    onChange={() => toggleSelect(u.id)}
                    className="rounded border-slate-300"
                  />
                </td>
                <td className="px-3 py-3">
                  <span className="text-sm font-medium text-slate-800">{u.username}</span>
                </td>
                <td className="px-3 py-3">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                    u.role === 'admin'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-sky-50 text-sky-700 border border-sky-200'
                  }`}>
                    {u.role === 'admin' ? <Shield size={10} /> : <GraduationCap size={10} />}
                    {u.role}
                  </span>
                </td>
                <td className="px-3 py-3 text-xs text-slate-500">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="px-3 py-3">
                  <button
                    onClick={() => {
                      setEditingUser(u);
                      setFormUsername(u.username);
                      setFormPassword('');
                      setShowCreate(false);
                      setError('');
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="text-center py-10 text-sm text-slate-400">No users found</div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Loader2, Users, Shield, GraduationCap, ChevronRight, RefreshCw,
  ChevronUp, ChevronDown, ChevronsUpDown, KeyRound, X, Eye, EyeOff, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { updateUser } from '../../lib/api';

const STANDALONE_URL = 'https://qfitpwdrswvnbmzvkoyd.supabase.co';
const STANDALONE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmaXRwd2Ryc3d2bmJtenZrb3lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNTc4NTIsImV4cCI6MjA3NjkzMzg1Mn0.owLaj3VrcyR7_LW9xMwOTTFQupbDKlvAlVwYtbidiNE';

type SortKey = 'username' | 'role' | 'taskCount' | 'lastActive';
type SortDir = 'asc' | 'desc';

interface LoginUser {
  id: string;
  username: string;
  is_admin: boolean;
  created_at: string;
}

interface UserRow extends LoginUser {
  taskCount: number;
  lastActive: string | null;
}

interface Props {
  onSelectUser?: (username: string) => void;
}

async function fetchLoginUsers(): Promise<LoginUser[]> {
  const res = await fetch(
    `${STANDALONE_URL}/rest/v1/users_login?select=id,username,is_admin,created_at&order=created_at.asc`,
    {
      headers: {
        apikey: STANDALONE_ANON_KEY,
        Authorization: `Bearer ${STANDALONE_ANON_KEY}`,
      },
    }
  );
  if (!res.ok) return [];
  return res.json();
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown size={12} className="text-slate-300" />;
  return sortDir === 'asc'
    ? <ChevronUp size={12} className="text-sky-600" />
    : <ChevronDown size={12} className="text-sky-600" />;
}

interface ChangePasswordModalProps {
  user: UserRow;
  onClose: () => void;
}

function ChangePasswordModal({ user, onClose }: ChangePasswordModalProps) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await updateUser(user.id, { password });
      setSuccess(true);
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 pt-6 pb-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Change Password</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Set a new password for <span className="font-medium text-slate-700">{user.username}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {success ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                <CheckCircle2 size={24} className="text-green-500" />
              </div>
              <p className="text-sm font-medium text-slate-700">Password updated successfully</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle size={15} className="shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    disabled={loading}
                    autoFocus
                    className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat new password"
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all disabled:opacity-50"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!password || !confirm || loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-xl transition-colors disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />}
                  {loading ? 'Saving...' : 'Update'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UserManagement({ onSelectUser }: Props) {
  const [userRows, setUserRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('username');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [changingPasswordFor, setChangingPasswordFor] = useState<UserRow | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [loginUsers, progressRes] = await Promise.all([
        fetchLoginUsers(),
        supabase
          .from('module_progress')
          .select('username, completed_at')
          .order('completed_at', { ascending: false }),
      ]);

      const progressData = progressRes.data || [];
      const progressMap: Record<string, { count: number; lastActive: string | null }> = {};
      for (const row of progressData) {
        const key = row.username.toLowerCase();
        if (!progressMap[key]) {
          progressMap[key] = { count: 0, lastActive: row.completed_at };
        }
        progressMap[key].count++;
      }

      const rows: UserRow[] = loginUsers.map((u) => {
        const stats = progressMap[u.username.toLowerCase()];
        return {
          ...u,
          taskCount: stats?.count ?? 0,
          lastActive: stats?.lastActive ?? null,
        };
      });

      setUserRows(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = useMemo(() => {
    return [...userRows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'username') {
        cmp = a.username.localeCompare(b.username);
      } else if (sortKey === 'role') {
        cmp = Number(b.is_admin) - Number(a.is_admin);
      } else if (sortKey === 'taskCount') {
        cmp = a.taskCount - b.taskCount;
      } else if (sortKey === 'lastActive') {
        const aTime = a.lastActive ? new Date(a.lastActive).getTime() : 0;
        const bTime = b.lastActive ? new Date(b.lastActive).getTime() : 0;
        cmp = aTime - bTime;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [userRows, sortKey, sortDir]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-slate-400" size={24} />
      </div>
    );
  }

  const headerCell = (label: string, key: SortKey, span: string) => (
    <button
      onClick={() => handleSort(key)}
      className={`${span} flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
        sortKey === key ? 'text-sky-600' : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      {label}
      <SortIcon col={key} sortKey={sortKey} sortDir={sortDir} />
    </button>
  );

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users size={20} className="text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-800">Users</h2>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
              {userRows.length} users
            </span>
          </div>
          <button
            onClick={fetchUsers}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 grid grid-cols-12 gap-3">
            {headerCell('Username', 'username', 'col-span-4')}
            {headerCell('Role', 'role', 'col-span-2')}
            {headerCell('Tasks Done', 'taskCount', 'col-span-2')}
            {headerCell('Last Active', 'lastActive', 'col-span-2')}
            <div className="col-span-2" />
          </div>

          <div className="divide-y divide-slate-100">
            {sorted.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-12 gap-3 items-center px-5 py-3.5 hover:bg-slate-50 transition-colors"
              >
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-white">{row.username[0].toUpperCase()}</span>
                  </div>
                  <button
                    onClick={() => onSelectUser?.(row.username)}
                    className="group flex items-center gap-1 text-sm font-medium text-sky-700 hover:text-sky-900 transition-colors"
                  >
                    {row.username}
                    <ChevronRight size={13} className="opacity-0 group-hover:opacity-60 transition-opacity" />
                  </button>
                </div>

                <div className="col-span-2">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full ${
                    row.is_admin
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-sky-50 text-sky-700 border border-sky-200'
                  }`}>
                    {row.is_admin ? <Shield size={10} /> : <GraduationCap size={10} />}
                    {row.is_admin ? 'Admin' : 'Student'}
                  </span>
                </div>

                <div className="col-span-2">
                  {row.taskCount > 0 ? (
                    <span className="text-sm font-medium text-slate-700">{row.taskCount}</span>
                  ) : (
                    <span className="text-sm text-slate-300">—</span>
                  )}
                </div>

                <div className="col-span-2 text-xs text-slate-500">
                  {row.lastActive ? new Date(row.lastActive).toLocaleDateString() : (
                    <span className="text-slate-300">—</span>
                  )}
                </div>

                <div className="col-span-2 flex justify-end">
                  <button
                    onClick={() => setChangingPasswordFor(row)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                    title="Change password"
                  >
                    <KeyRound size={12} />
                    Password
                  </button>
                </div>
              </div>
            ))}
          </div>

          {sorted.length === 0 && !error && (
            <div className="text-center py-12 text-sm text-slate-400">No users found</div>
          )}
        </div>
      </div>

      {changingPasswordFor && (
        <ChangePasswordModal
          user={changingPasswordFor}
          onClose={() => setChangingPasswordFor(null)}
        />
      )}
    </>
  );
}

import { useState } from 'react';
import { Users, ClipboardList, FileCheck, LogOut, Code2, GraduationCap, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import UserManagement from './UserManagement';
import TaskManager from './TaskManager';
import SubmissionViewer from './SubmissionViewer';
import ModuleProgressViewer from './ModuleProgressViewer';

type Tab = 'users' | 'tasks' | 'submissions' | 'progress';
type UserDetailTab = 'progress' | 'submissions';

const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: 'users', label: 'Users', icon: Users },
  { id: 'tasks', label: 'Tasks', icon: ClipboardList },
  { id: 'submissions', label: 'Submissions', icon: FileCheck },
  { id: 'progress', label: 'Module Progress', icon: GraduationCap },
];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('tasks');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userDetailTab, setUserDetailTab] = useState<UserDetailTab>('progress');

  const handleSelectUser = (username: string) => {
    setSelectedUser(username);
    setUserDetailTab('progress');
    setActiveTab('progress');
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (tab !== 'progress') {
      setSelectedUser(null);
    }
  };

  const handleClearUser = () => {
    setSelectedUser(null);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <header className="flex items-center justify-between px-6 py-3 bg-slate-800 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-4">
          <a
            href="https://digitalvector.com.au"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <img src="/digivec_logo.png" alt="Digital Vector" className="h-7" />
          </a>
          <div className="w-px h-5 bg-slate-600" />
          <div className="flex items-center gap-2">
            <Code2 size={16} className="text-sky-400" />
            <span className="text-sm font-semibold text-white">Admin Dashboard</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            Signed in as <span className="text-slate-200 font-medium">{user?.username}</span>
          </span>
          <a
            href="/playground"
            className="px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            Playground
          </a>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <LogOut size={13} />
            Sign Out
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <nav className="w-52 bg-white border-r border-slate-200 py-4 px-3 shrink-0">
          <div className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto">
            {activeTab === 'users' && (
              <UserManagement onSelectUser={handleSelectUser} />
            )}
            {activeTab === 'tasks' && <TaskManager />}
            {activeTab === 'submissions' && <SubmissionViewer />}
            {activeTab === 'progress' && (
              selectedUser ? (
                <div>
                  <div className="flex items-center justify-between mb-5 px-4 py-3 bg-sky-50 border border-sky-200 rounded-xl">
                    <div className="flex items-center gap-2 text-sm text-sky-700">
                      <Users size={14} />
                      <span>Viewing <strong>{selectedUser}</strong></span>
                    </div>
                    <button
                      onClick={handleClearUser}
                      className="flex items-center gap-1 text-xs text-sky-500 hover:text-sky-700 transition-colors"
                    >
                      <X size={13} />
                      Show all
                    </button>
                  </div>

                  <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit border border-slate-200">
                    <button
                      onClick={() => setUserDetailTab('progress')}
                      className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        userDetailTab === 'progress'
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <GraduationCap size={14} />
                      Module Progress
                    </button>
                    <button
                      onClick={() => setUserDetailTab('submissions')}
                      className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        userDetailTab === 'submissions'
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <FileCheck size={14} />
                      Submissions
                    </button>
                  </div>

                  {userDetailTab === 'progress' && (
                    <ModuleProgressViewer
                      initialUser={selectedUser}
                      onClearUser={handleClearUser}
                      hideUserBanner
                    />
                  )}
                  {userDetailTab === 'submissions' && (
                    <SubmissionViewer filterUsername={selectedUser} />
                  )}
                </div>
              ) : (
                <ModuleProgressViewer onClearUser={handleClearUser} />
              )
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

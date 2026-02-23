import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import LoginModal from '../auth/LoginModal';
import TaskView from './TaskView';
import { ClipboardList, LogIn, Loader2 } from 'lucide-react';

interface TaskPageProps {
  shareCode: string;
}

export default function TaskPage({ shareCode }: TaskPageProps) {
  const { user, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-slate-400" size={28} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-full bg-sky-100 flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="text-sky-600" size={24} />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Sign in required</h2>
          <p className="text-sm text-slate-500 mb-6">
            You need to sign in to access this task. Please log in with your student account.
          </p>
          <button
            onClick={() => setShowLogin(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <LogIn size={16} />
            Sign In
          </button>
          {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
        </div>
      </div>
    );
  }

  return <TaskView shareCode={shareCode} />;
}

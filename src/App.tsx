import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './components/auth/AuthContext';
import PythonPlayground from './components/PythonPlayground';
import SharedView from './components/SharedView';
import EmbedView from './components/EmbedView';
import SessionReview from './components/SessionReview';
import AdminDashboard from './components/admin/AdminDashboard';
import TaskPage from './components/tasks/TaskPage';
import LoginModal from './components/auth/LoginModal';

type Route =
  | { type: 'home' }
  | { type: 'playground' }
  | { type: 'shared'; code: string }
  | { type: 'embed'; code: string }
  | { type: 'review'; code: string }
  | { type: 'task'; code: string }
  | { type: 'admin' };

function getRoute(): Route {
  const path = window.location.pathname;

  const reviewMatch = path.match(/^\/review\/([a-z0-9]+)$/);
  if (reviewMatch) return { type: 'review', code: reviewMatch[1] };

  const sharedMatch = path.match(/^\/code\/([a-z0-9]+)$/);
  if (sharedMatch) return { type: 'shared', code: sharedMatch[1] };

  const embedMatch = path.match(/^\/embed\/([a-z0-9]+)$/);
  if (embedMatch) return { type: 'embed', code: embedMatch[1] };

  const taskMatch = path.match(/^\/task\/([a-z0-9]+)$/);
  if (taskMatch) return { type: 'task', code: taskMatch[1] };

  if (path === '/admin') return { type: 'admin' };
  if (path === '/playground') return { type: 'playground' };

  return { type: 'home' };
}

function AppContent() {
  const [route, setRoute] = useState<Route>(getRoute);
  const { user, apiKey, loading, initialized, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    function handlePopState() {
      setRoute(getRoute());
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (!initialized || loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-slate-500 border-t-slate-200 rounded-full animate-spin" />
          <span className="text-sm text-slate-400">Loading...</span>
        </div>
      </div>
    );
  }

  if (route.type === 'review') {
    return <SessionReview shareId={route.code} />;
  }
  if (route.type === 'shared') {
    return <SharedView shortCode={route.code} />;
  }
  if (route.type === 'embed') {
    return <EmbedView shortCode={route.code} />;
  }
  if (route.type === 'task') {
    return <TaskPage shareCode={route.code} />;
  }

  if (route.type !== 'playground' && (route.type === 'admin' || (route.type === 'home' && user?.isAdmin))) {
    if (user?.isAdmin) {
      return <AdminDashboard />;
    }
  }

  const profile = user ? { username: user.username, role: user.isAdmin ? 'admin' : 'student' } : null;

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 min-h-0">
        <PythonPlayground
          profile={profile}
          loading={false}
          apiKey={apiKey}
          logout={logout}
          onShowLogin={() => setShowLogin(true)}
        />
      </div>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

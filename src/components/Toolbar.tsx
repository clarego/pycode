import { useState, useRef, useEffect } from 'react';
import {
  Play,
  Square,
  Trash2,
  Share2,
  Download,
  Upload,
  RotateCcw,
  Maximize,
  Minimize,
  ChevronDown,
  BookOpen,
  LayoutGrid,
  Undo2,
  Redo2,
  Send,
  Loader2,
  LogIn,
  LogOut,
  User,
  Settings,
  KeyRound,
  Sun,
  Moon,
  Terminal,
  GraduationCap,
  Save,
  FolderOpen,
  FileCheck,
  MoreHorizontal,
} from 'lucide-react';
import { templates } from '../lib/templates';
import { useTheme } from './ThemeContext';

interface ToolbarProps {
  isReady: boolean;
  isRunning: boolean;
  isFullscreen: boolean;
  onRun: () => void;
  onStop: () => void;
  onClear: () => void;
  onShare: () => void;
  onDownload: () => void;
  onReset: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onToggleFullscreen: () => void;
  onLoadTemplate: (files: Record<string, string>) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  showSubmit?: boolean;
  onOpenDesigner: () => void;
  hasDesign?: boolean;
  onUploadFile?: (name: string, content: string, isBinary?: boolean) => void;
  profile?: { username: string; role: string } | null;
  loading?: boolean;
  logout?: () => void;
  onShowLogin?: () => void;
  onShowChangePassword?: () => void;
  apiKeyLoaded?: boolean;
  onSaveProject?: () => void;
  onOpenProject?: () => void;
  onShowSubmissions?: () => void;
}

export default function Toolbar({
  isReady,
  isRunning,
  isFullscreen,
  onRun,
  onStop,
  onClear,
  onShare,
  onDownload,
  onReset,
  onUndo,
  onRedo,
  onToggleFullscreen,
  onLoadTemplate,
  onSubmit,
  isSubmitting = false,
  showSubmit = false,
  onOpenDesigner,
  hasDesign = false,
  onUploadFile,
  profile,
  loading,
  logout,
  onShowLogin,
  onShowChangePassword,
  apiKeyLoaded = false,
  onSaveProject,
  onOpenProject,
  onShowSubmissions,
}: ToolbarProps) {
  const { darkMode, hackerMode, toggleDarkMode, toggleHackerMode } = useTheme();
  const [showExamples, setShowExamples] = useState(false);
  const [showMobileMore, setShowMobileMore] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowExamples(false);
      }
      if (mobileMoreRef.current && !mobileMoreRef.current.contains(e.target as Node)) {
        setShowMobileMore(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col bg-slate-800 border-b border-slate-700">
      {/* Branding row */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-0.5 border-b border-slate-700/60">
        <a href="/" className="flex items-center gap-2 sm:gap-3 shrink-0 group">
          <img src="/pycode_logo.png" alt="PyCode" className="h-8 sm:h-10 w-auto" />
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="text-base font-bold text-white tracking-tight">PyCode</span>
            <span className="text-[11px] text-slate-400 tracking-wide">Online Python Compiler</span>
          </div>
        </a>

        <div className="flex items-center gap-2">
          <span className="hidden lg:inline-flex items-center px-2.5 py-1 bg-sky-900/40 text-sky-300 text-xs font-medium rounded-full border border-sky-700/50">
            Python 3.10+
          </span>

          {!loading && (
            <>
              {profile ? (
                <div className="flex items-center gap-1">
                  <span className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-700 px-2 py-1.5 rounded">
                    <User size={13} />
                    <span className="hidden sm:inline">{profile.username}</span>
                  </span>
                  {profile.role === 'admin' && (
                    <a
                      href="/admin"
                      className="hidden sm:block text-xs text-sky-300 hover:text-sky-200 bg-slate-700 hover:bg-slate-600 px-2.5 py-1.5 rounded transition-colors"
                    >
                      Dashboard
                    </a>
                  )}
                  {onShowSubmissions && (
                    <button
                      onClick={onShowSubmissions}
                      className="hidden sm:flex items-center gap-1.5 px-2 py-1.5 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-medium rounded transition-colors"
                      title="My Submissions"
                    >
                      <FileCheck size={13} />
                    </button>
                  )}
                  <div
                    className={`hidden sm:flex items-center px-1.5 py-1.5 rounded ${apiKeyLoaded ? 'text-emerald-400' : 'text-slate-500'}`}
                    title={apiKeyLoaded ? 'API key loaded' : 'No API key'}
                  >
                    <Settings size={13} />
                  </div>
                  <button
                    onClick={onShowChangePassword}
                    className="hidden sm:flex items-center gap-1.5 px-2 py-1.5 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-medium rounded transition-colors"
                    title="Change Password"
                  >
                    <KeyRound size={13} />
                  </button>
                  <button
                    onClick={logout}
                    className="flex items-center gap-1.5 px-2 py-1.5 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-medium rounded transition-colors"
                    title="Logout"
                  >
                    <LogOut size={13} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={onShowLogin}
                  className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded transition-colors font-medium"
                  title="Login"
                >
                  <LogIn size={13} />
                  <span>Login</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Actions row - desktop */}
      <div className="hidden sm:flex items-center justify-between px-4 py-1.5">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onRun}
            disabled={!isReady || isRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:text-slate-400 text-white text-xs font-medium rounded transition-colors"
            title="Run (Ctrl+Enter)"
          >
            <Play size={13} fill="currentColor" />
            <span>Run</span>
          </button>

          <button
            onClick={onStop}
            disabled={!isRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 disabled:bg-slate-600 disabled:text-slate-400 text-white text-xs font-medium rounded transition-colors"
            title="Stop"
          >
            <Square size={12} fill="currentColor" />
            <span>Stop</span>
          </button>

          <button
            onClick={onClear}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-medium rounded transition-colors"
            title="Clear Output"
          >
            <Trash2 size={13} />
            <span className="hidden md:inline">Clear</span>
          </button>

          <div className="w-px h-5 bg-slate-600 mx-1" />

          <button onClick={onUndo} className="flex items-center gap-1.5 px-2 py-1.5 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-medium rounded transition-colors" title="Undo">
            <Undo2 size={13} />
          </button>
          <button onClick={onRedo} className="flex items-center gap-1.5 px-2 py-1.5 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-medium rounded transition-colors" title="Redo">
            <Redo2 size={13} />
          </button>

          <div className="w-px h-5 bg-slate-600 mx-1" />

          <div ref={dropdownRef} className="relative">
            <button onClick={() => setShowExamples(!showExamples)} className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-medium rounded transition-colors">
              <BookOpen size={13} />
              <span className="hidden sm:inline">Examples</span>
              <ChevronDown size={12} className={`transition-transform ${showExamples ? 'rotate-180' : ''}`} />
            </button>
            {showExamples && (
              <div className="absolute top-full left-0 mt-1 w-52 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                {templates.map((t) => (
                  <button key={t.name} onClick={() => { onLoadTemplate(t.files); setShowExamples(false); }} className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onOpenDesigner}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded transition-colors border ${hasDesign ? 'text-teal-200 bg-teal-800/50 border-teal-600/70 hover:bg-teal-700/60' : 'text-teal-300 hover:text-teal-100 hover:bg-teal-800/40 border-teal-700/50'}`}
            title={hasDesign ? 'Edit existing GUI design' : 'Visual GUI Designer'}
          >
            <LayoutGrid size={13} />
            <span className="hidden md:inline">{hasDesign ? 'Edit Design' : 'GUI Designer'}</span>
            {hasDesign && <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />}
          </button>

          <a href="/modules" className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded transition-colors border text-sky-300 hover:text-sky-100 hover:bg-sky-900/40 border-sky-700/50" title="Learning Modules">
            <GraduationCap size={13} />
            <span className="hidden md:inline">Modules</span>
          </a>

          {profile && (
            <>
              <div className="w-px h-5 bg-slate-600 mx-0.5" />
              <button onClick={onSaveProject} className="flex items-center gap-1.5 px-2.5 py-1.5 text-emerald-300 hover:text-emerald-100 hover:bg-emerald-900/40 text-xs font-medium rounded transition-colors border border-emerald-700/50" title="Save project">
                <Save size={13} />
                <span className="hidden md:inline">Save</span>
              </button>
              <button onClick={onOpenProject} className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-medium rounded transition-colors border border-slate-600/50" title="Open saved project">
                <FolderOpen size={13} />
                <span className="hidden md:inline">Open</span>
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {showSubmit && (
            <>
              <button onClick={onSubmit} disabled={isSubmitting} className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 disabled:text-slate-400 text-white text-xs font-semibold rounded transition-colors" title="Submit for teacher review">
                {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                <span className="hidden sm:inline">{isSubmitting ? 'Submitting...' : 'Submit'}</span>
              </button>
              <div className="w-px h-5 bg-slate-600 mx-1" />
            </>
          )}

          <button onClick={onShare} className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-medium rounded transition-colors" title="Share">
            <Share2 size={13} />
            <span className="hidden md:inline">Share</span>
          </button>

          {onUploadFile && (
            <label className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-medium rounded transition-colors cursor-pointer" title="Open file">
              <Upload size={13} />
              <input type="file" accept=".py,.ipynb,.html,.css,.js,.json,.txt,.csv,.md,.png,.jpg,.jpeg,.gif,.svg,.bmp,.webp,.ico,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp" className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
                  const textExtensions = ['.py', '.ipynb', '.html', '.css', '.js', '.json', '.txt', '.csv', '.md'];
                  const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.bmp', '.webp', '.ico', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.odt', '.ods', '.odp'];
                  if (textExtensions.includes(ext)) {
                    const reader = new FileReader();
                    reader.onload = () => { onUploadFile(file.name, reader.result as string, false); };
                    reader.readAsText(file);
                  } else if (binaryExtensions.includes(ext)) {
                    const reader = new FileReader();
                    reader.onload = () => { onUploadFile(file.name, reader.result as string, true); };
                    reader.readAsDataURL(file);
                  } else {
                    alert(`Unsupported file type: ${file.name}`);
                  }
                  e.target.value = '';
                }}
              />
            </label>
          )}

          <button onClick={onDownload} className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-medium rounded transition-colors" title="Download">
            <Download size={13} />
          </button>
          <button onClick={onReset} className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-medium rounded transition-colors" title="Reset">
            <RotateCcw size={13} />
          </button>
          <button onClick={onToggleFullscreen} className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-medium rounded transition-colors" title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
            {isFullscreen ? <Minimize size={13} /> : <Maximize size={13} />}
          </button>

          <div className="w-px h-5 bg-slate-600 mx-1" />

          <button onClick={toggleDarkMode} title={darkMode ? 'Light Mode' : 'Dark Mode'} className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded transition-all ${darkMode ? 'text-amber-300 hover:text-amber-200 hover:bg-slate-700' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}>
            {darkMode ? <Sun size={13} /> : <Moon size={13} />}
            <span className="hidden lg:inline">{darkMode ? 'Light' : 'Dark'}</span>
          </button>
          <button onClick={toggleHackerMode} title={hackerMode ? 'Disable Hacker Mode' : 'Enable Hacker Mode'} className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded transition-all ${hackerMode ? 'text-green-400 bg-green-950/60 border border-green-700/60 hover:bg-green-900/60 shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}>
            <Terminal size={13} />
            <span className="hidden lg:inline">Hack</span>
          </button>
        </div>
      </div>

      {/* Actions row - mobile (compact single row) */}
      <div className="flex sm:hidden items-center justify-between px-2 py-1.5 gap-1">
        <div className="flex items-center gap-1">
          <button
            onClick={onRun}
            disabled={!isReady || isRunning}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:text-slate-400 text-white text-xs font-medium rounded transition-colors"
          >
            <Play size={13} fill="currentColor" />
            Run
          </button>
          <button
            onClick={onStop}
            disabled={!isRunning}
            className="flex items-center gap-1 px-2 py-1.5 bg-red-600 hover:bg-red-500 disabled:bg-slate-600 disabled:text-slate-400 text-white text-xs font-medium rounded transition-colors"
          >
            <Square size={11} fill="currentColor" />
          </button>
          <button onClick={onUndo} className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Undo">
            <Undo2 size={13} />
          </button>
          <button onClick={onRedo} className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Redo">
            <Redo2 size={13} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          {showSubmit && (
            <button onClick={onSubmit} disabled={isSubmitting} className="flex items-center gap-1 px-2.5 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 text-white text-xs font-semibold rounded transition-colors">
              {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              Submit
            </button>
          )}

          <div ref={mobileMoreRef} className="relative">
            <button
              onClick={() => setShowMobileMore(!showMobileMore)}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
              title="More options"
            >
              <MoreHorizontal size={15} />
            </button>
            {showMobileMore && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                <button onClick={() => { onClear(); setShowMobileMore(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                  <Trash2 size={13} /> Clear Output
                </button>
                <button onClick={() => { onShare(); setShowMobileMore(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                  <Share2 size={13} /> Share
                </button>
                <button onClick={() => { onDownload(); setShowMobileMore(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                  <Download size={13} /> Download
                </button>
                <button onClick={() => { onReset(); setShowMobileMore(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                  <RotateCcw size={13} /> Reset
                </button>
                {profile && onSaveProject && (
                  <button onClick={() => { onSaveProject(); setShowMobileMore(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-emerald-300 hover:text-white hover:bg-slate-700 transition-colors">
                    <Save size={13} /> Save Project
                  </button>
                )}
                {profile && onOpenProject && (
                  <button onClick={() => { onOpenProject(); setShowMobileMore(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                    <FolderOpen size={13} /> Open Project
                  </button>
                )}
                <a href="/modules" className="flex items-center gap-2.5 px-3 py-2 text-xs text-sky-300 hover:text-white hover:bg-slate-700 transition-colors">
                  <GraduationCap size={13} /> Modules
                </a>
                <button onClick={() => { toggleDarkMode(); setShowMobileMore(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                  {darkMode ? <Sun size={13} /> : <Moon size={13} />} {darkMode ? 'Light Mode' : 'Dark Mode'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useCallback, useEffect, useRef } from 'react';
import CodeEditor from './CodeEditor';
import type { CodeEditorHandle } from './CodeEditor';
import FileTabs from './FileTabs';
import FileManager from './FileManager';
import FilePreview from './FilePreview';
import OutputPanel from './OutputPanel';
import Toolbar from './Toolbar';
import ShareDialog from './ShareDialog';
import ResizablePanel from './ResizablePanel';
import Toast from './Toast';
import SubmitDialog from './SubmitDialog';
import GuiDesigner from './gui-designer/GuiDesigner';
import NotebookEditor from './notebook/NotebookEditor';
import type { FormState } from './gui-designer/types';
import { usePyodide } from '../hooks/usePyodide';
import { useSessionRecorder } from '../hooks/useSessionRecorder';
import { serializeNotebook, createEmptyNotebook } from '../lib/notebook';
import { Upload, PanelLeftOpen, Lock, ExternalLink, Play, Square } from 'lucide-react';

import { saveSnippet } from '../lib/snippets';
import { saveSession } from '../lib/sessions';

const DEFAULT_FORM: FormState = {
  title: 'My Application',
  width: 500,
  height: 400,
  bg: '#f0f0f0',
  backgroundImage: '',
  widgets: [],
};

const DEFAULT_CODE = `# Write your Python code here
print("Hello, World!")
`;

interface PythonPlaygroundProps {
  initialFiles?: Record<string, string>;
  isEmbed?: boolean;
  shareCode?: string;
  embedded?: boolean;
  onFilesChange?: (files: Record<string, string>, activeFile: string) => void;
  onPasteDetected?: () => void;
  binaryFiles?: Record<string, string>;
  profile?: { username: string; role: string } | null;
  loading?: boolean;
  apiKey?: string;
  logout?: () => void;
  onShowLogin?: () => void;
}

export default function PythonPlayground({
  initialFiles,
  isEmbed = false,
  shareCode,
  embedded = false,
  onFilesChange,
  onPasteDetected,
  binaryFiles,
  profile,
  loading,
  apiKey = '',
  logout,
  onShowLogin,
}: PythonPlaygroundProps) {
  const [files, setFiles] = useState<Record<string, string>>(
    initialFiles || { 'main.py': DEFAULT_CODE }
  );
  const [localBinaryFiles, setLocalBinaryFiles] = useState<Record<string, string>>(
    binaryFiles || {}
  );
  const [activeFile, setActiveFile] = useState('main.py');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [embedCode, setEmbedCode] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showDesigner, setShowDesigner] = useState(false);
  const [designerForm, setDesignerForm] = useState<FormState>(DEFAULT_FORM);
  const [fileManagerCollapsed, setFileManagerCollapsed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const dragCounterRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<CodeEditorHandle>(null);
  const { updateFiles, getSnapshots, reset: resetRecorder, recordEvent } = useSessionRecorder();

  const effectiveBinaryFiles = { ...binaryFiles, ...localBinaryFiles };
  const hasBinaryFiles = Object.keys(effectiveBinaryFiles).length > 0;

  const handleFilesCreated = useCallback((newFiles: Record<string, string>) => {
    setFiles((prev) => ({ ...prev, ...newFiles }));
  }, []);

  const { isReady, isRunning, output, plots, tkTree, pgFrame, turtleFrame, flaskHtml, inputRequest, messageBoxRequest, dialogRequest, runCode, stopCode, clearOutput, submitInput, sendTkEvent, sendPgEvent, sendMessageBoxResponse, sendDialogResponse } = usePyodide({
    onFilesCreated: handleFilesCreated,
  });

  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < 768);
    }
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleRun = useCallback(() => {
    runCode(files, activeFile);
  }, [files, activeFile, runCode]);

  const handleFileChange = useCallback(
    (content: string) => {
      setFiles((prev) => ({ ...prev, [activeFile]: content }));
    },
    [activeFile]
  );

  const handleAddFile = useCallback((filename: string) => {
    const content = filename.endsWith('.ipynb')
      ? serializeNotebook(createEmptyNotebook())
      : '';
    setFiles((prev) => ({ ...prev, [filename]: content }));
    setActiveFile(filename);
  }, []);

  const handleRemoveFile = useCallback(
    (filename: string) => {
      setFiles((prev) => {
        const next = { ...prev };
        delete next[filename];
        return next;
      });
      if (activeFile === filename) {
        const remaining = Object.keys(files).filter((f) => f !== filename);
        setActiveFile(remaining[0] || 'main.py');
      }
    },
    [activeFile, files]
  );

  const handleRenameFile = useCallback(
    (oldName: string, newName: string) => {
      if (oldName === newName || !newName.trim()) return;
      setFiles((prev) => {
        if (prev[newName] !== undefined) return prev;
        const next: Record<string, string> = {};
        for (const [key, val] of Object.entries(prev)) {
          if (key === oldName) {
            next[newName] = val;
          } else {
            next[key] = val;
          }
        }
        return next;
      });
      if (activeFile === oldName) {
        setActiveFile(newName);
      }
    },
    [activeFile]
  );

  const handleShare = useCallback(async () => {
    const result = await saveSnippet(files);
    if ('error' in result) {
      setToast({ message: 'Failed to share: ' + result.error, type: 'error' });
      return;
    }
    const base = window.location.origin;
    const url = `${base}/code/${result.shortCode}`;
    const embed = `<iframe src="${base}/embed/${result.shortCode}" width="100%" height="500" frameborder="0" style="border:1px solid #e2e8f0;border-radius:8px;" allowfullscreen></iframe>`;
    setShareUrl(url);
    setEmbedCode(embed);
    setShowShare(true);
  }, [files]);

  const handleDownload = useCallback(() => {
    const content = files[activeFile] || '';
    const isNotebook = activeFile.endsWith('.ipynb');
    const blob = new Blob([content], { type: isNotebook ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile;
    a.click();
    URL.revokeObjectURL(url);
    setToast({ message: `Downloaded ${activeFile}`, type: 'success' });
  }, [files, activeFile]);

  const handleReset = useCallback(() => {
    setFiles({ 'main.py': DEFAULT_CODE });
    setActiveFile('main.py');
    clearOutput();
  }, [clearOutput]);

  const handleToggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  useEffect(() => {
    function handleFSChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, []);

  const handleLoadTemplate = useCallback(
    (templateFiles: Record<string, string>) => {
      setFiles(templateFiles);
      const firstFile = Object.keys(templateFiles)[0];
      setActiveFile(firstFile);
      clearOutput();
    },
    [clearOutput]
  );

  const handleDesignerGenerate = useCallback(
    (generatedFiles: Record<string, string>) => {
      setFiles(generatedFiles);
      setActiveFile(Object.keys(generatedFiles)[0]);
      setShowDesigner(false);
      clearOutput();
      setTimeout(() => runCode(generatedFiles, Object.keys(generatedFiles)[0]), 100);
    },
    [clearOutput, runCode]
  );

  useEffect(() => {
    updateFiles(files, activeFile);
    onFilesChange?.(files, activeFile);
  }, [files, activeFile, updateFiles, onFilesChange]);

  const handlePaste = useCallback(() => {
    if (onPasteDetected) {
      onPasteDetected();
    } else {
      recordEvent('paste');
    }
  }, [onPasteDetected, recordEvent]);

  const handleSubmitClick = useCallback(() => {
    const { snapshots } = getSnapshots();
    if (snapshots.length === 0) {
      setToast({ message: 'Nothing to submit - start coding first!', type: 'error' });
      return;
    }
    setShowSubmitDialog(true);
  }, [getSnapshots]);

  const handleSubmitWithName = useCallback(async (studentName: string) => {
    setIsSubmitting(true);
    const { snapshots, durationMs } = getSnapshots();
    if (snapshots.length === 0) {
      setToast({ message: 'Nothing to submit - start coding first!', type: 'error' });
      setIsSubmitting(false);
      setShowSubmitDialog(false);
      return;
    }
    const result = await saveSession(snapshots, durationMs, activeFile, studentName);
    setIsSubmitting(false);
    setShowSubmitDialog(false);
    if ('error' in result) {
      setToast({ message: 'Submit failed: ' + result.error, type: 'error' });
      return;
    }
    const url = `${window.location.origin}/review/${result.shareId}`;
    setShareUrl(url);
    setEmbedCode('');
    setShowShare(true);
    resetRecorder();
  }, [getSnapshots, activeFile, resetRecorder]);

  const handleExplainError = useCallback(async (errorText: string, userCode?: string): Promise<string> => {
    if (!apiKey) throw new Error('Login required to use the error explanation feature.');

    const codeSection = userCode
      ? `\n\nHere is the student's full code:\n\`\`\`python\n${userCode}\n\`\`\``
      : '';

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a friendly, encouraging Python teacher explaining errors to a Year 9 student who is brand new to programming. Your job is to:
1. Look at the error AND the student's code to figure out what they were TRYING to do (predict their intent - e.g. did they misspell a function name? Forget parentheses? Use the wrong syntax?).
2. Explain what went wrong using a simple real-life analogy first (something a 14-year-old would relate to), then explain the coding equivalent.
3. Show a corrected code example that fixes the mistake.
4. Keep a warm, encouraging tone. Never make them feel stupid.

Format your response like this:
- Start with "What happened:" and give a one-sentence plain English summary.
- Then "Think of it like this:" and give a relatable everyday analogy.
- Then "In your code:" and explain specifically what the student typed and what they likely meant to type instead.
- Then "Here's the fix:" and show the corrected line(s) of code in a code block.
Keep it concise - no more than 6-8 sentences total.`,
          },
          {
            role: 'user',
            content: `The student got this error:\n${errorText}${codeSection}\n\nExplain what went wrong, what they were probably trying to do, and how to fix it.`,
          },
        ],
        max_tokens: 400,
        temperature: 0.5,
      }),
    });
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Invalid API key. Please contact your administrator.');
      }
      throw new Error(`OpenAI error: ${res.status}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || 'No explanation available.';
  }, [apiKey]);

  const handleNotebookRunCode = useCallback(
    (code: string) => {
      const cleanFiles: Record<string, string> = {};
      for (const [k, v] of Object.entries(files)) {
        if (!k.endsWith('.ipynb')) {
          cleanFiles[k] = v;
        }
      }
      cleanFiles['__notebook_exec__.py'] = code;
      runCode(cleanFiles, '__notebook_exec__.py');
    },
    [files, runCode]
  );

  const handleUploadFile = useCallback(
    (name: string, content: string, isBinary?: boolean) => {
      if (isBinary) {
        setLocalBinaryFiles((prev) => ({ ...prev, [name]: content }));
        setPreviewFile(name);
        setToast({ message: `Uploaded ${name}`, type: 'success' });
      } else {
        setFiles((prev) => ({ ...prev, [name]: content }));
        setActiveFile(name);
        setToast({ message: `Opened ${name}`, type: 'success' });
      }
    },
    []
  );

  const TEXT_EXTENSIONS = ['.py', '.ipynb', '.html', '.css', '.js', '.json', '.txt', '.csv', '.md'];
  const BINARY_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.bmp', '.webp', '.ico', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.odt', '.ods', '.odp'];
  const ACCEPTED_EXTENSIONS = [...TEXT_EXTENSIONS, ...BINARY_EXTENSIONS];

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounterRef.current = 0;

      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length === 0) return;

      let loadedCount = 0;
      let textCount = 0;
      let binaryCount = 0;
      let lastName = '';

      droppedFiles.forEach((file) => {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!ACCEPTED_EXTENSIONS.includes(ext)) {
          setToast({ message: `Unsupported file type: ${file.name}`, type: 'error' });
          return;
        }

        const isText = TEXT_EXTENSIONS.includes(ext);
        const isBinary = BINARY_EXTENSIONS.includes(ext);

        if (isText) {
          const reader = new FileReader();
          reader.onload = () => {
            const content = reader.result as string;
            setFiles((prev) => ({ ...prev, [file.name]: content }));
            lastName = file.name;
            textCount++;
            loadedCount++;
            if (loadedCount === droppedFiles.filter((f) => ACCEPTED_EXTENSIONS.includes('.' + f.name.split('.').pop()?.toLowerCase())).length) {
              if (textCount > 0) {
                setActiveFile(lastName);
              } else if (binaryCount > 0) {
                setPreviewFile(lastName);
              }
              setToast({
                message: loadedCount === 1 ? `Opened ${lastName}` : `Opened ${loadedCount} files`,
                type: 'success',
              });
            }
          };
          reader.readAsText(file);
        } else if (isBinary) {
          const reader = new FileReader();
          reader.onload = () => {
            const content = reader.result as string;
            setLocalBinaryFiles((prev) => ({ ...prev, [file.name]: content }));
            lastName = file.name;
            binaryCount++;
            loadedCount++;
            if (loadedCount === droppedFiles.filter((f) => ACCEPTED_EXTENSIONS.includes('.' + f.name.split('.').pop()?.toLowerCase())).length) {
              if (textCount > 0) {
                setActiveFile(lastName);
              } else if (binaryCount > 0) {
                setPreviewFile(lastName);
              }
              setToast({
                message: loadedCount === 1 ? `Uploaded ${lastName}` : `Uploaded ${loadedCount} files`,
                type: 'success',
              });
            }
          };
          reader.readAsDataURL(file);
        }
      });
    },
    []
  );

  const isActiveNotebook = activeFile.endsWith('.ipynb');

  const codeArea = (
    <div className="h-full min-h-0">
      {isActiveNotebook ? (
        <NotebookEditor
          value={files[activeFile] || ''}
          onChange={handleFileChange}
          onRunCode={handleNotebookRunCode}
          isRunning={isRunning}
          output={output}
          plots={plots}
          filename={activeFile}
        />
      ) : (
        <CodeEditor
          ref={editorRef}
          value={files[activeFile] || ''}
          onChange={handleFileChange}
          onRun={handleRun}
          onPaste={handlePaste}
          filename={activeFile}
          readOnly={isEmbed}
        />
      )}
    </div>
  );

  const fileTree = (
    <FileManager
      files={files}
      activeFile={activeFile}
      onSelectFile={setActiveFile}
      onAddFile={handleAddFile}
      onRemoveFile={handleRemoveFile}
      onRenameFile={handleRenameFile}
      onToggleCollapse={() => setFileManagerCollapsed(true)}
      binaryFiles={effectiveBinaryFiles}
      previewFile={previewFile}
      onPreviewFile={setPreviewFile}
    />
  );

  const fileSidebar = hasBinaryFiles ? (
    <ResizablePanel
      direction="vertical"
      left={fileTree}
      right={
        <FilePreview
          filename={previewFile}
          url={previewFile && effectiveBinaryFiles ? effectiveBinaryFiles[previewFile] : null}
        />
      }
      defaultRatio={0.5}
      minRatio={0.2}
      maxRatio={0.8}
    />
  ) : fileTree;

  const collapsedSidebar = (
    <div className="flex flex-col items-center py-2 px-1 bg-slate-50 border-r border-slate-200 w-9 flex-shrink-0 h-full">
      <button
        onClick={() => setFileManagerCollapsed(false)}
        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
        title="Show file manager"
      >
        <PanelLeftOpen size={14} />
      </button>
    </div>
  );

  const editorWithSidebar = fileManagerCollapsed ? (
    <div className="flex h-full">
      {collapsedSidebar}
      <div className="flex-1 min-w-0 h-full">{codeArea}</div>
    </div>
  ) : (
    <ResizablePanel
      direction="horizontal"
      left={fileSidebar}
      right={codeArea}
      defaultRatio={hasBinaryFiles ? 0.22 : 0.18}
      minRatio={0.1}
      maxRatio={0.4}
    />
  );

  const editorPanel = (
    <div className="flex flex-col h-full bg-white">
      <FileTabs
        files={files}
        activeFile={activeFile}
        onSelectFile={setActiveFile}
        onAddFile={handleAddFile}
        onRemoveFile={handleRemoveFile}
        onRenameFile={handleRenameFile}
      />
      <div className="flex-1 min-h-0">
        {editorWithSidebar}
      </div>
    </div>
  );

  const outputPanel = (
    <OutputPanel
      output={output}
      plots={plots}
      isRunning={isRunning}
      tkTree={tkTree}
      pgFrame={pgFrame}
      turtleFrame={turtleFrame}
      flaskHtml={flaskHtml}
      inputRequest={inputRequest}
      messageBoxRequest={messageBoxRequest}
      dialogRequest={dialogRequest}
      onSubmitInput={submitInput}
      onTkEvent={sendTkEvent}
      onPgEvent={sendPgEvent}
      onMessageBoxResponse={sendMessageBoxResponse}
      onDialogResponse={sendDialogResponse}
      onExplainError={handleExplainError}
      userCode={files[activeFile] || ''}
    />
  );

  if (isEmbed) {
    const embedEditorPanel = (
      <div className="flex flex-col h-full bg-white">
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2 overflow-x-auto">
            {Object.keys(files).map((f) => (
              <button
                key={f}
                onClick={() => setActiveFile(f)}
                className={`flex-shrink-0 px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                  f === activeFile
                    ? 'bg-white text-slate-800 font-medium shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <span className="flex-shrink-0 ml-2 flex items-center gap-1 text-[10px] text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-medium">
            <Lock size={9} />
            read-only
          </span>
        </div>
        <div className="flex-1 min-h-0">
          {codeArea}
        </div>
      </div>
    );

    return (
      <div className="h-full flex flex-col bg-white">
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-semibold text-white">PyCode</span>
            {shareCode && (
              <span className="text-[10px] text-slate-400 font-mono select-all">/{shareCode}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {shareCode && (
              <a
                href={`/code/${shareCode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2 py-0.5 text-slate-400 hover:text-slate-200 text-[10px] rounded transition-colors"
                title="Open in editor"
              >
                <ExternalLink size={10} />
                <span className="hidden sm:inline">Open</span>
              </a>
            )}
            <button
              onClick={handleRun}
              disabled={!isReady || isRunning}
              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:text-slate-400 text-white text-xs font-medium rounded transition-colors"
            >
              <Play size={11} fill="currentColor" />
              Run
            </button>
            <button
              onClick={stopCode}
              disabled={!isRunning}
              className="flex items-center gap-1 px-2.5 py-1 bg-red-600 hover:bg-red-500 disabled:bg-slate-600 disabled:text-slate-400 text-white text-xs font-medium rounded transition-colors"
            >
              <Square size={10} fill="currentColor" />
              Stop
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <ResizablePanel
            left={embedEditorPanel}
            right={outputPanel}
            direction={isMobile ? 'vertical' : 'horizontal'}
            defaultRatio={0.55}
          />
        </div>
      </div>
    );
  }

  if (embedded) {
    return (
      <div
        ref={containerRef}
        className="flex flex-col bg-slate-100 h-full"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <Toolbar
          isReady={isReady}
          isRunning={isRunning}
          isFullscreen={false}
          onRun={handleRun}
          onStop={stopCode}
          onClear={clearOutput}
          onShare={handleShare}
          onDownload={handleDownload}
          onReset={handleReset}
          onUndo={() => editorRef.current?.undo()}
          onRedo={() => editorRef.current?.redo()}
          onToggleFullscreen={() => {}}
          onLoadTemplate={handleLoadTemplate}
          onSubmit={() => {}}
          isSubmitting={false}
          onOpenDesigner={() => setShowDesigner(true)}
          hasDesign={designerForm.widgets.length > 0}
          onUploadFile={handleUploadFile}
          profile={profile}
          loading={loading}
          logout={logout}
          onShowLogin={onShowLogin}
          apiKeyLoaded={!!apiKey}
        />
        <div className="flex-1 min-h-0">
          <ResizablePanel
            left={editorPanel}
            right={outputPanel}
            direction={isMobile ? 'vertical' : 'horizontal'}
            defaultRatio={0.55}
          />
        </div>
        {showShare && (
          <ShareDialog shareUrl={shareUrl} embedCode={embedCode} onClose={() => setShowShare(false)} />
        )}
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </div>
    );
  }

  if (showDesigner) {
    return (
      <div
        ref={containerRef}
        className={`flex flex-col bg-slate-100 ${isFullscreen ? 'h-screen' : 'h-full'}`}
      >
        <GuiDesigner
          form={designerForm}
          onFormChange={setDesignerForm}
          onGenerateCode={handleDesignerGenerate}
          onClose={() => setShowDesigner(false)}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col bg-slate-100 ${isFullscreen ? 'h-screen' : 'h-full'}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm pointer-events-none">
          <div className="flex flex-col items-center gap-3 px-10 py-8 rounded-2xl border-2 border-dashed border-sky-400 bg-slate-800/80">
            <Upload size={40} className="text-sky-400" />
            <p className="text-white text-lg font-semibold">Drop files here</p>
            <p className="text-slate-400 text-sm">.py, .ipynb, .html, .css, .js, .json, .txt</p>
          </div>
        </div>
      )}
      <Toolbar
        isReady={isReady}
        isRunning={isRunning}
        isFullscreen={isFullscreen}
        onRun={handleRun}
        onStop={stopCode}
        onClear={clearOutput}
        onShare={handleShare}
        onDownload={handleDownload}
        onReset={handleReset}
        onUndo={() => editorRef.current?.undo()}
        onRedo={() => editorRef.current?.redo()}
        onToggleFullscreen={handleToggleFullscreen}
        onLoadTemplate={handleLoadTemplate}
        onSubmit={handleSubmitClick}
        isSubmitting={isSubmitting}
        onOpenDesigner={() => setShowDesigner(true)}
        hasDesign={designerForm.widgets.length > 0}
        onUploadFile={handleUploadFile}
        profile={profile}
        loading={loading}
        logout={logout}
        onShowLogin={onShowLogin}
        apiKeyLoaded={!!apiKey}
      />

      <div className="flex-1 min-h-0">
        <ResizablePanel
          left={editorPanel}
          right={outputPanel}
          direction={isMobile ? 'vertical' : 'horizontal'}
          defaultRatio={0.55}
        />
      </div>

      <div className="flex items-center justify-between px-3 py-1 bg-slate-800 border-t border-slate-700">
        <div className="flex items-center gap-2">
          {isReady ? (
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Ready
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[10px] text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Loading Python...
            </span>
          )}
        </div>
        <a
          href="https://digitalvector.com.au"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center hover:opacity-75 transition-opacity"
        >
          <img src="/digivec_logo.png" alt="Digital Vector" className="h-4 opacity-60" />
        </a>
      </div>

      {showSubmitDialog && (
        <SubmitDialog
          onSubmit={handleSubmitWithName}
          onClose={() => setShowSubmitDialog(false)}
          isSubmitting={isSubmitting}
        />
      )}

      {showShare && (
        <ShareDialog
          shareUrl={shareUrl}
          embedCode={embedCode}
          onClose={() => setShowShare(false)}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

    </div>
  );
}

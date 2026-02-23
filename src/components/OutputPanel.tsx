import { useEffect, useRef, useState } from 'react';
import { Terminal, Image, Monitor, Gamepad2, Pen, Globe, HelpCircle, Loader2, X } from 'lucide-react';
import type { OutputLine, PlotData, TkWidgetNode, PygameFrame, InputRequest, MessageBoxRequest, DialogRequest } from '../hooks/usePyodide';
import type { TurtleFrame } from './TurtleRenderer';
import TkinterWindow from './tkinter/TkinterWindow';
import PygameRenderer from './PygameRenderer';
import TurtleRenderer from './TurtleRenderer';
import MessageBox from './tkinter/MessageBox';
import { TkinterDialog } from './tkinter/TkinterDialog';

interface OutputPanelProps {
  output: OutputLine[];
  plots: PlotData[];
  isRunning: boolean;
  tkTree: TkWidgetNode | null;
  pgFrame: PygameFrame | null;
  turtleFrame: TurtleFrame | null;
  flaskHtml: string | null;
  inputRequest: InputRequest | null;
  messageBoxRequest: MessageBoxRequest | null;
  dialogRequest: DialogRequest | null;
  onSubmitInput: (value: string) => void;
  onTkEvent: (widgetId: string, eventType: string, eventData?: Record<string, unknown>) => void;
  onPgEvent: (eventData: Record<string, unknown>) => void;
  onMessageBoxResponse: (msgId: string, result: any) => void;
  onDialogResponse: (msgId: string, result: any) => void;
  onExplainError?: (errorText: string, userCode?: string) => Promise<string>;
  userCode?: string;
}

type Tab = 'console' | 'gui' | 'pygame' | 'turtle' | 'web';

export default function OutputPanel({ output, plots, isRunning, tkTree, pgFrame, turtleFrame, flaskHtml, inputRequest, messageBoxRequest, dialogRequest, onSubmitInput, onTkEvent, onPgEvent, onMessageBoxResponse, onDialogResponse, onExplainError, userCode }: OutputPanelProps) {
  const consoleRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>('console');
  const [inputValue, setInputValue] = useState('');
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [output, inputRequest]);

  useEffect(() => {
    if (inputRequest) {
      setInputValue('');
      setActiveTab('console');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [inputRequest]);

  useEffect(() => {
    if (tkTree) {
      setActiveTab('gui');
    }
  }, [tkTree]);

  useEffect(() => {
    if (pgFrame) {
      setActiveTab('pygame');
    }
  }, [pgFrame]);

  useEffect(() => {
    if (turtleFrame) {
      setActiveTab('turtle');
    }
  }, [turtleFrame]);

  useEffect(() => {
    if (flaskHtml) {
      setActiveTab('web');
    }
  }, [flaskHtml]);

  useEffect(() => {
    if (!tkTree && !pgFrame && !turtleFrame && !flaskHtml) {
      setActiveTab('console');
    }
  }, [tkTree, pgFrame, turtleFrame, flaskHtml]);

  useEffect(() => {
    setExplanation(null);
    setExplainError(null);
  }, [output]);

  async function handleExplainFurther() {
    if (!onExplainError) return;
    const errorLines = output
      .filter((l) => l.type === 'error' || l.type === 'stderr')
      .map((l) => (l.line ? `[Line ${l.line}] ${l.text}` : l.text))
      .join('\n');
    if (!errorLines) return;
    setExplaining(true);
    setExplainError(null);
    setExplanation(null);
    try {
      const result = await onExplainError(errorLines, userCode);
      setExplanation(result);
    } catch (e: any) {
      setExplainError(e?.message || 'Failed to get explanation.');
    } finally {
      setExplaining(false);
    }
  }

  const hasPlots = plots.length > 0;
  const hasOutput = output.length > 0;
  const isEmpty = !hasOutput && !hasPlots && !isRunning;
  const hasGui = tkTree !== null;
  const hasPygame = pgFrame !== null;
  const hasTurtle = turtleFrame !== null;
  const hasWeb = flaskHtml !== null;

  return (
    <div className="h-full flex flex-col bg-[#1a1d23] text-slate-300 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-[#15171c] border-b border-slate-700/50">
        <div className="flex items-center gap-1">
          {(hasGui || hasPygame || hasTurtle || hasWeb) ? (
            <>
              <button
                onClick={() => setActiveTab('console')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  activeTab === 'console'
                    ? 'bg-slate-700/60 text-slate-200'
                    : 'text-slate-500 hover:text-slate-400'
                }`}
              >
                <Terminal size={12} />
                Console
              </button>
              {hasGui && (
                <button
                  onClick={() => setActiveTab('gui')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    activeTab === 'gui'
                      ? 'bg-slate-700/60 text-slate-200'
                      : 'text-slate-500 hover:text-slate-400'
                  }`}
                >
                  <Monitor size={12} />
                  GUI Preview
                </button>
              )}
              {hasPygame && (
                <button
                  onClick={() => setActiveTab('pygame')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    activeTab === 'pygame'
                      ? 'bg-slate-700/60 text-slate-200'
                      : 'text-slate-500 hover:text-slate-400'
                  }`}
                >
                  <Gamepad2 size={12} />
                  Pygame
                </button>
              )}
              {hasTurtle && (
                <button
                  onClick={() => setActiveTab('turtle')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    activeTab === 'turtle'
                      ? 'bg-slate-700/60 text-slate-200'
                      : 'text-slate-500 hover:text-slate-400'
                  }`}
                >
                  <Pen size={12} />
                  Turtle
                </button>
              )}
              {hasWeb && (
                <button
                  onClick={() => setActiveTab('web')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    activeTab === 'web'
                      ? 'bg-slate-700/60 text-slate-200'
                      : 'text-slate-500 hover:text-slate-400'
                  }`}
                >
                  <Globe size={12} />
                  Web Preview
                </button>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-slate-500" />
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Output</span>
            </div>
          )}
        </div>
        {isRunning && (
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs text-emerald-400">Running</span>
          </div>
        )}
      </div>

      {activeTab === 'console' && (
        <div ref={consoleRef} className="flex-1 overflow-auto p-3 font-mono text-sm leading-relaxed space-y-0.5">
          {isEmpty && (
            <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
              <Terminal size={28} strokeWidth={1.5} />
              <p className="text-xs">Click Run or press Ctrl+Enter to execute</p>
            </div>
          )}

          {output.map((line, i) => {
            let className = 'whitespace-pre-wrap break-all';
            switch (line.type) {
              case 'stdout':
                className += ' text-slate-200';
                break;
              case 'stderr':
                className += ' text-amber-400';
                break;
              case 'error':
                className += ' text-red-400';
                break;
              case 'status':
                className += ' text-sky-400 italic';
                break;
              case 'info':
                className += ' text-slate-500 italic';
                break;
            }

            return (
              <div key={i} className={className}>
                {line.type === 'error' && line.line && (
                  <span className="text-red-500 font-bold mr-1">[Line {line.line}]</span>
                )}
                {line.text}
              </div>
            );
          })}

          {onExplainError && output.some((l) => l.type === 'error' || l.type === 'stderr') && !isRunning && (
            <div className="mt-3">
              {!explanation && !explaining && (
                <button
                  onClick={handleExplainFurther}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-amber-300 hover:text-amber-200 text-xs font-medium rounded-lg transition-colors border border-slate-600/50"
                >
                  <HelpCircle size={13} />
                  Explain further
                </button>
              )}
              {explaining && (
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <Loader2 size={13} className="animate-spin" />
                  Getting explanation...
                </div>
              )}
              {explainError && (
                <p className="text-red-400 text-xs mt-1">{explainError}</p>
              )}
              {explanation && (
                <div className="mt-2 rounded-lg border border-slate-600/60 bg-slate-700/40 p-3 relative">
                  <button
                    onClick={() => setExplanation(null)}
                    className="absolute top-2 right-2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <X size={12} />
                  </button>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <HelpCircle size={12} className="text-amber-400" />
                    <span className="text-xs font-semibold text-amber-400">Explanation</span>
                  </div>
                  <div className="space-y-2">
                    {explanation.split('\n').map((line, i) => {
                      if (line.startsWith('```')) return null;
                      const isHeading = /^(What happened:|Think of it like this:|In your code:|Here's the fix:)/.test(line);
                      const isCodeLine = (() => {
                        let inCode = false;
                        const lines = explanation.split('\n');
                        for (let j = 0; j < lines.length; j++) {
                          if (lines[j].startsWith('```')) { inCode = !inCode; }
                          if (j === i) return inCode;
                        }
                        return false;
                      })();
                      if (isHeading) {
                        return <p key={i} className="text-xs font-semibold text-amber-300 mt-2 first:mt-0">{line}</p>;
                      }
                      if (isCodeLine) {
                        return <pre key={i} className="text-xs text-emerald-300 font-mono bg-slate-800/60 px-2 py-0.5 rounded">{line}</pre>;
                      }
                      if (!line.trim()) return null;
                      return <p key={i} className="text-slate-300 text-xs leading-relaxed">{line}</p>;
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {hasPlots && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <Image size={13} />
                <span>Graphical Output</span>
              </div>
              {plots.map((plot, i) => (
                <div key={i} className="rounded-lg overflow-hidden border border-slate-700/50 bg-white">
                  <img
                    src={`data:image/png;base64,${plot.data}`}
                    alt={`Plot ${i + 1}`}
                    className="w-full h-auto"
                  />
                </div>
              ))}
            </div>
          )}

          {inputRequest && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSubmitInput(inputValue);
                setInputValue('');
              }}
              className="flex items-center gap-0 mt-1"
            >
              {inputRequest.prompt && (
                <span className="text-slate-100 shrink-0 whitespace-pre font-mono text-sm">{inputRequest.prompt}</span>
              )}
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-emerald-300 font-mono text-sm caret-emerald-400 placeholder:text-slate-600"
                placeholder=""
                autoFocus
              />
            </form>
          )}
        </div>
      )}

      {activeTab === 'gui' && hasGui && (
        <div className="flex-1 overflow-auto bg-[#2a2d35]">
          <TkinterWindow tree={tkTree} onEvent={onTkEvent} />
        </div>
      )}

      {activeTab === 'pygame' && hasPygame && (
        <div className="flex-1 overflow-auto bg-[#2a2d35]">
          <PygameRenderer frame={pgFrame} onEvent={onPgEvent} />
        </div>
      )}

      {activeTab === 'turtle' && hasTurtle && (
        <div className="flex-1 overflow-auto bg-[#2a2d35]">
          <TurtleRenderer frame={turtleFrame} />
        </div>
      )}

      {activeTab === 'web' && hasWeb && (
        <div className="flex-1 overflow-hidden bg-white">
          <iframe
            srcDoc={flaskHtml!}
            title="Flask Web Preview"
            sandbox="allow-scripts"
            className="w-full h-full border-0"
          />
        </div>
      )}

      {messageBoxRequest && (
        <MessageBox
          msgId={messageBoxRequest.msgId}
          msgType={messageBoxRequest.msgType}
          title={messageBoxRequest.title}
          message={messageBoxRequest.message}
          onResponse={onMessageBoxResponse}
        />
      )}

      {dialogRequest && (
        <TkinterDialog
          msgId={dialogRequest.msgId}
          dialogType={dialogRequest.dialogType}
          options={dialogRequest.options}
          onResponse={onDialogResponse}
        />
      )}
    </div>
  );
}

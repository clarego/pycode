import { useCallback, useEffect, useRef, useState } from 'react';
import type { TurtleFrame } from '../components/TurtleRenderer';

export interface OutputLine {
  type: 'stdout' | 'stderr' | 'error' | 'status' | 'info';
  text: string;
  line?: number | null;
}

export interface PlotData {
  data: string;
}

export interface TkWidgetNode {
  id: string;
  type: string;
  config: Record<string, unknown>;
  layout: Record<string, unknown> | null;
  children: TkWidgetNode[];
  hasCommand: boolean;
  bindings: string[];
  canvasItems: Array<Record<string, unknown>>;
  menuItems: Array<Record<string, unknown>>;
  menuBar?: TkWidgetNode;
}

export interface PygameFrame {
  width: number;
  height: number;
  title: string;
  commands: Array<Record<string, unknown>>;
}

export interface InputRequest {
  prompt: string;
}

export interface MessageBoxRequest {
  msgId: string;
  msgType: string;
  title: string;
  message: string;
}

export interface DialogRequest {
  msgId: string;
  dialogType: string;
  options: Record<string, unknown>;
}

interface UsePyodideOptions {
  onFilesCreated?: (files: Record<string, string>) => void;
}

interface UsePyodideReturn {
  isReady: boolean;
  isRunning: boolean;
  output: OutputLine[];
  plots: PlotData[];
  tkTree: TkWidgetNode | null;
  pgFrame: PygameFrame | null;
  turtleFrame: TurtleFrame | null;
  flaskHtml: string | null;
  inputRequest: InputRequest | null;
  messageBoxRequest: MessageBoxRequest | null;
  dialogRequest: DialogRequest | null;
  runCode: (files: Record<string, string>, mainFile?: string) => void;
  stopCode: () => void;
  clearOutput: () => void;
  submitInput: (value: string) => void;
  sendTkEvent: (widgetId: string, eventType: string, eventData?: Record<string, unknown>) => void;
  sendPgEvent: (eventData: Record<string, unknown>) => void;
  sendMessageBoxResponse: (msgId: string, result: any) => void;
  sendDialogResponse: (msgId: string, result: any) => void;
}

export function usePyodide(options?: UsePyodideOptions): UsePyodideReturn {
  const workerRef = useRef<Worker | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<OutputLine[]>([]);
  const [plots, setPlots] = useState<PlotData[]>([]);
  const [tkTree, setTkTree] = useState<TkWidgetNode | null>(null);
  const [pgFrame, setPgFrame] = useState<PygameFrame | null>(null);
  const [turtleFrame, setTurtleFrame] = useState<TurtleFrame | null>(null);
  const [flaskHtml, setFlaskHtml] = useState<string | null>(null);
  const [inputRequest, setInputRequest] = useState<InputRequest | null>(null);
  const [messageBoxRequest, setMessageBoxRequest] = useState<MessageBoxRequest | null>(null);
  const [dialogRequest, setDialogRequest] = useState<DialogRequest | null>(null);
  const inputBufferRef = useRef<SharedArrayBuffer | null>(null);
  const onFilesCreatedRef = useRef(options?.onFilesCreated);
  onFilesCreatedRef.current = options?.onFilesCreated;

  const createWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.onmessage = null;
      workerRef.current.onerror = null;
      workerRef.current.terminate();
    }

    const worker = new Worker('/pyodide-worker.js');
    workerRef.current = worker;

    worker.onmessage = (event) => {
      const msg = event.data;

      switch (msg.type) {
        case 'ready':
          setIsReady(true);
          break;
        case 'stdout':
          setOutput((prev) => [...prev, { type: 'stdout', text: msg.text }]);
          break;
        case 'stderr':
          setOutput((prev) => [...prev, { type: 'stderr', text: msg.text }]);
          break;
        case 'error':
          setOutput((prev) => [
            ...prev,
            { type: 'error', text: msg.text, line: msg.line },
          ]);
          break;
        case 'status':
          if (msg.text) {
            setOutput((prev) => [...prev, { type: 'status', text: msg.text }]);
          }
          break;
        case 'plot':
          setPlots((prev) => [...prev, { data: msg.data }]);
          break;
        case 'tkinter-render':
          try {
            const tree = JSON.parse(msg.tree) as TkWidgetNode;
            setTkTree(tree);
          } catch {
            // ignore parse errors
          }
          break;
        case 'pygame-frame':
          try {
            const frame = JSON.parse(msg.frame) as PygameFrame;
            setPgFrame(frame);
          } catch {
            // ignore parse errors
          }
          break;
        case 'turtle-frame':
          try {
            const tf = JSON.parse(msg.frame) as TurtleFrame;
            setTurtleFrame(tf);
          } catch {
            // ignore parse errors
          }
          break;
        case 'flask-html':
          setFlaskHtml(msg.html as string);
          break;
        case 'files-created':
          if (onFilesCreatedRef.current && msg.files) {
            onFilesCreatedRef.current(msg.files as Record<string, string>);
          }
          break;
        case 'input-request':
          setInputRequest({ prompt: (msg.prompt as string) || '' });
          break;
        case 'tkinter-messagebox':
          setMessageBoxRequest({
            msgId: msg.msgId as string,
            msgType: msg.msgType as string,
            title: msg.title as string,
            message: msg.message as string,
          });
          break;
        case 'dialog':
          setDialogRequest({
            msgId: msg.msgId as string,
            dialogType: msg.dialogType as string,
            options: (msg.options as Record<string, unknown>) || {},
          });
          break;
        case 'execution-start':
          break;
        case 'execution-end':
          setIsRunning(false);
          setInputRequest(null);
          setMessageBoxRequest(null);
          setDialogRequest(null);
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          break;
      }
    };

    worker.onerror = (error) => {
      console.error('Pyodide worker error:', error);
      if (workerRef.current === worker) {
        setOutput((prev) => [
          ...prev,
          { type: 'error', text: 'Worker encountered an unexpected error.' },
        ]);
        setIsRunning(false);
      }
    };

    if (typeof SharedArrayBuffer !== 'undefined') {
      const buffer = new SharedArrayBuffer(65536);
      inputBufferRef.current = buffer;
      worker.postMessage({ type: 'input-buffer', buffer });
    }

    worker.postMessage({ type: 'init' });

    return worker;
  }, []);

  useEffect(() => {
    createWorker();
    return () => {
      if (workerRef.current) {
        workerRef.current.onmessage = null;
        workerRef.current.onerror = null;
        workerRef.current.terminate();
        workerRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [createWorker]);

  const runCode = useCallback(
    (files: Record<string, string>, mainFile = 'main.py') => {
      if (!workerRef.current) return;

      setOutput([]);
      setPlots([]);
      setTkTree(null);
      setPgFrame(null);
      setTurtleFrame(null);
      setFlaskHtml(null);
      setInputRequest(null);
      setIsRunning(true);

      workerRef.current.postMessage({ type: 'run', files, mainFile });

      timeoutRef.current = window.setTimeout(() => {
        if (workerRef.current) {
          workerRef.current.onmessage = null;
          workerRef.current.onerror = null;
          workerRef.current.terminate();
          workerRef.current = null;
          setIsRunning(false);
          setOutput((prev) => [
            ...prev,
            {
              type: 'error',
              text: 'Execution timed out after 5 minutes. Your code may contain an infinite loop.',
            },
          ]);
          setIsReady(false);
          const w = createWorker();
          w.postMessage({ type: 'init' });
        }
      }, 300000);
    },
    [createWorker]
  );

  const stopCode = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.onmessage = null;
      workerRef.current.onerror = null;
      workerRef.current.terminate();
      workerRef.current = null;
      setIsRunning(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setOutput((prev) => [
        ...prev,
        { type: 'info', text: 'Execution stopped by user.' },
      ]);
      setIsReady(false);
      const w = createWorker();
      w.postMessage({ type: 'init' });
    }
  }, [createWorker]);

  const submitInput = useCallback((value: string) => {
    if (!inputBufferRef.current || !inputRequest) return;
    const promptText = inputRequest.prompt || '';
    setOutput((prev) => [...prev, { type: 'stdout', text: promptText + value }]);
    const signalArray = new Int32Array(inputBufferRef.current, 0, 2);
    const dataArray = new Uint8Array(inputBufferRef.current, 8);
    const encoder = new TextEncoder();
    const encoded = encoder.encode(value);
    dataArray.set(encoded);
    signalArray[1] = encoded.length;
    Atomics.store(signalArray, 0, 1);
    Atomics.notify(signalArray, 0);
    setInputRequest(null);
  }, [inputRequest]);

  const clearOutput = useCallback(() => {
    setOutput([]);
    setPlots([]);
    setTkTree(null);
    setPgFrame(null);
    setTurtleFrame(null);
    setFlaskHtml(null);
  }, []);

  const sendTkEvent = useCallback(
    (widgetId: string, eventType: string, eventData?: Record<string, unknown>) => {
      if (!workerRef.current) return;
      workerRef.current.postMessage({
        type: 'tkinter-event',
        widgetId,
        eventType,
        eventData: eventData || {},
      });
    },
    []
  );

  const sendPgEvent = useCallback(
    (eventData: Record<string, unknown>) => {
      if (!workerRef.current) return;
      workerRef.current.postMessage({
        type: 'pygame-event',
        eventData,
      });
    },
    []
  );

  const sendMessageBoxResponse = useCallback(
    (msgId: string, result: any) => {
      if (!workerRef.current) return;
      setMessageBoxRequest(null);
      workerRef.current.postMessage({
        type: 'messagebox-response',
        msgId,
        result,
      });
    },
    []
  );

  const sendDialogResponse = useCallback(
    (msgId: string, result: any) => {
      if (!workerRef.current) return;
      setDialogRequest(null);
      workerRef.current.postMessage({
        type: 'dialog-response',
        msgId,
        result,
      });
    },
    []
  );

  return {
    isReady,
    isRunning,
    output,
    plots,
    tkTree,
    pgFrame,
    turtleFrame,
    flaskHtml,
    inputRequest,
    messageBoxRequest,
    dialogRequest,
    runCode,
    stopCode,
    clearOutput,
    submitInput,
    sendTkEvent,
    sendPgEvent,
    sendMessageBoxResponse,
    sendDialogResponse,
  };
}

import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, rectangularSelection } from '@codemirror/view';
import { defaultKeymap, indentWithTab, history, historyKeymap, undo, redo } from '@codemirror/commands';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldGutter, indentOnInput } from '@codemirror/language';
import { autocompletion, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun?: () => void;
  onPaste?: () => void;
  filename?: string;
  readOnly?: boolean;
}

function getLanguageExtension(filename?: string) {
  if (!filename) return python();
  if (filename.endsWith('.html') || filename.endsWith('.htm')) return html();
  if (filename.endsWith('.css')) return css();
  if (filename.endsWith('.js')) return javascript();
  if (filename.endsWith('.json')) return javascript();
  return python();
}

const editorTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '14px',
    fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", Menlo, Monaco, "Courier New", monospace',
  },
  '.cm-content': {
    padding: '12px 0 48px 0',
    caretColor: '#1e293b',
  },
  '.cm-gutters': {
    backgroundColor: '#f8fafc',
    color: '#94a3b8',
    border: 'none',
    borderRight: '1px solid #e2e8f0',
    paddingRight: '4px',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#f1f5f9',
    color: '#475569',
  },
  '.cm-activeLine': {
    backgroundColor: '#f8fafc',
  },
  '.cm-selectionBackground': {
    backgroundColor: '#93c5fd !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: '#60a5fa !important',
  },
  '.cm-cursor': {
    borderLeftColor: '#1e293b',
    borderLeftWidth: '2px',
  },
  '.cm-matchingBracket': {
    backgroundColor: '#e0f2fe',
    outline: '1px solid #7dd3fc',
  },
  '.cm-foldGutter': {
    width: '12px',
  },
  '.cm-tooltip': {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
  },
  '.cm-tooltip-autocomplete': {
    '& > ul > li[aria-selected]': {
      backgroundColor: '#eff6ff',
      color: '#1e293b',
    },
  },
});

export interface CodeEditorHandle {
  undo: () => void;
  redo: () => void;
}

const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(function CodeEditor({ value, onChange, onRun, onPaste, filename, readOnly = false }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onRunRef = useRef(onRun);
  const onPasteRef = useRef(onPaste);
  const langCompartment = useRef(new Compartment());

  onChangeRef.current = onChange;
  onRunRef.current = onRun;
  onPasteRef.current = onPaste;

  useImperativeHandle(ref, () => ({
    undo: () => {
      if (viewRef.current) undo(viewRef.current);
    },
    redo: () => {
      if (viewRef.current) redo(viewRef.current);
    },
  }));

  const createState = useCallback(
    (doc: string) => {
      const extensions = [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        history(),
        foldGutter(),
        drawSelection(),
        rectangularSelection(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        highlightSelectionMatches(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        langCompartment.current.of(getLanguageExtension(filename)),
        editorTheme,
        EditorView.lineWrapping,
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          ...closeBracketsKeymap,
          ...searchKeymap,
          indentWithTab,
          {
            key: 'Ctrl-Enter',
            mac: 'Cmd-Enter',
            run: () => {
              onRunRef.current?.();
              return true;
            },
          },
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
        EditorView.domEventHandlers({
          paste: () => {
            onPasteRef.current?.();
            return false;
          },
        }),
        EditorState.tabSize.of(4),
      ];

      if (readOnly) {
        extensions.push(EditorState.readOnly.of(true));
      }

      return EditorState.create({ doc, extensions });
    },
    [readOnly]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const view = new EditorView({
      state: createState(value),
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createState]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentDoc = view.state.doc.toString();
    if (currentDoc !== value) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentDoc.length,
          insert: value,
        },
      });
    }
  }, [value]);

  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: langCompartment.current.reconfigure(
          getLanguageExtension(filename)
        ),
      });
    }
  }, [filename]);

  return (
    <div ref={containerRef} className="h-full w-full overflow-hidden [&_.cm-editor]:h-full [&_.cm-editor]:outline-none [&_.cm-scroller]:overflow-auto" />
  );
});

export default CodeEditor;

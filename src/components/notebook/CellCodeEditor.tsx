import { useEffect, useRef, useCallback } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, drawSelection } from '@codemirror/view';
import { defaultKeymap, indentWithTab, history, historyKeymap } from '@codemirror/commands';
import { python } from '@codemirror/lang-python';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, indentOnInput } from '@codemirror/language';
import { autocompletion, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';

interface CellCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun?: () => void;
}

const cellTheme = EditorView.theme({
  '&': {
    fontSize: '13px',
    fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", Menlo, Monaco, monospace',
    maxHeight: '500px',
  },
  '.cm-content': {
    padding: '8px 0',
    caretColor: '#1e293b',
  },
  '.cm-gutters': {
    backgroundColor: '#f8fafc',
    color: '#94a3b8',
    border: 'none',
    borderRight: '1px solid #e2e8f0',
    minWidth: '36px',
  },
  '.cm-activeLine': {
    backgroundColor: 'transparent',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent',
  },
  '.cm-selectionBackground': {
    backgroundColor: '#dbeafe !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: '#bfdbfe !important',
  },
  '.cm-cursor': {
    borderLeftColor: '#1e293b',
    borderLeftWidth: '2px',
  },
  '.cm-matchingBracket': {
    backgroundColor: '#e0f2fe',
    outline: '1px solid #7dd3fc',
  },
  '.cm-scroller': {
    overflow: 'auto',
  },
});

export default function CellCodeEditor({ value, onChange, onRun }: CellCodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onRunRef = useRef(onRun);
  onChangeRef.current = onChange;
  onRunRef.current = onRun;

  const createState = useCallback((doc: string) => {
    return EditorState.create({
      doc,
      extensions: [
        lineNumbers(),
        history(),
        drawSelection(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        python(),
        cellTheme,
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          ...closeBracketsKeymap,
          indentWithTab,
          {
            key: 'Shift-Enter',
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
        EditorState.tabSize.of(4),
      ],
    });
  }, []);

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
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      className="[&_.cm-editor]:outline-none [&_.cm-scroller]:overflow-auto"
    />
  );
}

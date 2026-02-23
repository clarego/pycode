import { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState, Compartment } from '@codemirror/state';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';
import { indentWithTab } from '@codemirror/commands';
import { keymap } from '@codemirror/view';
import { autocompletion } from '@codemirror/autocomplete';

interface CodeViewProps {
  code: string;
  onChange: (code: string) => void;
  readOnly?: boolean;
}

export default function CodeView({ code, onChange, readOnly = false }: CodeViewProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const readOnlyCompartment = useRef(new Compartment());

  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      doc: code,
      extensions: [
        basicSetup,
        python(),
        oneDark,
        keymap.of([indentWithTab]),
        autocompletion(),
        readOnlyCompartment.current.of(EditorState.readOnly.of(readOnly)),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !readOnly) {
            onChange(update.state.doc.toString());
          }
        }),
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '13px',
          },
          '.cm-scroller': {
            overflow: 'auto',
            fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
          },
          '.cm-gutters': {
            backgroundColor: '#282c34',
            color: '#5c6370',
            border: 'none',
          },
          '.cm-content': {
            caretColor: '#528bff',
            padding: '8px 0',
          },
          '.cm-line': {
            padding: '0 4px',
          },
          '&.cm-focused .cm-cursor': {
            borderLeftColor: '#528bff',
          },
          '&.cm-focused .cm-selectionBackground, ::selection': {
            backgroundColor: '#3e4451',
          },
          '.cm-activeLine': {
            backgroundColor: '#2c313c',
          },
          '.cm-activeLineGutter': {
            backgroundColor: '#2c313c',
          },
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!viewRef.current) return;
    const currentCode = viewRef.current.state.doc.toString();
    if (currentCode !== code) {
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: currentCode.length,
          insert: code,
        },
      });
    }
  }, [code]);

  useEffect(() => {
    if (!viewRef.current) return;
    viewRef.current.dispatch({
      effects: readOnlyCompartment.current.reconfigure(EditorState.readOnly.of(readOnly)),
    });
  }, [readOnly]);

  return (
    <div className="h-full w-full bg-[#282c34]" ref={editorRef} />
  );
}

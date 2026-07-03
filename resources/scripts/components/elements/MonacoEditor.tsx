import React, { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import { findModeByFilename, getMonacoLanguage } from '@/lib/monacoLanguages';
import { patchMonacoWorkerEnvironment } from '@/lib/monacoWorkerShim';

patchMonacoWorkerEnvironment();

const EditorContainer = styled.div`
    ${tw`relative h-full w-full min-h-0`};

    .monaco-editor,
    .monaco-editor .overflow-guard {
        ${tw`rounded`};
    }

    .monaco-editor .margin {
        background-color: #0f1419 !important;
    }
`;

export interface Props {
    style?: React.CSSProperties;
    initialContent?: string;
    mode: string;
    filename?: string;
    onModeChanged: (mode: string) => void;
    fetchContent: (callback: () => Promise<string>) => void;
    onContentSaved: () => void;
    onContentChanged?: (content: string) => void;
    onCursorLineChange?: (line: number) => void;
}

let themeDefined = false;

const ensureTheme = () => {
    if (themeDefined) {
        return;
    }

    monaco.editor.defineTheme('realm-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
            'editor.background': '#0f1419',
            'editor.lineHighlightBackground': '#151b22',
            'editorGutter.background': '#0f1419',
            'editorLineNumber.foreground': '#5c6370',
            'editorLineNumber.activeForeground': '#cbccc6',
            'editor.selectionBackground': '#33415e',
            'editor.inactiveSelectionBackground': '#2a3548',
            'editorCursor.foreground': '#f8f8f2',
            'editorWhitespace.foreground': '#3b4048',
        },
    });

    themeDefined = true;
};

export default ({
    style,
    initialContent,
    filename,
    mode,
    fetchContent,
    onContentSaved,
    onModeChanged,
    onContentChanged,
    onCursorLineChange,
}: Props) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const onModeChangedRef = useRef(onModeChanged);
    const onContentSavedRef = useRef(onContentSaved);
    const onContentChangedRef = useRef(onContentChanged);
    const onCursorLineChangeRef = useRef(onCursorLineChange);
    const fetchContentRef = useRef(fetchContent);
    const modeRef = useRef(mode);

    onModeChangedRef.current = onModeChanged;
    onContentSavedRef.current = onContentSaved;
    onContentChangedRef.current = onContentChanged;
    onCursorLineChangeRef.current = onCursorLineChange;
    fetchContentRef.current = fetchContent;
    modeRef.current = mode;

    useEffect(() => {
        if (!containerRef.current) {
            return;
        }

        ensureTheme();

        const editor = monaco.editor.create(containerRef.current, {
            value: initialContent || '',
            language: getMonacoLanguage(filename, mode),
            theme: 'realm-dark',
            automaticLayout: true,
            fontSize: 12,
            lineHeight: 22,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            tabSize: 4,
            insertSpaces: true,
            renderLineHighlight: 'line',
            padding: { top: 4 },
            scrollbar: {
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10,
            },
        });

        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => onContentSavedRef.current());

        editorRef.current = editor;

        fetchContentRef.current(() => Promise.resolve(editor.getValue()));

        const contentSubscription = editor.onDidChangeModelContent(() => {
            onContentChangedRef.current?.(editor.getValue());
        });

        const cursorSubscription = editor.onDidChangeCursorPosition((event) => {
            onCursorLineChangeRef.current?.(event.position.lineNumber);
        });

        onCursorLineChangeRef.current?.(editor.getPosition()?.lineNumber ?? 1);

        return () => {
            contentSubscription.dispose();
            cursorSubscription.dispose();
            editor.dispose();
            editorRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (filename === undefined) {
            return;
        }

        const detected = findModeByFilename(filename)?.mime || 'text/plain';
        if (detected !== modeRef.current) {
            onModeChangedRef.current(detected);
        }
    }, [filename]);

    useEffect(() => {
        const editor = editorRef.current;
        const model = editor?.getModel();

        if (!editor || !model) {
            return;
        }

        const language = getMonacoLanguage(filename, mode);
        if (model.getLanguageId() !== language) {
            monaco.editor.setModelLanguage(model, language);
        }
    }, [filename, mode]);

    useEffect(() => {
        const editor = editorRef.current;

        if (!editor) {
            return;
        }

        const next = initialContent || '';
        if (editor.getValue() === next) {
            return;
        }

        editor.setValue(next);
    }, [initialContent]);

    useEffect(() => {
        const editor = editorRef.current;

        if (!editor) {
            fetchContentRef.current(() => Promise.reject(new Error('no editor session has been configured')));
            return;
        }

        fetchContentRef.current(() => Promise.resolve(editor.getValue()));
    }, [filename]);

    return <EditorContainer ref={containerRef} style={style} />;
};

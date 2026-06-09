import React, { useEffect, useRef } from 'react';
import CodeMirror from 'codemirror';
import { cn } from '@/lib/utils';

import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/ayu-mirage.css';
import 'codemirror/mode/yaml/yaml';

export interface CodeBlockProps {
    value: string;
    language?: 'yaml' | 'plaintext';
    className?: string;
    /** Max height before scrolling kicks in. Defaults to 32rem. */
    maxHeight?: string;
    /** Flush inside a parent card — no extra border, padding, or rounded corners. */
    embedded?: boolean;
}

const languageMode: Record<NonNullable<CodeBlockProps['language']>, string> = {
    yaml: 'yaml',
    plaintext: 'text/plain',
};

const maxHeightToPx = (maxHeight: string): number => {
    if (maxHeight.endsWith('rem')) {
        return parseFloat(maxHeight) * 16;
    }

    if (maxHeight.endsWith('px')) {
        return parseFloat(maxHeight);
    }

    return 512;
};

export default ({ value, language = 'yaml', className, maxHeight = '32rem', embedded = false }: CodeBlockProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<CodeMirror.Editor>();
    const maxHeightPx = maxHeightToPx(maxHeight);

    useEffect(() => {
        if (!containerRef.current) {
            return;
        }

        const editor = CodeMirror(containerRef.current, {
            value,
            mode: languageMode[language],
            theme: 'ayu-mirage',
            readOnly: 'nocursor',
            lineNumbers: true,
            lineWrapping: true,
            tabSize: 2,
            indentWithTabs: false,
            scrollbarStyle: 'native',
        });

        const refreshHeight = () => {
            const lineHeight = editor.defaultTextHeight();
            const contentHeight = editor.lineCount() * lineHeight + 12;
            editor.setSize('100%', Math.min(contentHeight, maxHeightPx));
        };

        editorRef.current = editor;
        refreshHeight();

        return () => {
            editor.getWrapperElement().remove();
            editorRef.current = undefined;
        };
    }, [language, maxHeightPx]);

    useEffect(() => {
        const editor = editorRef.current;

        if (!editor || editor.getValue() === value) {
            return;
        }

        editor.setValue(value);

        const lineHeight = editor.defaultTextHeight();
        const contentHeight = editor.lineCount() * lineHeight + 12;
        editor.setSize('100%', Math.min(contentHeight, maxHeightPx));
    }, [value, maxHeightPx]);

    return (
        <div
            className={cn(
                'admin-code-block overflow-hidden bg-[#0f1419]',
                !embedded && 'rounded-lg border border-border',
                embedded && 'admin-code-block--embedded',
                className
            )}
            style={embedded ? undefined : { maxHeight }}
        >
            <div ref={containerRef} />
        </div>
    );
};

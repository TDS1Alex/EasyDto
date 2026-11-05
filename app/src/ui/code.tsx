import { useRef } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

import { cx, formatBytes, pluralize } from './utils';

export type CodeLanguage = 'csharp' | 'typescript' | 'proto';

export interface LanguageMeta {
    language: CodeLanguage;
    label: string;
    extension: string;
}

const languageByTechnology: Record<string, LanguageMeta> = {
    CSharp: { language: 'csharp', label: 'C#', extension: 'cs' },
    JavaScript: { language: 'typescript', label: 'TypeScript', extension: 'ts' },
    Grpc: { language: 'proto', label: 'gRPC / Proto', extension: 'proto' },
};

export function getLanguageMeta(technology: string): LanguageMeta {
    return languageByTechnology[technology] ?? languageByTechnology.CSharp;
}

const keywords = new Set([
    'public', 'private', 'protected', 'internal', 'class', 'record', 'struct', 'enum', 'interface',
    'new', 'return', 'get', 'set', 'export', 'const', 'let', 'var', 'function', 'message', 'repeated',
    'optional', 'required', 'syntax', 'package', 'import', 'from', 'extends', 'implements', 'static',
    'readonly', 'async', 'await', 'true', 'false', 'null', 'void', 'override', 'partial',
]);

const types = new Set([
    'int', 'int32', 'int64', 'string', 'bool', 'boolean', 'number', 'DateOnly', 'DateTimeOffset',
    'Guid', 'Date', 'ICollection', 'List', 'Task', 'google.protobuf.Timestamp',
    'google.protobuf.StringValue', 'google.protobuf.Int32Value', 'google.protobuf.BoolValue',
]);

const tokenPattern = /(\/\/.*$)|("(?:[^"\\]|\\.)*")|(\[[A-Za-z][^\]\n]*\])|([A-Za-z_][A-Za-z0-9_.]*)|(\d+)/g;

function renderLine(line: string): ReactNode[] {
    const nodes: ReactNode[] = [];
    let cursor = 0;
    let key = 0;

    for (const match of line.matchAll(tokenPattern)) {
        const index = match.index ?? 0;
        if (index > cursor) {
            nodes.push(<span key={key++}>{line.slice(cursor, index)}</span>);
        }

        const token = match[0];
        let className = '';

        if (match[1]) className = 'tok-comment';
        else if (match[2]) className = 'tok-string';
        else if (match[3]) className = 'tok-attr';
        else if (match[4]) {
            if (keywords.has(token)) className = 'tok-keyword';
            else if (types.has(token)) className = 'tok-type';
        } else if (match[5]) className = 'tok-number';

        nodes.push(
            className
                ? <span key={key++} className={className}>{token}</span>
                : <span key={key++}>{token}</span>,
        );
        cursor = index + token.length;
    }

    if (cursor < line.length) {
        nodes.push(<span key={key++}>{line.slice(cursor)}</span>);
    }

    return nodes;
}

interface CodeViewProps {
    code: string;
    showLineNumbers: boolean;
    wrap: boolean;
    emptyState: ReactNode;
}

export function CodeView({ code, showLineNumbers, wrap, emptyState }: CodeViewProps) {
    if (!code) {
        return <>{emptyState}</>;
    }

    const lines = code.split('\n');

    return (
        <div className={cx('ed-code', wrap && 'is-wrap')}>
            <div className="ed-code-inner">
                {lines.map((line, index) => (
                    <div className="ed-code-line" key={index}>
                        {showLineNumbers && (
                            <span className="ed-code-num" aria-hidden="true">{index + 1}</span>
                        )}
                        <span className="ed-code-text">{line === '' ? '\u00A0' : renderLine(line)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    onRun?: () => void;
    showLineNumbers: boolean;
    ariaLabel: string;
}

export function CodeEditor({
    value,
    onChange,
    placeholder,
    onRun,
    showLineNumbers,
    ariaLabel,
}: CodeEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const gutterRef = useRef<HTMLDivElement>(null);
    const lineCount = Math.max(1, value.split('\n').length);

    const handleScroll = () => {
        if (gutterRef.current && textareaRef.current) {
            gutterRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Tab') {
            event.preventDefault();
            const textarea = event.currentTarget;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const nextValue = `${value.slice(0, start)}  ${value.slice(end)}`;
            onChange(nextValue);

            window.requestAnimationFrame(() => {
                textarea.selectionStart = start + 2;
                textarea.selectionEnd = start + 2;
            });
        }

        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            onRun?.();
        }
    };

    return (
        <div className="ed-editor">
            {showLineNumbers && (
                <div className="ed-gutter" ref={gutterRef} aria-hidden="true">
                    {Array.from({ length: lineCount }, (_, index) => (
                        <span key={index}>{index + 1}</span>
                    ))}
                </div>
            )}
            <textarea
                ref={textareaRef}
                className="ed-editor-input"
                value={value}
                onChange={event => onChange(event.target.value)}
                onScroll={handleScroll}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                aria-label={ariaLabel}
                spellCheck={false}
                wrap="off"
            />
        </div>
    );
}

export interface CodeStats {
    lines: number;
    classes: number;
    bytes: number;
    sizeLabel: string;
}

export function getCodeStats(code: string): CodeStats {
    const lines = code === '' ? 0 : code.split('\n').filter(line => line.trim() !== '').length;
    const classes = code.match(/^\s*(?:public\s+class|export\s+class|message)\s+/gm)?.length ?? 0;
    const bytes = new TextEncoder().encode(code).length;

    return {
        lines,
        classes,
        bytes,
        sizeLabel: formatBytes(bytes),
    };
}

export function codeSummary(stats: CodeStats): string {
    if (stats.lines === 0) return 'Код ещё не сгенерирован';
    return [
        `${stats.lines} ${pluralize(stats.lines, 'строка', 'строки', 'строк')}`,
        `${stats.classes} ${pluralize(stats.classes, 'класс', 'класса', 'классов')}`,
        stats.sizeLabel,
    ].join(' · ');
}

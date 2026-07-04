import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/solid';

interface Option {
    value: string;
    label: string;
}

interface Props {
    value: string;
    options: (string | Option)[];
    onChange: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
}

const toOption = (option: string | Option): Option =>
    typeof option === 'string' ? { value: option, label: option } : option;

export default ({ value, options, onChange, disabled, placeholder }: Props) => {
    const normalized = useMemo(() => options.map(toOption), [options]);
    const selected = normalized.find((entry) => entry.value === value) ?? null;

    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number; openUp: boolean } | null>(
        null
    );
    const containerRef = useRef<HTMLDivElement>(null);

    const close = () => {
        setOpen(false);
        setQuery('');
    };

    useLayoutEffect(() => {
        if (!open || !containerRef.current) return;

        const update = () => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const openUp = spaceBelow < 240 && rect.top > spaceBelow;

            setMenuRect({ top: openUp ? rect.top : rect.bottom, left: rect.left, width: rect.width, openUp });
        };

        update();
        window.addEventListener('scroll', update, true);
        window.addEventListener('resize', update);
        return () => {
            window.removeEventListener('scroll', update, true);
            window.removeEventListener('resize', update);
        };
    }, [open]);

    useEffect(() => {
        if (!open) return;

        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                close();
            }
        };

        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const filtered = useMemo(() => {
        if (!query) return normalized;
        const lower = query.toLowerCase();
        return normalized.filter((entry) => entry.label.toLowerCase().includes(lower));
    }, [normalized, query]);

    return (
        <div className={'relative'} ref={containerRef}>
            <div
                className={classNames(
                    'flex items-center gap-2 px-3 py-2.5 rounded-md border bg-realm-surface cursor-text transition-colors duration-150',
                    open ? 'border-blue-500/60' : 'border-realm-border/60',
                    disabled && 'opacity-60 cursor-not-allowed'
                )}
                onClick={() => !disabled && setOpen(true)}
            >
                <input
                    type={'text'}
                    disabled={disabled}
                    value={open ? query : selected?.label ?? ''}
                    placeholder={placeholder}
                    onChange={(e) => setQuery(e.currentTarget.value)}
                    onFocus={() => setOpen(true)}
                    className={'flex-1 min-w-0 bg-transparent border-0 outline-none text-sm text-neutral-200 placeholder:text-neutral-500'}
                />
                {open ? (
                    <ChevronUpIcon className={'w-4 h-4 text-neutral-500 flex-shrink-0'} />
                ) : (
                    <ChevronDownIcon className={'w-4 h-4 text-neutral-500 flex-shrink-0'} />
                )}
            </div>

            {open &&
                !disabled &&
                menuRect &&
                createPortal(
                    <div
                        style={{
                            position: 'fixed',
                            top: menuRect.openUp ? undefined : menuRect.top + 6,
                            bottom: menuRect.openUp ? window.innerHeight - menuRect.top + 6 : undefined,
                            left: menuRect.left,
                            width: menuRect.width,
                        }}
                        className={
                            'z-[9999] max-h-56 overflow-y-auto rounded-md border border-realm-border/60 bg-realm-popover shadow-lg py-1'
                        }
                    >
                        {filtered.length === 0 ? (
                            <p className={'px-3 py-2 text-sm text-neutral-500 m-0'}>No matches</p>
                        ) : (
                            filtered.map((entry) => (
                                <button
                                    key={entry.value}
                                    type={'button'}
                                    onClick={() => {
                                        onChange(entry.value);
                                        close();
                                    }}
                                    className={classNames(
                                        'w-full text-left px-3 py-2 text-sm bg-transparent border-0 cursor-pointer transition-colors duration-100',
                                        entry.value === value
                                            ? 'text-blue-400 font-medium bg-blue-500/10'
                                            : 'text-neutral-300 hover:bg-white/5'
                                    )}
                                >
                                    {entry.label}
                                </button>
                            ))
                        )}
                    </div>,
                    document.body
                )}
        </div>
    );
};

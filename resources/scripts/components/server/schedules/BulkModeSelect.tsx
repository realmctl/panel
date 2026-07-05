import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { ChevronDownIcon } from '@heroicons/react/outline';
import { realmClasses } from '@/lib/realmTokens';

interface Props {
    value: boolean;
    onChange: (bulkMode: boolean) => void;
}

const OPTIONS = [
    { value: false, label: 'Select automations…' },
    { value: true, label: 'Bulk select' },
];

const BulkModeSelect = ({ value, onChange }: Props) => {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const selected = OPTIONS.find((option) => option.value === value) ?? OPTIONS[0];

    return (
        <div className={'relative flex-shrink-0'} ref={containerRef}>
            <button
                type={'button'}
                onClick={() => setOpen((current) => !current)}
                className={classNames(
                    'flex items-center gap-2 text-sm rounded px-3 py-1.5 cursor-pointer transition-colors duration-150 border',
                    open ? 'border-blue-500/60' : 'border-realm-border',
                    realmClasses.surface,
                    'text-realm-text'
                )}
            >
                {selected.label}
                <ChevronDownIcon
                    className={classNames(
                        'w-4 h-4 text-neutral-500 transition-transform duration-150',
                        open && 'rotate-180'
                    )}
                />
            </button>

            {open && (
                <div
                    className={
                        'absolute right-0 top-full mt-1.5 z-20 w-48 rounded-md border border-realm-border/60 bg-realm-popover shadow-lg py-1'
                    }
                >
                    {OPTIONS.map((option) => (
                        <button
                            key={String(option.value)}
                            type={'button'}
                            onClick={() => {
                                onChange(option.value);
                                setOpen(false);
                            }}
                            className={classNames(
                                'w-full text-left px-3 py-2 text-sm bg-transparent border-0 cursor-pointer transition-colors duration-100',
                                option.value === value
                                    ? 'text-blue-400 font-medium bg-blue-500/10'
                                    : 'text-neutral-300 hover:bg-white/5'
                            )}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BulkModeSelect;

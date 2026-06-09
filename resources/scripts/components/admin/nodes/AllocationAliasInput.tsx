import React, { useEffect, useRef, useState } from 'react';
import { updateNodeAllocationAlias } from '@/api/admin/nodes';
import { cn } from '@/lib/utils';

interface Props {
    nodeId: number;
    allocationId: number;
    initialValue: string | null;
    onUpdated?: (alias: string) => void;
    className?: string;
}

export default ({ nodeId, allocationId, initialValue, onUpdated, className }: Props) => {
    const serverValue = initialValue ?? '';
    const [value, setValue] = useState(serverValue);
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const saveVersion = useRef(0);

    useEffect(() => {
        setValue(serverValue);
        setStatus('idle');
    }, [serverValue, allocationId]);

    const save = async (nextValue: string) => {
        if (nextValue === serverValue) {
            setStatus('idle');
            return;
        }

        const version = ++saveVersion.current;
        setStatus('saving');

        try {
            await updateNodeAllocationAlias(nodeId, allocationId, nextValue);

            if (version !== saveVersion.current) {
                return;
            }

            setStatus('saved');
            onUpdated?.(nextValue);
            window.setTimeout(() => {
                setStatus((current) => (current === 'saved' ? 'idle' : current));
            }, 1500);
        } catch {
            if (version !== saveVersion.current) {
                return;
            }

            setStatus('error');
        }
    };

    const onBlur = () => {
        void save(value);
    };

    const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.currentTarget.blur();
        }

        if (event.key === 'Escape') {
            setValue(serverValue);
            setStatus('idle');
            event.currentTarget.blur();
        }
    };

    return (
        <div className={cn('min-w-0', className)}>
            <input
                className={cn(
                    'h-9 w-full min-w-0 rounded-md border border-border bg-background px-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    status === 'saved' && 'border-emerald-500/50',
                    status === 'error' && 'border-red-500/50'
                )}
                value={value}
                placeholder="No alias"
                aria-label="IP alias"
                onChange={(event) => {
                    setValue(event.target.value);
                    if (status === 'error') {
                        setStatus('idle');
                    }
                }}
                onBlur={onBlur}
                onKeyDown={onKeyDown}
            />
            {status === 'saving' && <p className="mt-1 text-xs text-muted-foreground">Saving…</p>}
        </div>
    );
};

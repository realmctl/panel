import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { updateNodeAllocationAlias } from '@/api/admin/nodes';
import { fieldClass } from '@/components/admin-preview/settings/fieldClass';
import { cn } from '@/lib/utils';

interface Props {
    nodeId: number;
    allocationId: number;
    initialValue: string | null;
    onUpdated?: (alias: string) => void;
}

export default ({ nodeId, allocationId, initialValue, onUpdated }: Props) => {
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
        <div className="flex items-center gap-2">
            <input
                className={cn(
                    fieldClass,
                    'py-1 text-xs',
                    status === 'saved' && 'border-green-500/50',
                    status === 'error' && 'border-red-500/50'
                )}
                value={value}
                placeholder="none"
                onChange={(event) => {
                    setValue(event.target.value);
                    if (status === 'error') {
                        setStatus('idle');
                    }
                }}
                onBlur={onBlur}
                onKeyDown={onKeyDown}
            />
            {status === 'saving' && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />}
        </div>
    );
};

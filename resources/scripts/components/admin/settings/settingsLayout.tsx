import React from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type SettingRowProps = {
    label: string;
    description: React.ReactNode;
    htmlFor?: string;
    children: React.ReactNode;
    wide?: boolean;
    /** Always stack label above input — use in narrow sidebars. */
    stacked?: boolean;
};

export const SettingRow = ({ label, description, htmlFor, children, wide, stacked }: SettingRowProps) => (
    <div
        className={cn(
            'flex flex-col gap-3 px-5 py-4',
            !stacked && 'md:flex-row md:items-start md:justify-between md:gap-10'
        )}
    >
        <div className={cn('min-w-0', !stacked && 'md:w-2/5 md:max-w-sm lg:max-w-md')}>
            {htmlFor ? <Label htmlFor={htmlFor}>{label}</Label> : <p className="text-sm font-medium text-foreground">{label}</p>}
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <div
            className={cn(
                'w-full min-w-0',
                !stacked && 'md:flex-1',
                !stacked && (wide ? 'md:max-w-2xl' : 'md:max-w-xl')
            )}
        >
            {children}
        </div>
    </div>
);

export const SegmentedControl = <T extends string | number | boolean>({
    value,
    options,
    onChange,
}: {
    value: T;
    options: { value: T; label: string; disabled?: boolean }[];
    onChange: (value: T) => void;
}) => (
    <div className="flex w-full rounded-md border border-border bg-muted/30 p-1">
        {options.map((option) => {
            const selected = value === option.value;

            return (
                <button
                    key={String(option.value)}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => onChange(option.value)}
                    className={cn(
                        'flex-1 rounded-sm px-3 py-2 text-sm font-medium transition-colors',
                        selected
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground',
                        option.disabled && 'cursor-not-allowed opacity-50'
                    )}
                >
                    {option.label}
                </button>
            );
        })}
    </div>
);

export const SettingsSection = ({
    title,
    description,
    children,
}: {
    title: string;
    description: React.ReactNode;
    children: React.ReactNode;
}) => (
    <div className="overflow-hidden rounded-md border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="divide-y divide-border">{children}</div>
    </div>
);

export const SettingsFooter = ({ children }: { children: React.ReactNode }) => (
    <div className="flex flex-wrap justify-end gap-2 rounded-md border border-border bg-card px-5 py-4">
        {children}
    </div>
);

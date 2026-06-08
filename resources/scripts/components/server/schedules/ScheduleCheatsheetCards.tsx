import React from 'react';
import classNames from 'classnames';

const EXAMPLE_ROWS = [
    { expr: '*/5 * * * *', label: 'Every 5 minutes' },
    { expr: '0 */1 * * *', label: 'Every hour' },
    { expr: '0 8-12 * * *', label: 'Hour range (8 AM–12 PM)' },
    { expr: '0 0 * * *', label: 'Once a day at midnight' },
    { expr: '0 0 * * MON', label: 'Every Monday at midnight' },
];

const SYMBOL_ROWS = [
    { symbol: '*', label: 'Any value' },
    { symbol: ',', label: 'Value list separator' },
    { symbol: '-', label: 'Range of values' },
    { symbol: '/', label: 'Step values' },
];

const Table = ({ title, rows }: { title: string; rows: { expr?: string; symbol?: string; label: string }[] }) => (
    <div className={'rounded-lg border border-realm-border/80 overflow-hidden'}>
        <div className={'px-3 py-2 bg-realm-surface border-b border-realm-border/80'}>
            <p className={'text-xs font-semibold uppercase tracking-wide text-neutral-400 m-0'}>{title}</p>
        </div>
        <div className={'divide-y divide-realm-border/50'}>
            {rows.map((row) => (
                <div key={row.expr ?? row.symbol} className={'flex items-center gap-3 px-3 py-2.5 text-sm'}>
                    <code className={'shrink-0 min-w-[5.5rem] font-mono text-xs text-blue-200'}>
                        {row.expr ?? row.symbol}
                    </code>
                    <span className={'text-neutral-400 text-xs'}>{row.label}</span>
                </div>
            ))}
        </div>
    </div>
);

interface Props {
    compact?: boolean;
}

export default ({ compact = false }: Props) => (
    <div className={classNames('grid gap-3', compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2')}>
        <Table title={'Examples'} rows={EXAMPLE_ROWS} />
        <Table title={'Symbols'} rows={SYMBOL_ROWS} />
    </div>
);

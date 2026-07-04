import React, { useMemo, useState } from 'react';
import classNames from 'classnames';
import { Server } from '@/api/server/getServer';
import ServerRow from '@/components/dashboard/ServerRow';

type SortKey = 'name' | 'game';
type SortDir = 'asc' | 'desc';

const SortIcon = ({ active, dir }: { active: boolean; dir: SortDir }) => (
    <svg
        xmlns={'http://www.w3.org/2000/svg'}
        className={classNames('w-3 h-3 transition-transform duration-150', active ? 'text-neutral-300' : 'text-neutral-600', dir === 'desc' && 'rotate-180')}
        viewBox={'0 0 24 24'}
        fill={'currentColor'}
    >
        <path d={'M12 15.5l-6-6h12l-6 6z'} />
    </svg>
);

export default ({ servers, groupColor }: { servers: Server[]; groupColor?: string }) => {
    const [sortKey, setSortKey] = useState<SortKey>('name');
    const [sortDir, setSortDir] = useState<SortDir>('asc');

    const toggleSort = (key: SortKey) => {
        if (key === sortKey) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    const sorted = useMemo(() => {
        const value = (s: Server) => (sortKey === 'name' ? s.name : s.eggName).toLowerCase();
        return [...servers].sort((a, b) => {
            const cmp = value(a).localeCompare(value(b));
            return sortDir === 'asc' ? cmp : -cmp;
        });
    }, [servers, sortKey, sortDir]);

    return (
        <div className={'rounded-md border border-realm-border/50 bg-realm-card overflow-hidden'}>
            <div className={'hidden sm:grid grid-cols-12 gap-4 px-4 py-2 border-b border-realm-border/50'}>
                <button
                    onClick={() => toggleSort('name')}
                    className={'col-span-4 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-neutral-500 hover:text-neutral-300 bg-transparent border-0 p-0 cursor-pointer text-left'}
                >
                    Name
                    <SortIcon active={sortKey === 'name'} dir={sortDir} />
                </button>
                <button
                    onClick={() => toggleSort('game')}
                    className={'col-span-2 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-neutral-500 hover:text-neutral-300 bg-transparent border-0 p-0 cursor-pointer text-left'}
                >
                    Game
                    <SortIcon active={sortKey === 'game'} dir={sortDir} />
                </button>
                <div className={'col-span-2 text-xs font-medium uppercase tracking-wide text-neutral-500'}>Status</div>
                <div className={'col-span-2 text-xs font-medium uppercase tracking-wide text-neutral-500'}>Memory</div>
                <div className={'col-span-2 text-xs font-medium uppercase tracking-wide text-neutral-500'}>Players</div>
            </div>
            <div className={'divide-y divide-realm-border/50'}>
                {sorted.map((s) => (
                    <ServerRow key={s.uuid} server={s} groupColor={groupColor} />
                ))}
            </div>
        </div>
    );
};

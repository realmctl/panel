import React from 'react';
import { Server } from '@/api/server/getServer';
import ServerCard from '@/components/dashboard/ServerCard';
import ServerRow from '@/components/dashboard/ServerRow';
import GroupColorDot, { resolveColor } from '@/components/dashboard/groups/GroupColorDot';

interface Props {
    name: string;
    color: string;
    servers: Server[];
    layout: 'grid' | 'list';
    collapsed: boolean;
    onToggle: () => void;
}

export default ({ name, color, servers, layout, collapsed, onToggle }: Props) => (
    <div className={'mb-6'}>
        <button
            onClick={onToggle}
            className={
                'w-full flex items-center gap-2 mb-3 text-left bg-transparent border-0 cursor-pointer p-0 group'
            }
        >
            <GroupColorDot color={color} size={10} />
            <span className={'text-sm font-semibold text-neutral-200 group-hover:text-white transition-colors'}>
                {name}
            </span>
            <span
                className={'text-xs text-neutral-500 ml-1'}
                style={{ color: resolveColor(color) + 'aa' }}
            >
                {servers.length}
            </span>
            <svg
                xmlns={'http://www.w3.org/2000/svg'}
                className={`w-3 h-3 text-neutral-500 ml-auto transition-transform duration-150 ${collapsed ? '-rotate-90' : ''}`}
                viewBox={'0 0 24 24'}
                fill={'currentColor'}
            >
                <path d={'M12 15.5l-6-6h12l-6 6z'} />
            </svg>
        </button>

        {!collapsed && (
            layout === 'grid' ? (
                <div className={'grid grid-cols-1 md:grid-cols-2 gap-4'}>
                    {servers.map((s) => (
                        <ServerCard key={s.uuid} server={s} groupColor={color} />
                    ))}
                </div>
            ) : (
                <div className={'flex flex-col gap-2'}>
                    {servers.map((s) => (
                        <ServerRow key={s.uuid} server={s} groupColor={color} />
                    ))}
                </div>
            )
        )}
    </div>
);

import React from 'react';
import { Link } from 'react-router-dom';
import Tooltip from '@/components/elements/tooltip/Tooltip';
import Translate from '@/components/elements/Translate';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { ActivityLog } from '@definitions/user';
import ActivityLogMetaButton from '@/components/elements/activity/ActivityLogMetaButton';
import { FolderOpenIcon, TerminalIcon } from '@heroicons/react/solid';
import style from './style.module.css';
import Avatar from '@/components/Avatar';
import useLocationHash from '@/plugins/useLocationHash';
import { getObjectKeys, isObject } from '@/lib/objects';

interface Props {
    activity: ActivityLog;
    children?: React.ReactNode;
}

function wrapProperties(value: unknown): any {
    if (value === null || typeof value === 'string' || typeof value === 'number') {
        return `<strong>${String(value)}</strong>`;
    }
    if (isObject(value)) {
        return getObjectKeys(value).reduce((obj, key) => {
            if (key === 'count' || (typeof key === 'string' && key.endsWith('_count'))) {
                return { ...obj, [key]: value[key] };
            }
            return { ...obj, [key]: wrapProperties(value[key]) };
        }, {} as Record<string, unknown>);
    }
    if (Array.isArray(value)) return value.map(wrapProperties);
    return value;
}

export default ({ activity, children }: Props) => {
    const { pathTo } = useLocationHash();
    const actor = activity.relationships.actor;
    const properties = wrapProperties(activity.properties);

    return (
        <div
            className={'flex items-start gap-4 p-4 rounded-lg transition-colors duration-150 group'}
            style={{ backgroundColor: '#192024', border: '1px solid #2d3338' }}
        >
            {/* Avatar */}
            <div className={'hidden sm:flex flex-shrink-0 w-9 h-9 rounded-full overflow-hidden mt-0.5'}
                style={{ backgroundColor: '#2d3338' }}
            >
                <Avatar name={actor?.uuid || 'system'} />
            </div>

            {/* Content */}
            <div className={'flex-1 min-w-0'}>
                {/* Top row: actor — event + icons */}
                <div className={'flex items-center flex-wrap gap-x-1.5 gap-y-1 mb-1'}>
                    <Tooltip placement={'top'} content={actor?.email || 'System User'}>
                        <span className={'text-sm font-medium text-neutral-200 cursor-default'}>
                            {actor?.username || 'System'}
                        </span>
                    </Tooltip>
                    <span className={'text-neutral-600 text-sm'}>&mdash;</span>
                    <Link
                        to={`#${pathTo({ event: activity.event })}`}
                        className={'text-sm font-mono transition-colors duration-75 text-neutral-400 hover:text-cyan-400'}
                    >
                        {activity.event}
                    </Link>
                    <div className={style.icons}>
                        {activity.isApi && (
                            <Tooltip placement={'top'} content={'Using API Key'}>
                                <TerminalIcon />
                            </Tooltip>
                        )}
                        {activity.event.startsWith('server:sftp.') && (
                            <Tooltip placement={'top'} content={'Using SFTP'}>
                                <FolderOpenIcon />
                            </Tooltip>
                        )}
                        {children}
                    </div>
                </div>

                {/* Description */}
                <p className={style.description}>
                    <Translate ns={'activity'} values={properties} i18nKey={activity.event.replace(':', '.')} />
                </p>

                {/* Footer: IP + timestamp */}
                <div className={'mt-2 flex items-center gap-2 flex-wrap'}>
                    {activity.ip && (
                        <Link
                            to={`#${pathTo({ ip: activity.ip })}`}
                            className={'text-xs font-mono px-2 py-0.5 rounded transition-colors duration-100 hover:text-cyan-400'}
                            style={{ backgroundColor: '#0e1417', color: '#64748b', border: '1px solid #2d3338' }}
                        >
                            {activity.ip}
                        </Link>
                    )}
                    <Tooltip placement={'right'} content={format(activity.timestamp, 'MMM do, yyyy H:mm:ss')}>
                        <span className={'text-xs text-neutral-400 cursor-default'}>
                            {formatDistanceToNowStrict(activity.timestamp, { addSuffix: true })}
                        </span>
                    </Tooltip>
                </div>
            </div>

            {/* Metadata button */}
            {activity.hasAdditionalMetadata && (
                <ActivityLogMetaButton meta={activity.properties} />
            )}
        </div>
    );
};

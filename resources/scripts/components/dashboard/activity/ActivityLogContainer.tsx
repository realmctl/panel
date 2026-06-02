import React, { useEffect, useState } from 'react';
import { ActivityLogFilters, useActivityLogs } from '@/api/account/activity';
import { useFlashKey } from '@/plugins/useFlash';
import PageContentBlock from '@/components/elements/PageContentBlock';
import FlashMessageRender from '@/components/FlashMessageRender';
import { Link } from 'react-router-dom';
import PaginationFooter from '@/components/elements/table/PaginationFooter';
import { DesktopComputerIcon, XCircleIcon } from '@heroicons/react/solid';
import Spinner from '@/components/elements/Spinner';
import { styles as btnStyles } from '@/components/elements/button/index';
import classNames from 'classnames';
import ActivityLogEntry from '@/components/elements/activity/ActivityLogEntry';
import Tooltip from '@/components/elements/tooltip/Tooltip';
import useLocationHash from '@/plugins/useLocationHash';

const cardStyle = { backgroundColor: '#192024', border: '1px solid #2d3338' } as React.CSSProperties;
const cardHeaderStyle = { backgroundColor: '#0e1417', borderBottom: '1px solid #2d3338' } as React.CSSProperties;

export default () => {
    const { hash } = useLocationHash();
    const { clearAndAddHttpError } = useFlashKey('account');
    const [filters, setFilters] = useState<ActivityLogFilters>({ page: 1, sorts: { timestamp: -1 } });
    const { data, isValidating, error } = useActivityLogs(filters, {
        revalidateOnMount: true,
        revalidateOnFocus: false,
    });

    useEffect(() => {
        setFilters((value) => ({ ...value, filters: { ip: hash.ip, event: hash.event } }));
    }, [hash]);

    useEffect(() => {
        clearAndAddHttpError(error);
    }, [error]);

    return (
        <PageContentBlock title={'Account Activity Log'}>
            <FlashMessageRender byKey={'account'} />
            {(filters.filters?.event || filters.filters?.ip) && (
                <div className={'flex justify-end mb-4'}>
                    <Link
                        to={'#'}
                        className={classNames(btnStyles.button, btnStyles.text, 'w-full sm:w-auto')}
                        onClick={() => setFilters((value) => ({ ...value, filters: {} }))}
                    >
                        Clear Filters <XCircleIcon className={'w-4 h-4 ml-2'} />
                    </Link>
                </div>
            )}
            <div className={'rounded-lg overflow-hidden'} style={cardStyle}>
                <div className={'px-4 py-3'} style={cardHeaderStyle}>
                    <h3 className={'text-sm font-semibold text-neutral-100'}>Activity Log</h3>
                </div>
                <div>
                    {!data && isValidating ? (
                        <div className={'py-8'}><Spinner centered /></div>
                    ) : (
                        data?.items.map((activity) => (
                            <ActivityLogEntry key={activity.id} activity={activity}>
                                {typeof activity.properties.useragent === 'string' && (
                                    <Tooltip content={activity.properties.useragent} placement={'top'}>
                                        <span>
                                            <DesktopComputerIcon />
                                        </span>
                                    </Tooltip>
                                )}
                            </ActivityLogEntry>
                        ))
                    )}
                </div>
            </div>
            {data && (
                <PaginationFooter
                    pagination={data.pagination}
                    onPageSelect={(page) => setFilters((value) => ({ ...value, page }))}
                />
            )}
        </PageContentBlock>
    );
};

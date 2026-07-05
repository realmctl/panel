import React from 'react';
import classNames from 'classnames';
import { Schedule } from '@/api/server/schedules/getServerSchedules';
import { format } from 'date-fns';

export default ({ schedule }: { schedule: Schedule }) => {
    const cronExpression = `${schedule.cron.minute} ${schedule.cron.hour} ${schedule.cron.dayOfMonth} ${schedule.cron.month} ${schedule.cron.dayOfWeek}`;

    return (
        <>
            <div className={'col-span-5 min-w-0'}>
                <p className={'text-sm font-medium text-neutral-200 m-0 truncate'}>{schedule.name}</p>
                <p className={'text-xs text-neutral-500 m-0 mt-0.5'}>
                    Last run: {schedule.lastRunAt ? format(schedule.lastRunAt, "MMM do 'at' h:mma") : 'never'}
                </p>
            </div>
            <div className={'col-span-4'}>
                <code className={'text-xs font-mono text-neutral-400'}>{cronExpression}</code>
            </div>
            <div className={'col-span-3 flex justify-end'}>
                <span
                    className={classNames(
                        'py-1 px-3 rounded text-xs uppercase text-white',
                        schedule.isActive && !schedule.isProcessing ? 'bg-green-600' : 'bg-neutral-500'
                    )}
                >
                    {schedule.isProcessing ? 'Processing' : schedule.isActive ? 'Active' : 'Inactive'}
                </span>
            </div>
        </>
    );
};

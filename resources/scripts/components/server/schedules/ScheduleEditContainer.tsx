import React, { useCallback, useEffect, useState } from 'react';
import classNames from 'classnames';
import { useHistory, useParams } from 'react-router-dom';
import getServerSchedule from '@/api/server/schedules/getServerSchedule';
import Spinner from '@/components/elements/Spinner';
import FlashMessageRender from '@/components/FlashMessageRender';
import NewTaskButton from '@/components/server/schedules/NewTaskButton';
import DeleteScheduleButton from '@/components/server/schedules/DeleteScheduleButton';
import Can from '@/components/elements/Can';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';
import PageContentBlock from '@/components/elements/PageContentBlock';
import ScheduleTaskRow from '@/components/server/schedules/ScheduleTaskRow';
import isEqual from 'react-fast-compare';
import { format } from 'date-fns';
import RunScheduleButton from '@/components/server/schedules/RunScheduleButton';
import ScheduleRunHistory from '@/components/server/schedules/ScheduleRunHistory';
import useSchedulePolling from '@/components/server/schedules/useSchedulePolling';
import RealmTabBar from '@/components/elements/realm/RealmTabBar';
import { realmClasses } from '@/lib/realmTokens';
import { Schedule } from '@/api/server/schedules/getServerSchedules';

interface Params {
    id: string;
}

const CronBox = ({ title, value }: { title: string; value: string }) => (
    <div className={classNames('rounded-lg p-3 text-center', realmClasses.insetPanel)}>
        <p className={'font-mono font-medium text-neutral-100 m-0'}>{value}</p>
        <p className={'text-2xs uppercase tracking-wide text-neutral-500 m-0 mt-0.5'}>{title}</p>
    </div>
);

const StatusPill = ({ schedule }: { schedule: Schedule }) =>
    schedule.isProcessing ? (
        <span
            className={
                'flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs uppercase font-medium bg-neutral-700 text-neutral-200'
            }
        >
            <Spinner size={'small'} />
            Processing
        </span>
    ) : (
        <span
            className={classNames(
                'rounded-full px-2.5 py-0.5 text-xs uppercase font-medium',
                schedule.isActive ? 'bg-green-600/20 text-green-400' : 'bg-neutral-700 text-neutral-400'
            )}
        >
            {schedule.isActive ? 'Active' : 'Inactive'}
        </span>
    );

export default () => {
    const history = useHistory();
    const { id: scheduleId } = useParams<Params>();

    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'tasks' | 'history'>('tasks');

    const schedule = ServerContext.useStoreState(
        (st) => st.schedules.data.find((s) => s.id === Number(scheduleId)),
        isEqual
    );
    const appendSchedule = ServerContext.useStoreActions((actions) => actions.schedules.appendSchedule);

    const onScheduleUpdate = useCallback(
        (updated: NonNullable<typeof schedule>) => {
            appendSchedule(updated);
        },
        [appendSchedule]
    );

    useSchedulePolling(uuid, Number(scheduleId), !!schedule?.isProcessing, onScheduleUpdate);

    useEffect(() => {
        if (schedule?.id === Number(scheduleId)) {
            setIsLoading(false);
            return;
        }

        clearFlashes('automation');
        getServerSchedule(uuid, Number(scheduleId))
            .then((schedule) => appendSchedule(schedule))
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ error, key: 'automation' });
            })
            .then(() => setIsLoading(false));
    }, [scheduleId]);

    const sortedTasks = schedule ? [...schedule.tasks].sort((a, b) => a.sequenceId - b.sequenceId) : [];

    return (
        <PageContentBlock title={'Automation'}>
            <FlashMessageRender byKey={'automation'} className={'mb-4'} />
            {!schedule || isLoading ? (
                <Spinner size={'large'} centered />
            ) : (
                <>
                    <div className={'rounded-md border border-realm-border/50 bg-realm-card overflow-hidden'}>
                        <div className={'sm:flex items-start justify-between gap-4 p-5 border-b border-realm-border/50'}>
                            <div className={'min-w-0'}>
                                <div className={'flex items-center gap-3 flex-wrap'}>
                                    <h3 className={'text-xl font-semibold text-neutral-100 m-0'}>{schedule.name}</h3>
                                    <StatusPill schedule={schedule} />
                                </div>
                                <p className={'mt-1.5 text-sm text-neutral-500 m-0'}>
                                    Last run:{' '}
                                    {schedule.lastRunAt ? format(schedule.lastRunAt, "MMM do 'at' h:mma") : 'never'}
                                    <span className={'mx-3 text-neutral-700'}>&middot;</span>
                                    Next run:{' '}
                                    {schedule.nextRunAt ? format(schedule.nextRunAt, "MMM do 'at' h:mma") : 'n/a'}
                                </p>
                            </div>

                            <div className={'flex items-center gap-2 mt-4 sm:mt-0 flex-shrink-0'}>
                                <Can action={'schedule.delete'}>
                                    <DeleteScheduleButton
                                        scheduleId={schedule.id}
                                        onDeleted={() => history.push(`/instance/${id}/automation`)}
                                    />
                                </Can>
                                <Can action={'schedule.update'}>
                                    <>
                                        {schedule.tasks.length > 0 && <RunScheduleButton schedule={schedule} />}
                                        <NewTaskButton schedule={schedule} />
                                    </>
                                </Can>
                            </div>
                        </div>

                        <div className={'grid grid-cols-5 gap-3 p-5 border-b border-realm-border/50'}>
                            <CronBox title={'Minute'} value={schedule.cron.minute} />
                            <CronBox title={'Hour'} value={schedule.cron.hour} />
                            <CronBox title={'Day (Month)'} value={schedule.cron.dayOfMonth} />
                            <CronBox title={'Month'} value={schedule.cron.month} />
                            <CronBox title={'Day (Week)'} value={schedule.cron.dayOfWeek} />
                        </div>

                        <div className={'px-5 pt-4'}>
                            <RealmTabBar
                                tabs={[
                                    { id: 'tasks', label: 'Tasks' },
                                    { id: 'history', label: 'History' },
                                ]}
                                activeTab={activeTab}
                                onTabChange={setActiveTab}
                            />
                        </div>

                        {activeTab === 'tasks' ? (
                            sortedTasks.length > 0 ? (
                                <div className={'divide-y divide-realm-border/50 mt-2'}>
                                    {sortedTasks.map((task, index) => (
                                        <ScheduleTaskRow
                                            key={`${schedule.id}_${task.id}`}
                                            task={task}
                                            schedule={schedule}
                                            isFirst={index === 0}
                                            isLast={index === sortedTasks.length - 1}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className={'flex flex-col items-center justify-center py-12'}>
                                    <p className={'text-sm text-neutral-500 m-0'}>No tasks configured yet.</p>
                                </div>
                            )
                        ) : (
                            <div className={'p-5'}>
                                <ScheduleRunHistory uuid={uuid} scheduleId={schedule.id} />
                            </div>
                        )}
                    </div>
                </>
            )}
        </PageContentBlock>
    );
};

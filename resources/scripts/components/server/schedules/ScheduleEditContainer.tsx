import React, { useCallback, useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import getServerSchedule from '@/api/server/schedules/getServerSchedule';
import Spinner from '@/components/elements/Spinner';
import FlashMessageRender from '@/components/FlashMessageRender';
import EditScheduleModal from '@/components/server/schedules/EditScheduleModal';
import NewTaskButton from '@/components/server/schedules/NewTaskButton';
import DeleteScheduleButton from '@/components/server/schedules/DeleteScheduleButton';
import Can from '@/components/elements/Can';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';
import PageContentBlock from '@/components/elements/PageContentBlock';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';
import ScheduleTaskRow from '@/components/server/schedules/ScheduleTaskRow';
import isEqual from 'react-fast-compare';
import { format } from 'date-fns';
import ScheduleCronRow from '@/components/server/schedules/ScheduleCronRow';
import RunScheduleButton from '@/components/server/schedules/RunScheduleButton';
import ScheduleRunHistory from '@/components/server/schedules/ScheduleRunHistory';
import useSchedulePolling from '@/components/server/schedules/useSchedulePolling';
import duplicateSchedule from '@/api/server/schedules/duplicateSchedule';
import exportSchedule from '@/api/server/schedules/exportSchedule';
import { httpErrorToHuman } from '@/api/http';

interface Params {
    id: string;
}

const CronBox = ({ title, value }: { title: string; value: string }) => (
    <div css={tw`bg-neutral-700 rounded p-3`}>
        <p css={tw`text-neutral-300 text-sm`}>{title}</p>
        <p css={tw`text-xl font-medium text-neutral-100`}>{value}</p>
    </div>
);

const ActivePill = ({ active }: { active: boolean }) => (
    <span
        css={[
            tw`rounded-full px-2 py-px text-xs ml-4 uppercase`,
            active ? tw`bg-green-600 text-green-100` : tw`bg-red-600 text-red-100`,
        ]}
    >
        {active ? 'Active' : 'Inactive'}
    </span>
);

export default () => {
    const history = useHistory();
    const { id: scheduleId } = useParams<Params>();

    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

    const { clearFlashes, clearAndAddHttpError, addError, addFlash } = useFlash();
    const [isLoading, setIsLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
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

    const toggleEditModal = useCallback(() => {
        setShowEditModal((s) => !s);
    }, []);

    const onDuplicate = () => {
        duplicateSchedule(uuid, Number(scheduleId))
            .then((copy) => {
                appendSchedule(copy);
                history.push(`/server/${id}/automation/${copy.id}`);
            })
            .catch((error) => addError({ message: httpErrorToHuman(error), key: 'automation' }));
    };

    const onExport = () => {
        exportSchedule(uuid, Number(scheduleId))
            .then((template) => {
                const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${schedule?.name || 'automation'}.json`;
                link.click();
                URL.revokeObjectURL(url);
                addFlash({ type: 'success', key: 'automation', message: 'Automation exported.' });
            })
            .catch((error) => addError({ message: httpErrorToHuman(error), key: 'automation' }));
    };

    const sortedTasks = schedule ? [...schedule.tasks].sort((a, b) => a.sequenceId - b.sequenceId) : [];

    return (
        <PageContentBlock title={'Automation'}>
            <FlashMessageRender byKey={'automation'} css={tw`mb-4`} />
            {!schedule || isLoading ? (
                <Spinner size={'large'} centered />
            ) : (
                <>
                    <ScheduleCronRow cron={schedule.cron} css={tw`sm:hidden bg-neutral-700 rounded mb-4 p-3`} />
                    <div css={tw`rounded shadow`}>
                        <div
                            css={tw`sm:flex items-center bg-neutral-900 p-3 sm:p-6 border-b-4 border-neutral-600 rounded-t`}
                        >
                            <div css={tw`flex-1`}>
                                <h3 css={tw`flex items-center text-neutral-100 text-2xl`}>
                                    {schedule.name}
                                    {schedule.isProcessing ? (
                                        <span
                                            css={tw`flex items-center rounded-full px-2 py-px text-xs ml-4 uppercase bg-neutral-600 text-white`}
                                        >
                                            <Spinner css={tw`w-3! h-3! mr-2`} />
                                            Processing
                                        </span>
                                    ) : (
                                        <ActivePill active={schedule.isActive} />
                                    )}
                                </h3>
                                <p css={tw`mt-1 text-sm text-neutral-200`}>
                                    Last run at:&nbsp;
                                    {schedule.lastRunAt ? (
                                        format(schedule.lastRunAt, "MMM do 'at' h:mma")
                                    ) : (
                                        <span css={tw`text-neutral-300`}>n/a</span>
                                    )}
                                    <span css={tw`ml-4 pl-4 border-l-4 border-neutral-600 py-px`}>
                                        Next run at:&nbsp;
                                        {schedule.nextRunAt ? (
                                            format(schedule.nextRunAt, "MMM do 'at' h:mma")
                                        ) : (
                                            <span css={tw`text-neutral-300`}>n/a</span>
                                        )}
                                    </span>
                                </p>
                            </div>
                            <div css={tw`flex sm:block mt-3 sm:mt-0 gap-2`}>
                                <Can action={'schedule.update'}>
                                    <Button.Text className={'flex-1 mr-4'} onClick={toggleEditModal}>
                                        Edit
                                    </Button.Text>
                                    <Button.Text className={'mr-4'} onClick={onDuplicate}>
                                        Duplicate
                                    </Button.Text>
                                    <Button.Text className={'mr-4'} onClick={onExport}>
                                        Export
                                    </Button.Text>
                                    <NewTaskButton schedule={schedule} />
                                </Can>
                            </div>
                        </div>
                        <div css={tw`hidden sm:grid grid-cols-5 md:grid-cols-5 gap-4 mb-4 mt-4`}>
                            <CronBox title={'Minute'} value={schedule.cron.minute} />
                            <CronBox title={'Hour'} value={schedule.cron.hour} />
                            <CronBox title={'Day (Month)'} value={schedule.cron.dayOfMonth} />
                            <CronBox title={'Month'} value={schedule.cron.month} />
                            <CronBox title={'Day (Week)'} value={schedule.cron.dayOfWeek} />
                        </div>
                        <div css={tw`flex border-b border-neutral-800 px-4`}>
                            <button
                                type={'button'}
                                css={[
                                    tw`px-4 py-3 text-sm border-0 bg-transparent cursor-pointer transition-colors duration-150`,
                                    activeTab === 'tasks' ? tw`text-neutral-100 border-b-2 border-blue-500` : tw`text-neutral-400`,
                                ]}
                                onClick={() => setActiveTab('tasks')}
                            >
                                Tasks
                            </button>
                            <button
                                type={'button'}
                                css={[
                                    tw`px-4 py-3 text-sm border-0 bg-transparent cursor-pointer transition-colors duration-150`,
                                    activeTab === 'history' ? tw`text-neutral-100 border-b-2 border-blue-500` : tw`text-neutral-400`,
                                ]}
                                onClick={() => setActiveTab('history')}
                            >
                                History
                            </button>
                        </div>
                        {activeTab === 'tasks' ? (
                            <div css={tw`bg-neutral-700 rounded-b`}>
                                {sortedTasks.length > 0
                                    ? sortedTasks.map((task, index) => (
                                          <ScheduleTaskRow
                                              key={`${schedule.id}_${task.id}`}
                                              task={task}
                                              schedule={schedule}
                                              isFirst={index === 0}
                                              isLast={index === sortedTasks.length - 1}
                                          />
                                      ))
                                    : null}
                            </div>
                        ) : (
                            <div css={tw`bg-neutral-700 rounded-b p-4`}>
                                <ScheduleRunHistory uuid={uuid} scheduleId={schedule.id} />
                            </div>
                        )}
                    </div>
                    <EditScheduleModal visible={showEditModal} schedule={schedule} onModalDismissed={toggleEditModal} />
                    <div css={tw`mt-6 flex sm:justify-end`}>
                        <Can action={'schedule.delete'}>
                            <DeleteScheduleButton
                                scheduleId={schedule.id}
                                onDeleted={() => history.push(`/server/${id}/automation`)}
                            />
                        </Can>
                        {schedule.tasks.length > 0 && (
                            <Can action={'schedule.update'}>
                                <RunScheduleButton schedule={schedule} />
                            </Can>
                        )}
                    </div>
                </>
            )}
        </PageContentBlock>
    );
};

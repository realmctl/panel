import React, { useState } from 'react';
import { Schedule, Task } from '@/api/server/schedules/getServerSchedules';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowCircleDown,
    faArrowDown,
    faArrowUp,
    faClock,
    faCode,
    faEnvelope,
    faFileArchive,
    faLink,
    faPencilAlt,
    faToggleOn,
    faTrash,
    faTrashAlt,
} from '@fortawesome/free-solid-svg-icons';
import deleteScheduleTask from '@/api/server/schedules/deleteScheduleTask';
import reorderScheduleTasks from '@/api/server/schedules/reorderScheduleTasks';
import { httpErrorToHuman } from '@/api/http';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import TaskDetailsModal from '@/components/server/schedules/TaskDetailsModal';
import Can from '@/components/elements/Can';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';
import tw from 'twin.macro';
import ConfirmationModal from '@/components/elements/ConfirmationModal';
import Icon from '@/components/elements/Icon';

interface Props {
    schedule: Schedule;
    task: Task;
    isFirst: boolean;
    isLast: boolean;
}

const getActionDetails = (action: string): [string, any] => {
    switch (action) {
        case 'command':
            return ['Send Command', faCode];
        case 'power':
            return ['Send Power Action', faToggleOn];
        case 'backup':
            return ['Create Backup', faFileArchive];
        case 'webhook':
            return ['Send Webhook', faLink];
        case 'email':
            return ['Send Email', faEnvelope];
        case 'delete_files':
            return ['Delete Files', faTrash];
        default:
            return ['Unknown Action', faCode];
    }
};

export default ({ schedule, task, isFirst, isLast }: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { clearFlashes, addError } = useFlash();
    const [visible, setVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const appendSchedule = ServerContext.useStoreActions((actions) => actions.schedules.appendSchedule);

    const sortedTasks = [...schedule.tasks].sort((a, b) => a.sequenceId - b.sequenceId);

    const onConfirmDeletion = () => {
        setIsLoading(true);
        clearFlashes('automation');
        deleteScheduleTask(uuid, schedule.id, task.id)
            .then(() =>
                appendSchedule({
                    ...schedule,
                    tasks: schedule.tasks.filter((t) => t.id !== task.id),
                })
            )
            .catch((error) => {
                console.error(error);
                setIsLoading(false);
                addError({ message: httpErrorToHuman(error), key: 'automation' });
            });
    };

    const moveTask = (direction: 'up' | 'down') => {
        const currentIndex = sortedTasks.findIndex((t) => t.id === task.id);
        const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (swapIndex < 0 || swapIndex >= sortedTasks.length) {
            return;
        }

        const order = [...sortedTasks];
        [order[currentIndex], order[swapIndex]] = [order[swapIndex], order[currentIndex]];

        setIsLoading(true);
        reorderScheduleTasks(uuid, schedule.id, order.map((t) => t.id))
            .then((tasks) => appendSchedule({ ...schedule, tasks }))
            .catch((error) => addError({ message: httpErrorToHuman(error), key: 'automation' }))
            .then(() => setIsLoading(false));
    };

    const [title, icon] = getActionDetails(task.action);

    return (
        <div css={tw`sm:flex items-center p-3 sm:p-6 border-b border-neutral-800`}>
            <SpinnerOverlay visible={isLoading} fixed size={'large'} />
            <TaskDetailsModal
                schedule={schedule}
                task={task}
                visible={isEditing}
                onModalDismissed={() => setIsEditing(false)}
            />
            <ConfirmationModal
                title={'Confirm task deletion'}
                buttonText={'Delete Task'}
                onConfirmed={onConfirmDeletion}
                visible={visible}
                onModalDismissed={() => setVisible(false)}
            >
                Are you sure you want to delete this task? This action cannot be undone.
            </ConfirmationModal>
            <FontAwesomeIcon icon={icon} css={tw`text-lg text-white hidden md:block`} />
            <div css={tw`flex-none sm:flex-1 w-full sm:w-auto overflow-x-auto`}>
                <p css={tw`md:ml-6 text-neutral-200 uppercase text-sm`}>{title}</p>
                {task.payload && (
                    <div css={tw`md:ml-6 mt-2`}>
                        {task.action === 'backup' && (
                            <p css={tw`text-xs uppercase text-neutral-400 mb-1`}>Ignoring files & folders:</p>
                        )}
                        <div
                            css={tw`font-mono bg-neutral-800 rounded py-1 px-2 text-sm w-auto inline-block whitespace-pre-wrap break-all`}
                        >
                            {task.payload}
                        </div>
                    </div>
                )}
            </div>
            <div css={tw`mt-3 sm:mt-0 flex items-center w-full sm:w-auto`}>
                {task.condition && (
                    <div css={tw`mr-4`}>
                        <div css={tw`px-2 py-1 bg-blue-500/20 text-blue-200 text-xs rounded-full`}>
                            {task.condition === 'require_online' ? 'Requires online' : 'Requires backup space'}
                        </div>
                    </div>
                )}
                {task.continueOnFailure && (
                    <div css={tw`mr-6`}>
                        <div css={tw`flex items-center px-2 py-1 bg-yellow-500 text-yellow-800 text-sm rounded-full`}>
                            <Icon icon={faArrowCircleDown} css={tw`w-3 h-3 mr-2`} />
                            Continues on Failure
                        </div>
                    </div>
                )}
                {task.sequenceId > 1 && task.timeOffset > 0 && (
                    <div css={tw`mr-6`}>
                        <div css={tw`flex items-center px-2 py-1 bg-neutral-500 text-sm rounded-full`}>
                            <Icon icon={faClock} css={tw`w-3 h-3 mr-2`} />
                            {task.timeOffset}s later
                        </div>
                    </div>
                )}
                <Can action={'schedule.update'}>
                    <button
                        type={'button'}
                        aria-label={'Move task up'}
                        disabled={isFirst}
                        css={tw`block text-sm p-2 text-neutral-500 hover:text-neutral-100 transition-colors duration-150 disabled:opacity-30`}
                        onClick={() => moveTask('up')}
                    >
                        <FontAwesomeIcon icon={faArrowUp} />
                    </button>
                    <button
                        type={'button'}
                        aria-label={'Move task down'}
                        disabled={isLast}
                        css={tw`block text-sm p-2 text-neutral-500 hover:text-neutral-100 transition-colors duration-150 disabled:opacity-30`}
                        onClick={() => moveTask('down')}
                    >
                        <FontAwesomeIcon icon={faArrowDown} />
                    </button>
                    <button
                        type={'button'}
                        aria-label={'Edit scheduled task'}
                        css={tw`block text-sm p-2 text-neutral-500 hover:text-neutral-100 transition-colors duration-150 mr-4 ml-auto sm:ml-0`}
                        onClick={() => setIsEditing(true)}
                    >
                        <FontAwesomeIcon icon={faPencilAlt} />
                    </button>
                </Can>
                <Can action={'schedule.update'}>
                    <button
                        type={'button'}
                        aria-label={'Delete scheduled task'}
                        css={tw`block text-sm p-2 text-neutral-500 hover:text-red-600 transition-colors duration-150`}
                        onClick={() => setVisible(true)}
                    >
                        <FontAwesomeIcon icon={faTrashAlt} />
                    </button>
                </Can>
            </div>
        </div>
    );
};

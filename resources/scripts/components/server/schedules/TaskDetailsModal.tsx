import React, { useContext } from 'react';
import { Schedule, Task } from '@/api/server/schedules/getServerSchedules';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';
import ModalContext from '@/context/ModalContext';
import asModal from '@/hoc/asModal';
import TaskDetailsForm from '@/components/server/schedules/TaskDetailsForm';

interface Props {
    schedule: Schedule;
    task: Task;
}

const TaskDetailsModal = ({ schedule, task }: Props) => {
    const { dismiss } = useContext(ModalContext);

    return (
        <>
            <h2 css={tw`text-2xl mb-6`}>Edit task</h2>
            <TaskDetailsForm
                schedule={schedule}
                task={task}
                onSuccess={dismiss}
                footer={(isSubmitting) => (
                    <div css={tw`flex justify-end`}>
                        <Button type={'submit'} disabled={isSubmitting}>
                            Save changes
                        </Button>
                    </div>
                )}
            />
        </>
    );
};

export default asModal<Props>({ top: false })(TaskDetailsModal);

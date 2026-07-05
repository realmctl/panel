import React, { useState } from 'react';
import { Schedule } from '@/api/server/schedules/getServerSchedules';
import Modal from '@/components/elements/Modal';
import { Button } from '@/components/elements/button/index';
import TaskDetailsForm from '@/components/server/schedules/TaskDetailsForm';

interface Props {
    schedule: Schedule;
    visible: boolean;
    onDismissed: () => void;
}

const CreateTaskDrawer = ({ schedule, visible, onDismissed }: Props) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    return (
        <Modal
            visible={visible}
            onDismissed={onDismissed}
            title={'Create task'}
            dismissable={!isSubmitting}
            closeOnBackground={!isSubmitting}
            closeOnEscape={!isSubmitting}
        >
            <p className={'text-sm text-neutral-400 mb-4 -mt-3'}>Add an action that runs as part of this automation.</p>
            <TaskDetailsForm
                schedule={schedule}
                onSuccess={onDismissed}
                onSubmittingChange={setIsSubmitting}
                footer={(submitting) => (
                    <div className={'flex justify-end gap-3 mt-6 pt-4 border-t border-realm-border/50'}>
                        <Button.Text
                            size={Button.Sizes.Small}
                            type={'button'}
                            onClick={onDismissed}
                            disabled={submitting}
                        >
                            Cancel
                        </Button.Text>
                        <Button size={Button.Sizes.Small} type={'submit'} disabled={submitting}>
                            {submitting ? 'Creating…' : 'Create task'}
                        </Button>
                    </div>
                )}
            />
        </Modal>
    );
};

export default CreateTaskDrawer;

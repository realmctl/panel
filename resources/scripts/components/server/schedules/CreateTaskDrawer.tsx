import React, { useState } from 'react';
import { Schedule } from '@/api/server/schedules/getServerSchedules';
import Drawer from '@/components/elements/Drawer';
import { Button } from '@/components/elements/button/index';
import TaskDetailsForm from '@/components/server/schedules/TaskDetailsForm';
import tw from 'twin.macro';

interface Props {
    schedule: Schedule;
    visible: boolean;
    onDismissed: () => void;
}

const CreateTaskDrawer = ({ schedule, visible, onDismissed }: Props) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    return (
        <Drawer
            visible={visible}
            onDismissed={onDismissed}
            title={'Create task'}
            subtitle={'Add an action that runs as part of this automation.'}
            width={'40rem'}
            dismissable={!isSubmitting}
            closeOnBackground={!isSubmitting}
            closeOnEscape={!isSubmitting}
        >
            <TaskDetailsForm
                schedule={schedule}
                onSuccess={onDismissed}
                onSubmittingChange={setIsSubmitting}
                footer={(submitting) => (
                    <div css={tw`flex justify-end gap-3`}>
                        <Button.Text size={Button.Sizes.Small} type={'button'} onClick={onDismissed} disabled={submitting}>
                            Cancel
                        </Button.Text>
                        <Button size={Button.Sizes.Small} type={'submit'} disabled={submitting}>
                            {submitting ? 'Creating…' : 'Create task'}
                        </Button>
                    </div>
                )}
            />
        </Drawer>
    );
};

export default CreateTaskDrawer;

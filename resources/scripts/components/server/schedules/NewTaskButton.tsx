import React, { useState } from 'react';
import { Schedule } from '@/api/server/schedules/getServerSchedules';
import CreateTaskDrawer from '@/components/server/schedules/CreateTaskDrawer';
import { Button } from '@/components/elements/button/index';

interface Props {
    schedule: Schedule;
}

export default ({ schedule }: Props) => {
    const [visible, setVisible] = useState(false);

    return (
        <>
            <CreateTaskDrawer schedule={schedule} visible={visible} onDismissed={() => setVisible(false)} />
            <Button onClick={() => setVisible(true)} className={'flex-1'}>
                New Task
            </Button>
        </>
    );
};

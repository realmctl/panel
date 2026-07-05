import React, { useState } from 'react';
import { Schedule } from '@/api/server/schedules/getServerSchedules';
import CreateTaskDrawer from '@/components/server/schedules/CreateTaskDrawer';
import { Button } from '@/components/elements/button/index';

interface Props {
    schedule: Schedule;
    size?: typeof Button.Sizes.Small;
}

export default ({ schedule, size = Button.Sizes.Small }: Props) => {
    const [visible, setVisible] = useState(false);

    return (
        <>
            <CreateTaskDrawer schedule={schedule} visible={visible} onDismissed={() => setVisible(false)} />
            <Button size={size} onClick={() => setVisible(true)}>
                New Task
            </Button>
        </>
    );
};

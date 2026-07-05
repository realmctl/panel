import React, { useCallback, useState } from 'react';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { Button } from '@/components/elements/button/index';
import triggerScheduleExecution from '@/api/server/schedules/triggerScheduleExecution';
import { ServerContext } from '@/state/server';
import useFlash from '@/plugins/useFlash';
import { Schedule } from '@/api/server/schedules/getServerSchedules';

const RunScheduleButton = ({
    schedule,
    size = Button.Sizes.Small,
}: {
    schedule: Schedule;
    size?: typeof Button.Sizes.Small;
}) => {
    const [loading, setLoading] = useState(false);
    const { clearFlashes, clearAndAddHttpError } = useFlash();

    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const appendSchedule = ServerContext.useStoreActions((actions) => actions.schedules.appendSchedule);

    const onTriggerExecute = useCallback(() => {
        clearFlashes('automation');
        setLoading(true);
        triggerScheduleExecution(id, schedule.id)
            .then(() => {
                setLoading(false);
                appendSchedule({ ...schedule, isProcessing: true });
            })
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ error, key: 'automation' });
            })
            .then(() => setLoading(false));
    }, []);

    return (
        <>
            <SpinnerOverlay visible={loading} size={'large'} />
            <Button
                variant={Button.Variants.Secondary}
                size={size}
                disabled={schedule.isProcessing}
                onClick={onTriggerExecute}
            >
                Run Now
            </Button>
        </>
    );
};

export default RunScheduleButton;

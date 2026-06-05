import { useEffect } from 'react';
import getServerSchedule from '@/api/server/schedules/getServerSchedule';

export default (
    uuid: string,
    scheduleId: number,
    isProcessing: boolean,
    onUpdate: (schedule: Awaited<ReturnType<typeof getServerSchedule>>) => void
) => {
    useEffect(() => {
        if (!isProcessing) {
            return;
        }

        const interval = setInterval(() => {
            getServerSchedule(uuid, scheduleId).then(onUpdate).catch(() => null);
        }, 3000);

        return () => clearInterval(interval);
    }, [uuid, scheduleId, isProcessing, onUpdate]);
};

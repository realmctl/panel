import React, { useEffect, useState } from 'react';
import getScheduleRuns, { ScheduleRun } from '@/api/server/schedules/getScheduleRuns';
import { httpErrorToHuman } from '@/api/http';
import Spinner from '@/components/elements/Spinner';
import tw from 'twin.macro';
import { format } from 'date-fns';
import { Button } from '@/components/elements/button/index';
import useFlash from '@/plugins/useFlash';

const statusColor = (status: string) => {
    switch (status) {
        case 'completed':
            return tw`bg-green-600 text-green-100`;
        case 'failed':
            return tw`bg-red-600 text-red-100`;
        case 'skipped':
            return tw`bg-yellow-600 text-yellow-100`;
        case 'running':
            return tw`bg-blue-600 text-blue-100`;
        default:
            return tw`bg-neutral-600 text-neutral-100`;
    }
};

export default ({ uuid, scheduleId }: { uuid: string; scheduleId: number }) => {
    const { addError } = useFlash();
    const [loading, setLoading] = useState(true);
    const [runs, setRuns] = useState<ScheduleRun[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        setLoading(true);
        getScheduleRuns(uuid, scheduleId, page)
            .then(({ items, pagination }) => {
                setRuns(items);
                setTotalPages(pagination.totalPages);
            })
            .catch((error) => addError({ message: httpErrorToHuman(error), key: 'automation' }))
            .then(() => setLoading(false));
    }, [uuid, scheduleId, page]);

    if (loading) {
        return <Spinner size={'large'} centered />;
    }

    if (runs.length === 0) {
        return <p css={tw`text-neutral-400 text-sm text-center py-8`}>No run history yet.</p>;
    }

    return (
        <div>
            {runs.map((run) => (
                <div key={run.id} css={tw`bg-neutral-800 rounded mb-3 p-4`}>
                    <div css={tw`flex items-center justify-between mb-2`}>
                        <div css={tw`flex items-center gap-3`}>
                            <span css={[tw`rounded-full px-2 py-px text-xs uppercase`, statusColor(run.status)]}>
                                {run.status}
                            </span>
                            <span css={tw`text-xs text-neutral-400 uppercase`}>{run.trigger}</span>
                        </div>
                        <span css={tw`text-xs text-neutral-400`}>
                            {run.startedAt ? format(run.startedAt, "MMM do 'at' h:mma") : 'n/a'}
                        </span>
                    </div>
                    {run.errorMessage && <p css={tw`text-sm text-red-400 mb-2`}>{run.errorMessage}</p>}
                    <div css={tw`space-y-1`}>
                        {run.tasks.map((task) => (
                            <div key={task.id} css={tw`flex items-center justify-between text-sm`}>
                                <span css={tw`text-neutral-300`}>
                                    #{task.sequenceId} {task.action}
                                </span>
                                <span css={[tw`text-xs uppercase`, statusColor(task.status)]}>{task.status}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            {totalPages > 1 && (
                <div css={tw`mt-4 flex justify-center gap-2`}>
                    <Button.Text disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                        Previous
                    </Button.Text>
                    <span css={tw`text-sm text-neutral-400 self-center`}>
                        Page {page} of {totalPages}
                    </span>
                    <Button.Text disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                        Next
                    </Button.Text>
                </div>
            )}
        </div>
    );
};

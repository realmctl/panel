import React from 'react';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import Spinner from '@/components/elements/Spinner';
import StatGraphs from '@/components/server/console/StatGraphs';

const MetricsContainer = () => {
    return (
        <ServerContentBlock title={'Metrics'}>
            <div className={'grid grid-cols-1 md:grid-cols-3 gap-4'}>
                <Spinner.Suspense>
                    <StatGraphs />
                </Spinner.Suspense>
            </div>
        </ServerContentBlock>
    );
};

export default MetricsContainer;

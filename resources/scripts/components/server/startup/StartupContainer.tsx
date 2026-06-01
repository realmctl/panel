import React, { useCallback, useEffect, useState } from 'react';
import VariableBox from '@/components/server/startup/VariableBox';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import getServerStartup from '@/api/swr/getServerStartup';
import Spinner from '@/components/elements/Spinner';
import { ServerError } from '@/components/elements/ScreenBlock';
import { httpErrorToHuman } from '@/api/http';
import { ServerContext } from '@/state/server';
import { useDeepCompareEffect } from '@/plugins/useDeepCompareEffect';
import Select from '@/components/elements/Select';
import isEqual from 'react-fast-compare';
import Input from '@/components/elements/Input';
import setSelectedDockerImage from '@/api/server/setSelectedDockerImage';
import InputSpinner from '@/components/elements/InputSpinner';
import useFlash from '@/plugins/useFlash';

type Tab = 'startup' | 'variables';

const TABS: { id: Tab; label: string }[] = [
    { id: 'startup',   label: 'Startup & Docker' },
    { id: 'variables', label: 'Variables'         },
];

const StartupContainer = () => {
    const [activeTab, setActiveTab] = useState<Tab>('startup');
    const [loading, setLoading] = useState(false);
    const { clearFlashes, clearAndAddHttpError } = useFlash();

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const variables = ServerContext.useStoreState(
        ({ server }) => ({
            variables:   server.data!.variables,
            invocation:  server.data!.invocation,
            dockerImage: server.data!.dockerImage,
        }),
        isEqual
    );

    const { data, error, isValidating, mutate } = getServerStartup(uuid, {
        ...variables,
        dockerImages: { [variables.dockerImage]: variables.dockerImage },
    });

    const setServerFromState = ServerContext.useStoreActions((actions) => actions.server.setServerFromState);

    const isCustomImage =
        data &&
        !Object.values(data.dockerImages)
            .map((v) => v.toLowerCase())
            .includes(variables.dockerImage.toLowerCase());

    useEffect(() => { mutate(); }, []);

    useDeepCompareEffect(() => {
        if (!data) return;
        setServerFromState((s) => ({ ...s, invocation: data.invocation, variables: data.variables }));
    }, [data]);

    const updateSelectedDockerImage = useCallback(
        (v: React.ChangeEvent<HTMLSelectElement>) => {
            setLoading(true);
            clearFlashes('startup:image');
            const image = v.currentTarget.value;
            setSelectedDockerImage(uuid, image)
                .then(() => setServerFromState((s) => ({ ...s, dockerImage: image })))
                .catch((error) => { console.error(error); clearAndAddHttpError({ key: 'startup:image', error }); })
                .then(() => setLoading(false));
        },
        [uuid]
    );

    if (!data) {
        return !error || (error && isValidating)
            ? <Spinner centered size={Spinner.Size.LARGE} />
            : <ServerError title={'Oops!'} message={httpErrorToHuman(error)} onRetry={() => mutate()} />;
    }

    return (
        <ServerContentBlock title={'Startup Settings'} showFlashKey={'startup:image'}>
            {/* Tab bar */}
            <div
                className={'flex items-center gap-1 p-1 rounded-lg mb-6 w-fit'}
                style={{ backgroundColor: '#0e1417', border: '1px solid #2d3338' }}
            >
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={'px-4 py-1.5 rounded-md text-sm font-medium transition-colors duration-150'}
                        style={
                            activeTab === tab.id
                                ? { backgroundColor: '#192024', color: '#e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }
                                : { color: '#64748b' }
                        }
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Startup & Docker tab */}
            {activeTab === 'startup' && (
                <div className={'grid grid-cols-1 md:grid-cols-3 gap-4'}>
                    {/* Startup command — spans 2 cols */}
                    <div
                        className={'md:col-span-2 rounded-lg overflow-hidden'}
                        style={{ backgroundColor: '#192024', border: '1px solid #2d3338' }}
                    >
                        <div
                            className={'px-4 py-3'}
                            style={{ backgroundColor: '#0e1417', borderBottom: '1px solid #2d3338' }}
                        >
                            <span className={'text-xs uppercase tracking-wide text-neutral-400'}>Startup Command</span>
                        </div>
                        <div className={'px-4 py-4'}>
                            <p className={'font-mono text-sm break-all leading-relaxed'} style={{ color: '#22d3ee' }}>
                                {data.invocation}
                            </p>
                        </div>
                    </div>

                    {/* Docker image — spans 1 col */}
                    <div
                        className={'rounded-lg overflow-hidden'}
                        style={{ backgroundColor: '#192024', border: '1px solid #2d3338' }}
                    >
                        <div
                            className={'px-4 py-3'}
                            style={{ backgroundColor: '#0e1417', borderBottom: '1px solid #2d3338' }}
                        >
                            <span className={'text-xs uppercase tracking-wide text-neutral-400'}>Docker Image</span>
                        </div>
                        <div className={'px-4 py-4'}>
                            {Object.keys(data.dockerImages).length > 1 && !isCustomImage ? (
                                <>
                                    <InputSpinner visible={loading}>
                                        <Select
                                            disabled={Object.keys(data.dockerImages).length < 2}
                                            onChange={updateSelectedDockerImage}
                                            defaultValue={variables.dockerImage}
                                        >
                                            {Object.keys(data.dockerImages).map((key) => (
                                                <option key={data.dockerImages[key]} value={data.dockerImages[key]}>
                                                    {key}
                                                </option>
                                            ))}
                                        </Select>
                                    </InputSpinner>
                                    <p className={'text-xs text-neutral-500 mt-2'}>
                                        Select a Docker image to use when running this server.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <Input disabled readOnly value={variables.dockerImage} />
                                    {isCustomImage && (
                                        <p className={'text-xs text-neutral-500 mt-2'}>
                                            This image was manually set by an administrator and cannot be changed here.
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Variables tab */}
            {activeTab === 'variables' && (
                <div className={'grid gap-4 md:grid-cols-2'}>
                    {data.variables.map((variable) => (
                        <VariableBox key={variable.envVariable} variable={variable} />
                    ))}
                </div>
            )}
        </ServerContentBlock>
    );
};

export default StartupContainer;

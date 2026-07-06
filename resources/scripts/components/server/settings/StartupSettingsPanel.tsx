import React, { useCallback, useEffect, useMemo, useState } from 'react';
import VariableBox from '@/components/server/startup/VariableBox';
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
import CopyOnClick from '@/components/elements/CopyOnClick';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy } from '@fortawesome/free-solid-svg-icons';

const INVOCATION_TOKEN = /(\{\{[^}]+\}\})/g;

const InvocationText = ({ invocation }: { invocation: string }) => {
    const parts = useMemo(() => invocation.split(INVOCATION_TOKEN).filter((part) => part.length > 0), [invocation]);

    return (
        <>
            {parts.map((part, index) =>
                part.startsWith('{{') && part.endsWith('}}') ? (
                    <span
                        key={`${part}-${index}`}
                        className={'inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold'}
                        style={{ backgroundColor: '#1a2e35', color: '#22d3ee', border: '1px solid #2d4a55' }}
                    >
                        {part}
                    </span>
                ) : (
                    <span key={`${part}-${index}`} className={'text-neutral-200 whitespace-pre-wrap break-all'}>
                        {part}
                    </span>
                )
            )}
        </>
    );
};

interface Props {
    section: 'startup' | 'variables';
}

export default ({ section }: Props) => {
    const [loading, setLoading] = useState(false);
    const { clearFlashes, clearAndAddHttpError } = useFlash();

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const variables = ServerContext.useStoreState(
        ({ server }) => ({
            variables: server.data!.variables,
            invocation: server.data!.invocation,
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

    useEffect(() => {
        mutate();
    }, []);

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
                .catch((error) => {
                    console.error(error);
                    clearAndAddHttpError({ key: 'startup:image', error });
                })
                .then(() => setLoading(false));
        },
        [uuid]
    );

    if (!data) {
        return !error || (error && isValidating) ? (
            <Spinner centered size={Spinner.Size.LARGE} />
        ) : (
            <ServerError title={'Oops!'} message={httpErrorToHuman(error)} onRetry={() => mutate()} />
        );
    }

    if (section === 'variables') {
        return (
            <div className={'grid gap-4 md:grid-cols-2'}>
                {data.variables.map((variable) => (
                    <VariableBox key={variable.envVariable} variable={variable} />
                ))}
            </div>
        );
    }

    return (
        <div className={'grid grid-cols-1 md:grid-cols-3 gap-4'}>
            <div
                className={'md:col-span-2 rounded-lg overflow-hidden'}
                style={{ backgroundColor: '#192024', border: '1px solid #2d3338' }}
            >
                <div
                    className={'px-4 py-3'}
                    style={{ backgroundColor: '#0e1417', borderBottom: '1px solid #2d3338' }}
                >
                    <span className={'text-xs tracking-wide text-neutral-400'}>Startup Command</span>
                </div>
                <div className={'px-4 py-4'}>
                    <CopyOnClick text={data.invocation} showInNotification={false}>
                        <div
                            className={
                                'group flex w-full items-start justify-between gap-3 rounded-md px-3 py-2.5 font-mono text-sm leading-relaxed cursor-pointer transition-colors duration-150 hover:border-neutral-500'
                            }
                            style={{ backgroundColor: '#0e1417', border: '1px solid #2d3338' }}
                        >
                            <div className={'flex min-w-0 flex-1 flex-wrap items-center gap-x-1 gap-y-1.5'}>
                                <InvocationText invocation={data.invocation} />
                            </div>
                            <FontAwesomeIcon
                                icon={faCopy}
                                className={
                                    'mt-0.5 flex-shrink-0 text-xs text-neutral-600 transition-colors duration-150 group-hover:text-neutral-400'
                                }
                            />
                        </div>
                    </CopyOnClick>
                    <p className={'text-xs text-neutral-500 mt-2'}>Click to copy the full startup command.</p>
                </div>
            </div>

            <div
                className={'rounded-lg overflow-hidden'}
                style={{ backgroundColor: '#192024', border: '1px solid #2d3338' }}
            >
                <div
                    className={'px-4 py-3'}
                    style={{ backgroundColor: '#0e1417', borderBottom: '1px solid #2d3338' }}
                >
                    <span className={'text-xs tracking-wide text-neutral-400'}>Docker Image</span>
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
    );
};

import React, { useCallback, useEffect, useState } from 'react';
import classNames from 'classnames';
import tw from 'twin.macro';
import Modal from '@/components/elements/Modal';
import Select from '@/components/elements/Select';
import Button from '@/components/elements/Button';
import InputSpinner from '@/components/elements/InputSpinner';
import Label from '@/components/elements/Label';
import Can from '@/components/elements/Can';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { ServerContext } from '@/state/server';
import getVersions from '@/api/server/versions/getVersions';
import installVersion from '@/api/server/versions/installVersion';
import deleteFiles from '@/api/server/files/deleteFiles';
import setSelectedDockerImage from '@/api/server/setSelectedDockerImage';
import http from '@/api/http';
import { realmClasses } from '@/lib/realmTokens';
import { getRequiredJavaLabel, resolveDockerImage } from '@/components/server/versions/javaDockerImage';

const SERVER_TYPES = [
    { id: 'paper', name: 'Paper' },
    { id: 'purpur', name: 'Purpur' },
    { id: 'vanilla', name: 'Vanilla' },
    { id: 'spigot', name: 'Spigot' },
    { id: 'fabric', name: 'Fabric' },
    { id: 'velocity', name: 'Velocity' },
    { id: 'snapshot', name: 'Snapshot' },
];

const WIPE_PATHS = [
    'server.jar',
    'libraries',
    'mods',
    'config',
    'plugins',
    'world',
    'world_nether',
    'world_the_end',
    'logs',
    'cache',
    'resources',
    'scripts',
    'fontfiles',
    'structures',
    'unix_args.txt',
    'user_jvm_args.txt',
];

const fetchDockerImages = async (uuid: string): Promise<Record<string, string>> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/startup`);
    return data.meta.docker_images || {};
};

interface Props {
    visible: boolean;
    onDismissed: () => void;
}

export default ({ visible, onDismissed }: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

    const [selectedType, setSelectedType] = useState('paper');
    const [selectedVersion, setSelectedVersion] = useState('');
    const [versions, setVersions] = useState<string[]>([]);
    const [loadingVersions, setLoadingVersions] = useState(false);
    const [installing, setInstalling] = useState(false);
    const [wipeServer, setWipeServer] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const resetState = useCallback(() => {
        setSelectedType('paper');
        setSelectedVersion('');
        setVersions([]);
        setWipeServer(false);
        setError(null);
        setSuccess(null);
        setInstalling(false);
        setLoadingVersions(false);
    }, []);

    useEffect(() => {
        if (!visible) {
            return;
        }

        resetState();
    }, [visible, resetState]);

    useEffect(() => {
        if (!visible) {
            return;
        }

        setLoadingVersions(true);
        setError(null);
        setVersions([]);
        setSelectedVersion('');

        getVersions(uuid, selectedType)
            .then((data) => {
                const available = data.versions;
                setVersions(available);
                setSelectedVersion(available[0] ?? '');
            })
            .catch(() => setError('Failed to load versions.'))
            .then(() => setLoadingVersions(false));
    }, [selectedType, uuid, visible]);

    const handleDismiss = () => {
        if (installing) {
            return;
        }

        onDismissed();
    };

    const updateJavaVersion = (version: string) =>
        fetchDockerImages(uuid)
            .then((dockerImages) => {
                const image = resolveDockerImage(version, dockerImages);
                if (!image) {
                    return false;
                }

                return setSelectedDockerImage(uuid, image).then(() => true);
            })
            .catch(() => false);

    const handleInstall = () => {
        if (!selectedVersion || installing) {
            return;
        }

        setInstalling(true);
        setError(null);
        setSuccess(null);

        const runInstall = () =>
            installVersion(uuid, selectedType, selectedVersion)
                .then((data) => {
                    if (!data.success) {
                        setError(data.error || 'Installation failed.');
                        return;
                    }

                    return updateJavaVersion(selectedVersion).then((javaUpdated) => {
                        const javaLabel = getRequiredJavaLabel(selectedVersion);
                        setSuccess(
                            javaUpdated
                                ? `Successfully installed ${data.version} and set the Java runtime to ${javaLabel}. Restart your server to apply changes.`
                                : `Successfully installed ${data.version}. Restart your server to apply changes.`
                        );
                    });
                })
                .catch((err) => {
                    setError(
                        err?.response?.data?.error ||
                            err?.response?.data?.errors?.[0]?.detail ||
                            'Installation failed. Check server logs for details.'
                    );
                });

        const installPromise = wipeServer
            ? deleteFiles(uuid, '/', WIPE_PATHS)
                  .then(runInstall)
                  .catch(() => {
                      setError('Failed to wipe server files before installing.');
                  })
            : runInstall();

        installPromise.then(() => setInstalling(false));
    };

    const activeType = SERVER_TYPES.find((type) => type.id === selectedType);
    const javaLabel = selectedVersion ? getRequiredJavaLabel(selectedVersion) : null;

    return (
        <Modal
            visible={visible}
            onDismissed={handleDismiss}
            dismissable={!installing}
            closeOnBackground={!installing}
            closeOnEscape={!installing}
        >
            <div className={'relative flex flex-col'}>
                <SpinnerOverlay visible={installing} />

                <h2 css={tw`text-2xl mb-1`}>Change Version</h2>
                <p css={tw`text-sm text-neutral-400 mb-6`}>
                    Select a server distribution and version to install.
                </p>

                {success && (
                    <div
                        css={tw`mb-4 p-3 rounded-lg text-sm`}
                        style={{ backgroundColor: '#0d2f2a', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399' }}
                    >
                        {success}
                    </div>
                )}

                {error && (
                    <div
                        css={tw`mb-4 p-3 rounded-lg text-sm`}
                        style={{ backgroundColor: '#1c0a0a', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}
                    >
                        {error}
                    </div>
                )}

                <div css={tw`space-y-4 flex-1`}>
                    <div>
                        <Label htmlFor={'version-distribution'} css={tw`mb-1 block`}>
                            Distribution
                        </Label>
                        <Select
                            id={'version-distribution'}
                            value={selectedType}
                            disabled={installing}
                            onChange={(e) => setSelectedType(e.currentTarget.value)}
                        >
                            {SERVER_TYPES.map((type) => (
                                <option key={type.id} value={type.id}>
                                    {type.name}
                                </option>
                            ))}
                        </Select>
                        {selectedType === 'spigot' && (
                            <p css={tw`text-xs text-neutral-500 mt-1.5 mb-0`}>
                                Spigot cannot be downloaded automatically. Installation may fail — upload the jar manually if
                                needed.
                            </p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor={'version-select'} css={tw`mb-1 block`}>
                            Version
                        </Label>
                        <InputSpinner visible={loadingVersions}>
                            <Select
                                id={'version-select'}
                                value={selectedVersion}
                                disabled={installing || loadingVersions || versions.length === 0}
                                onChange={(e) => setSelectedVersion(e.currentTarget.value)}
                            >
                                {loadingVersions ? (
                                    <option value={''}>Loading versions...</option>
                                ) : versions.length === 0 ? (
                                    <option value={''}>No versions available</option>
                                ) : (
                                    versions.map((version) => (
                                        <option key={version} value={version}>
                                            {version}
                                        </option>
                                    ))
                                )}
                            </Select>
                        </InputSpinner>
                        {javaLabel && (
                            <p css={tw`text-xs text-neutral-500 mt-1.5 mb-0`}>
                                Requires <span css={tw`text-neutral-400`}>{javaLabel}</span> — will be set automatically after
                                install.
                            </p>
                        )}
                    </div>

                    <label
                        className={classNames(
                            'flex items-start gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors duration-150',
                            realmClasses.insetPanel,
                            wipeServer ? 'border-blue-500/40 bg-blue-500/5' : 'hover:bg-white/5',
                            installing && 'opacity-60 cursor-not-allowed'
                        )}
                    >
                        <input
                            type={'checkbox'}
                            checked={wipeServer}
                            disabled={installing}
                            onChange={(e) => setWipeServer(e.currentTarget.checked)}
                            className={'w-4 h-4 mt-0.5 flex-shrink-0 accent-blue-500 rounded'}
                        />
                        <span>
                            <span className={'text-sm text-neutral-200 block'}>Wipe server</span>
                            <span className={'text-xs text-neutral-500 block mt-1'}>
                                Delete server files including worlds, plugins, mods, config, and libraries before installing{' '}
                                {activeType?.name ?? 'the new version'}.
                            </span>
                        </span>
                    </label>
                </div>

                <div
                    css={tw`mt-6 pt-4 border-t border-realm-border flex flex-col sm:flex-row justify-end sm:space-x-3 space-y-3 sm:space-y-0`}
                >
                    <Button isSecondary onClick={handleDismiss} disabled={installing} css={tw`w-full sm:w-auto`}>
                        {success ? 'Close' : 'Cancel'}
                    </Button>
                    {!success && (
                        <Can action={'file.create'}>
                            <Button
                                onClick={handleInstall}
                                disabled={installing || loadingVersions || !selectedVersion}
                                css={tw`w-full sm:w-auto`}
                            >
                                {installing ? 'Installing...' : 'Install Version'}
                            </Button>
                        </Can>
                    )}
                </div>
            </div>
        </Modal>
    );
};

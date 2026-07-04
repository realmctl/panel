import React, { useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import axios from 'axios';
import { UploadIcon } from '@heroicons/react/outline';
import Modal from '@/components/elements/Modal';
import Button from '@/components/elements/Button';
import InputSpinner from '@/components/elements/InputSpinner';
import Can from '@/components/elements/Can';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { ServerContext } from '@/state/server';
import getVersions from '@/api/server/versions/getVersions';
import installVersion from '@/api/server/versions/installVersion';
import deleteFiles from '@/api/server/files/deleteFiles';
import getFileUploadUrl from '@/api/server/files/getFileUploadUrl';
import renameFiles from '@/api/server/files/renameFiles';
import setSelectedDockerImage from '@/api/server/setSelectedDockerImage';
import http from '@/api/http';
import { getRequiredJavaLabel, resolveDockerImage } from '@/components/server/versions/javaDockerImage';
import { SERVER_SOFTWARE, getServerSoftware } from '@/lib/serverSoftware';
import SearchableSelect from '@/components/elements/SearchableSelect';

const CUSTOM_ID = 'custom';
const ENVIRONMENT_OPTIONS = [
    { value: 'stable', label: 'stable' },
    { value: 'snapshot', label: 'snapshots' },
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

const STEPS = ['Type', 'Version', 'Review'] as const;

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
    const installedSoftware = ServerContext.useStoreState((state) => state.server.data!.installedSoftware);
    const installedVersion = ServerContext.useStoreState((state) => state.server.data!.installedVersion);

    const [step, setStep] = useState(0);
    const [selectedType, setSelectedType] = useState(installedSoftware === 'snapshot' ? 'vanilla' : installedSoftware ?? 'paper');
    const [environment, setEnvironment] = useState(installedSoftware === 'snapshot' ? 'snapshot' : 'stable');
    const [selectedVersion, setSelectedVersion] = useState('');
    const [versions, setVersions] = useState<string[]>([]);
    const [loadingVersions, setLoadingVersions] = useState(false);
    const [installing, setInstalling] = useState(false);
    const [wipeServer, setWipeServer] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [manualStep, setManualStep] = useState(false);
    const [customFile, setCustomFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = useCallback(() => {
        setStep(0);
        setSelectedType(installedSoftware === 'snapshot' ? 'vanilla' : installedSoftware ?? 'paper');
        setEnvironment(installedSoftware === 'snapshot' ? 'snapshot' : 'stable');
        setSelectedVersion('');
        setVersions([]);
        setWipeServer(false);
        setError(null);
        setSuccess(null);
        setManualStep(false);
        setInstalling(false);
        setLoadingVersions(false);
        setCustomFile(null);
        setUploadProgress(null);
    }, [installedSoftware]);

    useEffect(() => {
        if (!visible) return;
        resetState();
    }, [visible, resetState]);

    const isVanillaFamily = selectedType === 'vanilla';
    const effectiveType = isVanillaFamily && environment === 'snapshot' ? 'snapshot' : selectedType;

    useEffect(() => {
        if (!visible || step !== 1 || selectedType === CUSTOM_ID) return;

        setLoadingVersions(true);
        setError(null);
        setVersions([]);
        setSelectedVersion('');

        getVersions(uuid, effectiveType)
            .then((data) => {
                const available = data.versions;
                setVersions(available);
                setSelectedVersion(available[0] ?? '');
            })
            .catch(() => setError('Failed to load versions.'))
            .then(() => setLoadingVersions(false));
    }, [effectiveType, uuid, visible, step]);

    const handleDismiss = () => {
        if (installing) return;
        onDismissed();
    };

    const updateJavaVersion = (version: string) =>
        fetchDockerImages(uuid)
            .then((dockerImages) => {
                const image = resolveDockerImage(version, dockerImages);
                if (!image) return false;
                return setSelectedDockerImage(uuid, image).then(() => true);
            })
            .catch(() => false);

    const handleInstall = () => {
        if (!selectedVersion || installing) return;

        setInstalling(true);
        setError(null);
        setSuccess(null);

        const runInstall = () =>
            installVersion(uuid, effectiveType, selectedVersion)
                .then((data: any) => {
                    if (!data.success) {
                        setError(data.error || 'Installation failed.');
                        return;
                    }

                    if (data.requires_manual_step) {
                        setManualStep(true);
                        setSuccess(`Downloaded the Forge installer for ${data.version}.`);
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

    const handleCustomUpload = () => {
        if (!customFile || installing) return;

        setInstalling(true);
        setError(null);
        setSuccess(null);
        setUploadProgress(0);

        const file = customFile;

        const runUpload = () =>
            getFileUploadUrl(uuid)
                .then((url) =>
                    axios.post(
                        url,
                        { files: file },
                        {
                            headers: { 'Content-Type': 'multipart/form-data' },
                            params: { directory: '/' },
                            onUploadProgress: (event) => {
                                if (event.total) {
                                    setUploadProgress(Math.round((event.loaded / event.total) * 100));
                                }
                            },
                        }
                    )
                )
                .then(() => (file.name === 'server.jar' ? Promise.resolve() : renameFiles(uuid, '/', [{ from: file.name, to: 'server.jar' }])))
                .then(() => http.post(`/api/client/servers/${uuid}/versions/custom`, { filename: file.name }))
                .then(() => {
                    setSuccess(`Uploaded and installed ${file.name}. Restart your server to apply changes.`);
                })
                .catch((err) => {
                    setError(
                        err?.response?.data?.error ||
                            err?.response?.data?.errors?.[0]?.detail ||
                            'Upload failed. Check the file and try again.'
                    );
                });

        const uploadPromise = wipeServer
            ? deleteFiles(uuid, '/', WIPE_PATHS)
                  .then(runUpload)
                  .catch(() => {
                      setError('Failed to wipe server files before uploading.');
                  })
            : runUpload();

        uploadPromise.then(() => setInstalling(false));
    };

    const activeType = getServerSoftware(selectedType);
    const existingType = getServerSoftware(installedSoftware);
    const javaLabel = selectedVersion ? getRequiredJavaLabel(selectedVersion) : null;

    const goNext = () => setStep((current) => Math.min(current + 1, STEPS.length - 1));
    const goBack = () => setStep((current) => Math.max(current - 1, 0));

    const selectType = (id: string) => {
        setSelectedType(id);
        setEnvironment('stable');
        setSuccess(null);
        setError(null);
        setManualStep(false);
        setCustomFile(null);
        setUploadProgress(null);
    };

    const resetToExisting = () => {
        if (!installedSoftware) return;
        selectType(installedSoftware === 'snapshot' ? 'vanilla' : installedSoftware);
        if (installedSoftware === 'snapshot') setEnvironment('snapshot');
    };

    return (
        <Modal
            visible={visible}
            onDismissed={handleDismiss}
            dismissable={!installing}
            closeOnBackground={!installing}
            closeOnEscape={!installing}
            wide
        >
            <div className={'relative flex h-[32rem] max-h-[80vh]'}>
                <SpinnerOverlay visible={installing} />

                <div className={'w-44 sm:w-52 flex-shrink-0 border-r border-realm-border/50 p-5'}>
                    <h2 className={'text-base font-semibold text-neutral-100 m-0 mb-5'}>Change Version</h2>
                    <div>
                        {STEPS.map((label, index) => {
                            const active = index === step;
                            const done = index < step;

                            return (
                                <div key={label} className={'flex items-start gap-3'}>
                                    <div className={'flex flex-col items-center flex-shrink-0'}>
                                        <div
                                            className={classNames(
                                                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0',
                                                active || done
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-transparent border border-realm-border text-neutral-500'
                                            )}
                                        >
                                            {index + 1}
                                        </div>
                                        {index < STEPS.length - 1 && (
                                            <div
                                                className={classNames(
                                                    'w-px flex-1 my-1',
                                                    done ? 'bg-blue-500' : 'bg-realm-border'
                                                )}
                                                style={{ minHeight: '1.25rem' }}
                                            />
                                        )}
                                    </div>
                                    <span
                                        className={classNames(
                                            'text-sm mt-0.5 pb-6',
                                            active ? 'text-neutral-100 font-semibold' : 'text-neutral-500'
                                        )}
                                    >
                                        {label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className={'flex-1 flex flex-col min-h-0'}>
                    <div className={'flex-1 overflow-y-auto p-6'}>
                        <p className={'text-xs font-semibold text-blue-400 uppercase tracking-wide mb-1'}>
                            Step {step + 1} of {STEPS.length}
                        </p>

                        {step === 0 && (
                            <>
                                <h3 className={'text-xl font-semibold text-neutral-100 m-0 mb-1'}>
                                    Choose a Server Type
                                </h3>
                                <p className={'text-sm text-neutral-400 mb-5'}>
                                    What server type would you like to change your world to?
                                </p>

                                {existingType && (
                                    <div className={'flex items-center justify-between mb-3'}>
                                        <p className={'text-sm text-neutral-400 m-0'}>
                                            Existing server type: <strong className={'text-neutral-200'}>{existingType.name}</strong>
                                        </p>
                                        <button
                                            type={'button'}
                                            onClick={resetToExisting}
                                            className={'bg-transparent border-0 p-0 text-xs font-medium text-blue-600 hover:text-blue-500 cursor-pointer'}
                                        >
                                            Reset
                                        </button>
                                    </div>
                                )}

                                <div className={'space-y-2'}>
                                    {SERVER_SOFTWARE.filter((entry) => entry.id !== 'snapshot').map((entry) => {
                                        const selected = entry.id === selectedType;

                                        return (
                                            <label
                                                key={entry.id}
                                                className={classNames(
                                                    'flex items-center gap-3 px-3 py-3 rounded-md border cursor-pointer transition-colors duration-150',
                                                    selected
                                                        ? 'border-blue-500/50 bg-blue-500/5'
                                                        : 'border-realm-border/60 hover:border-realm-border'
                                                )}
                                            >
                                                <img
                                                    src={entry.icon}
                                                    alt={entry.name}
                                                    className={'w-9 h-9 rounded-md object-cover flex-shrink-0 bg-realm-card'}
                                                />
                                                <div className={'min-w-0 flex-1'}>
                                                    <p className={'text-sm font-semibold text-neutral-100 m-0'}>{entry.name}</p>
                                                    <p className={'text-xs text-neutral-500 m-0 mt-0.5'}>{entry.description}</p>
                                                </div>
                                                <input
                                                    type={'radio'}
                                                    checked={selected}
                                                    onChange={() => selectType(entry.id)}
                                                    className={'w-4 h-4 flex-shrink-0 accent-blue-500'}
                                                />
                                            </label>
                                        );
                                    })}

                                    <label
                                        className={classNames(
                                            'flex items-center gap-3 px-3 py-3 rounded-md border cursor-pointer transition-colors duration-150',
                                            selectedType === CUSTOM_ID
                                                ? 'border-blue-500/50 bg-blue-500/5'
                                                : 'border-realm-border/60 hover:border-realm-border'
                                        )}
                                    >
                                        <div
                                            className={
                                                'w-9 h-9 rounded-md flex-shrink-0 bg-realm-card border border-realm-border/50 flex items-center justify-center'
                                            }
                                        >
                                            <UploadIcon className={'w-5 h-5 text-neutral-400'} />
                                        </div>
                                        <div className={'min-w-0 flex-1'}>
                                            <p className={'text-sm font-semibold text-neutral-100 m-0'}>Custom Jar</p>
                                            <p className={'text-xs text-neutral-500 m-0 mt-0.5'}>
                                                Upload your own server jar instead of downloading one.
                                            </p>
                                        </div>
                                        <input
                                            type={'radio'}
                                            checked={selectedType === CUSTOM_ID}
                                            onChange={() => selectType(CUSTOM_ID)}
                                            className={'w-4 h-4 flex-shrink-0 accent-blue-500'}
                                        />
                                    </label>
                                </div>
                            </>
                        )}

                        {step === 1 && selectedType === CUSTOM_ID && (
                            <>
                                <h3 className={'text-xl font-semibold text-neutral-100 m-0 mb-1'}>Upload a Jar</h3>
                                <p className={'text-sm text-neutral-400 mb-5'}>
                                    Choose the server jar file you want to run.
                                </p>

                                {error && (
                                    <div
                                        className={'mb-4 p-3 rounded-md text-sm'}
                                        style={{ backgroundColor: '#1c0a0a', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}
                                    >
                                        {error}
                                    </div>
                                )}

                                <input
                                    ref={fileInputRef}
                                    type={'file'}
                                    accept={'.jar'}
                                    className={'hidden'}
                                    onChange={(e) => {
                                        setCustomFile(e.currentTarget.files?.[0] ?? null);
                                        setSuccess(null);
                                        setUploadProgress(null);
                                    }}
                                />

                                <button
                                    type={'button'}
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={installing}
                                    className={
                                        'w-full flex flex-col items-center justify-center gap-2 py-8 rounded-md border border-dashed border-realm-border text-center cursor-pointer bg-transparent hover:border-neutral-500 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed'
                                    }
                                >
                                    <UploadIcon className={'w-6 h-6 text-neutral-500'} />
                                    <span className={'text-sm text-neutral-300'}>
                                        {customFile ? customFile.name : 'Click to choose a .jar file'}
                                    </span>
                                    {customFile && (
                                        <span className={'text-xs text-neutral-500'}>
                                            {(customFile.size / 1024 / 1024).toFixed(1)} MB
                                        </span>
                                    )}
                                </button>

                                {uploadProgress !== null && (
                                    <div className={'mt-4'}>
                                        <div className={'h-1.5 rounded-full overflow-hidden bg-realm-surface'}>
                                            <div
                                                className={'h-full rounded-full bg-blue-500 transition-all duration-300'}
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                        <p className={'text-xs text-neutral-500 mt-1.5 mb-0'}>
                                            {success ? 'Upload complete.' : `Uploading… ${uploadProgress}%`}
                                        </p>
                                    </div>
                                )}

                                <label
                                    className={classNames(
                                        'flex items-start gap-3 px-3 py-3 mt-5 rounded-md border cursor-pointer transition-colors duration-150',
                                        wipeServer
                                            ? 'border-blue-500/50 bg-blue-500/5'
                                            : 'border-realm-border/60 hover:border-realm-border'
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
                                            Delete server files including worlds, plugins, mods, config, and libraries
                                            before installing this jar.
                                        </span>
                                    </span>
                                </label>

                                {!success && (
                                    <div className={'mt-5'}>
                                        <Can action={'file.create'}>
                                            <Button onClick={handleCustomUpload} disabled={installing || !customFile}>
                                                {installing ? 'Uploading...' : 'Upload & Install'}
                                            </Button>
                                        </Can>
                                    </div>
                                )}
                            </>
                        )}

                        {step === 1 && selectedType !== CUSTOM_ID && (
                            <>
                                <h3 className={'text-xl font-semibold text-neutral-100 m-0 mb-1'}>
                                    Choose a {activeType?.name ?? 'Server'} Version
                                </h3>
                                <p className={'text-sm text-neutral-400 mb-5'}>
                                    What version would you like to change your world to?
                                </p>

                                <div
                                    className={
                                        'flex items-start gap-2.5 px-3 py-2.5 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-300 text-sm mb-5'
                                    }
                                >
                                    Once a world has been upgraded to a higher version, it cannot be downgraded.
                                </div>

                                {error && (
                                    <div
                                        className={'mb-4 p-3 rounded-md text-sm'}
                                        style={{ backgroundColor: '#1c0a0a', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}
                                    >
                                        {error}
                                    </div>
                                )}

                                {isVanillaFamily && (
                                    <div className={'mb-4'}>
                                        {installedSoftware === 'vanilla' || installedSoftware === 'snapshot' ? (
                                            <p className={'text-sm text-neutral-400 mb-1.5'}>
                                                Existing server environment:{' '}
                                                <strong className={'text-neutral-200'}>
                                                    {installedSoftware === 'snapshot' ? 'Vanilla Snapshot' : 'Vanilla Stable'}
                                                </strong>
                                            </p>
                                        ) : (
                                            <p className={'text-sm text-neutral-400 mb-1.5'}>Environment</p>
                                        )}
                                        <SearchableSelect
                                            value={environment}
                                            options={ENVIRONMENT_OPTIONS}
                                            onChange={(value) => setEnvironment(value)}
                                        />
                                    </div>
                                )}

                                {(installedSoftware === selectedType || (isVanillaFamily && installedSoftware === 'snapshot')) &&
                                    installedVersion && (
                                        <p className={'text-sm text-neutral-400 mb-1.5'}>
                                            Existing server version:{' '}
                                            <strong className={'text-neutral-200'}>{installedVersion}</strong>
                                        </p>
                                    )}

                                <InputSpinner visible={loadingVersions}>
                                    <SearchableSelect
                                        value={selectedVersion}
                                        options={versions}
                                        disabled={loadingVersions || versions.length === 0}
                                        placeholder={loadingVersions ? 'Loading versions...' : 'No versions available'}
                                        onChange={(value) => setSelectedVersion(value)}
                                    />
                                </InputSpinner>
                                {javaLabel && (
                                    <p className={'text-xs text-neutral-500 mt-1.5 mb-0'}>
                                        Requires <span className={'text-neutral-400'}>{javaLabel}</span> — will be set
                                        automatically after install.
                                    </p>
                                )}

                                <label
                                    className={classNames(
                                        'flex items-start gap-3 px-3 py-3 mt-5 rounded-md border cursor-pointer transition-colors duration-150',
                                        wipeServer
                                            ? 'border-blue-500/50 bg-blue-500/5'
                                            : 'border-realm-border/60 hover:border-realm-border'
                                    )}
                                >
                                    <input
                                        type={'checkbox'}
                                        checked={wipeServer}
                                        onChange={(e) => setWipeServer(e.currentTarget.checked)}
                                        className={'w-4 h-4 mt-0.5 flex-shrink-0 accent-blue-500 rounded'}
                                    />
                                    <span>
                                        <span className={'text-sm text-neutral-200 block'}>Wipe server</span>
                                        <span className={'text-xs text-neutral-500 block mt-1'}>
                                            Delete server files including worlds, plugins, mods, config, and libraries
                                            before installing {activeType?.name ?? 'the new version'}.
                                        </span>
                                    </span>
                                </label>
                            </>
                        )}

                        {step === 2 && (
                            <>
                                <h3 className={'text-xl font-semibold text-neutral-100 m-0 mb-1'}>Review Information</h3>
                                <p className={'text-sm text-neutral-400 mb-5'}>Make sure everything looks good!</p>

                                {!success && (
                                    <div
                                        className={
                                            'flex items-start gap-2.5 px-3 py-2.5 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-300 text-sm mb-5'
                                        }
                                    >
                                        Changing the server type or version of an existing server may cause
                                        corruption. We'd highly recommend creating a backup beforehand.
                                    </div>
                                )}

                                {success && (
                                    <div
                                        className={'mb-4 p-3 rounded-md text-sm'}
                                        style={{ backgroundColor: '#0d2f2a', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399' }}
                                    >
                                        {success}
                                    </div>
                                )}

                                {manualStep && (
                                    <div
                                        className={'mb-4 p-3 rounded-md text-sm'}
                                        style={{ backgroundColor: '#2a2110', border: '1px solid rgba(245,158,11,0.25)', color: '#fbbf24' }}
                                    >
                                        Forge only ships an installer, and we can't run it for you automatically yet.
                                        Start your server once — most Forge eggs run the installer on first boot — or
                                        run <code>java -jar forge-installer.jar --installServer</code> via the console
                                        before starting normally.
                                    </div>
                                )}

                                {error && (
                                    <div
                                        className={'mb-4 p-3 rounded-md text-sm'}
                                        style={{ backgroundColor: '#1c0a0a', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}
                                    >
                                        {error}
                                    </div>
                                )}

                                {!success && (
                                    <>
                                        <div className={'flex items-center gap-3 px-4 py-4 rounded-md bg-realm-surface border border-realm-border/60'}>
                                            {activeType && (
                                                <img
                                                    src={activeType.icon}
                                                    alt={activeType.name}
                                                    className={'w-12 h-12 rounded-md object-cover flex-shrink-0 border border-realm-border/50 bg-realm-card'}
                                                />
                                            )}
                                            <div className={'min-w-0 flex-1'}>
                                                <p className={'text-xs font-semibold text-neutral-500 uppercase tracking-wide m-0'}>
                                                    Selected Server Type
                                                </p>
                                                <p className={'text-base font-semibold text-neutral-100 m-0 mt-0.5'}>
                                                    {activeType?.name}
                                                </p>
                                                <p className={'text-sm text-neutral-400 m-0 mt-0.5'}>
                                                    {activeType?.name} {selectedVersion}
                                                    {isVanillaFamily && environment === 'snapshot' ? ' · Snapshot' : ''}
                                                </p>
                                            </div>
                                        </div>

                                        {(wipeServer || javaLabel) && (
                                            <div className={'mt-3 rounded-md border border-realm-border/60 divide-y divide-realm-border/50'}>
                                                <div className={'flex items-center justify-between px-4 py-3'}>
                                                    <span className={'text-sm text-neutral-500'}>Wipe server</span>
                                                    <span className={'text-sm text-neutral-200'}>{wipeServer ? 'Yes' : 'No'}</span>
                                                </div>
                                                {javaLabel && (
                                                    <div className={'flex items-center justify-between px-4 py-3'}>
                                                        <span className={'text-sm text-neutral-500'}>Java runtime</span>
                                                        <span className={'text-sm text-neutral-200'}>{javaLabel}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </div>

                    <div className={'flex items-center justify-between gap-3 px-6 py-4 border-t border-realm-border/50'}>
                        <Button isSecondary onClick={step === 0 ? handleDismiss : goBack} disabled={installing}>
                            {step === 0 ? 'Cancel' : 'Back'}
                        </Button>

                        {step < 2 ? (
                            <Button
                                onClick={goNext}
                                disabled={
                                    step === 1 &&
                                    (selectedType === CUSTOM_ID ? !success : loadingVersions || !selectedVersion)
                                }
                            >
                                Next Step
                            </Button>
                        ) : success ? (
                            <Button onClick={handleDismiss}>Close</Button>
                        ) : (
                            <Can action={'file.create'}>
                                <Button onClick={handleInstall} disabled={installing || !selectedVersion}>
                                    {installing ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </Can>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

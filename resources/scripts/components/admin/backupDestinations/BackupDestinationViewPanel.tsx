import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { useHistory, useParams } from 'react-router-dom';
import { Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import { Dialog } from '@/components/elements/dialog';
import useFlash from '@/plugins/useFlash';
import { deleteBackupDestination, getBackupDestination, updateBackupDestination } from '@/api/admin/backupDestinations';
import { fieldClass } from '@/components/admin/settings/fieldClass';
import { SettingRow, SettingsFooter, SettingsSection } from '@/components/admin/settings/settingsLayout';
import { adminBasePath } from '@/routers/adminRoutes';

export default () => {
    const { id } = useParams<{ id: string }>();
    const destinationId = Number(id);
    const history = useHistory();
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data, error, isValidating, mutate } = useSWR(
        Number.isFinite(destinationId) ? `admin-backup-destination-${destinationId}` : null,
        () => getBackupDestination(destinationId)
    );

    const [name, setName] = useState('');
    const [bucket, setBucket] = useState('');
    const [region, setRegion] = useState('');
    const [accessKey, setAccessKey] = useState('');
    const [secretKey, setSecretKey] = useState('');
    const [endpoint, setEndpoint] = useState('');
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (data?.backup_destination) {
            setName(data.backup_destination.name);
            setBucket(data.backup_destination.bucket ?? '');
            setRegion(data.backup_destination.region ?? '');
            setAccessKey(data.backup_destination.access_key ?? '');
            setEndpoint(data.backup_destination.endpoint ?? '');
        }
    }, [data]);

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-backup-destinations', error });
        } else {
            clearFlashes('admin-backup-destinations');
        }
    }, [error]);

    const onSave = (event: React.FormEvent) => {
        event.preventDefault();

        setSaving(true);
        clearFlashes('admin-backup-destinations');

        updateBackupDestination(destinationId, {
            name,
            bucket,
            region,
            access_key: accessKey,
            // Only send the secret if the admin actually typed a new one — leaving it blank keeps the existing secret.
            ...(secretKey ? { secret_key: secretKey } : {}),
            endpoint,
        })
            .then((response) => {
                addFlash({
                    key: 'admin-backup-destinations',
                    type: 'success',
                    title: 'Backup destination saved',
                    message: response.message,
                });
                setSecretKey('');
                mutate();
            })
            .catch((submitError) => {
                clearAndAddHttpError({ key: 'admin-backup-destinations', error: submitError });
            })
            .finally(() => setSaving(false));
    };

    const onDelete = () => {
        setDeleting(true);
        clearFlashes('admin-backup-destinations');

        deleteBackupDestination(destinationId)
            .then((response) => {
                addFlash({
                    key: 'admin-backup-destinations',
                    type: 'success',
                    title: 'Backup destination deleted',
                    message: response.message,
                });
                history.push(`${adminBasePath}/backup-destinations`);
            })
            .catch((submitError) => {
                clearAndAddHttpError({ key: 'admin-backup-destinations', error: submitError });
                setConfirmDelete(false);
            })
            .finally(() => setDeleting(false));
    };

    if (!data && isValidating) {
        return <Spinner centered />;
    }

    if (!data) {
        return <p className={'text-sm text-muted-foreground'}>Unable to load backup destination.</p>;
    }

    return (
        <>
            <Dialog.Confirm
                appearance={'admin'}
                title={'Delete backup destination'}
                confirm={'Delete'}
                open={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirmed={onDelete}
            >
                Locations using this destination will fall back to the global default. Existing backups already
                stored here are not affected.
            </Dialog.Confirm>

            <form onSubmit={onSave} className={'space-y-4'}>
                <SettingsSection title={'Destination details'} description={'S3-compatible storage used for backups.'}>
                    <SettingRow label={'Name'} htmlFor={'destination-name-edit'} description={'e.g. "NA — Wasabi" or "EU — Backblaze".'}>
                        <input
                            id={'destination-name-edit'}
                            className={fieldClass}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </SettingRow>
                    <SettingRow label={'Bucket'} htmlFor={'destination-bucket-edit'} description={'The S3 bucket backups will be stored in.'}>
                        <input
                            id={'destination-bucket-edit'}
                            className={fieldClass}
                            value={bucket}
                            onChange={(e) => setBucket(e.target.value)}
                            required
                        />
                    </SettingRow>
                    <SettingRow label={'Region'} htmlFor={'destination-region-edit'} description={'e.g. us-east-1.'}>
                        <input
                            id={'destination-region-edit'}
                            className={fieldClass}
                            value={region}
                            onChange={(e) => setRegion(e.target.value)}
                        />
                    </SettingRow>
                    <SettingRow label={'Access key'} htmlFor={'destination-access-key-edit'} description={'S3 access key ID.'}>
                        <input
                            id={'destination-access-key-edit'}
                            className={fieldClass}
                            value={accessKey}
                            onChange={(e) => setAccessKey(e.target.value)}
                            required
                            autoComplete={'off'}
                        />
                    </SettingRow>
                    <SettingRow
                        label={'Secret key'}
                        htmlFor={'destination-secret-key-edit'}
                        description={'Leave blank to keep the currently stored secret.'}
                    >
                        <input
                            id={'destination-secret-key-edit'}
                            type={'password'}
                            className={fieldClass}
                            value={secretKey}
                            onChange={(e) => setSecretKey(e.target.value)}
                            autoComplete={'new-password'}
                            placeholder={'••••••••'}
                        />
                    </SettingRow>
                    <SettingRow label={'Endpoint'} htmlFor={'destination-endpoint-edit'} description={'Optional. Leave blank to use AWS S3.'}>
                        <input
                            id={'destination-endpoint-edit'}
                            className={fieldClass}
                            value={endpoint}
                            onChange={(e) => setEndpoint(e.target.value)}
                        />
                    </SettingRow>
                </SettingsSection>

                <SettingsFooter>
                    <Button
                        type={'button'}
                        variant={'outline'}
                        className={'mr-auto border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive'}
                        disabled={deleting || saving}
                        onClick={() => setConfirmDelete(true)}
                    >
                        <Trash2 className={'mr-2 h-4 w-4'} />
                        Delete
                    </Button>
                    <Button type={'submit'} disabled={saving || deleting}>
                        <Save className={'mr-2 h-4 w-4'} />
                        {saving ? 'Saving...' : 'Save changes'}
                    </Button>
                </SettingsFooter>
            </form>
        </>
    );
};

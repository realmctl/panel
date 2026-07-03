import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/elements/dialog';
import useFlash from '@/plugins/useFlash';
import { createBackupDestination } from '@/api/admin/backupDestinations';
import { fieldClass } from '@/components/admin/settings/fieldClass';
import { SettingRow } from '@/components/admin/settings/settingsLayout';

export default ({
    open,
    onClose,
    onCreated,
}: {
    open: boolean;
    onClose: () => void;
    onCreated: (id: number) => void;
}) => {
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const [name, setName] = useState('');
    const [bucket, setBucket] = useState('');
    const [region, setRegion] = useState('');
    const [accessKey, setAccessKey] = useState('');
    const [secretKey, setSecretKey] = useState('');
    const [endpoint, setEndpoint] = useState('');
    const [saving, setSaving] = useState(false);

    const reset = () => {
        setName('');
        setBucket('');
        setRegion('');
        setAccessKey('');
        setSecretKey('');
        setEndpoint('');
    };

    const handleClose = () => {
        if (saving) return;
        reset();
        onClose();
    };

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        setSaving(true);
        clearFlashes('admin-backup-destinations');

        createBackupDestination({
            name,
            adapter: 's3',
            bucket,
            region,
            access_key: accessKey,
            secret_key: secretKey,
            endpoint,
        })
            .then((response) => {
                addFlash({
                    key: 'admin-backup-destinations',
                    type: 'success',
                    title: 'Backup destination created',
                    message: response.message,
                });
                reset();
                onClose();
                onCreated(response.backup_destination.id);
            })
            .catch((submitError) => {
                clearAndAddHttpError({ key: 'admin-backup-destinations', error: submitError });
            })
            .finally(() => setSaving(false));
    };

    return (
        <Dialog appearance={'admin'} open={open} onClose={handleClose} title={'Create backup destination'}>
            <form id={'create-backup-destination-form'} onSubmit={onSubmit} className={'space-y-4'}>
                <SettingRow label={'Name'} htmlFor={'destination-name'} description={'e.g. "NA — Wasabi" or "EU — Backblaze".'}>
                    <input
                        id={'destination-name'}
                        className={fieldClass}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        autoFocus
                    />
                </SettingRow>
                <SettingRow label={'Bucket'} htmlFor={'destination-bucket'} description={'The S3 bucket backups will be stored in.'}>
                    <input
                        id={'destination-bucket'}
                        className={fieldClass}
                        value={bucket}
                        onChange={(e) => setBucket(e.target.value)}
                        required
                    />
                </SettingRow>
                <SettingRow label={'Region'} htmlFor={'destination-region'} description={'e.g. us-east-1.'}>
                    <input
                        id={'destination-region'}
                        className={fieldClass}
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                    />
                </SettingRow>
                <SettingRow label={'Access key'} htmlFor={'destination-access-key'} description={'S3 access key ID.'}>
                    <input
                        id={'destination-access-key'}
                        className={fieldClass}
                        value={accessKey}
                        onChange={(e) => setAccessKey(e.target.value)}
                        required
                        autoComplete={'off'}
                    />
                </SettingRow>
                <SettingRow label={'Secret key'} htmlFor={'destination-secret-key'} description={'S3 secret access key. Stored encrypted, never shown again.'}>
                    <input
                        id={'destination-secret-key'}
                        type={'password'}
                        className={fieldClass}
                        value={secretKey}
                        onChange={(e) => setSecretKey(e.target.value)}
                        required
                        autoComplete={'new-password'}
                    />
                </SettingRow>
                <SettingRow label={'Endpoint'} htmlFor={'destination-endpoint'} description={'Optional. Leave blank to use AWS S3.'}>
                    <input
                        id={'destination-endpoint'}
                        className={fieldClass}
                        value={endpoint}
                        onChange={(e) => setEndpoint(e.target.value)}
                    />
                </SettingRow>
            </form>
            <Dialog.Footer>
                <Button type={'button'} variant={'outline'} disabled={saving} onClick={handleClose}>
                    Cancel
                </Button>
                <Button type={'submit'} form={'create-backup-destination-form'} disabled={saving}>
                    <Plus className={'mr-2 h-4 w-4'} />
                    {saving ? 'Creating...' : 'Create destination'}
                </Button>
            </Dialog.Footer>
        </Dialog>
    );
};

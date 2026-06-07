import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useHistory } from 'react-router-dom';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import CopyOnClick from '@/components/elements/CopyOnClick';
import { Dialog } from '@/components/elements/dialog';
import CodeBlock from '@/components/admin-preview/CodeBlock';
import useFlash from '@/plugins/useFlash';
import {
    createApplicationApiKey,
    formatResourceLabel,
    getApplicationApiCreateMeta,
} from '@/api/admin/applicationApi';
import { fieldClass, selectClass } from '@/components/admin-preview/settings/fieldClass';
import { SettingRow, SettingsFooter, SettingsSection } from '@/components/admin-preview/settings/settingsLayout';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';

export default () => {
    const history = useHistory();
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data, error, isValidating } = useSWR('admin-application-api-create', getApplicationApiCreateMeta);
    const [memo, setMemo] = useState('');
    const [permissions, setPermissions] = useState<Record<string, number>>({});
    const [saving, setSaving] = useState(false);
    const [secretToken, setSecretToken] = useState('');

    useEffect(() => {
        if (data?.resources && data.permissions) {
            setPermissions(
                Object.fromEntries(data.resources.map((resource) => [`r_${resource}`, data.permissions.none]))
            );
        }
    }, [data]);

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-api', error });
        } else {
            clearFlashes('admin-api');
        }
    }, [error]);

    const setPermission = (resource: string, value: number) => {
        setPermissions((current) => ({ ...current, [`r_${resource}`]: value }));
    };

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!data) return;

        setSaving(true);
        clearFlashes('admin-api');

        createApplicationApiKey(memo, permissions)
            .then((response) => {
                setSecretToken(response.secret_token);
                addFlash({
                    key: 'admin-api',
                    type: 'success',
                    title: 'API key created',
                    message: response.message,
                });
            })
            .catch((submitError) => {
                clearAndAddHttpError({ key: 'admin-api', error: submitError });
            })
            .finally(() => setSaving(false));
    };

    const onDismissSecret = () => {
        setSecretToken('');
        history.push(`${adminPreviewBasePath}/api`);
    };

    if (!data && isValidating) {
        return <Spinner centered />;
    }

    if (!data) {
        return <p className="text-sm text-muted-foreground">Unable to load API key form.</p>;
    }

    return (
        <>
            <Dialog
                appearance="admin"
                panelClassName="max-w-xl"
                open={!!secretToken}
                onClose={onDismissSecret}
                title="Your API key"
                preventExternalClose
                hideCloseIcon
            >
                <p className="text-sm text-muted-foreground">
                    Store this key somewhere safe. It will not be shown again in full.
                </p>
                {secretToken && (
                    <CopyOnClick text={secretToken}>
                        <CodeBlock value={secretToken} language="plaintext" className="mt-4" maxHeight="6rem" />
                    </CopyOnClick>
                )}
                <Dialog.Footer>
                    <Button type="button" onClick={onDismissSecret}>
                        Close
                    </Button>
                </Dialog.Footer>
            </Dialog>

            <form onSubmit={onSubmit} className="space-y-4">
                <SettingsSection
                    title="Details"
                    description="Describe what this key is used for. Permissions cannot be changed after creation."
                >
                    <SettingRow
                        label="Description"
                        htmlFor="api-key-memo"
                        description="A short label to identify this key later."
                    >
                        <input
                            id="api-key-memo"
                            className={fieldClass}
                            value={memo}
                            onChange={(e) => setMemo(e.target.value)}
                            placeholder="Billing integration"
                            required
                        />
                    </SettingRow>
                </SettingsSection>

                <SettingsSection
                    title="Permissions"
                    description="Choose what each resource can access with this key."
                >
                    {data.resources.map((resource) => (
                        <SettingRow
                            key={resource}
                            label={formatResourceLabel(resource)}
                            htmlFor={`permission-${resource}`}
                            description={`Access level for ${formatResourceLabel(resource).toLowerCase()}.`}
                        >
                            <select
                                id={`permission-${resource}`}
                                className={selectClass}
                                value={permissions[`r_${resource}`] ?? data.permissions.none}
                                onChange={(e) => setPermission(resource, Number(e.target.value))}
                            >
                                <option value={data.permissions.none}>None</option>
                                <option value={data.permissions.read}>Read</option>
                                <option value={data.permissions.readWrite}>Read &amp; write</option>
                            </select>
                        </SettingRow>
                    ))}
                </SettingsSection>

                <SettingsFooter>
                    <Link to={`${adminPreviewBasePath}/api`} className="no-underline">
                        <Button type="button" variant="outline">
                            Cancel
                        </Button>
                    </Link>
                    <Button type="submit" disabled={saving}>
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? 'Creating...' : 'Create key'}
                    </Button>
                </SettingsFooter>
            </form>
        </>
    );
};

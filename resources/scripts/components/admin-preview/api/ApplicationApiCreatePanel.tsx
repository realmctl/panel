import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useHistory } from 'react-router-dom';
import { Info, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
import { fieldClass } from '@/components/admin-preview/settings/fieldClass';
import {
    tableBodyCellClass,
    tableBodyRowClass,
    tableClass,
    tableHeadCellClass,
    tableHeadRowClass,
    tableWrapClass,
} from '@/components/admin-preview/adminTable';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';
import { cn } from '@/lib/utils';

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
                Object.fromEntries(data.resources.map((resource) => [ `r_${resource}`, data.permissions.none ]))
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
                    The API key you requested is shown below. Store it in a safe location — it will not be shown again
                    in full unless you created it.
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

            <form onSubmit={onSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <div className="rounded-lg border border-border bg-card">
                        <div className="border-b border-border px-5 py-4">
                            <h2 className="text-base font-semibold text-foreground">Permissions</h2>
                        </div>
                        <div className={tableWrapClass}>
                            <table className={tableClass}>
                                <thead>
                                    <tr className={tableHeadRowClass}>
                                        <th className={cn(tableHeadCellClass, 'w-[40%]')}>Resource</th>
                                        <th className={cn(tableHeadCellClass, 'w-28 text-center')}>Read</th>
                                        <th className={cn(tableHeadCellClass, 'w-32 text-center')}>Read &amp; write</th>
                                        <th className={cn(tableHeadCellClass, 'w-24 text-center')}>None</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.resources.map((resource) => (
                                        <tr key={resource} className={tableBodyRowClass}>
                                            <td className={cn(tableBodyCellClass, 'font-medium text-foreground')}>
                                                {formatResourceLabel(resource)}
                                            </td>
                                            <td className={cn(tableBodyCellClass, 'text-center')}>
                                                <label className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md hover:bg-muted/60">
                                                    <input
                                                        type="radio"
                                                        name={`r_${resource}`}
                                                        className="h-4 w-4 border-border text-primary"
                                                        checked={permissions[`r_${resource}`] === data.permissions.read}
                                                        onChange={() => setPermission(resource, data.permissions.read)}
                                                    />
                                                </label>
                                            </td>
                                            <td className={cn(tableBodyCellClass, 'text-center')}>
                                                <label className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md hover:bg-muted/60">
                                                    <input
                                                        type="radio"
                                                        name={`r_${resource}`}
                                                        className="h-4 w-4 border-border text-primary"
                                                        checked={
                                                            permissions[`r_${resource}`] === data.permissions.readWrite
                                                        }
                                                        onChange={() =>
                                                            setPermission(resource, data.permissions.readWrite)
                                                        }
                                                    />
                                                </label>
                                            </td>
                                            <td className={cn(tableBodyCellClass, 'text-center')}>
                                                <label className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md hover:bg-muted/60">
                                                    <input
                                                        type="radio"
                                                        name={`r_${resource}`}
                                                        className="h-4 w-4 border-border text-primary"
                                                        checked={permissions[`r_${resource}`] === data.permissions.none}
                                                        onChange={() => setPermission(resource, data.permissions.none)}
                                                    />
                                                </label>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div>
                    <div className="rounded-lg border border-border bg-card">
                        <div className="border-b border-border px-5 py-4">
                            <h2 className="text-base font-semibold text-foreground">Details</h2>
                        </div>
                        <div className="space-y-5 p-5">
                            <div className="space-y-2">
                                <Label htmlFor="api-key-memo">Description</Label>
                                <input
                                    id="api-key-memo"
                                    className={fieldClass}
                                    value={memo}
                                    onChange={(e) => setMemo(e.target.value)}
                                    placeholder="What is this key for?"
                                    required
                                />
                            </div>
                            <div className="flex gap-3 rounded-md border border-primary/30 bg-primary/10 p-4 text-sm text-foreground">
                                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                <p>
                                    Once created, you cannot edit permissions. You will need to create a new key if
                                    changes are needed.
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
                            <Link to={`${adminPreviewBasePath}/api`} className="no-underline">
                                <Button type="button" variant="outline">
                                    Cancel
                                </Button>
                            </Link>
                            <Button type="submit" disabled={saving}>
                                <Save className="mr-2 h-4 w-4" />
                                {saving ? 'Creating...' : 'Create credentials'}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </>
    );
};

import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { useHistory, useParams } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import { Dialog } from '@/components/elements/dialog';
import useFlash from '@/plugins/useFlash';
import { deleteServer, getServer } from '@/api/admin/servers';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';

export default () => {
    const { id } = useParams<{ id: string }>();
    const serverId = Number(id);
    const history = useHistory();
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data, error, isValidating } = useSWR(
        Number.isFinite(serverId) ? `admin-server-${serverId}` : null,
        () => getServer(serverId)
    );
    const [confirmSafe, setConfirmSafe] = useState(false);
    const [confirmForce, setConfirmForce] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-servers', error });
        } else {
            clearFlashes('admin-servers');
        }
    }, [error, clearAndAddHttpError, clearFlashes]);

    const onDelete = (force: boolean) => {
        setDeleting(true);
        clearFlashes('admin-servers');

        deleteServer(serverId, force)
            .then((response) => {
                addFlash({
                    key: 'admin-servers',
                    type: 'success',
                    title: 'Server deleted',
                    message: response.message,
                });
                history.push(`${adminPreviewBasePath}/servers`);
            })
            .catch((submitError) => {
                clearAndAddHttpError({ key: 'admin-servers', error: submitError });
                setConfirmSafe(false);
                setConfirmForce(false);
            })
            .finally(() => setDeleting(false));
    };

    if (!data && isValidating) {
        return <Spinner centered />;
    }

    if (!data) {
        return <p className="text-sm text-muted-foreground">Unable to load server.</p>;
    }

    return (
        <>
            <Dialog.Confirm
                appearance="admin"
                title="Safely delete server"
                confirm="Delete"
                open={confirmSafe}
                onClose={() => setConfirmSafe(false)}
                onConfirmed={() => onDelete(false)}
            >
                Are you sure you want to delete {data.server.name}? This action is irreversible.
            </Dialog.Confirm>

            <Dialog.Confirm
                appearance="admin"
                title="Force delete server"
                confirm="Force delete"
                open={confirmForce}
                onClose={() => setConfirmForce(false)}
                onConfirmed={() => onDelete(true)}
            >
                Force delete {data.server.name}? This may leave dangling files on the daemon if it reports an error.
            </Dialog.Confirm>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-lg border border-border bg-card">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-base font-semibold text-foreground">Safely delete server</h2>
                    </div>
                    <div className="space-y-4 p-5">
                        <p className="text-sm text-muted-foreground">
                            Attempt to delete the server from both the panel and daemon. If either reports an error,
                            the action will be cancelled.
                        </p>
                        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                            Deleting a server is irreversible. All server data will be removed.
                        </div>
                    </div>
                    <div className="border-t border-border px-5 py-4">
                        <Button
                            type="button"
                            variant="destructive"
                            className="w-full"
                            disabled={deleting}
                            onClick={() => setConfirmSafe(true)}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Safely delete this server
                        </Button>
                    </div>
                </div>

                <div className="rounded-lg border border-border bg-card">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-base font-semibold text-foreground">Force delete server</h2>
                    </div>
                    <div className="space-y-4 p-5">
                        <p className="text-sm text-muted-foreground">
                            Delete the server even if the daemon does not respond or reports an error.
                        </p>
                        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                            This method may leave dangling files on your daemon.
                        </div>
                    </div>
                    <div className="border-t border-border px-5 py-4">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
                            disabled={deleting}
                            onClick={() => setConfirmForce(true)}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Forcibly delete this server
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
};

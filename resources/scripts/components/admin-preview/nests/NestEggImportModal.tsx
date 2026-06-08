import React, { useEffect, useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/elements/dialog';
import useFlash from '@/plugins/useFlash';
import { importEgg, NestSummary } from '@/api/admin/nests';
import { fieldClass } from '@/components/admin-preview/settings/fieldClass';
import { SettingRow } from '@/components/admin-preview/settings/settingsLayout';

export default ({
    open,
    nests,
    onClose,
    onImported,
}: {
    open: boolean;
    nests: NestSummary[];
    onClose: () => void;
    onImported: (eggId: number) => void;
}) => {
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const [nestId, setNestId] = useState<number | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);

    useEffect(() => {
        if (open && nests[0] && nestId === null) {
            setNestId(nests[0].id);
        }
    }, [open, nests, nestId]);

    const reset = () => {
        setNestId(nests[0]?.id ?? null);
        setFile(null);
    };

    const handleClose = () => {
        if (importing) return;
        reset();
        onClose();
    };

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!file || nestId === null) return;

        setImporting(true);
        clearFlashes('admin-nests');

        importEgg(file, nestId)
            .then((response: any) => {
                addFlash({ key: 'admin-nests', type: 'success', title: 'Egg imported', message: response.message });
                reset();
                onClose();
                onImported(response.egg!.id);
            })
            .catch((submitError) => clearAndAddHttpError({ key: 'admin-nests', error: submitError }))
            .finally(() => setImporting(false));
    };

    return (
        <Dialog appearance="admin" open={open} onClose={handleClose} title="Import egg">
            <form id="import-egg-form" onSubmit={onSubmit} className="space-y-4">
                <SettingRow label="Egg file" htmlFor="import-file" description="JSON export from another panel.">
                    <input
                        id="import-file"
                        type="file"
                        accept="application/json"
                        className={fieldClass}
                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                        required
                    />
                </SettingRow>
                <SettingRow label="Nest" htmlFor="import-nest" description="Nest the imported egg belongs to.">
                    <select
                        id="import-nest"
                        className={fieldClass}
                        value={nestId ?? ''}
                        onChange={(e) => setNestId(Number(e.target.value))}
                    >
                        {nests.map((nest) => (
                            <option key={nest.id} value={nest.id}>
                                {nest.name} ({nest.author})
                            </option>
                        ))}
                    </select>
                </SettingRow>
            </form>
            <Dialog.Footer>
                <Button type="button" variant="outline" disabled={importing} onClick={handleClose}>
                    Cancel
                </Button>
                <Button type="submit" form="import-egg-form" disabled={importing || !file}>
                    <Upload className="mr-2 h-4 w-4" />
                    {importing ? 'Importing...' : 'Import egg'}
                </Button>
            </Dialog.Footer>
        </Dialog>
    );
};

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog } from '@/components/elements/dialog';
import useFlash from '@/plugins/useFlash';
import { createLocation } from '@/api/admin/locations';
import { fieldClass, textareaClass } from '@/components/admin-preview/settings/fieldClass';

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
    const [short, setShort] = useState('');
    const [long, setLong] = useState('');
    const [saving, setSaving] = useState(false);

    const reset = () => {
        setShort('');
        setLong('');
    };

    const handleClose = () => {
        if (saving) return;
        reset();
        onClose();
    };

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        setSaving(true);
        clearFlashes('admin-locations');

        createLocation({ short, long })
            .then((response) => {
                addFlash({
                    key: 'admin-locations',
                    type: 'success',
                    title: 'Location created',
                    message: response.message,
                });
                reset();
                onClose();
                onCreated(response.location.id);
            })
            .catch((submitError) => {
                clearAndAddHttpError({ key: 'admin-locations', error: submitError });
            })
            .finally(() => setSaving(false));
    };

    return (
        <Dialog appearance="admin" open={open} onClose={handleClose} title="Create location">
            <form id="create-location-form" onSubmit={onSubmit} className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="location-short">Short code</Label>
                    <input
                        id="location-short"
                        className={fieldClass}
                        value={short}
                        onChange={(e) => setShort(e.target.value)}
                        required
                        autoFocus
                    />
                    <p className="text-xs text-muted-foreground">
                        A short identifier (e.g. <code>us.nyc.lvl3</code>). Must be between 1 and 60 characters.
                    </p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="location-long">Description</Label>
                    <textarea
                        id="location-long"
                        className={textareaClass}
                        value={long}
                        onChange={(e) => setLong(e.target.value)}
                        rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                        A longer description of this location. Must be less than 191 characters.
                    </p>
                </div>
            </form>
            <Dialog.Footer>
                <Button type="button" variant="outline" disabled={saving} onClick={handleClose}>
                    Cancel
                </Button>
                <Button type="submit" form="create-location-form" disabled={saving}>
                    <Plus className="mr-2 h-4 w-4" />
                    {saving ? 'Creating...' : 'Create'}
                </Button>
            </Dialog.Footer>
        </Dialog>
    );
};

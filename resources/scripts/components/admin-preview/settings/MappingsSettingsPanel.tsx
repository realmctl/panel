import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Info, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { getMappingsSettings, updateMappingsSettings } from '@/api/admin/settings';
import { cn } from '@/lib/utils';

export default () => {
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data, error, isValidating, mutate } = useSWR('admin-settings-mappings', getMappingsSettings);
    const [mappings, setMappings] = useState<Record<string, number[]> | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (data?.mappings) {
            setMappings(data.mappings);
        }
    }, [data]);

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-settings', error });
        } else {
            clearFlashes('admin-settings');
        }
    }, [error]);

    const toggleEgg = (categoryKey: string, eggId: number, checked: boolean) => {
        setMappings((current) => {
            if (!current) return current;

            const next = Object.fromEntries(
                Object.entries(current).map(([key, eggIds]) => [key, [...eggIds]])
            ) as Record<string, number[]>;

            if (checked) {
                Object.keys(next).forEach((key) => {
                    next[key] = next[key].filter((id) => id !== eggId);
                });
                next[categoryKey] = [...(next[categoryKey] ?? []), eggId].sort((a, b) => a - b);
            } else {
                next[categoryKey] = (next[categoryKey] ?? []).filter((id) => id !== eggId);
            }

            return next;
        });
    };

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!mappings) return;

        setSaving(true);
        clearFlashes('admin-settings');

        updateMappingsSettings(mappings)
            .then((response) => {
                addFlash({
                    key: 'admin-settings',
                    type: 'success',
                    title: 'Mappings saved',
                    message: response.message,
                });
                mutate();
            })
            .catch((submitError) => {
                clearAndAddHttpError({ key: 'admin-settings', error: submitError });
            })
            .finally(() => setSaving(false));
    };

    if (!data && isValidating) {
        return <Spinner centered />;
    }

    if (!mappings || !data) {
        return <p className="text-sm text-muted-foreground">Unable to load egg mappings.</p>;
    }

    const categoryEntries = Object.entries(data.categories);

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <div className="flex gap-3 rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm text-foreground">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                    <p className="font-medium">Category mappings control panel features</p>
                    <p className="mt-1 text-muted-foreground">
                        Assign eggs to a category to enable features for those servers only. Minecraft-mapped eggs
                        unlock the plugin installer, version changer, and player manager.
                    </p>
                </div>
            </div>

            {categoryEntries.map(([categoryKey, category]) => (
                <div key={categoryKey} className="rounded-lg border border-border bg-card">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-base font-semibold text-foreground">
                            {category.label ?? categoryKey}
                        </h2>
                        {category.description && (
                            <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
                        )}
                        {category.features && category.features.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {category.features.map((feature) => (
                                    <span
                                        key={feature}
                                        className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                                    >
                                        {feature}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 lg:grid-cols-3">
                        {data.nests.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No nests or eggs found.</p>
                        ) : (
                            data.nests.map((nest) => (
                                <div key={nest.id} className="rounded-md border border-border p-4">
                                    <p className="mb-3 text-sm font-medium text-foreground">{nest.name}</p>
                                    <div className="space-y-2">
                                        {nest.eggs.map((egg) => {
                                            const checked = (mappings[categoryKey] ?? []).includes(egg.id);

                                            return (
                                                <label
                                                    key={egg.id}
                                                    className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className={cn(
                                                            'h-4 w-4 rounded border-border text-primary',
                                                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                                                        )}
                                                        checked={checked}
                                                        onChange={(e) =>
                                                            toggleEgg(categoryKey, egg.id, e.target.checked)
                                                        }
                                                    />
                                                    {egg.name}
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ))}

            <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving...' : 'Save mappings'}
                </Button>
            </div>
        </form>
    );
};

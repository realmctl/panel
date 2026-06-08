import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { getMappingsSettings, updateMappingsSettings } from '@/api/admin/settings';
import { SettingsFooter, SettingsSection } from '@/components/admin-preview/settings/settingsLayout';
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
            .then((response: any) => {
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
        <form onSubmit={onSubmit} className="space-y-4">
            <SettingsSection
                title="Egg categories"
                description="Assign eggs to unlock category-specific panel features for those servers."
            >
                <p className="px-5 py-4 text-sm text-muted-foreground">
                    Each egg can belong to one category. For example, Minecraft-mapped eggs unlock the plugin
                    installer, version changer, and player manager.
                </p>
            </SettingsSection>

            {categoryEntries.map(([categoryKey, category]) => {
                const selectedCount = (mappings[categoryKey] ?? []).length;

                return (
                    <SettingsSection
                        key={categoryKey}
                        title={category.label ?? categoryKey}
                        description={
                            category.description ??
                            (category.features?.length
                                ? `Unlocks: ${category.features.join(', ')}`
                                : 'Select which eggs belong to this category.')
                        }
                    >
                        {data.nests.length === 0 ? (
                            <p className="px-5 py-4 text-sm text-muted-foreground">No nests or eggs found.</p>
                        ) : (
                            <>
                                <div className="flex items-center justify-between gap-4 border-b border-border bg-muted/20 px-5 py-2.5">
                                    <span className="text-xs text-muted-foreground">Eggs in this category</span>
                                    <span className="text-xs font-medium tabular-nums text-foreground">
                                        {selectedCount} selected
                                    </span>
                                </div>
                                <div className="divide-y divide-border">
                                    {data.nests.map((nest) => (
                                        <div key={nest.id}>
                                            <div className="bg-muted/10 px-5 py-2">
                                                <span className="text-xs font-medium text-muted-foreground">
                                                    {nest.name}
                                                </span>
                                            </div>
                                            <div className="divide-y divide-border">
                                                {nest.eggs.map((egg) => {
                                                    const checked = (mappings[categoryKey] ?? []).includes(
                                                        egg.id
                                                    );

                                                    return (
                                                        <label
                                                            key={egg.id}
                                                            className="flex cursor-pointer items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-muted/50"
                                                        >
                                                            <span className="text-sm text-foreground">{egg.name}</span>
                                                            <input
                                                                type="checkbox"
                                                                className={cn(
                                                                    'h-4 w-4 shrink-0 rounded border-border text-primary',
                                                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                                                                )}
                                                                checked={checked}
                                                                onChange={(e) =>
                                                                    toggleEgg(
                                                                        categoryKey,
                                                                        egg.id,
                                                                        e.target.checked
                                                                    )
                                                                }
                                                            />
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </SettingsSection>
                );
            })}

            <SettingsFooter>
                <Button type="submit" disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving...' : 'Save mappings'}
                </Button>
            </SettingsFooter>
        </form>
    );
};

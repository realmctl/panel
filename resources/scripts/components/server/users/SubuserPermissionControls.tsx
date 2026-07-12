import React, { useEffect } from 'react';
import { useFormikContext } from 'formik';
import classNames from 'classnames';
import { Actions, useStoreActions, useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import { Button } from '@/components/elements/button/index';
import { PERMISSION_PRESETS, resolvePresetPermissions } from '@/components/server/users/userPermissionPresets';

interface Values {
    emails: string;
    permissions: string[];
}

const presetButtonClass = (active: boolean) =>
    classNames(
        'px-3 py-1.5 text-xs font-medium rounded border transition-colors duration-150 cursor-pointer',
        active
            ? 'border-blue-500/50 bg-blue-500/20 text-blue-200'
            : 'border-realm-border/60 bg-transparent text-neutral-300 hover:border-neutral-500 hover:bg-neutral-800/50'
    );

interface Props {
    editablePermissions: string[];
    showPresets?: boolean;
}

export default ({ editablePermissions, showPresets = false }: Props) => {
    const { setFieldValue, values } = useFormikContext<Values>();
    const allSelected = editablePermissions.every((p) => values.permissions.includes(p));
    const selectedCount = values.permissions.filter((p) => p !== 'websocket.connect').length;

    const templates = useStoreState((state: ApplicationStore) => state.permissionTemplates.data);
    const fetchTemplates = useStoreActions(
        (actions: Actions<ApplicationStore>) => actions.permissionTemplates.fetchTemplates
    );

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const applyPreset = (presetId: string) => {
        setFieldValue('permissions', resolvePresetPermissions(presetId, editablePermissions));
    };

    const isPresetActive = (presetId: string) => {
        const presetPerms = resolvePresetPermissions(presetId, editablePermissions).sort().join(',');
        const currentPerms = [...values.permissions].sort().join(',');
        return presetPerms.length > 0 && presetPerms === currentPerms;
    };

    const applyTemplate = (permissions: string[]) => {
        setFieldValue(
            'permissions',
            permissions.filter((p) => editablePermissions.includes(p))
        );
    };

    const isTemplateActive = (permissions: string[]) => {
        const templatePerms = permissions
            .filter((p) => editablePermissions.includes(p))
            .sort()
            .join(',');
        const currentPerms = [...values.permissions].sort().join(',');
        return templatePerms.length > 0 && templatePerms === currentPerms;
    };

    return (
        <div className={'pb-4 border-b border-realm-border/60'}>
            <div className={'flex flex-wrap items-center justify-between gap-3 mb-3'}>
                <div>
                    <p className={'text-sm font-medium text-neutral-100 m-0'}>Permission presets</p>
                    <p className={'text-xs text-neutral-500 mt-1 m-0'}>{selectedCount} selected</p>
                </div>
                <Button.Text
                    type={'button'}
                    onClick={() => setFieldValue('permissions', allSelected ? [] : editablePermissions)}
                >
                    {allSelected ? 'Clear all' : 'Select all'}
                </Button.Text>
            </div>
            {showPresets && (
                <div className={'flex flex-wrap gap-2'}>
                    {PERMISSION_PRESETS.map((preset) => (
                        <button
                            key={preset.id}
                            type={'button'}
                            title={preset.description}
                            className={presetButtonClass(isPresetActive(preset.id))}
                            onClick={() => applyPreset(preset.id)}
                        >
                            {preset.label}
                        </button>
                    ))}
                    <button
                        type={'button'}
                        title={'Grant every permission you can assign'}
                        className={presetButtonClass(isPresetActive('full'))}
                        onClick={() => applyPreset('full')}
                    >
                        Full access
                    </button>
                </div>
            )}
            {templates.length > 0 && (
                <div className={'flex flex-wrap gap-2 mt-2'}>
                    {templates.map((template) => (
                        <button
                            key={template.uuid}
                            type={'button'}
                            title={`Apply "${template.name}" template`}
                            className={presetButtonClass(isTemplateActive(template.permissions))}
                            onClick={() => applyTemplate(template.permissions)}
                        >
                            {template.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

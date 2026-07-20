import React, { memo, useCallback } from 'react';
import { useField } from 'formik';
import isEqual from 'react-fast-compare';

interface Props {
    isEditable: boolean;
    title: string;
    permissions: string[];
    description?: string;
    children: React.ReactNode;
}

const PermissionSection: React.FC<Props> = memo(({ isEditable, title, permissions, description, children }) => {
    const [{ value }, , { setValue }] = useField<string[]>('permissions');

    const setAllSelected = useCallback(
        (checked: boolean) => {
            if (checked) {
                setValue([...value, ...permissions.filter((p) => !value.includes(p))]);
            } else {
                setValue(value.filter((p) => !permissions.includes(p)));
            }
        },
        [permissions, value]
    );

    const allSelected = permissions.every((p) => value.includes(p));

    return (
        <section className={'border-t border-realm-border/50 pt-3 first:border-t-0 first:pt-0'}>
            <div className={'flex items-center gap-3 mb-1.5 px-1'}>
                <div className={'flex-1 min-w-0'}>
                    <h3 className={'text-sm font-semibold text-neutral-200 m-0 capitalize'}>{title}</h3>
                    {description && <p className={'text-xs text-neutral-500 mt-0.5 mb-0'}>{description}</p>}
                </div>
                {isEditable && (
                    <button
                        type={'button'}
                        onClick={() => setAllSelected(!allSelected)}
                        className={'text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors shrink-0'}
                    >
                        {allSelected ? 'Deselect all' : 'Select all'}
                    </button>
                )}
            </div>
            {children}
        </section>
    );
}, isEqual);

export default PermissionSection;

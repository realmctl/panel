import React, { memo, useCallback } from 'react';
import { useField } from 'formik';
import Input from '@/components/elements/Input';
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

    const onCheckboxClicked = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.currentTarget.checked) {
                setValue([...value, ...permissions.filter((p) => !value.includes(p))]);
            } else {
                setValue(value.filter((p) => !permissions.includes(p)));
            }
        },
        [permissions, value]
    );

    const allSelected = permissions.every((p) => value.includes(p));

    return (
        <section className={'border-t border-realm-border/60 pt-4 first:border-t-0 first:pt-0'}>
            <div className={'flex items-center gap-3 mb-2'}>
                <div className={'flex-1 min-w-0'}>
                    <h3 className={'text-xs font-semibold uppercase tracking-wide text-neutral-400 m-0'}>{title}</h3>
                    {description && <p className={'text-xs text-neutral-500 mt-1 mb-0'}>{description}</p>}
                </div>
                {isEditable && (
                    <label className={'flex items-center gap-2 text-xs text-neutral-500 cursor-pointer shrink-0'}>
                        <Input type={'checkbox'} checked={allSelected} onChange={onCheckboxClicked} />
                        All
                    </label>
                )}
            </div>
            {children}
        </section>
    );
}, isEqual);

export default PermissionSection;

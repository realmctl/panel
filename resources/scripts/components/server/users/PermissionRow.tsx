import React from 'react';
import classNames from 'classnames';
import { useStoreState } from 'easy-peasy';
import Checkbox from '@/components/elements/Checkbox';
import Label from '@/components/elements/Label';

interface Props {
    permission: string;
    disabled: boolean;
    compact?: boolean;
}

const PermissionRow = ({ permission, disabled }: Props) => {
    const [key, pkey] = permission.split('.', 2);
    const permissions = useStoreState((state) => state.permissions.data);

    return (
        <label
            htmlFor={`permission_${permission}`}
            className={classNames(
                'flex items-center border border-transparent rounded-md p-2 transition-colors duration-75',
                disabled ? 'opacity-50' : 'cursor-pointer hover:border-neutral-500 hover:bg-neutral-800/50'
            )}
        >
            <Checkbox
                id={`permission_${permission}`}
                name={'permissions'}
                value={permission}
                className={'w-4 h-4 mr-3'}
                disabled={disabled}
            />
            <div className={'flex-1 min-w-0'}>
                <Label as={'p'} className={'font-medium m-0'}>
                    {pkey}
                </Label>
                {permissions[key].keys[pkey].length > 0 && (
                    <p className={'text-xs text-neutral-500 mt-1 m-0'}>{permissions[key].keys[pkey]}</p>
                )}
            </div>
        </label>
    );
};

export default PermissionRow;

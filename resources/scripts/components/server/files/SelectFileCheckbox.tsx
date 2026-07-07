import React from 'react';
import { ServerContext } from '@/state/server';
import Checkbox from '@/components/elements/inputs/Checkbox';

export const FileActionCheckbox = Checkbox;

export default ({ name }: { name: string }) => {
    const isChecked = ServerContext.useStoreState((state) => state.files.selectedFiles.indexOf(name) >= 0);
    const appendSelectedFile = ServerContext.useStoreActions((actions) => actions.files.appendSelectedFile);
    const removeSelectedFile = ServerContext.useStoreActions((actions) => actions.files.removeSelectedFile);

    return (
        <label
            className={'flex-none flex items-center justify-center cursor-pointer -m-1.5 p-1.5'}
            onClick={(e) => e.stopPropagation()}
        >
            <FileActionCheckbox
                name={'selectedFiles'}
                value={name}
                checked={isChecked}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    if (e.currentTarget.checked) {
                        appendSelectedFile(name);
                    } else {
                        removeSelectedFile(name);
                    }
                }}
            />
        </label>
    );
};

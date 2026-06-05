import styled from 'styled-components/macro';
import tw from 'twin.macro';
import Checkbox from '@/components/elements/Checkbox';
import React from 'react';
import { useStoreState } from 'easy-peasy';
import Label from '@/components/elements/Label';

const Container = styled.label`
    ${tw`flex items-center border border-transparent rounded md:p-2 transition-colors duration-75`};
    text-transform: none;

    &:not(.disabled) {
        ${tw`cursor-pointer`};

        &:hover {
            ${tw`border-neutral-500 bg-neutral-800`};
        }
    }

    &:not(:first-of-type):not(.compact) {
        ${tw`mt-4 sm:mt-2`};
    }

    &.compact {
        ${tw`rounded-md`};
    }

    &.disabled {
        ${tw`opacity-50`};

        & input[type='checkbox']:not(:checked) {
            ${tw`border-0`};
        }
    }
`;

interface Props {
    permission: string;
    disabled: boolean;
    compact?: boolean;
}

const PermissionRow = ({ permission, disabled, compact }: Props) => {
    const [key, pkey] = permission.split('.', 2);
    const permissions = useStoreState((state) => state.permissions.data);

    return (
        <Container
            htmlFor={`permission_${permission}`}
            className={[disabled ? 'disabled' : undefined, compact ? 'compact' : undefined].filter(Boolean).join(' ')}
        >
            <div css={tw`p-2`}>
                <Checkbox
                    id={`permission_${permission}`}
                    name={'permissions'}
                    value={permission}
                    css={tw`w-5 h-5 mr-2`}
                    disabled={disabled}
                />
            </div>
            <div css={tw`flex-1`}>
                <Label as={'p'} css={tw`font-medium`}>
                    {pkey}
                </Label>
                {permissions[key].keys[pkey].length > 0 && (
                    <p css={tw`text-xs text-neutral-400 mt-1`}>{permissions[key].keys[pkey]}</p>
                )}
            </div>
        </Container>
    );
};

export default PermissionRow;

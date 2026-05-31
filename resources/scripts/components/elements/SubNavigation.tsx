import styled from 'styled-components/macro';
import tw from 'twin.macro';

const SubNavigation = styled.div`
    ${tw`w-full overflow-x-auto`};
    background-color: #192024;

    & > div {
        ${tw`flex items-center text-sm mx-4 xl:mx-auto`};
        max-width: 1200px;
        gap: 1.25rem;

        & > a,
        & > div {
            ${tw`inline-block py-3 text-neutral-400 no-underline whitespace-nowrap transition-all duration-150 relative`};

            &:hover {
                ${tw`text-neutral-100`};
            }

            &:active,
            &.active {
                ${tw`text-neutral-100`};

                &::after {
                    content: '';
                    ${tw`absolute bottom-0 left-0 w-full`};
                    height: 2px;
                    background-color: #3b82f6;
                }
            }
        }
    }
`;

export default SubNavigation;

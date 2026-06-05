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
        & > div.nav-item-dropdown > button {
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

        & > div.nav-item-dropdown {
            ${tw`relative inline-block flex-shrink-0`};
        }

        & > div.nav-item-dropdown > button {
            ${tw`inline-flex items-center gap-1 border-0 bg-transparent cursor-pointer text-sm`};
            font: inherit;
        }
    }
`;

export default SubNavigation;

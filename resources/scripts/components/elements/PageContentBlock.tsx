import React, { useEffect } from 'react';
import { useStoreState } from 'easy-peasy';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCodeBranch } from '@fortawesome/free-solid-svg-icons';
import ContentContainer from '@/components/elements/ContentContainer';
import { CSSTransition } from 'react-transition-group';
import tw from 'twin.macro';
import { ApplicationStore } from '@/state';
export interface PageContentBlockProps {
    title?: string;
    className?: string;
    showFlashKey?: string;
}

const PageContentBlock: React.FC<PageContentBlockProps> = ({ title, className, children }) => {
    const version = useStoreState((state: ApplicationStore) => state.settings.data?.version);

    useEffect(() => {
        if (title) {
            document.title = title;
        }
    }, [title]);

    return (
        <CSSTransition timeout={150} classNames={'fade'} appear in>
            <>
                <ContentContainer css={tw`my-4 sm:my-10`} className={className}>
                    {children}
                </ContentContainer>
                <ContentContainer css={tw`mb-4`}>
                    <p css={tw`flex items-center justify-center gap-1.5 text-center text-neutral-500 text-xs`}>
                        <FontAwesomeIcon icon={faCodeBranch} className={'text-xs'} />
                        v{version?.current ?? 'unknown'}
                        {version?.commit && (
                            <>
                                <span css={tw`text-neutral-700`}>&middot;</span>
                                <span css={tw`font-mono`}>{version.commit}</span>
                            </>
                        )}
                    </p>
                </ContentContainer>
            </>
        </CSSTransition>
    );
};

export default PageContentBlock;

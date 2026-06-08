import React, { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import { createPortal } from 'react-dom';
import { XIcon } from '@heroicons/react/outline';
import CSSTransition from 'react-transition-group/CSSTransition';
import styled from 'styled-components/macro';
import tw from 'twin.macro';

export interface DrawerProps {
    visible: boolean;
    onDismissed: () => void;
    title?: React.ReactNode;
    subtitle?: React.ReactNode;
    width?: string;
    dismissable?: boolean;
    closeOnBackground?: boolean;
    closeOnEscape?: boolean;
    children: React.ReactNode;
}

const DrawerScene = styled.div`
    ${tw`fixed inset-0 z-[120] flex justify-end`};
    background: rgba(0, 0, 0, 0.55);
    opacity: 1;
    transition: opacity 200ms ease-out;

    &.drawer-enter {
        opacity: 0;
    }

    &.drawer-enter-active {
        opacity: 1;
    }

    &.drawer-exit {
        opacity: 1;
    }

    &.drawer-exit-active {
        opacity: 0;
        transition: opacity 200ms ease-in;
    }
`;

const DrawerPanel = styled.aside`
    ${tw`h-full flex flex-col border-l border-realm-border bg-realm-card shadow-2xl`};
    transform: translateX(0);
    transition: transform 250ms cubic-bezier(0.22, 1, 0.36, 1);

    .drawer-enter & {
        transform: translateX(100%);
    }

    .drawer-enter-active & {
        transform: translateX(0);
    }

    .drawer-exit & {
        transform: translateX(0);
    }

    .drawer-exit-active & {
        transform: translateX(100%);
        transition: transform 220ms cubic-bezier(0.4, 0, 1, 1);
    }
`;

const DrawerHeader = styled.div`
    ${tw`flex items-start justify-between gap-3 px-5 py-4 border-b border-realm-border bg-realm-surface flex-shrink-0`};
`;

const DrawerHeaderText = styled.div`
    ${tw`min-w-0 flex-1`};
`;

const DrawerTitle = styled.h2`
    ${tw`text-base font-header font-medium text-neutral-100 m-0`};
`;

const DrawerSubtitle = styled.p`
    ${tw`text-xs text-neutral-500 mt-1 mb-0 truncate`};
`;

const DrawerClose = styled.button`
    ${tw`flex items-center justify-center w-8 h-8 rounded-md border-0 bg-transparent text-neutral-400 cursor-pointer flex-shrink-0`};
    ${tw`hover:text-neutral-100 hover:bg-white/5 transition-colors duration-150`};
`;

const DrawerBody = styled.div<{ $flush?: boolean }>`
    ${tw`flex-1 min-h-0 overflow-y-auto`};
    ${(props) => (props.$flush ? tw`px-0 py-0` : tw`px-5 py-4`)};
`;

export default ({
    visible,
    onDismissed,
    title,
    subtitle,
    width = '28rem',
    dismissable = true,
    closeOnBackground = true,
    closeOnEscape = true,
    children,
}: DrawerProps) => {
    const [render, setRender] = useState(visible);

    const canDismiss = useMemo(() => dismissable, [dismissable]);

    useEffect(() => setRender(visible), [visible]);

    useEffect(() => {
        if (!canDismiss || !closeOnEscape || !render) {
            return;
        }

        const handler = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setRender(false);
            }
        };

        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [canDismiss, closeOnEscape, render]);

    useEffect(() => {
        if (!render) {
            return;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [render]);

    return createPortal(
        <CSSTransition in={render} timeout={250} classNames={'drawer'} appear unmountOnExit onExited={onDismissed}>
            <DrawerScene
                onMouseDown={(event) => {
                    if (!canDismiss || !closeOnBackground || event.target !== event.currentTarget) {
                        return;
                    }

                    setRender(false);
                }}
            >
                <DrawerPanel
                    style={{ width, maxWidth: '100vw' }}
                    role={'dialog'}
                    aria-modal={'true'}
                    onMouseDown={(event) => event.stopPropagation()}
                >
                    {(title || canDismiss) && (
                        <DrawerHeader>
                            <DrawerHeaderText>
                                {title && <DrawerTitle>{title}</DrawerTitle>}
                                {subtitle && <DrawerSubtitle>{subtitle}</DrawerSubtitle>}
                            </DrawerHeaderText>
                            {canDismiss && (
                                <DrawerClose type={'button'} aria-label={'Close drawer'} onClick={() => setRender(false)}>
                                    <XIcon className={classNames('w-5 h-5')} />
                                </DrawerClose>
                            )}
                        </DrawerHeader>
                    )}
                    <DrawerBody $flush={!title && !canDismiss}>{children}</DrawerBody>
                </DrawerPanel>
            </DrawerScene>
        </CSSTransition>,
        document.body
    );
};

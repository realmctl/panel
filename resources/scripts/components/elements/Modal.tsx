import React, { useEffect, useMemo, useRef, useState } from 'react';
import Spinner from '@/components/elements/Spinner';
import tw from 'twin.macro';
import styled, { css } from 'styled-components/macro';
import { breakpoint } from '@/theme';
import Fade from '@/components/elements/Fade';
import { createPortal } from 'react-dom';

export interface RequiredModalProps {
    visible: boolean;
    onDismissed: () => void;
    appear?: boolean;
    top?: boolean;
}

export interface ModalProps extends RequiredModalProps {
    dismissable?: boolean;
    closeOnEscape?: boolean;
    closeOnBackground?: boolean;
    showSpinnerOverlay?: boolean;
    wide?: boolean;
    title?: string;
    footer?: React.ReactNode;
}

export const ModalMask = styled.div<{ center?: boolean }>`
    ${tw`fixed z-50 overflow-auto flex w-full inset-0`};
    ${(props) => props.center && tw`items-center justify-center`};
    background: rgba(0, 0, 0, 0.7);
`;

const ModalContainer = styled.div<{ alignTop?: boolean; wide?: boolean }>`
    max-width: 95%;
    max-height: calc(100vh - 8rem);
    ${breakpoint('md')`max-width: 75%`};
    ${breakpoint('lg')`max-width: 50%`};
    ${(props) =>
        props.wide &&
        css`
            ${breakpoint('md')`max-width: 90%`};
            ${breakpoint('lg')`max-width: 42rem`};
            ${breakpoint('xl')`max-width: 52rem`};
        `};

    ${tw`relative flex flex-col w-full m-auto`};
    ${(props) => props.wide && tw`overflow-hidden`};
    ${(props) =>
        props.alignTop &&
        css`
            margin-top: 20%;
            ${breakpoint('md')`margin-top: 10%`};
        `};

    margin-bottom: auto;
`;

const Modal: React.FC<ModalProps> = ({
    visible,
    appear,
    dismissable,
    showSpinnerOverlay,
    top = true,
    wide = false,
    closeOnBackground = true,
    closeOnEscape = true,
    onDismissed,
    title,
    footer,
    children,
}) => {
    const [render, setRender] = useState(visible);

    const isDismissable = useMemo(() => {
        return (dismissable || true) && !(showSpinnerOverlay || false);
    }, [dismissable, showSpinnerOverlay]);

    useEffect(() => {
        if (!isDismissable || !closeOnEscape) return;

        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setRender(false);
        };

        window.addEventListener('keydown', handler);
        return () => {
            window.removeEventListener('keydown', handler);
        };
    }, [isDismissable, closeOnEscape, render]);

    useEffect(() => setRender(visible), [visible]);

    return (
        <Fade in={render} timeout={150} appear={appear || true} unmountOnExit onExited={() => onDismissed()}>
            <ModalMask
                center={!top}
                onClick={(e) => e.stopPropagation()}
                onContextMenu={(e) => e.stopPropagation()}
                onMouseDown={(e) => {
                    if (isDismissable && closeOnBackground) {
                        e.stopPropagation();
                        if (e.target === e.currentTarget) {
                            setRender(false);
                        }
                    }
                }}
            >
                <ModalContainer alignTop={top} wide={wide}>
                    {showSpinnerOverlay && (
                        <Fade timeout={150} appear in>
                            <div
                                css={tw`absolute w-full h-full rounded flex items-center justify-center`}
                                style={{ background: 'hsla(211, 10%, 53%, 0.35)', zIndex: 9999 }}
                            >
                                <Spinner />
                            </div>
                        </Fade>
                    )}
                    <div
                        css={[
                            tw`relative rounded-lg border border-realm-border/50 shadow-md transition-all duration-150`,
                            wide || footer
                                ? tw`flex flex-col flex-1 min-h-0 overflow-hidden`
                                : tw`p-5 sm:p-6 overflow-y-auto`,
                        ]}
                        style={{ backgroundColor: '#192024' }}
                    >
                        {footer ? (
                            <>
                                <div className={'flex-1 min-h-0 overflow-y-auto p-6'}>
                                    {title && (
                                        <h2 className={'text-xl font-semibold text-neutral-100 m-0 mb-5'}>{title}</h2>
                                    )}
                                    {children}
                                </div>
                                <div
                                    className={
                                        'flex items-center justify-end gap-3 px-6 py-4 border-t border-realm-border/50 flex-shrink-0'
                                    }
                                >
                                    {footer}
                                </div>
                            </>
                        ) : (
                            children
                        )}
                    </div>
                </ModalContainer>
            </ModalMask>
        </Fade>
    );
};

const PortaledModal: React.FC<ModalProps> = ({ children, ...props }) => {
    const element = useRef(document.getElementById('modal-portal'));

    return createPortal(<Modal {...props}>{children}</Modal>, element.current!);
};

export default PortaledModal;

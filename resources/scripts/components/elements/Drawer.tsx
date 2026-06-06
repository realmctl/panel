import React, { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import { createPortal } from 'react-dom';
import { XIcon } from '@heroicons/react/outline';
import CSSTransition from 'react-transition-group/CSSTransition';
import styles from './drawer.module.css';

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
        <CSSTransition
            in={render}
            timeout={250}
            classNames={{
                enter: styles.scene_enter,
                enterActive: styles.scene_enter_active,
                exit: styles.scene_exit,
                exitActive: styles.scene_exit_active,
            }}
            unmountOnExit
            onExited={onDismissed}
        >
            <div
                className={styles.drawer_scene}
                onMouseDown={(event) => {
                    if (!canDismiss || !closeOnBackground || event.target !== event.currentTarget) {
                        return;
                    }

                    setRender(false);
                }}
            >
                <aside
                    className={styles.drawer_panel}
                    style={{ width, maxWidth: '100vw' }}
                    role={'dialog'}
                    aria-modal={'true'}
                    onMouseDown={(event) => event.stopPropagation()}
                >
                    {(title || canDismiss) && (
                        <div className={styles.drawer_header}>
                            <div className={styles.drawer_header_text}>
                                {title && <h2 className={styles.drawer_title}>{title}</h2>}
                                {subtitle && <p className={styles.drawer_subtitle}>{subtitle}</p>}
                            </div>
                            {canDismiss && (
                                <button
                                    type={'button'}
                                    className={styles.drawer_close}
                                    aria-label={'Close drawer'}
                                    onClick={() => setRender(false)}
                                >
                                    <XIcon className={'w-5 h-5'} />
                                </button>
                            )}
                        </div>
                    )}
                    <div className={classNames(styles.drawer_body, !title && !canDismiss && styles.drawer_body_flush)}>
                        {children}
                    </div>
                </aside>
            </div>
        </CSSTransition>,
        document.body
    );
};

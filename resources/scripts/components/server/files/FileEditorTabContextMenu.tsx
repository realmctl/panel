import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronLeft,
    faChevronRight,
    faTimes,
    faTimesCircle,
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import styles from './style.module.css';

export interface TabContextTarget {
    path: string;
    index: number;
    x: number;
    y: number;
}

interface MenuItemProps {
    icon: IconDefinition;
    label: string;
    onClick: () => void;
    disabled?: boolean;
}

const MenuItem = ({ icon, label, onClick, disabled }: MenuItemProps) => (
    <button
        type={'button'}
        className={styles.context_menu_item}
        onClick={onClick}
        disabled={disabled}
    >
        <FontAwesomeIcon icon={icon} className={'w-3 text-neutral-500'} fixedWidth />
        <span>{label}</span>
    </button>
);

interface Props {
    target: TabContextTarget | null;
    tabCount: number;
    onClose: () => void;
    onCloseTab: () => void;
    onCloseOthers: () => void;
    onCloseToRight: () => void;
    onCloseToLeft: () => void;
    onCloseAll: () => void;
}

export default ({
    target,
    tabCount,
    onClose,
    onCloseTab,
    onCloseOthers,
    onCloseToRight,
    onCloseToLeft,
    onCloseAll,
}: Props) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!target) {
            return;
        }

        const close = () => onClose();

        const onPointerDown = (event: MouseEvent) => {
            if (menuRef.current?.contains(event.target as Node)) {
                return;
            }

            close();
        };

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                close();
            }
        };

        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('contextmenu', close);
        document.addEventListener('scroll', close, true);
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('contextmenu', close);
            document.removeEventListener('scroll', close, true);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [target, onClose]);

    useEffect(() => {
        if (!target || !menuRef.current) {
            return;
        }

        const menu = menuRef.current;
        const rect = menu.getBoundingClientRect();
        let x = target.x;
        let y = target.y;

        if (x + rect.width > window.innerWidth - 8) {
            x = Math.max(8, window.innerWidth - rect.width - 8);
        }

        if (y + rect.height > window.innerHeight - 8) {
            y = Math.max(8, window.innerHeight - rect.height - 8);
        }

        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
    }, [target]);

    if (!target) {
        return null;
    }

    const hasTabsToLeft = target.index > 0;
    const hasTabsToRight = target.index < tabCount - 1;
    const hasOtherTabs = tabCount > 1;

    const run = (action: () => void) => {
        onClose();
        action();
    };

    return createPortal(
        <div ref={menuRef} className={styles.context_menu} style={{ left: target.x, top: target.y }}>
            <MenuItem icon={faTimes} label={'Close'} onClick={() => run(onCloseTab)} />
            <MenuItem
                icon={faTimes}
                label={'Close others'}
                onClick={() => run(onCloseOthers)}
                disabled={!hasOtherTabs}
            />
            <div className={styles.context_menu_divider} />
            <MenuItem
                icon={faChevronRight}
                label={'Close to the right'}
                onClick={() => run(onCloseToRight)}
                disabled={!hasTabsToRight}
            />
            <MenuItem
                icon={faChevronLeft}
                label={'Close to the left'}
                onClick={() => run(onCloseToLeft)}
                disabled={!hasTabsToLeft}
            />
            <div className={styles.context_menu_divider} />
            <MenuItem icon={faTimesCircle} label={'Close all'} onClick={() => run(onCloseAll)} />
        </div>,
        document.body
    );
};

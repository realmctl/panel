import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import Can from '@/components/elements/Can';
import { ServerContext } from '@/state/server';

const INSIGHT_ITEMS = [
    { path: '/metrics', name: 'Metrics', permission: null as string | string[] | null, exact: true },
    { path: '/activity', name: 'History', permission: 'activity.*' as string | string[] | null, exact: false },
];

const DropdownMenu = styled.div`
    min-width: 10rem;
    padding: 0.375rem 0;
    border-radius: 0.5rem;
    border: 1px solid #2d3338;
    background-color: #1e2a2f;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35);
    z-index: 1000;
`;

const DropdownLink = styled(NavLink)`
    ${tw`block px-4 py-2 text-sm no-underline transition-colors duration-150`};
    color: #d4d4d4;

    &:hover {
        background-color: rgba(255, 255, 255, 0.05);
        color: #f5f5f5;
    }

    &.active {
        background-color: rgba(59, 130, 246, 0.15);
        color: #f5f5f5;
    }
`;

const canAccess = (permission: string | string[] | null, userPermissions: string[]): boolean => {
    if (!permission) {
        return true;
    }

    if (userPermissions[0] === '*') {
        return true;
    }

    const actions = Array.isArray(permission) ? permission : [permission];

    return actions.some(
        (action) =>
            (action.endsWith('.*') &&
                userPermissions.some((value) => value.startsWith(action.split('.')[0]))) ||
            userPermissions.indexOf(action) >= 0
    );
};

const isRouteActive = (path: string, exact: boolean, pathname: string, to: (value: string, url?: boolean) => string) => {
    const routePath = to(path, true);
    return exact ? pathname === routePath : pathname.startsWith(routePath.replace(/\/$/, ''));
};

interface Props {
    to: (value: string, url?: boolean) => string;
}

export default ({ to }: Props) => {
    const location = useLocation();
    const userPermissions = ServerContext.useStoreState((state) => state.server.permissions);
    const [open, setOpen] = useState(false);
    const [menuStyle, setMenuStyle] = useState<React.CSSProperties | null>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const visibleItems = useMemo(
        () => INSIGHT_ITEMS.filter((item) => canAccess(item.permission, userPermissions)),
        [userPermissions]
    );

    const calculateMenuPosition = (): React.CSSProperties | null => {
        if (!buttonRef.current) {
            return null;
        }

        const rect = buttonRef.current.getBoundingClientRect();

        return {
            position: 'fixed',
            top: rect.bottom + 4,
            left: rect.left,
            minWidth: Math.max(rect.width, 160),
        };
    };

    const closeMenu = () => {
        setOpen(false);
        setMenuStyle(null);
    };

    const toggleMenu = () => {
        if (open) {
            closeMenu();
            return;
        }

        const position = calculateMenuPosition();
        if (!position) {
            return;
        }

        setMenuStyle(position);
        setOpen(true);
    };

    useLayoutEffect(() => {
        if (!open) {
            return;
        }

        const position = calculateMenuPosition();
        if (position) {
            setMenuStyle(position);
        }

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;

            if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) {
                return;
            }

            closeMenu();
        };

        const handleReposition = () => {
            const nextPosition = calculateMenuPosition();
            if (nextPosition) {
                setMenuStyle(nextPosition);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('resize', handleReposition);
        window.addEventListener('scroll', handleReposition, true);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('resize', handleReposition);
            window.removeEventListener('scroll', handleReposition, true);
        };
    }, [open]);

    if (visibleItems.length === 0) {
        return null;
    }

    const isActive = visibleItems.some((item) => isRouteActive(item.path, item.exact, location.pathname, to));

    if (visibleItems.length === 1) {
        const item = visibleItems[0];
        const link = (
            <NavLink to={to(item.path, true)} exact={item.exact}>
                {item.name}
            </NavLink>
        );

        return item.permission ? <Can action={item.permission}>{link}</Can> : link;
    }

    return (
        <div className={'nav-item-dropdown'}>
            <button
                ref={buttonRef}
                type={'button'}
                className={isActive ? 'active' : undefined}
                onClick={toggleMenu}
            >
                Insights
                <FontAwesomeIcon icon={faChevronDown} className={'text-[10px] opacity-70'} />
            </button>
            {open && menuStyle &&
                createPortal(
                    <DropdownMenu ref={menuRef} style={menuStyle}>
                        {visibleItems.map((item) => {
                            const link = (
                                <DropdownLink
                                    key={item.path}
                                    to={to(item.path, true)}
                                    exact={item.exact}
                                    onClick={closeMenu}
                                >
                                    {item.name}
                                </DropdownLink>
                            );

                            return item.permission ? (
                                <Can key={item.path} action={item.permission}>
                                    {link}
                                </Can>
                            ) : (
                                link
                            );
                        })}
                    </DropdownMenu>,
                    document.body
                )}
        </div>
    );
};

import React, { lazy } from 'react';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
    faCogs,
    faDatabase,
    faEgg,
    faFolder,
    faGlobe,
    faHome,
    faNetworkWired,
    faPlug,
    faPuzzlePiece,
    faServer,
    faThLarge,
    faUsers,
    faGlobeAmericas,
} from '@fortawesome/free-solid-svg-icons';

const AdminPreviewOverviewContainer = lazy(
    () => import('@/components/admin-preview/AdminPreviewOverviewContainer')
);
const AdminPreviewPlaceholderContainer = lazy(
    () => import('@/components/admin-preview/AdminPreviewPlaceholderContainer')
);

export interface AdminPreviewRouteDefinition {
    path: string;
    name: string;
    component: React.ComponentType;
    exact?: boolean;
    icon?: IconDefinition;
    legacyPath?: string;
}

export interface AdminPreviewNavGroup {
    name: string;
    icon: IconDefinition;
    items: AdminPreviewRouteDefinition[];
}

export const adminPreviewBasePath = '/admin-preview';

export const adminPreviewRoutes: AdminPreviewRouteDefinition[] = [
    {
        path: '/',
        name: 'Overview',
        component: AdminPreviewOverviewContainer,
        exact: true,
        icon: faHome,
    },
    {
        path: '/settings',
        name: 'Settings',
        component: AdminPreviewPlaceholderContainer,
        icon: faCogs,
        legacyPath: '/admin/settings',
    },
    {
        path: '/api',
        name: 'API',
        component: AdminPreviewPlaceholderContainer,
        icon: faPlug,
        legacyPath: '/admin/api',
    },
    {
        path: '/databases',
        name: 'Databases',
        component: AdminPreviewPlaceholderContainer,
        icon: faDatabase,
        legacyPath: '/admin/databases',
    },
    {
        path: '/locations',
        name: 'Locations',
        component: AdminPreviewPlaceholderContainer,
        icon: faGlobe,
        legacyPath: '/admin/locations',
    },
    {
        path: '/nodes',
        name: 'Nodes',
        component: AdminPreviewPlaceholderContainer,
        icon: faNetworkWired,
        legacyPath: '/admin/nodes',
    },
    {
        path: '/servers',
        name: 'Servers',
        component: AdminPreviewPlaceholderContainer,
        icon: faServer,
        legacyPath: '/admin/servers',
    },
    {
        path: '/subdomains',
        name: 'Subdomains',
        component: AdminPreviewPlaceholderContainer,
        icon: faGlobeAmericas,
        legacyPath: '/admin/subdomains',
    },
    {
        path: '/users',
        name: 'Users',
        component: AdminPreviewPlaceholderContainer,
        icon: faUsers,
        legacyPath: '/admin/users',
    },
    {
        path: '/mounts',
        name: 'Mounts',
        component: AdminPreviewPlaceholderContainer,
        icon: faFolder,
        legacyPath: '/admin/mounts',
    },
    {
        path: '/nests',
        name: 'Nests',
        component: AdminPreviewPlaceholderContainer,
        icon: faEgg,
        legacyPath: '/admin/nests',
    },
];

export const adminPreviewNavGroups: AdminPreviewNavGroup[] = [
    {
        name: 'Management',
        icon: faThLarge,
        items: adminPreviewRoutes.filter((route) =>
            ['/databases', '/locations', '/nodes', '/servers', '/subdomains', '/users'].includes(route.path)
        ),
    },
    {
        name: 'Services',
        icon: faPuzzlePiece,
        items: adminPreviewRoutes.filter((route) => ['/mounts', '/nests'].includes(route.path)),
    },
];

export const adminPreviewTopLevelRoutes = adminPreviewRoutes.filter(
    (route) => route.path === '/' || route.path === '/settings' || route.path === '/api'
);

export const getAdminPreviewRoute = (pathname: string): AdminPreviewRouteDefinition | undefined => {
    const normalized = pathname.replace(/\/$/, '') || adminPreviewBasePath;

    return adminPreviewRoutes.find((route) => {
        const fullPath =
            route.path === '/'
                ? adminPreviewBasePath
                : `${adminPreviewBasePath}${route.path}`.replace('//', '/');

        return route.exact ? normalized === fullPath : normalized.startsWith(fullPath);
    });
};

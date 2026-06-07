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
const AdminPreviewApiContainer = lazy(
    () => import('@/components/admin-preview/AdminPreviewApiContainer')
);
const AdminPreviewSettingsContainer = lazy(
    () => import('@/components/admin-preview/AdminPreviewSettingsContainer')
);
const AdminPreviewDatabasesContainer = lazy(
    () => import('@/components/admin-preview/AdminPreviewDatabasesContainer')
);
const AdminPreviewLocationsContainer = lazy(
    () => import('@/components/admin-preview/AdminPreviewLocationsContainer')
);
const AdminPreviewNodesContainer = lazy(
    () => import('@/components/admin-preview/AdminPreviewNodesContainer')
);
const AdminPreviewServersContainer = lazy(
    () => import('@/components/admin-preview/AdminPreviewServersContainer')
);
const AdminPreviewSubdomainsContainer = lazy(
    () => import('@/components/admin-preview/AdminPreviewSubdomainsContainer')
);
const AdminPreviewUsersContainer = lazy(
    () => import('@/components/admin-preview/AdminPreviewUsersContainer')
);
const AdminPreviewMountsContainer = lazy(
    () => import('@/components/admin-preview/AdminPreviewMountsContainer')
);
const AdminPreviewNestsContainer = lazy(
    () => import('@/components/admin-preview/AdminPreviewNestsContainer')
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
        component: AdminPreviewSettingsContainer,
        icon: faCogs,
        legacyPath: '/admin/settings',
    },
    {
        path: '/api',
        name: 'API',
        component: AdminPreviewApiContainer,
        icon: faPlug,
        legacyPath: '/admin/api',
    },
    {
        path: '/databases',
        name: 'Databases',
        component: AdminPreviewDatabasesContainer,
        icon: faDatabase,
        legacyPath: '/admin/databases',
    },
    {
        path: '/locations',
        name: 'Locations',
        component: AdminPreviewLocationsContainer,
        icon: faGlobe,
        legacyPath: '/admin/locations',
    },
    {
        path: '/nodes',
        name: 'Nodes',
        component: AdminPreviewNodesContainer,
        icon: faNetworkWired,
        legacyPath: '/admin/nodes',
    },
    {
        path: '/servers',
        name: 'Servers',
        component: AdminPreviewServersContainer,
        icon: faServer,
        legacyPath: '/admin/servers',
    },
    {
        path: '/subdomains',
        name: 'Subdomains',
        component: AdminPreviewSubdomainsContainer,
        icon: faGlobeAmericas,
        legacyPath: '/admin/subdomains',
    },
    {
        path: '/users',
        name: 'Users',
        component: AdminPreviewUsersContainer,
        icon: faUsers,
        legacyPath: '/admin/users',
    },
    {
        path: '/mounts',
        name: 'Mounts',
        component: AdminPreviewMountsContainer,
        icon: faFolder,
        legacyPath: '/admin/mounts',
    },
    {
        path: '/nests',
        name: 'Nests',
        component: AdminPreviewNestsContainer,
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

        if (['/settings', '/api', '/databases', '/locations', '/nodes', '/servers', '/subdomains', '/users', '/mounts', '/nests'].includes(route.path)) {
            return normalized === fullPath || normalized.startsWith(`${fullPath}/`);
        }

        return route.exact ? normalized === fullPath : normalized.startsWith(fullPath);
    });
};

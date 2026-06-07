import React, { lazy } from 'react';
import {
    Blocks,
    Database,
    Egg,
    Folder,
    Globe,
    Globe2,
    LayoutDashboard,
    LucideIcon,
    Network,
    Server,
    Settings,
    Users,
} from 'lucide-react';

const AdminPreviewOverviewContainer = lazy(
    () => import('@/components/admin-preview/AdminPreviewOverviewContainer')
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

export type AdminPreviewSection = 'top' | 'management' | 'services';

export interface AdminPreviewRouteDefinition {
    path: string;
    name: string;
    component: React.ComponentType;
    icon: LucideIcon;
    section: AdminPreviewSection;
    exact?: boolean;
    legacyPath?: string;
    badge?: string;
}

export const adminPreviewBasePath = '/admin-preview';

export const adminPreviewRoutes: AdminPreviewRouteDefinition[] = [
    {
        path: '/',
        name: 'Overview',
        component: AdminPreviewOverviewContainer,
        exact: true,
        icon: LayoutDashboard,
        section: 'top',
        badge: 'Preview',
    },
    {
        path: '/settings',
        name: 'Settings',
        component: AdminPreviewSettingsContainer,
        icon: Settings,
        section: 'top',
        legacyPath: '/admin/settings',
    },
    {
        path: '/api',
        name: 'API',
        component: AdminPreviewApiContainer,
        icon: Blocks,
        section: 'top',
        legacyPath: '/admin/api',
    },
    {
        path: '/databases',
        name: 'Databases',
        component: AdminPreviewDatabasesContainer,
        icon: Database,
        section: 'management',
        legacyPath: '/admin/databases',
    },
    {
        path: '/locations',
        name: 'Locations',
        component: AdminPreviewLocationsContainer,
        icon: Globe,
        section: 'management',
        legacyPath: '/admin/locations',
    },
    {
        path: '/nodes',
        name: 'Nodes',
        component: AdminPreviewNodesContainer,
        icon: Network,
        section: 'management',
        legacyPath: '/admin/nodes',
    },
    {
        path: '/servers',
        name: 'Servers',
        component: AdminPreviewServersContainer,
        icon: Server,
        section: 'management',
        legacyPath: '/admin/servers',
    },
    {
        path: '/subdomains',
        name: 'Subdomains',
        component: AdminPreviewSubdomainsContainer,
        icon: Globe2,
        section: 'management',
        legacyPath: '/admin/subdomains',
    },
    {
        path: '/users',
        name: 'Users',
        component: AdminPreviewUsersContainer,
        icon: Users,
        section: 'management',
        legacyPath: '/admin/users',
    },
    {
        path: '/mounts',
        name: 'Mounts',
        component: AdminPreviewMountsContainer,
        icon: Folder,
        section: 'services',
        legacyPath: '/admin/mounts',
    },
    {
        path: '/nests',
        name: 'Nests',
        component: AdminPreviewNestsContainer,
        icon: Egg,
        section: 'services',
        legacyPath: '/admin/nests',
    },
];

export const fullPathFor = (route: AdminPreviewRouteDefinition): string =>
    route.path === '/' ? adminPreviewBasePath : `${adminPreviewBasePath}${route.path}`.replace('//', '/');

export const adminPreviewRoutesBySection = (section: AdminPreviewSection): AdminPreviewRouteDefinition[] =>
    adminPreviewRoutes.filter((route) => route.section === section);

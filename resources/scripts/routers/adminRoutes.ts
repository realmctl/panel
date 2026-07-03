import React, { lazy } from 'react';
import {
    Blocks,
    CloudUpload,
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

const AdminOverviewContainer = lazy(
    () => import('@/components/admin/AdminOverviewContainer')
);
const AdminApiContainer = lazy(
    () => import('@/components/admin/AdminApiContainer')
);
const AdminSettingsContainer = lazy(
    () => import('@/components/admin/AdminSettingsContainer')
);
const AdminDatabasesContainer = lazy(
    () => import('@/components/admin/AdminDatabasesContainer')
);
const AdminLocationsContainer = lazy(
    () => import('@/components/admin/AdminLocationsContainer')
);
const AdminBackupDestinationsContainer = lazy(
    () => import('@/components/admin/AdminBackupDestinationsContainer')
);
const AdminNodesContainer = lazy(
    () => import('@/components/admin/AdminNodesContainer')
);
const AdminServersContainer = lazy(
    () => import('@/components/admin/AdminServersContainer')
);
const AdminSubdomainsContainer = lazy(
    () => import('@/components/admin/AdminSubdomainsContainer')
);
const AdminUsersContainer = lazy(
    () => import('@/components/admin/AdminUsersContainer')
);
const AdminMountsContainer = lazy(
    () => import('@/components/admin/AdminMountsContainer')
);
const AdminNestsContainer = lazy(
    () => import('@/components/admin/AdminNestsContainer')
);

export type AdminSection = 'top' | 'management' | 'services';

export interface AdminRouteDefinition {
    path: string;
    name: string;
    component: React.ComponentType;
    icon: LucideIcon;
    section: AdminSection;
    exact?: boolean;
}

export const adminBasePath = '/admin';

export const adminRoutes: AdminRouteDefinition[] = [
    {
        path: '/',
        name: 'Overview',
        component: AdminOverviewContainer,
        exact: true,
        icon: LayoutDashboard,
        section: 'top',
    },
    {
        path: '/settings',
        name: 'Settings',
        component: AdminSettingsContainer,
        icon: Settings,
        section: 'top',
    },
    {
        path: '/api',
        name: 'API',
        component: AdminApiContainer,
        icon: Blocks,
        section: 'top',
    },
    {
        path: '/databases',
        name: 'Databases',
        component: AdminDatabasesContainer,
        icon: Database,
        section: 'management',
    },
    {
        path: '/locations',
        name: 'Locations',
        component: AdminLocationsContainer,
        icon: Globe,
        section: 'management',
    },
    {
        path: '/backup-destinations',
        name: 'Backup Destinations',
        component: AdminBackupDestinationsContainer,
        icon: CloudUpload,
        section: 'management',
    },
    {
        path: '/nodes',
        name: 'Nodes',
        component: AdminNodesContainer,
        icon: Network,
        section: 'management',
    },
    {
        path: '/servers',
        name: 'Servers',
        component: AdminServersContainer,
        icon: Server,
        section: 'management',
    },
    {
        path: '/subdomains',
        name: 'Subdomains',
        component: AdminSubdomainsContainer,
        icon: Globe2,
        section: 'management',
    },
    {
        path: '/users',
        name: 'Users',
        component: AdminUsersContainer,
        icon: Users,
        section: 'management',
    },
    {
        path: '/mounts',
        name: 'Mounts',
        component: AdminMountsContainer,
        icon: Folder,
        section: 'services',
    },
    {
        path: '/nests',
        name: 'Nests',
        component: AdminNestsContainer,
        icon: Egg,
        section: 'services',
    },
];

export const fullPathFor = (route: AdminRouteDefinition): string =>
    route.path === '/' ? adminBasePath : `${adminBasePath}${route.path}`.replace('//', '/');

export const adminRoutesBySection = (section: AdminSection): AdminRouteDefinition[] =>
    adminRoutes.filter((route) => route.section === section);

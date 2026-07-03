import { createStore } from 'easy-peasy';
import flashes, { FlashStore } from '@/state/flashes';
import user, { UserStore } from '@/state/user';
import permissions, { GloablPermissionsStore } from '@/state/permissions';
import settings, { SettingsStore } from '@/state/settings';
import progress, { ProgressStore } from '@/state/progress';
import serverGroups, { ServerGroupStore } from '@/state/serverGroups';
import permissionTemplates, { PermissionTemplateStore } from '@/state/permissionTemplates';

export interface ApplicationStore {
    permissions: GloablPermissionsStore;
    flashes: FlashStore;
    user: UserStore;
    settings: SettingsStore;
    progress: ProgressStore;
    serverGroups: ServerGroupStore;
    permissionTemplates: PermissionTemplateStore;
}

const state: ApplicationStore = {
    permissions,
    flashes,
    user,
    settings,
    progress,
    serverGroups,
    permissionTemplates,
};

export const store = createStore(state);

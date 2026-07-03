import { action, Action, thunk, Thunk } from 'easy-peasy';
import { PermissionTemplate, getPermissionTemplates } from '@/api/account/permissionTemplates';

export type { PermissionTemplate };

export interface PermissionTemplateStore {
    data: PermissionTemplate[];
    loaded: boolean;
    setTemplates: Action<PermissionTemplateStore, PermissionTemplate[]>;
    appendTemplate: Action<PermissionTemplateStore, PermissionTemplate>;
    updateTemplate: Action<PermissionTemplateStore, PermissionTemplate>;
    removeTemplate: Action<PermissionTemplateStore, string>;
    fetchTemplates: Thunk<PermissionTemplateStore>;
}

const permissionTemplates: PermissionTemplateStore = {
    data: [],
    loaded: false,

    setTemplates: action((state, payload) => {
        state.data = payload;
        state.loaded = true;
    }),

    appendTemplate: action((state, payload) => {
        state.data = [...state.data, payload];
    }),

    updateTemplate: action((state, payload) => {
        state.data = state.data.map((t) => (t.uuid === payload.uuid ? payload : t));
    }),

    removeTemplate: action((state, uuid) => {
        state.data = state.data.filter((t) => t.uuid !== uuid);
    }),

    fetchTemplates: thunk(async (actions, _, { getState }) => {
        if (getState().loaded) {
            return;
        }

        const templates = await getPermissionTemplates();
        actions.setTemplates(templates);
    }),
};

export default permissionTemplates;

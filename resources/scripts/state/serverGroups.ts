import { action, Action, thunk, Thunk } from 'easy-peasy';
import { ServerGroup, getServerGroups } from '@/api/account/serverGroups';

export type { ServerGroup };

export interface ServerGroupStore {
    data: ServerGroup[];
    setGroups: Action<ServerGroupStore, ServerGroup[]>;
    appendGroup: Action<ServerGroupStore, ServerGroup>;
    updateGroup: Action<ServerGroupStore, ServerGroup>;
    removeGroup: Action<ServerGroupStore, string>;
    fetchGroups: Thunk<ServerGroupStore>;
}

const serverGroups: ServerGroupStore = {
    data: [],

    setGroups: action((state, payload) => {
        state.data = payload;
    }),

    appendGroup: action((state, payload) => {
        state.data = [...state.data, payload];
    }),

    updateGroup: action((state, payload) => {
        state.data = state.data.map((g) => (g.uuid === payload.uuid ? payload : g));
    }),

    removeGroup: action((state, uuid) => {
        state.data = state.data.filter((g) => g.uuid !== uuid);
    }),

    fetchGroups: thunk(async (actions) => {
        const groups = await getServerGroups();
        actions.setGroups(groups);
    }),
};

export default serverGroups;

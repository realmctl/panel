import React, { useEffect, useState } from 'react';
import { Actions, useStoreActions, useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import {
    createServerGroup,
    updateServerGroup,
    deleteServerGroup,
    syncGroupServers,
    ServerGroup,
} from '@/api/account/serverGroups';
import { Server } from '@/api/server/getServer';
import { GROUP_COLORS, resolveColor } from '@/components/dashboard/groups/GroupColorDot';

interface Props {
    servers: Server[];
    editing?: ServerGroup;
    onClose: () => void;
}

const COLOR_KEYS = Object.keys(GROUP_COLORS);

export default ({ servers, editing, onClose }: Props) => {
    const appendGroup = useStoreActions((a: Actions<ApplicationStore>) => a.serverGroups.appendGroup);
    const updateGroupInStore = useStoreActions((a: Actions<ApplicationStore>) => a.serverGroups.updateGroup);
    const removeGroup = useStoreActions((a: Actions<ApplicationStore>) => a.serverGroups.removeGroup);

    const [name, setName] = useState(editing?.name ?? '');
    const [color, setColor] = useState(editing?.color ?? 'blue');
    const [selected, setSelected] = useState<Set<string>>(new Set(editing?.serverUuids ?? []));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const toggleServer = (uuid: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(uuid) ? next.delete(uuid) : next.add(uuid);
            return next;
        });
    };

    const handleSave = async () => {
        if (!name.trim()) {
            setError('Name is required.');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            let group: ServerGroup;
            if (editing) {
                group = await updateServerGroup(editing.uuid, { name: name.trim(), color });
                group = await syncGroupServers(editing.uuid, [...selected]);
                updateGroupInStore(group);
            } else {
                group = await createServerGroup(name.trim(), color);
                group = await syncGroupServers(group.uuid, [...selected]);
                appendGroup(group);
            }
            onClose();
        } catch (e: any) {
            console.error('CreateGroupModal error:', e);
            const msg = e?.response?.data?.errors?.[0]?.detail
                || e?.response?.data?.message
                || e?.message
                || 'Something went wrong. Please try again.';
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!editing) return;
        setSaving(true);
        try {
            await deleteServerGroup(editing.uuid);
            removeGroup(editing.uuid);
            onClose();
        } catch (e: any) {
            console.error('DeleteGroup error:', e);
            setError(e?.response?.data?.errors?.[0]?.detail || 'Failed to delete group.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className={'fixed inset-0 z-50 flex items-center justify-center p-4'}
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className={'w-full max-w-md rounded-lg border border-[#2d3338] shadow-2xl'}
                style={{ backgroundColor: '#192024' }}
            >
                <div className={'px-5 py-4 border-b border-[#2d3338]'}>
                    <h2 className={'text-base font-semibold text-neutral-100 m-0'}>
                        {editing ? 'Edit Group' : 'Create Group'}
                    </h2>
                </div>

                <div className={'px-5 py-4 space-y-4'}>
                    {error && (
                        <p className={'text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded px-3 py-2'}>
                            {error}
                        </p>
                    )}

                    <div>
                        <label className={'block text-xs text-neutral-400 mb-1'}>Name</label>
                        <input
                            type={'text'}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={191}
                            placeholder={'e.g. Minecraft Servers'}
                            className={
                                'w-full px-3 py-2 text-sm rounded border border-[#2d3338] text-neutral-100 bg-[#0f1518] focus:outline-none focus:border-blue-500/50'
                            }
                        />
                    </div>

                    <div>
                        <label className={'block text-xs text-neutral-400 mb-2'}>Color</label>
                        <div className={'flex gap-2 flex-wrap'}>
                            {COLOR_KEYS.map((key) => (
                                <button
                                    key={key}
                                    onClick={() => setColor(key)}
                                    className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-transform duration-100 ${
                                        color === key
                                            ? 'border-white scale-110'
                                            : 'border-transparent hover:scale-105'
                                    }`}
                                    style={{ backgroundColor: resolveColor(key) }}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className={'block text-xs text-neutral-400 mb-2'}>
                            Servers{' '}
                            <span className={'text-neutral-600'}>({selected.size} selected)</span>
                        </label>
                        <div className={'space-y-1 max-h-52 overflow-y-auto pr-1'}>
                            {servers.map((server) => (
                                <label
                                    key={server.uuid}
                                    className={
                                        'flex items-center gap-3 px-3 py-2 rounded cursor-pointer transition-colors duration-100 hover:bg-white/5'
                                    }
                                >
                                    <input
                                        type={'checkbox'}
                                        checked={selected.has(server.uuid)}
                                        onChange={() => toggleServer(server.uuid)}
                                        className={'w-3.5 h-3.5 accent-blue-500'}
                                    />
                                    <span className={'text-sm text-neutral-200 truncate'}>{server.name}</span>
                                </label>
                            ))}
                            {servers.length === 0 && (
                                <p className={'text-xs text-neutral-500 px-3 py-2'}>No servers available.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className={'px-5 py-4 border-t border-[#2d3338] flex items-center justify-between gap-3'}>
                    {editing ? (
                        <button
                            onClick={handleDelete}
                            disabled={saving}
                            className={
                                'px-3 py-1.5 text-xs font-medium rounded border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50 cursor-pointer'
                            }
                        >
                            Delete
                        </button>
                    ) : (
                        <span />
                    )}
                    <div className={'flex gap-2'}>
                        <button
                            onClick={onClose}
                            disabled={saving}
                            className={
                                'px-3 py-1.5 text-xs font-medium rounded border border-[#2d3338] text-neutral-400 hover:text-neutral-200 transition-colors disabled:opacity-50 cursor-pointer bg-transparent'
                            }
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={
                                'px-3 py-1.5 text-xs font-medium rounded border border-blue-500/40 bg-blue-500/20 text-blue-300 hover:bg-blue-500/40 transition-colors disabled:opacity-50 cursor-pointer'
                            }
                        >
                            {saving ? 'Saving…' : editing ? 'Save' : 'Create'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

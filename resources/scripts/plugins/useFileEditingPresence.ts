import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    clearFileEditingPresence,
    FileEditorPresence,
    getFileEditingPresence,
    updateFileEditingPresence,
} from '@/api/server/files/fileEditingPresence';
import { cleanDirectoryPath } from '@/helpers';
import { useStoreState } from '@/state/hooks';

const POLL_INTERVAL_MS = 5000;
const HEARTBEAT_INTERVAL_MS = 10000;
const CURSOR_HEARTBEAT_DEBOUNCE_MS = 750;

const sortEditors = (editors: FileEditorPresence[], currentUserUuid?: string) => {
    if (!currentUserUuid) {
        return editors;
    }

    return [...editors].sort((a, b) => {
        if (a.uuid === currentUserUuid) {
            return -1;
        }

        if (b.uuid === currentUserUuid) {
            return 1;
        }

        return 0;
    });
};

export default (serverUuid: string, activeFile: string | null, cursorLine: number) => {
    const currentUser = useStoreState((state) => state.user.data);
    const currentUserUuid = currentUser?.uuid;
    const [othersPresence, setOthersPresence] = useState<FileEditorPresence[]>([]);
    const heartbeatTimer = useRef<number | null>(null);
    const cursorDebounceTimer = useRef<number | null>(null);
    const lastHeartbeat = useRef<{ file: string; line: number } | null>(null);
    const activeFileRef = useRef(activeFile);
    const cursorLineRef = useRef(cursorLine);

    activeFileRef.current = activeFile;
    cursorLineRef.current = cursorLine;

    const localSelf = useMemo((): FileEditorPresence | null => {
        if (!activeFile || !currentUserUuid || !currentUser) {
            return null;
        }

        return {
            uuid: currentUserUuid,
            username: currentUser.username,
            email: currentUser.email,
            file: cleanDirectoryPath(activeFile),
            line: cursorLine,
            updated_at: Math.floor(Date.now() / 1000),
        };
    }, [activeFile, cursorLine, currentUser, currentUserUuid]);

    const refreshPresence = useCallback(async () => {
        try {
            const data = await getFileEditingPresence(serverUuid);
            const normalizedActive = activeFile ? cleanDirectoryPath(activeFile) : null;

            setOthersPresence(
                data.filter((entry) => {
                    if (entry.uuid === currentUserUuid) {
                        return false;
                    }

                    if (!normalizedActive) {
                        return false;
                    }

                    return cleanDirectoryPath(entry.file) === normalizedActive;
                })
            );
        } catch (error) {
            console.error('Failed to fetch file editing presence.', error);
        }
    }, [activeFile, currentUserUuid, serverUuid]);

    const sendHeartbeat = useCallback(
        async (file: string, line: number) => {
            const normalized = cleanDirectoryPath(file);
            const previous = lastHeartbeat.current;

            if (previous?.file === normalized && previous.line === line) {
                return;
            }

            lastHeartbeat.current = { file: normalized, line };

            try {
                await updateFileEditingPresence(serverUuid, normalized, line);
            } catch (error) {
                console.error('Failed to update file editing presence.', error);
            }
        },
        [serverUuid]
    );

    const clearPresence = useCallback(async () => {
        lastHeartbeat.current = null;
        setOthersPresence([]);

        try {
            await clearFileEditingPresence(serverUuid);
        } catch (error) {
            console.error('Failed to clear file editing presence.', error);
        }
    }, [serverUuid]);

    useEffect(() => {
        void refreshPresence();

        const pollTimer = window.setInterval(() => {
            void refreshPresence();
        }, POLL_INTERVAL_MS);

        return () => window.clearInterval(pollTimer);
    }, [refreshPresence]);

    useEffect(() => {
        if (!activeFile) {
            void clearPresence();
            return;
        }

        setOthersPresence([]);
        void sendHeartbeat(activeFile, cursorLineRef.current);

        heartbeatTimer.current = window.setInterval(() => {
            const file = activeFileRef.current;
            if (!file) {
                return;
            }

            void sendHeartbeat(file, cursorLineRef.current);
        }, HEARTBEAT_INTERVAL_MS);

        return () => {
            if (heartbeatTimer.current) {
                window.clearInterval(heartbeatTimer.current);
                heartbeatTimer.current = null;
            }

            if (cursorDebounceTimer.current) {
                window.clearTimeout(cursorDebounceTimer.current);
                cursorDebounceTimer.current = null;
            }
        };
    }, [activeFile, clearPresence, sendHeartbeat]);

    useEffect(() => {
        if (!activeFile) {
            return;
        }

        if (cursorDebounceTimer.current) {
            window.clearTimeout(cursorDebounceTimer.current);
        }

        cursorDebounceTimer.current = window.setTimeout(() => {
            void sendHeartbeat(activeFile, cursorLine);
        }, CURSOR_HEARTBEAT_DEBOUNCE_MS);
    }, [activeFile, cursorLine, sendHeartbeat]);

    const activeEditors = useMemo(() => {
        if (!activeFile) {
            return [];
        }

        const editors = localSelf ? [localSelf, ...othersPresence] : othersPresence;

        return sortEditors(editors, currentUserUuid);
    }, [activeFile, currentUserUuid, localSelf, othersPresence]);

    return {
        activeEditors,
        currentUserUuid,
    };
};

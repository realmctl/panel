import {
    TerminalIcon,
    FolderIcon,
    DatabaseIcon,
    UsersIcon,
    GlobeAltIcon,
    AdjustmentsIcon,
    ClockIcon,
    ArchiveIcon,
    CogIcon,
    PuzzleIcon,
    PlayIcon,
    RefreshIcon,
    StopIcon,
    XCircleIcon,
} from '@heroicons/react/outline';

export type QuickActionType = 'link' | 'power' | 'version';

export interface QuickAction {
    id: string;
    label: string;
    icon: typeof TerminalIcon;
    type: QuickActionType;
    to?: string;
    power?: 'start' | 'stop' | 'restart' | 'kill';
}

export const QUICK_ACTIONS: QuickAction[] = [
    { id: 'console', label: 'Console', icon: TerminalIcon, type: 'link', to: '' },
    { id: 'files', label: 'Files', icon: FolderIcon, type: 'link', to: '/files' },
    { id: 'databases', label: 'Databases', icon: DatabaseIcon, type: 'link', to: '/databases' },
    { id: 'users', label: 'Subusers', icon: UsersIcon, type: 'link', to: '/users' },
    { id: 'network', label: 'Network', icon: GlobeAltIcon, type: 'link', to: '/network' },
    { id: 'startup', label: 'Startup', icon: AdjustmentsIcon, type: 'link', to: '/startup' },
    { id: 'schedules', label: 'Schedules', icon: ClockIcon, type: 'link', to: '/schedules' },
    { id: 'backups', label: 'Backups', icon: ArchiveIcon, type: 'link', to: '/backups' },
    { id: 'settings', label: 'Settings', icon: CogIcon, type: 'link', to: '/settings' },
    { id: 'version', label: 'Change Version', icon: PuzzleIcon, type: 'version' },
    { id: 'start', label: 'Start Server', icon: PlayIcon, type: 'power', power: 'start' },
    { id: 'restart', label: 'Restart Server', icon: RefreshIcon, type: 'power', power: 'restart' },
    { id: 'stop', label: 'Stop Server', icon: StopIcon, type: 'power', power: 'stop' },
    { id: 'kill', label: 'Kill Server', icon: XCircleIcon, type: 'power', power: 'kill' },
];

export const DEFAULT_QUICK_ACTION_IDS = ['console', 'files', 'backups', 'users', 'restart', 'settings'];

export const getQuickAction = (id: string): QuickAction | undefined =>
    QUICK_ACTIONS.find((entry) => entry.id === id);

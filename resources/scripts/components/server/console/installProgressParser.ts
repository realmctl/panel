export type InstallPhase = 'preparing' | 'downloading' | 'extracting' | 'configuring' | 'complete' | 'failed';

export interface InstallStep {
    id: InstallPhase;
    label: string;
    status: 'pending' | 'active' | 'done' | 'error';
}

export interface InstallProgressState {
    phase: InstallPhase;
    label: string;
    detail: string | null;
    downloadPercent: number | null;
    overallPercent: number;
    steps: InstallStep[];
    lineCount: number;
    startedAt: number;
    error: string | null;
}

const STEPS: { id: InstallPhase; label: string }[] = [
    { id: 'preparing', label: 'Preparing environment' },
    { id: 'downloading', label: 'Downloading files' },
    { id: 'extracting', label: 'Installing packages' },
    { id: 'configuring', label: 'Finalizing setup' },
];

const stripAnsi = (line: string): string => line.replace(/\u001b\[[0-9;]*m/g, '');

export const createInitialInstallProgress = (): InstallProgressState => ({
    phase: 'preparing',
    label: 'Preparing environment',
    detail: 'Starting installation…',
    downloadPercent: null,
    overallPercent: 5,
    steps: STEPS.map((step, index) => ({
        ...step,
        status: index === 0 ? 'active' : 'pending',
    })),
    lineCount: 0,
    startedAt: Date.now(),
    error: null,
});

const phaseOrder: InstallPhase[] = ['preparing', 'downloading', 'extracting', 'configuring', 'complete'];

const phaseIndex = (phase: InstallPhase): number => phaseOrder.indexOf(phase);

const buildSteps = (phase: InstallPhase, failed: boolean): InstallStep[] => {
    const activeIndex = phase === 'complete' ? STEPS.length : phaseIndex(phase);

    return STEPS.map((step, index) => {
        if (failed && index === activeIndex) {
            return { ...step, status: 'error' as const };
        }
        if (phase === 'complete' || index < activeIndex) {
            return { ...step, status: 'done' as const };
        }
        if (index === activeIndex) {
            return { ...step, status: 'active' as const };
        }
        return { ...step, status: 'pending' as const };
    });
};

const computeOverallPercent = (phase: InstallPhase, downloadPercent: number | null): number => {
    switch (phase) {
        case 'preparing':
            return 12;
        case 'downloading':
            if (downloadPercent !== null) {
                return 15 + Math.round(downloadPercent * 0.55);
            }
            return 35;
        case 'extracting':
            return 72;
        case 'configuring':
            return 88;
        case 'complete':
            return 100;
        case 'failed':
            return 0;
        default:
            return 5;
    }
};

const parseCurlPercent = (plain: string): number | null => {
    const totalMatch = plain.match(/^\s*(\d+(?:\.\d+)?)\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?/);
    if (totalMatch) {
        return Math.min(100, Math.max(0, parseFloat(totalMatch[1])));
    }

    const receivedMatch = plain.match(/(\d+(?:\.\d+)?)\s*%\s*received/i);
    if (receivedMatch) {
        return Math.min(100, Math.max(0, parseFloat(receivedMatch[1])));
    }

    return null;
};

const detectPhase = (plain: string): { phase: InstallPhase; label: string; detail: string } | null => {
    const lower = plain.toLowerCase();

    if (/installation process completed|install complete|successfully installed|install complete!/i.test(plain)) {
        return { phase: 'complete', label: 'Installation complete', detail: 'Your server is almost ready.' };
    }

    if (/\b(error|failed|fatal)\b/i.test(plain) && !/0 error/i.test(plain)) {
        return { phase: 'failed', label: 'Installation failed', detail: plain.slice(0, 120) };
    }

    if (/starting installation|beginning installation|running installation/i.test(plain)) {
        return { phase: 'preparing', label: 'Preparing environment', detail: 'Starting installer container…' };
    }

    if (/pulling docker|downloading container image|image download complete/i.test(plain)) {
        return {
            phase: 'downloading',
            label: 'Downloading files',
            detail: plain.includes('complete') ? 'Container image ready.' : 'Pulling container image…',
        };
    }

    if (/curl|wget|steamcmd|download|fetching|update state.*download|success! app/i.test(lower)) {
        return {
            phase: 'downloading',
            label: 'Downloading files',
            detail: plain.length > 140 ? `${plain.slice(0, 137)}…` : plain,
        };
    }

    if (/unzip|untar|extract|decompress|unpack|tar -|dpkg|npm install|yarn install|composer install/i.test(lower)) {
        return {
            phase: 'extracting',
            label: 'Installing packages',
            detail: plain.length > 140 ? `${plain.slice(0, 137)}…` : plain,
        };
    }

    if (/mkdir|chmod|chown|apt |apk add|pip install|npm ci|setting up|configuring|permission|running:/i.test(lower)) {
        return {
            phase: 'configuring',
            label: 'Finalizing setup',
            detail: plain.length > 140 ? `${plain.slice(0, 137)}…` : plain,
        };
    }

    if (/latest version|installscript|server files|\/mnt\/server/i.test(lower)) {
        return {
            phase: 'preparing',
            label: 'Preparing environment',
            detail: plain.length > 140 ? `${plain.slice(0, 137)}…` : plain,
        };
    }

    return null;
};

export const isNoisyInstallLine = (line: string): boolean => {
    const plain = stripAnsi(line).trim();

    if (!plain) {
        return true;
    }

    if (/^[\#=\-\.\|\s\\\/]+$/.test(plain)) {
        return true;
    }

    if (plain.length > 60 && (plain.match(/#/g)?.length ?? 0) > 8) {
        return true;
    }

    if (/^\s*\d+(?:\.\d+)?[KMG]?\s+\d+(?:\.\d+)?[KMG]?\s+\d+(?:\.\d+)?[KMG]?\s+\d+(?:\.\d+)?[KMG]?\s+\d+(?:\.\d+)?/.test(plain)) {
        return true;
    }

    if (/^[\s\d]+(?:\.\d+)?%/.test(plain) && plain.length < 40) {
        return true;
    }

    return false;
};

export const parseInstallLine = (state: InstallProgressState, line: string): InstallProgressState => {
    const plain = stripAnsi(line).trim();

    if (!plain) {
        return state;
    }

    const detected = detectPhase(plain);
    const curlPercent = parseCurlPercent(plain);
    let next = { ...state, lineCount: state.lineCount + 1 };

    if (detected?.phase === 'failed') {
        return {
            ...next,
            phase: 'failed',
            label: detected.label,
            detail: detected.detail,
            error: detected.detail,
            overallPercent: computeOverallPercent('failed', null),
            steps: buildSteps(state.phase, true),
        };
    }

    if (detected?.phase === 'complete') {
        return {
            ...next,
            phase: 'complete',
            label: detected.label,
            detail: detected.detail,
            downloadPercent: 100,
            overallPercent: 100,
            steps: buildSteps('complete', false),
        };
    }

    if (detected) {
        const phase = detected.phase;
        const shouldAdvance = phaseIndex(phase) >= phaseIndex(state.phase);

        next = {
            ...next,
            phase: shouldAdvance ? phase : state.phase,
            label: shouldAdvance ? detected.label : state.label,
            detail: detected.detail,
            downloadPercent: curlPercent ?? (phase === 'downloading' ? state.downloadPercent : state.downloadPercent),
            overallPercent: computeOverallPercent(
                shouldAdvance ? phase : state.phase,
                curlPercent ?? state.downloadPercent
            ),
            steps: buildSteps(shouldAdvance ? phase : state.phase, false),
        };
    } else if (curlPercent !== null) {
        next = {
            ...next,
            phase: 'downloading',
            label: 'Downloading files',
            detail: `Downloaded ${Math.round(curlPercent)}%`,
            downloadPercent: curlPercent,
            overallPercent: computeOverallPercent('downloading', curlPercent),
            steps: buildSteps('downloading', false),
        };
    } else if (state.phase !== 'complete' && state.phase !== 'failed') {
        next.overallPercent = Math.min(
            computeOverallPercent(state.phase, state.downloadPercent) + Math.floor(state.lineCount / 50),
            phaseIndex(state.phase) === phaseIndex('configuring') ? 97 : 68
        );
    }

    return next;
};

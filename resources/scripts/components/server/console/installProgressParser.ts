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
    downloadSpeed: string | null;
    downloadTotal: string | null;
    downloadReceived: string | null;
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

export const stripAnsi = (line: string): string => line.replace(/\[[0-9;]*m/g, '');

export const createInitialInstallProgress = (): InstallProgressState => ({
    phase: 'preparing',
    label: 'Preparing environment',
    detail: 'Starting installation…',
    downloadPercent: null,
    downloadSpeed: null,
    downloadTotal: null,
    downloadReceived: null,
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

interface CurlProgress {
    percent: number;
    speed: string | null;
    total: string | null;
    received: string | null;
}

const parseCurlProgress = (plain: string): CurlProgress | null => {
    // curl progress row: "  45 115M   45 52.6M    0     0  12.4M      0  0:00:09  0:00:04  0:00:05 12.9M"
    const match = plain.match(
        /^\s*(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?[KMGkm]?)\s+\d+(?:\.\d+)?\s+(\d+(?:\.\d+)?[KMGkm]?)\s+\S+\s+\S+\s+(\d+(?:\.\d+)?[KMGkm]?)/
    );
    if (match) {
        const percent = Math.min(100, Math.max(0, parseFloat(match[1])));
        const formatSize = (s: string) => (s.endsWith('M') || s.endsWith('G') || s.endsWith('K') ? `${s}B` : `${s} B`);
        return {
            percent,
            total: formatSize(match[2]),
            received: formatSize(match[3]),
            speed: formatSize(match[4]),
        };
    }

    const receivedMatch = plain.match(/(\d+(?:\.\d+)?)\s*%\s*received/i);
    if (receivedMatch) {
        return { percent: Math.min(100, Math.max(0, parseFloat(receivedMatch[1]))), speed: null, total: null, received: null };
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

    if (!plain) return true;
    if (/^[\#=\-\.\|\s\\\/]+$/.test(plain)) return true;
    if (plain.length > 60 && (plain.match(/#/g)?.length ?? 0) > 8) return true;

    // curl progress rows (raw numbers)
    if (/^\s*\d+(?:\.\d+)?[KMG]?\s+\d+(?:\.\d+)?[KMG]?\s+\d+(?:\.\d+)?[KMG]?\s+\d+(?:\.\d+)?[KMG]?\s+\d+(?:\.\d+)?/.test(plain)) return true;
    if (/^[\s\d]+(?:\.\d+)?%/.test(plain) && plain.length < 40) return true;

    return false;
};

export const parseInstallLine = (state: InstallProgressState, line: string): InstallProgressState => {
    const plain = stripAnsi(line).trim();

    if (!plain) return state;

    const detected = detectPhase(plain);
    const curlProgress = parseCurlProgress(plain);
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
        const newDownloadPercent = curlProgress?.percent ?? (phase === 'downloading' ? state.downloadPercent : state.downloadPercent);

        next = {
            ...next,
            phase: shouldAdvance ? phase : state.phase,
            label: shouldAdvance ? detected.label : state.label,
            detail: detected.detail,
            downloadPercent: newDownloadPercent,
            downloadSpeed: curlProgress?.speed ?? state.downloadSpeed,
            downloadTotal: curlProgress?.total ?? state.downloadTotal,
            downloadReceived: curlProgress?.received ?? state.downloadReceived,
            overallPercent: computeOverallPercent(
                shouldAdvance ? phase : state.phase,
                newDownloadPercent
            ),
            steps: buildSteps(shouldAdvance ? phase : state.phase, false),
        };
    } else if (curlProgress !== null) {
        next = {
            ...next,
            phase: 'downloading',
            label: 'Downloading files',
            detail: `Downloaded ${Math.round(curlProgress.percent)}%`,
            downloadPercent: curlProgress.percent,
            downloadSpeed: curlProgress.speed ?? state.downloadSpeed,
            downloadTotal: curlProgress.total ?? state.downloadTotal,
            downloadReceived: curlProgress.received ?? state.downloadReceived,
            overallPercent: computeOverallPercent('downloading', curlProgress.percent),
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

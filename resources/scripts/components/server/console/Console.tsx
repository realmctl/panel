import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ITerminalOptions, Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { SearchAddon } from 'xterm-addon-search';
import { SearchBarAddon } from 'xterm-addon-search-bar';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { Unicode11Addon } from 'xterm-addon-unicode11';
import { ScrollDownHelperAddon } from '@/plugins/XtermScrollDownHelperAddon';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { ServerContext } from '@/state/server';
import { usePermissions } from '@/plugins/usePermissions';
import { theme as th } from 'twin.macro';
import useEventListener from '@/plugins/useEventListener';
import { debounce } from 'debounce';
import { usePersistedState } from '@/plugins/usePersistedState';
import { SocketEvent, SocketRequest } from '@/components/server/events';
import classNames from 'classnames';
import { ChevronDoubleRightIcon } from '@heroicons/react/solid';

import 'xterm/css/xterm.css';
import { formatConsoleLine, formatDaemonErrorLine } from '@/components/server/console/consoleLogFormat';
import InstallProgressPanel from '@/components/server/console/InstallProgressPanel';
import {
    createInitialInstallProgress,
    InstallProgressState,
    isNoisyInstallLine,
    parseInstallLine,
    stripAnsi,
} from '@/components/server/console/installProgressParser';
import styles from './style.module.css';

/** Wings (node daemon) console prefix — shown in blue for system messages. */
const AIRPLANE_PRELUDE = '\x1B[34m\x1B[1m[Airplane]:\x1B[39m ';

/** Rewrite legacy Wings/Panel daemon output into Realm copy. Keys match wings/server/*.go strings. */
const WINGS_MESSAGE_REWRITES: Record<string, string> = {
    'Checking server disk space usage, this could take a few seconds...':
        'Measuring available storage on this node…',
    'Updating process configuration files...': 'Applying runtime configuration…',
    'Ensuring file permissions are set correctly, this could take a few seconds...':
        'Verifying file ownership and permissions…',
    'Pulling Docker container image, this could take a few minutes to complete...':
        'Downloading container image — this may take a few minutes…',
    'Finished pulling Docker container image': 'Container image download complete.',
    'Server is outputting console data too quickly -- throttling...':
        'Console output rate limited — throttling stream…',
    'Server is exceeding the assigned disk space limit, stopping process now.':
        'Storage quota exceeded — stopping server process.',
    '---------- Detected server process in a crashed state! ----------':
        '---------- Server process crashed ----------',
    'Aborting automatic restart, crash detection is disabled for this instance.':
        'Automatic restart skipped — crash recovery is disabled for this instance.',
};

const powersettings = {
    starting: 'Server marked as starting',
    started: 'Server marked as started',
    offline: 'Server marked as offline',
};

const DAEMON_PREFIX_PATTERN = /\x1B\[33m\x1B\[1m\[[^\]]+ Daemon\]:\x1B\[39m ?/g;
const SHELL_PROMPT_PATTERN = /\x1B\[1m\x1B\[33mcontainer@realm~ \x1B\[0m/g;
const PLAIN_DAEMON_PREFIX_PATTERN = /\[[^\]]+ Daemon\]: ?/g;

const customsettings: Record<string, string> = {
    // Add custom replacements here, e.g.:
    // 'Starting minecraft server version': 'Starting Realm server version',
};

const theme = {
    background: '#192024',
    foreground: '#cbd5e1',
    cursor: 'transparent',
    black: '#192024',
    red: '#f87171',
    green: '#86efac',
    yellow: '#fbbf24',
    blue: '#60a5fa',
    magenta: '#c084fc',
    cyan: '#67e8f9',
    white: '#cbd5e1',
    brightBlack: '#64748b',
    brightRed: '#fca5a5',
    brightGreen: '#bbf7d0',
    brightYellow: '#fcd34d',
    brightBlue: '#93c5fd',
    brightMagenta: '#d8b4fe',
    brightCyan: '#a5f3fc',
    brightWhite: '#f1f5f9',
    selection: 'rgba(59, 130, 246, 0.35)',
};

const terminalProps: ITerminalOptions = {
    disableStdin: true,
    cursorStyle: 'underline',
    allowTransparency: true,
    fontSize: 13,
    fontFamily: th('fontFamily.mono'),
    rows: 24,
    theme: theme,
};

export default () => {
    const TERMINAL_PRELUDE = AIRPLANE_PRELUDE;
    const ref = useRef<HTMLDivElement>(null);
    const terminal = useMemo(() => new Terminal({ ...terminalProps }), []);
    const fitAddon = new FitAddon();
    const searchAddon = new SearchAddon();
    const searchBar = new SearchBarAddon({ searchAddon });
    const webLinksAddon = new WebLinksAddon();
    const unicode11Addon = new Unicode11Addon();
    const scrollDownHelperAddon = new ScrollDownHelperAddon();
    const { connected, instance } = ServerContext.useStoreState((state) => state.socket);
    const [canSendCommands] = usePermissions(['control.console']);
    const serverId = ServerContext.useStoreState((state) => state.server.data!.id);
    const isInstalling = ServerContext.useStoreState((state) => state.server.isInstalling);
    const isTransferring = ServerContext.useStoreState((state) => state.server.data!.isTransferring);
    const [history, setHistory] = usePersistedState<string[]>(`${serverId}:command_history`, []);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [installProgress, setInstallProgress] = useState<InstallProgressState>(() => createInitialInstallProgress());
    const [showRawInstallLogs, setShowRawInstallLogs] = useState(false);
    const [recentInstallLines, setRecentInstallLines] = useState<string[]>([]);
    // SearchBarAddon has hardcoded z-index: 999 :(
    const zIndex = `
    .xterm-search-bar__addon {
        z-index: 10;
    }`;

    const normalizeConsoleLine = (line: string): string => {
        let normalized = line;

        Object.keys(customsettings).forEach((element) => {
            normalized = normalized.replace(element, customsettings[element]);
        });

        Object.entries(WINGS_MESSAGE_REWRITES).forEach(([from, to]) => {
            normalized = normalized.replace(from, to);
        });

        return normalized
            .replace(SHELL_PROMPT_PATTERN, TERMINAL_PRELUDE)
            .replace(DAEMON_PREFIX_PATTERN, TERMINAL_PRELUDE)
            .replace(PLAIN_DAEMON_PREFIX_PATTERN, TERMINAL_PRELUDE);
    };

    const handleConsoleOutput = (line: string, prelude = false) => {
        const formatted = formatConsoleLine(normalizeConsoleLine(line));

        if (!formatted) {
            return;
        }

        terminal.writeln((prelude ? TERMINAL_PRELUDE : '') + formatted);
    };

    const handleTransferStatus = (status: string) => {
        switch (status) {
            // Sent by either the source or target node if a failure occurs.
            case 'failure':
                terminal.writeln(TERMINAL_PRELUDE + formatConsoleLine('ERROR: Transfer has failed.'));
                return;
        }
    };

    const handleInstallOutput = (line: string) => {
        setInstallProgress((current) => parseInstallLine(current, line));

        if (!isNoisyInstallLine(line)) {
            const plain = stripAnsi(line).trim();
            if (plain) {
                setRecentInstallLines((prev) => [...prev.slice(-4), plain]);
            }
        }

        if (showRawInstallLogs) {
            handleConsoleOutput(line);
        }
    };

    const handleDaemonMessageDuringInstall = (line: string) => {
        const normalized = normalizeConsoleLine(line);
        setInstallProgress((current) => parseInstallLine(current, normalized));

        if (showRawInstallLogs) {
            handleConsoleOutput(line, true);
        }
    };

    const handleDaemonErrorOutput = (line: string) => {
        const formatted = formatDaemonErrorLine(line);

        if (formatted) {
            terminal.writeln(formatted);
        }
    };

    const handlePowerChangeEvent = (state: string) => {
        if (state === 'starting') {
            terminal.writeln(TERMINAL_PRELUDE + powersettings.starting);
        } else if (state === 'started') {
            terminal.writeln(TERMINAL_PRELUDE + powersettings.started);
        } else if (state === 'offline') {
            terminal.writeln(TERMINAL_PRELUDE + powersettings.offline);
        }
    };

    const handleCommandKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowUp') {
            const newIndex = Math.min(historyIndex + 1, history!.length - 1);

            setHistoryIndex(newIndex);
            e.currentTarget.value = history![newIndex] || '';

            // By default up arrow will also bring the cursor to the start of the line,
            // so we'll preventDefault to keep it at the end.
            e.preventDefault();
        }

        if (e.key === 'ArrowDown') {
            const newIndex = Math.max(historyIndex - 1, -1);

            setHistoryIndex(newIndex);
            e.currentTarget.value = history![newIndex] || '';
        }

        const command = e.currentTarget.value;
        if (e.key === 'Enter' && command.length > 0) {
            setHistory((prevHistory) => [command, ...prevHistory!].slice(0, 32));
            setHistoryIndex(-1);

            instance && instance.send('send command', command);
            e.currentTarget.value = '';
        }
    };

    const fitTerminal = () => {
        if (terminal.element) {
            fitAddon.fit();
        }
    };

    useEffect(() => {
        if (connected && ref.current && !terminal.element) {
            terminal.loadAddon(fitAddon);
            terminal.loadAddon(searchAddon);
            terminal.loadAddon(searchBar);
            terminal.loadAddon(webLinksAddon);
            terminal.loadAddon(unicode11Addon);
            terminal.loadAddon(scrollDownHelperAddon);

            terminal.open(ref.current);

            // Activate Unicode 11 for proper emoji and special character width handling
            terminal.unicode.activeVersion = '11';

            fitTerminal();
            window.requestAnimationFrame(fitTerminal);
            searchBar.addNewStyle(zIndex);

            // Add support for capturing keys
            terminal.attachCustomKeyEventHandler((e: KeyboardEvent) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
                    document.execCommand('copy');
                    return false;
                } else if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                    e.preventDefault();
                    searchBar.show();
                    return false;
                } else if (e.key === 'Escape') {
                    searchBar.hidden();
                }
                return true;
            });
        }
    }, [terminal, connected]);

    useEventListener('resize', debounce(fitTerminal, 100));

    useEffect(() => {
        if (!connected || !ref.current || !terminal.element) {
            return;
        }

        const observer = new ResizeObserver(debounce(fitTerminal, 50));
        observer.observe(ref.current);

        return () => observer.disconnect();
    }, [connected]);

    useEffect(() => {
        if (!isInstalling) {
            return;
        }

        setInstallProgress(createInitialInstallProgress());
        setShowRawInstallLogs(false);
        setRecentInstallLines([]);

        if (connected && terminal.element) {
            terminal.clear();
        }
    }, [isInstalling]);

    useEffect(() => {
        const installOutputHandler = (line: string) => handleInstallOutput(line);
        const daemonMessageHandler = (line: string) =>
            isInstalling ? handleDaemonMessageDuringInstall(line) : handleConsoleOutput(line, true);

        const listeners: Record<string, (s: string) => void> = {
            [SocketEvent.STATUS]: handlePowerChangeEvent,
            [SocketEvent.CONSOLE_OUTPUT]: handleConsoleOutput,
            [SocketEvent.INSTALL_OUTPUT]: isInstalling ? installOutputHandler : handleConsoleOutput,
            [SocketEvent.TRANSFER_LOGS]: handleConsoleOutput,
            [SocketEvent.TRANSFER_STATUS]: handleTransferStatus,
            [SocketEvent.DAEMON_MESSAGE]: daemonMessageHandler,
            [SocketEvent.DAEMON_ERROR]: handleDaemonErrorOutput,
        };

        if (connected && instance) {
            // Do not clear the console if the server is being transferred.
            if (!isTransferring && !isInstalling) {
                terminal.clear();
            }

            Object.keys(listeners).forEach((key: string) => {
                instance.addListener(key, listeners[key]);
            });
            instance.send(SocketRequest.SEND_LOGS);
        }

        return () => {
            if (instance) {
                Object.keys(listeners).forEach((key: string) => {
                    instance.removeListener(key, listeners[key]);
                });
            }
        };
    }, [connected, instance, isInstalling, showRawInstallLogs, isTransferring]);

    return (
        <div className={classNames(styles.terminal, 'relative')}>
            <SpinnerOverlay visible={!connected} size={'large'} />
            <div className={classNames(styles.container, styles.overflows_container)}>
                <div
                    className={styles.terminal_shell}
                    style={{ display: isInstalling && !showRawInstallLogs ? 'none' : undefined }}
                >
                    <div id={styles.terminal} ref={ref} />
                    {isInstalling && showRawInstallLogs && (
                        <button
                            type={'button'}
                            onClick={() => setShowRawInstallLogs(false)}
                            className={styles.install_log_toggle}
                        >
                            <ChevronDoubleRightIcon className={'w-3 h-3 -rotate-90'} />
                            Hide logs
                        </button>
                    )}
                </div>
                {isInstalling && !showRawInstallLogs && (
                    <InstallProgressPanel
                        progress={installProgress}
                        onToggleRawLogs={() => setShowRawInstallLogs(true)}
                    />
                )}
            </div>
            {canSendCommands && !isInstalling && (
                <div className={classNames('relative', styles.overflows_container)}>
                    <input
                        className={classNames('peer', styles.command_input)}
                        type={'text'}
                        placeholder={'Enter a command...'}
                        aria-label={'Console command input.'}
                        disabled={!instance || !connected}
                        onKeyDown={handleCommandKeyDown}
                        autoCorrect={'off'}
                        autoCapitalize={'none'}
                    />
                    <div
                        className={classNames(
                            'text-gray-100 peer-focus:text-gray-50 peer-focus:animate-pulse',
                            styles.command_icon
                        )}
                    >
                        <span className={'font-mono text-sm font-bold'}>$</span>
                    </div>
                </div>
            )}
        </div>
    );
};

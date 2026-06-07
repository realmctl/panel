import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Link, useHistory, useRouteMatch } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentDots, faQuestionCircle, faChevronDown, faCogs, faSignOutAlt, faUser, faSearch, faExchangeAlt } from '@fortawesome/free-solid-svg-icons';
import { Actions, useStoreActions, useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import debounce from 'debounce';
import useSWR from 'swr';
import getServers from '@/api/getServers';
import { Server } from '@/api/server/getServer';
import http from '@/api/http';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import Avatar from '@/components/Avatar';
import { ip } from '@/lib/formatters';
import { ServerContext } from '@/state/server';
import { REALM_LOGO } from '@/lib/branding';

const SERVER_SWITCHER_CACHE_KEY = '/api/client/servers/switcher';
const SERVER_SWITCHER_CACHE_MS = 5 * 60 * 1000;

const ServerSwitcher = () => {
    const history = useHistory();
    const serverMatch = useRouteMatch<{ id: string }>('/server/:id');
    const currentServerName = ServerContext.useStoreState((state) => state.server.data?.name) || 'Switch Server';
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const { data: servers = [], isValidating } = useSWR<Server[]>(
        open ? SERVER_SWITCHER_CACHE_KEY : null,
        async () => (await getServers({ perPage: 50 })).items,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            dedupingInterval: SERVER_SWITCHER_CACHE_MS,
        }
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={'relative ml-4'} ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className={'flex items-center gap-2 text-sm text-neutral-300 hover:text-neutral-100 transition-colors duration-150 bg-neutral-800/50 border border-realm-border rounded-lg px-3 py-1.5 cursor-pointer'}
            >
                <FontAwesomeIcon icon={faExchangeAlt} className={'text-xs'} />
                <span className={'max-w-[160px] truncate'}>{currentServerName}</span>
                <FontAwesomeIcon icon={faChevronDown} className={'text-xs'} />
            </button>

            {open && (
                <div
                    className={'absolute left-0 top-full mt-2 w-72 rounded-lg shadow-lg py-2 z-50 border border-realm-border bg-realm-popover max-h-80 overflow-y-auto'}
                >
                    {isValidating && servers.length === 0 ? (
                        <div className={'px-4 py-3 text-sm text-neutral-400 text-center'}>Loading...</div>
                    ) : servers.length === 0 ? (
                        <div className={'px-4 py-3 text-sm text-neutral-400 text-center'}>No servers found</div>
                    ) : (
                        servers.map((server) => (
                            <button
                                key={server.uuid}
                                onClick={() => {
                                    setOpen(false);
                                    history.push(`/server/${server.id}`);
                                }}
                                className={`flex items-center w-full px-4 py-2 text-left border-0 cursor-pointer transition-colors duration-150 ${
                                    serverMatch?.params.id === server.id
                                        ? 'bg-blue-500/20 text-neutral-100'
                                        : 'bg-transparent text-neutral-300 hover:bg-neutral-700/50 hover:text-neutral-100'
                                }`}
                            >
                                <div className={'flex-1 min-w-0'}>
                                    <p className={'text-sm truncate m-0'}>{server.name}</p>
                                    <p className={'text-xs text-neutral-400 m-0 mt-0.5'}>
                                        {server.allocations
                                            .filter((alloc) => alloc.isDefault)
                                            .map((allocation) => (
                                                <span key={allocation.ip + allocation.port.toString()}>
                                                    {allocation.alias || ip(allocation.ip)}:{allocation.port}
                                                </span>
                                            ))}
                                    </p>
                                </div>
                                {serverMatch?.params.id === server.id && (
                                    <span className={'text-xs text-blue-400 ml-2 flex-none'}>Current</span>
                                )}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default () => {
    const fetchGroups = useStoreActions((actions: Actions<ApplicationStore>) => actions.serverGroups.fetchGroups);
    const name = useStoreState((state: ApplicationStore) => state.settings.data!.name);
    const rootAdmin = useStoreState((state: ApplicationStore) => state.user.data!.rootAdmin);
    const userName = useStoreState((state: ApplicationStore) => state.user.data!.username);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Server[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const history = useHistory();

    // Detect if we're on a server page
    const serverMatch = useRouteMatch<{ id: string }>('/server/:id');
    const isOnServerPage = !!serverMatch;

    useEffect(() => {
        fetchGroups();
    }, [fetchGroups]);

    const onTriggerLogout = () => {
        setIsLoggingOut(true);
        http.post('/auth/logout').finally(() => {
            // @ts-expect-error this is valid
            window.location = '/';
        });
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setSearchOpen(false);
                setSearchTerm('');
                setSearchResults([]);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus input when search opens
    useEffect(() => {
        if (searchOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [searchOpen]);

    // Debounced search
    const performSearch = React.useCallback(
        debounce((term: string) => {
            if (term.length < 3) {
                setSearchResults([]);
                setIsSearching(false);
                return;
            }
            setIsSearching(true);
            getServers({ query: term, type: rootAdmin ? 'admin-all' : undefined })
                .then((servers) => setSearchResults(servers.items.filter((_, index) => index < 5)))
                .catch(() => setSearchResults([]))
                .finally(() => setIsSearching(false));
        }, 500),
        [rootAdmin]
    );

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        performSearch(value);
    };

    const handleResultClick = (serverId: string) => {
        setSearchOpen(false);
        setSearchTerm('');
        setSearchResults([]);
        history.push(`/server/${serverId}`);
    };

    return (
        <div className={'w-full border-b border-realm-border/50 bg-realm-card'}>
            <SpinnerOverlay visible={isLoggingOut} />
            <div className={'w-full flex items-center h-[3.5rem] max-w-[1200px] mx-4 xl:mx-auto'}>
                {/* Brand / Logo */}
                <div className={'flex items-center'}>
                    <Link
                        to={'/'}
                        className={'flex items-center no-underline'}
                    >
                        <img
                            src={REALM_LOGO}
                            className={'h-6'}
                            alt={name}
                            style={{ filter: 'brightness(0) invert(1)' }}
                        />
                    </Link>

                    {/* Server switcher - only visible on server pages */}
                    {isOnServerPage && <ServerSwitcher />}
                </div>

                {/* Right side navigation */}
                <div className={'flex items-center ml-auto gap-4'}>
                    {/* Inline expanding search */}
                    <div className={'relative flex items-center'} ref={searchRef}>
                        <div
                            className={`flex items-center overflow-hidden transition-all duration-300 ease-in-out ${
                                searchOpen ? 'w-64' : 'w-0'
                            }`}
                        >
                            <input
                                ref={searchInputRef}
                                type={'text'}
                                value={searchTerm}
                                onChange={handleSearchChange}
                                placeholder={'Search servers...'}
                                className={'w-full h-8 px-3 text-sm text-neutral-100 bg-neutral-800/60 border border-realm-border rounded-lg outline-none focus:border-blue-500 transition-colors duration-150 placeholder-neutral-500'}
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                        setSearchOpen(false);
                                        setSearchTerm('');
                                        setSearchResults([]);
                                    }
                                }}
                            />
                        </div>
                        <button
                            onClick={() => setSearchOpen(!searchOpen)}
                            className={'flex items-center justify-center w-8 h-8 text-neutral-400 hover:text-neutral-100 bg-transparent border-0 cursor-pointer transition-colors duration-150'}
                        >
                            <FontAwesomeIcon icon={faSearch} />
                        </button>

                        {/* Search results dropdown */}
                        {searchOpen && searchResults.length > 0 && (
                            <div
                                className={'absolute right-0 top-full mt-2 w-80 rounded-lg shadow-lg py-2 z-50 border border-realm-border bg-realm-popover'}
                            >
                                {searchResults.map((server) => (
                                    <button
                                        key={server.uuid}
                                        onClick={() => handleResultClick(server.identifier)}
                                        className={'flex items-center w-full px-4 py-2 text-left bg-transparent border-0 cursor-pointer hover:bg-neutral-700/50 transition-colors duration-150'}
                                    >
                                        <div className={'flex-1 min-w-0'}>
                                            <p className={'text-sm text-neutral-100 truncate m-0'}>{server.name}</p>
                                            <p className={'text-xs text-neutral-400 m-0 mt-0.5'}>
                                                {server.allocations
                                                    .filter((alloc) => alloc.isDefault)
                                                    .map((allocation) => (
                                                        <span key={allocation.ip + allocation.port.toString()}>
                                                            {allocation.alias || ip(allocation.ip)}:{allocation.port}
                                                        </span>
                                                    ))}
                                            </p>
                                        </div>
                                        <span className={'text-xs py-1 px-2 bg-cyan-800 text-cyan-100 rounded ml-2 flex-none'}>
                                            {server.node}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Loading indicator */}
                        {searchOpen && isSearching && (
                            <div
                                className={'absolute right-0 top-full mt-2 w-80 rounded-lg shadow-lg py-3 z-50 border border-realm-border bg-realm-popover text-center text-sm text-neutral-400'}
                            >
                                Searching...
                            </div>
                        )}
                    </div>

                    {/* Give us feedback */}
                    <a
                        href={'#'}
                        className={'flex items-center gap-2 text-sm text-neutral-300 hover:text-neutral-100 transition-colors duration-150 no-underline'}
                    >
                        <FontAwesomeIcon icon={faCommentDots} />
                        <span>Give us feedback</span>
                    </a>

                    {/* Help & Support */}
                    <a
                        href={'#'}
                        className={'flex items-center gap-2 text-sm text-neutral-300 hover:text-neutral-100 transition-colors duration-150 no-underline'}
                    >
                        <FontAwesomeIcon icon={faQuestionCircle} />
                        <span>Help & Support</span>
                    </a>

                    {/* User dropdown */}
                    <div className={'relative'} ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className={'flex items-center gap-2 text-sm text-neutral-300 hover:text-neutral-100 transition-colors duration-150 bg-transparent border-0 cursor-pointer px-0'}
                        >
                            <span className={'flex items-center w-6 h-6'}>
                                <Avatar.User />
                            </span>
                            <span>{userName}</span>
                            <FontAwesomeIcon icon={faChevronDown} className={'text-xs'} />
                        </button>

                        {dropdownOpen && (
                            <div className={'absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg py-1 z-50 border border-realm-border bg-realm-popover'}>
                                <Link
                                    to={'/account'}
                                    className={'flex items-center gap-2 px-4 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 no-underline transition-colors duration-150'}
                                >
                                    <FontAwesomeIcon icon={faUser} className={'w-4'} />
                                    <span>My Account</span>
                                </Link>
                                {rootAdmin && (
                                    <>
                                        <Link
                                            to={'/admin-preview'}
                                            className={'flex items-center gap-2 px-4 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 no-underline transition-colors duration-150'}
                                        >
                                            <FontAwesomeIcon icon={faCogs} className={'w-4'} />
                                            <span>Admin</span>
                                        </Link>
                                        <a
                                            href={'/admin'}
                                            className={'flex items-center gap-2 px-4 py-2 text-sm text-neutral-500 hover:text-neutral-300 hover:bg-neutral-700/50 no-underline transition-colors duration-150'}
                                        >
                                            <FontAwesomeIcon icon={faCogs} className={'w-4'} />
                                            <span>Legacy Admin</span>
                                        </a>
                                    </>
                                )}
                                <button
                                    onClick={onTriggerLogout}
                                    className={'flex items-center gap-2 px-4 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 w-full border-0 bg-transparent cursor-pointer transition-colors duration-150'}
                                >
                                    <FontAwesomeIcon icon={faSignOutAlt} className={'w-4'} />
                                    <span>Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

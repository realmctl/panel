import http from '@/api/http';
import { SetupConfiguration } from '@/state/settings';

export interface SetupStatus extends SetupConfiguration {
    context: {
        hasUsers: boolean;
        locationId: number | null;
        nodeId: number | null;
        nodeName: string | null;
        allocationCount: number;
        serverCount: number;
        locales: Record<string, string>;
        panelName: string;
        panelLocale: string;
        environment: SetupEnvironmentDefaults;
        testingMode: boolean;
    };
}

export interface SetupEnvironmentDefaults {
    author: string;
    url: string;
    timezone: string;
    cache: string;
    session: string;
    queue: string;
    redisHost: string;
    redisPort: number;
    configured: boolean;
}

export interface CreateAdminData {
    nameFirst: string;
    nameLast: string;
    email: string;
    username: string;
    password: string;
    passwordConfirmation: string;
}

export interface CreateAdminResponse {
    complete: boolean;
    intended?: string;
    user?: {
        uuid: string;
        username: string;
        email: string;
        name_first: string;
        root_admin: boolean;
        use_totp: boolean;
        language: string;
        created_at: string;
        updated_at: string;
    };
}

const unwrap = <T>(response: { data: { data: T } }): T => response.data.data;

export const getSetupStatus = (): Promise<SetupStatus> =>
    http.get('/setup/status').then((response) => unwrap<SetupStatus>(response));

export const acknowledgeWelcome = (): Promise<SetupStatus> =>
    http.post('/setup/welcome').then((response) => unwrap<SetupStatus>(response));

export const configureSetupEnvironment = (data: {
    author: string;
    url: string;
    timezone: string;
    cache?: string;
    session?: string;
    queue?: string;
    redisHost?: string;
    redisPort?: number;
    redisPassword?: string;
}): Promise<SetupStatus> =>
    http.post('/setup/environment', data).then((response) => unwrap<SetupStatus>(response));

export const createSetupAdmin = (data: CreateAdminData): Promise<CreateAdminResponse> =>
    http.get('/sanctum/csrf-cookie').then(() =>
        http.post('/setup/admin', {
            name_first: data.nameFirst,
            name_last: data.nameLast,
            email: data.email,
            username: data.username,
            password: data.password,
            password_confirmation: data.passwordConfirmation,
        }).then((response) => response.data.data)
    );

export const updateSetupSettings = (data: {
    name: string;
    locale: string;
    registrationEnabled: boolean;
}): Promise<SetupStatus> =>
    http.post('/setup/settings', {
        'app:name': data.name,
        'app:locale': data.locale,
        'pterodactyl:auth:registration_enabled': data.registrationEnabled ? 'true' : 'false',
    }).then((response) => unwrap<SetupStatus>(response));

export const createSetupLocation = (data: { short: string; long: string }): Promise<SetupStatus> =>
    http.post('/setup/location', data).then((response) => unwrap<SetupStatus>(response));

export const continueSetupLocation = (): Promise<SetupStatus> =>
    http.post('/setup/location/continue').then((response) => unwrap<SetupStatus>(response));

export const createSetupNode = (data: Record<string, unknown>): Promise<SetupStatus> =>
    http.post('/setup/node', data).then((response) => unwrap<SetupStatus>(response));

export const getNodeConfiguration = (nodeId: number): Promise<{ yaml: string; json: string }> =>
    http.get(`/setup/node/${nodeId}/configuration`).then((response) => unwrap(response));

export const verifySetupNode = (nodeId: number): Promise<SetupStatus & { version?: string }> =>
    http.post(`/setup/node/${nodeId}/verify`).then((response) => unwrap(response));

export const createSetupAllocations = (
    nodeId: number,
    data: { allocationIp: string; allocationAlias?: string; allocationPorts: string[] }
): Promise<SetupStatus> =>
    http.post(`/setup/node/${nodeId}/allocations`, {
        allocation_ip: data.allocationIp,
        allocation_alias: data.allocationAlias || null,
        allocation_ports: data.allocationPorts,
    }).then((response) => unwrap<SetupStatus>(response));

export const skipSetupServer = (): Promise<SetupStatus> =>
    http.post('/setup/skip-server').then((response) => unwrap<SetupStatus>(response));

export const completeSetup = (): Promise<{ status: SetupStatus; intended: string }> =>
    http.post('/setup/complete').then((response) => ({
        status: unwrap<SetupStatus>(response),
        intended: response.data.intended || '/',
    }));

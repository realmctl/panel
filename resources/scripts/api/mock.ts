/**
 * Dev-only mock interceptor for the /api/client endpoint.
 * Returns fake server data so you can develop the UI without a working node.
 *
 * To enable: set MOCK_SERVERS=true in your .env and rebuild frontend,
 * or just import and call `enableMockServers(http)` in http.ts during development.
 */
import { AxiosInstance, AxiosResponse } from 'axios';

const mockServers = [
    {
        object: 'server',
        attributes: {
            server_owner: true,
            identifier: 'mock1abc',
            __deprecated_uuid_short: 'mock1abc',
            server_identifier: 'serv_mock1abc',
            internal_id: 1,
            uuid: '11111111-1111-1111-1111-111111111111',
            name: 'Minecraft Survival',
            node: 'Mock Node',
            node_location: {
                ip: '188.114.96.3',
                country_code: 'NL',
                country: 'Netherlands',
                city: 'Amsterdam',
                region: 'North Holland',
            },
            is_node_under_maintenance: false,
            sftp_details: { ip: '0.0.0.0', port: 2022 },
            description: 'A vanilla survival Minecraft server',
            limits: { memory: 2048, swap: 0, disk: 10240, io: 500, cpu: 100, threads: null, oom_disabled: false },
            invocation: 'java -Xms128M -Xmx2048M -jar server.jar',
            docker_image: 'ghcr.io/realmctl/yolks:java_17',
            egg_features: ['eula', 'java_version'],
            egg_name: 'Paper',
            egg_background: 'minecraft.png',
            egg_category: 'minecraft',
            feature_limits: { databases: 2, allocations: 3, backups: 2, subdomains: 0 },
            status: null,
            is_suspended: false,
            is_installing: false,
            is_transferring: false,
            relationships: {
                allocations: {
                    object: 'list',
                    data: [
                        { object: 'allocation', attributes: { id: 1, ip: '188.114.96.3', ip_alias: null, port: 25565, notes: null, is_default: true } },
                    ],
                },
                variables: { object: 'list', data: [] },
            },
        },
    },
    {
        object: 'server',
        attributes: {
            server_owner: true,
            identifier: 'mock2def',
            __deprecated_uuid_short: 'mock2def',
            server_identifier: 'serv_mock2def',
            internal_id: 2,
            uuid: '22222222-2222-2222-2222-222222222222',
            name: 'Rust Server',
            node: 'Mock Node',
            node_location: {
                ip: '188.114.96.3',
                country_code: 'NL',
                country: 'Netherlands',
                city: 'Amsterdam',
                region: 'North Holland',
            },
            is_node_under_maintenance: false,
            sftp_details: { ip: '0.0.0.0', port: 2022 },
            description: 'Rust dedicated server',
            limits: { memory: 4096, swap: 0, disk: 20480, io: 500, cpu: 200, threads: null, oom_disabled: false },
            invocation: './RustDedicated -batchmode',
            docker_image: 'ghcr.io/realmctl/games:rust',
            egg_features: ['steam_disk_space'],
            egg_name: 'Rust',
            egg_background: 'rust.jpg',
            feature_limits: { databases: 1, allocations: 2, backups: 3, subdomains: 0 },
            status: null,
            is_suspended: false,
            is_installing: false,
            is_transferring: false,
            relationships: {
                allocations: {
                    object: 'list',
                    data: [
                        { object: 'allocation', attributes: { id: 2, ip: '188.114.96.3', ip_alias: null, port: 28015, notes: null, is_default: true } },
                    ],
                },
                variables: { object: 'list', data: [] },
            },
        },
    },
    {
        object: 'server',
        attributes: {
            server_owner: true,
            identifier: 'mock3ghi',
            __deprecated_uuid_short: 'mock3ghi',
            server_identifier: 'serv_mock3ghi',
            internal_id: 3,
            uuid: '33333333-3333-3333-3333-333333333333',
            name: 'FiveM Roleplay',
            node: 'Mock Node',
            node_location: {
                ip: '188.114.96.3',
                country_code: 'NL',
                country: 'Netherlands',
                city: 'Amsterdam',
                region: 'North Holland',
            },
            is_node_under_maintenance: false,
            sftp_details: { ip: '0.0.0.0', port: 2022 },
            description: 'GTA V FiveM RP server',
            limits: { memory: 4096, swap: 0, disk: 30720, io: 500, cpu: 200, threads: null, oom_disabled: false },
            invocation: './run.sh',
            docker_image: 'ghcr.io/realmctl/games:fivem',
            egg_features: [],
            egg_name: 'FiveM',
            egg_background: 'fivem.jpeg',
            feature_limits: { databases: 2, allocations: 5, backups: 3, subdomains: 0 },
            status: 'suspended',
            is_suspended: true,
            is_installing: false,
            is_transferring: false,
            relationships: {
                allocations: {
                    object: 'list',
                    data: [
                        { object: 'allocation', attributes: { id: 3, ip: '188.114.96.3', ip_alias: null, port: 30120, notes: null, is_default: true } },
                    ],
                },
                variables: { object: 'list', data: [] },
            },
        },
    },
    {
        object: 'server',
        attributes: {
            server_owner: true,
            identifier: 'mock4jkl',
            __deprecated_uuid_short: 'mock4jkl',
            server_identifier: 'serv_mock4jkl',
            internal_id: 4,
            uuid: '44444444-4444-4444-4444-444444444444',
            name: 'CS2 Competitive',
            node: 'Mock Node',
            node_location: {
                ip: '188.114.96.3',
                country_code: 'NL',
                country: 'Netherlands',
                city: 'Amsterdam',
                region: 'North Holland',
            },
            is_node_under_maintenance: false,
            sftp_details: { ip: '0.0.0.0', port: 2022 },
            description: 'Counter-Strike 2 competitive server',
            limits: { memory: 3072, swap: 0, disk: 15360, io: 500, cpu: 150, threads: null, oom_disabled: false },
            invocation: './srcds_run -game csgo',
            docker_image: 'ghcr.io/realmctl/games:source',
            egg_features: ['gsl_token', 'steam_disk_space'],
            egg_name: 'Counter-Strike 2',
            egg_background: 'csgo.jpg',
            feature_limits: { databases: 1, allocations: 2, backups: 2, subdomains: 0 },
            status: null,
            is_suspended: false,
            is_installing: false,
            is_transferring: false,
            relationships: {
                allocations: {
                    object: 'list',
                    data: [
                        { object: 'allocation', attributes: { id: 4, ip: '188.114.96.3', ip_alias: null, port: 27015, notes: null, is_default: true } },
                    ],
                },
                variables: { object: 'list', data: [] },
            },
        },
    },
    {
        object: 'server',
        attributes: {
            server_owner: true,
            identifier: 'mock5mno',
            __deprecated_uuid_short: 'mock5mno',
            server_identifier: 'serv_mock5mno',
            internal_id: 5,
            uuid: '55555555-5555-5555-5555-555555555555',
            name: 'Valheim Dedicated',
            node: 'Mock Node',
            node_location: {
                ip: '188.114.96.3',
                country_code: 'NL',
                country: 'Netherlands',
                city: 'Amsterdam',
                region: 'North Holland',
            },
            is_node_under_maintenance: false,
            sftp_details: { ip: '0.0.0.0', port: 2022 },
            description: 'Valheim dedicated server for the boys',
            limits: { memory: 2048, swap: 0, disk: 8192, io: 500, cpu: 100, threads: null, oom_disabled: false },
            invocation: './valheim_server.x86_64',
            docker_image: 'ghcr.io/realmctl/games:source',
            egg_features: ['steam_disk_space'],
            egg_name: 'Valheim',
            egg_background: 'valheim.jpeg',
            feature_limits: { databases: 0, allocations: 1, backups: 2, subdomains: 0 },
            status: null,
            is_suspended: false,
            is_installing: false,
            is_transferring: false,
            relationships: {
                allocations: {
                    object: 'list',
                    data: [
                        { object: 'allocation', attributes: { id: 5, ip: '188.114.96.3', ip_alias: null, port: 2456, notes: null, is_default: true } },
                    ],
                },
                variables: { object: 'list', data: [] },
            },
        },
    },
];

const mockResourceUsage: Record<string, any> = {
    '11111111-1111-1111-1111-111111111111': { current_state: 'running', is_suspended: false, resources: { memory_bytes: 1234567890, cpu_absolute: 12.5, disk_bytes: 3456789012, network_rx_bytes: 123456, network_tx_bytes: 654321, uptime: 86400000 } },
    '22222222-2222-2222-2222-222222222222': { current_state: 'running', is_suspended: false, resources: { memory_bytes: 2345678901, cpu_absolute: 45.2, disk_bytes: 8765432100, network_rx_bytes: 987654, network_tx_bytes: 456789, uptime: 172800000 } },
    '33333333-3333-3333-3333-333333333333': { current_state: 'offline', is_suspended: true, resources: { memory_bytes: 0, cpu_absolute: 0, disk_bytes: 5432109876, network_rx_bytes: 0, network_tx_bytes: 0, uptime: 0 } },
    '44444444-4444-4444-4444-444444444444': { current_state: 'offline', is_suspended: false, resources: { memory_bytes: 0, cpu_absolute: 0, disk_bytes: 2345678901, network_rx_bytes: 0, network_tx_bytes: 0, uptime: 0 } },
    '55555555-5555-5555-5555-555555555555': { current_state: 'starting', is_suspended: false, resources: { memory_bytes: 567890123, cpu_absolute: 78.9, disk_bytes: 1234567890, network_rx_bytes: 12345, network_tx_bytes: 54321, uptime: 5000 } },
};

export function enableMockServers(http: AxiosInstance): void {
    http.interceptors.request.use((config) => {
        // Mock the server list endpoint
        if (config.url === '/api/client' && config.method === 'get') {
            const response: AxiosResponse = {
                data: {
                    object: 'list',
                    data: mockServers,
                    meta: {
                        pagination: {
                            total: mockServers.length,
                            count: mockServers.length,
                            per_page: 50,
                            current_page: 1,
                            total_pages: 1,
                            links: {},
                        },
                    },
                },
                status: 200,
                statusText: 'OK',
                headers: {},
                config,
            };

            return Promise.reject({ __MOCK__: true, response }) as any;
        }

        // Mock resource usage endpoint
        const resourceMatch = config.url?.match(/\/api\/client\/servers\/([^/]+)\/resources/);
        if (resourceMatch) {
            const serverId = resourceMatch[1];
            // Find the server UUID by identifier
            const server = mockServers.find((s) => s.attributes.identifier === serverId || s.attributes.uuid === serverId);
            const uuid = server?.attributes.uuid || '';
            const usage = mockResourceUsage[uuid] || mockResourceUsage['44444444-4444-4444-4444-444444444444'];

            const response: AxiosResponse = {
                data: { object: 'stats', attributes: usage },
                status: 200,
                statusText: 'OK',
                headers: {},
                config,
            };

            return Promise.reject({ __MOCK__: true, response }) as any;
        }

        return config;
    });

    // Intercept the "error" and return the mock response instead
    http.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error?.__MOCK__) {
                return Promise.resolve(error.response);
            }
            return Promise.reject(error);
        }
    );

    console.log('%c[Mock] Server mocking enabled for UI development', 'color: #3b82f6; font-weight: bold;');
}

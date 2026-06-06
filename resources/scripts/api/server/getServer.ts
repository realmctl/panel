import http, { FractalResponseData, FractalResponseList } from '@/api/http';
import { rawDataToServerAllocation, rawDataToServerEggVariable } from '@/api/transformers';
import { ServerEggVariable, ServerStatus } from '@/api/server/types';
import { Identifier } from '@/api/definitions';

export type AllocationProtocol = 'tcp' | 'udp' | 'both';

export interface NodeLocation {
    ip: string;
    countryCode: string | null;
    country: string | null;
    city: string | null;
    region: string | null;
}

export interface Allocation {
    id: number;
    ip: string;
    alias: string | null;
    port: number;
    notes: string | null;
    isDefault: boolean;
    whitelistEnabled: boolean;
    protocol: AllocationProtocol;
    allowedIps: string[];
}

export interface Server {
    /**
     * This value is determined by the presence of the `PTERODACTYL_USE_SERVER_IDENTIFIERS` environment
     * variable which changes what the API can respond with. It will eventually be removed and referenced
     * as the "identifier" key, but this allows users to slowly opt-in to these new URLs and trial it
     * as they wish.
     *
     * @deprecated this is the "uuid_short" which will be removed in 2.0, prefer use of "identifier"
     */
    id: string | Identifier<'serv'>;
    identifier: Identifier<'serv'>; // Set from "server_identifier" and should be used moving forward to reference a server.
    internalId: number | string;
    /**
     * Exists only to maintain support in cases where the short-uuid is necessary for server reference
     * and cannot be easily replaced with "identifier".
     *
     * @deprecated
     */
    __deprecatedUuidShort: string;
    uuid: string;
    name: string;
    node: string;
    nodeLocation: NodeLocation | null;
    isNodeUnderMaintenance: boolean;
    status: ServerStatus;
    sftpDetails: {
        ip: string;
        port: number;
    };
    invocation: string;
    dockerImage: string;
    description: string;
    limits: {
        memory: number;
        swap: number;
        disk: number;
        io: number;
        cpu: number;
        threads: string;
    };
    eggFeatures: string[];
    eggName: string;
    eggBackground: string | null;
    eggCategory: string | null;
    featureLimits: {
        databases: number;
        allocations: number;
        backups: number;
        subdomains: number;
    };
    isTransferring: boolean;
    variables: ServerEggVariable[];
    allocations: Allocation[];
}

export const rawDataToServerObject = ({ attributes: data }: FractalResponseData): Server => ({
    id: data.identifier,
    identifier: data.server_identifier,
    internalId: data.internal_id,
    __deprecatedUuidShort: data.__deprecated_uuid_short,
    uuid: data.uuid,
    name: data.name,
    node: data.node,
    nodeLocation: data.node_location
        ? {
              ip: data.node_location.ip,
              countryCode: data.node_location.country_code ?? null,
              country: data.node_location.country ?? null,
              city: data.node_location.city ?? null,
              region: data.node_location.region ?? null,
          }
        : null,
    isNodeUnderMaintenance: data.is_node_under_maintenance,
    status: data.status,
    invocation: data.invocation,
    dockerImage: data.docker_image,
    sftpDetails: {
        ip: data.sftp_details.ip,
        port: data.sftp_details.port,
    },
    description: data.description ? (data.description.length > 0 ? data.description : null) : null,
    limits: { ...data.limits },
    eggFeatures: data.egg_features || [],
    eggName: data.egg_name || '',
    eggBackground: data.egg_background || null,
    eggCategory: data.egg_category || null,
    featureLimits: {
        databases: data.feature_limits?.databases ?? 0,
        allocations: data.feature_limits?.allocations ?? 0,
        backups: data.feature_limits?.backups ?? 0,
        subdomains: data.feature_limits?.subdomains ?? 0,
    },
    isTransferring: data.is_transferring,
    variables: ((data.relationships?.variables as FractalResponseList | undefined)?.data || []).map(
        rawDataToServerEggVariable
    ),
    allocations: ((data.relationships?.allocations as FractalResponseList | undefined)?.data || []).map(
        rawDataToServerAllocation
    ),
});

export default (uuid: string): Promise<[Server, string[]]> => {
    return new Promise((resolve, reject) => {
        http.get(`/api/client/servers/${uuid}`)
            .then(({ data }) =>
                resolve([
                    rawDataToServerObject(data),
                    // eslint-disable-next-line camelcase
                    data.meta?.is_server_owner ? ['*'] : data.meta?.user_permissions || [],
                ])
            )
            .catch(reject);
    });
};

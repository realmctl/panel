import http from '@/api/http';
import { Allocation, AllocationProtocol } from '@/api/server/getServer';
import { rawDataToServerAllocation } from '@/api/transformers';

export interface WhitelistPayload {
    whitelistEnabled: boolean;
    protocol: AllocationProtocol;
    allowedIps: string[];
}

export default (serverUuid: string, allocationId: number, payload: WhitelistPayload): Promise<Allocation> => {
    return http
        .post(`/api/client/servers/${serverUuid}/network/allocations/${allocationId}/whitelist`, {
            whitelist_enabled: payload.whitelistEnabled,
            protocol: payload.protocol,
            allowed_ips: payload.allowedIps,
        })
        .then(({ data }) => rawDataToServerAllocation(data));
};

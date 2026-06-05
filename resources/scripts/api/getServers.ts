import { rawDataToServerObject, Server } from '@/api/server/getServer';
import http, { getPaginationSet, PaginatedResult } from '@/api/http';

interface QueryParams {
    query?: string;
    page?: number;
    perPage?: number;
    type?: string;
}

const getServers = ({ query, perPage, ...params }: QueryParams): Promise<PaginatedResult<Server>> => {
    return new Promise((resolve, reject) => {
        http.get('/api/client', {
            params: {
                'filter[*]': query,
                ...(perPage !== undefined ? { per_page: perPage } : {}),
                ...params,
            },
        })
            .then(({ data }) =>
                resolve({
                    items: (data.data || []).map((datum: any) => rawDataToServerObject(datum)),
                    pagination: getPaginationSet(data.meta.pagination),
                })
            )
            .catch(reject);
    });
};

export default getServers;

const MAX_PER_PAGE = 100;

export const getAllServers = async (params: Omit<QueryParams, 'page' | 'perPage'> = {}): Promise<Server[]> => {
    const firstPage = await getServers({ ...params, page: 1, perPage: MAX_PER_PAGE });

    if (firstPage.pagination.totalPages <= 1) {
        return firstPage.items;
    }

    const remainingPages = await Promise.all(
        Array.from({ length: firstPage.pagination.totalPages - 1 }, (_, index) =>
            getServers({ ...params, page: index + 2, perPage: MAX_PER_PAGE })
        )
    );

    return remainingPages.reduce<Server[]>(
        (servers, page) => servers.concat(page.items),
        [...firstPage.items]
    );
};

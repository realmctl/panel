/**
 * Strip react-router path params for user-facing navigation URLs.
 * e.g. /settings/:tab(general|details)? -> /settings
 */
export const toNavigationPath = (path: string): string =>
    path
        .replace(/\/:\w+\([^)]*\)\?/g, '')
        .replace(/\/:\w+\?/g, '')
        .replace(/\/:\w+\([^)]*\)/g, '')
        .replace(/\/:\w+/g, '') || '/';

export const resolveNavUrl = (baseUrl: string, routePath: string): string => {
    const segment = toNavigationPath(routePath);

    if (segment === '/') {
        return baseUrl.replace(/\/$/, '') || baseUrl;
    }

    return `${baseUrl.replace(/\/$/, '')}${segment}`;
};

export const isNavRouteActive = (
    routePath: string,
    pathname: string,
    baseUrl: string,
    exact?: boolean
): boolean => {
    const navUrl = resolveNavUrl(baseUrl, routePath);
    const normalizedPath = pathname.replace(/\/$/, '');
    const normalizedNav = navUrl.replace(/\/$/, '');

    if (routePath.includes(':')) {
        return normalizedPath === normalizedNav || normalizedPath.startsWith(`${normalizedNav}/`);
    }

    if (exact) {
        return normalizedPath === normalizedNav;
    }

    return normalizedPath === normalizedNav || normalizedPath.startsWith(`${normalizedNav}/`);
};

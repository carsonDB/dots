/**
 * Interface for URL-based navigation state
 */
export interface NavigationState {
    searchQuery?: string;
    segmentPath?: string[];
    level?: number;
}

/**
 * Utility functions for URL parameter handling and navigation state management
 */

/**
 * Parses URL parameters to extract navigation state
 */
export function parseNavigationState(
    searchParams: URLSearchParams,
    pathSegments: string[]
): NavigationState {
    const searchQuery = searchParams.get('q') || undefined;
    const segmentPath = pathSegments.length > 0 ? pathSegments : undefined;
    const level = segmentPath ? segmentPath.length : 0;

    return {
        searchQuery,
        segmentPath,
        level
    };
}

/**
 * Builds URL with unified query-based navigation
 */
export function buildNavigationUrl(
    baseUrl: string,
    queryId?: string
): string {
    const url = new URL(baseUrl, window.location.origin);

    if (queryId) {
        url.pathname = `/q/${queryId}`;
    } else {
        url.pathname = '/';
    }

    return url.pathname;
}

/**
 * Parses unified URL to extract query ID
 */
export function parseUUIDUrl(pathname: string): { queryId?: string } {
    // Unified format
    const queryMatch = pathname.match(/^\/q\/([a-f0-9-]{36})$/);
    if (queryMatch) {
        return { queryId: queryMatch[1] };
    }

    return {};
}

/**
 * Converts segment title to URL-safe path component
 */
export function segmentTitleToPath(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Converts URL path component back to segment title (best effort)
 */
export function pathToSegmentTitle(path: string): string {
    return decodeURIComponent(path)
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letter of each word
}

/**
 * Reconstructs navigation history from segment path and search query
 * This is a simplified reconstruction - in a real app you might want to store more state
 */
export function reconstructNavigationFromPath(
    searchQuery: string,
    segmentPath: string[]
): string[] {
    const reconstructedTitles = [searchQuery];

    // Convert path segments back to titles (this is approximate)
    segmentPath.forEach(pathSegment => {
        reconstructedTitles.push(pathToSegmentTitle(pathSegment));
    });

    return reconstructedTitles;
}

/**
 * Validates if a navigation state is valid
 */
export function isValidNavigationState(state: NavigationState): boolean {
    // If we have segment path, we must have a search query
    if (state.segmentPath && state.segmentPath.length > 0 && !state.searchQuery) {
        return false;
    }

    // Level should match segment path length
    if (state.level !== undefined && state.segmentPath) {
        return state.level === state.segmentPath.length;
    }

    return true;
}

/**
 * Creates a deep link URL for sharing
 */
export function createDeepLink(queryId: string): string {
    return buildNavigationUrl('/', queryId);
}
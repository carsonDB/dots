import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cacheService } from '../services/cacheService';
import { store } from '../store/atoms';

/**
 * Hook to sync Jotai state with URL parameters
 * Handles URL updates when state changes and state initialization from URL
 */
export function useUrlLoader() {
    const navigate = useNavigate();
    const location = useLocation();

    const segments = useAtomValue(store.segmentsAtom);
    const currentQueryId = useAtomValue(store.currentSearchIdAtom);

    // Atom setters
    const setSearchQuery = useSetAtom(store.searchQueryAtom);
    const setSegments = useSetAtom(store.segmentsAtom);
    const setCurrentQueryId = useSetAtom(store.currentSearchIdAtom);

    // Track if we're currently loading from URL to prevent navigation conflicts
    const isLoadingFromUrl = useRef(false);
    const navigationTimeoutRef = useRef<number | null>(null);
    const lastProgrammaticUrl = useRef<string | null>(null);

    // Load state from URL on mount or URL change
    const loadFromUrl = useCallback(async () => {
        isLoadingFromUrl.current = true;

        const { queryId } = parseUUIDUrl(location.pathname);

        if (queryId) {
            const queryResult = cacheService.getQueryById(queryId);
            if (queryResult) {
                // Load query state (unified concept)
                setSearchQuery(queryResult.query);
                setSegments(queryResult.segments);
                setCurrentQueryId(queryResult.id);
            }
        }

        // Reset flag after a brief delay to allow state updates to complete
        setTimeout(() => {
            isLoadingFromUrl.current = false;
        }, 100);
    }, [location.pathname, setSearchQuery, setSegments, setCurrentQueryId]);

    // Load from URL on mount and URL changes
    useEffect(() => {
        // Check if this URL change was caused by our own programmatic navigation
        if (lastProgrammaticUrl.current === location.pathname) {
            // This is our own navigation, don't reload from URL
            lastProgrammaticUrl.current = null;
            return;
        }

        // This is likely browser navigation (back/forward), load from URL
        loadFromUrl();
    }, [loadFromUrl, location.pathname]);

    // Update URL when state changes (but not during browser back navigation)
    useEffect(() => {
        // Skip URL updates if we're currently loading from URL (browser navigation)
        if (isLoadingFromUrl.current) {
            return;
        }

        // Clear any pending navigation timeout
        if (navigationTimeoutRef.current) {
            clearTimeout(navigationTimeoutRef.current);
        }

        // Debounce URL updates to prevent rapid successive changes
        navigationTimeoutRef.current = setTimeout(() => {
            if (segments.length > 0 && currentQueryId) {
                const newUrl = buildNavigationUrl('/', currentQueryId);

                // Only navigate if URL actually changed to avoid infinite loops
                if (location.pathname !== newUrl) {
                    // Track this as a programmatic navigation
                    lastProgrammaticUrl.current = newUrl;

                    // Use replace: fales to adding to browser history during programmatic navigation
                    // This provide history with browser back button
                    navigate(newUrl);
                }
            }
        }, 50); // Small debounce delay

        // Cleanup timeout on unmount
        return () => {
            if (navigationTimeoutRef.current) {
                clearTimeout(navigationTimeoutRef.current);
            }
        };
    }, [currentQueryId, segments.length, navigate, location.pathname]);

    return loadFromUrl
}


/**
 * Builds URL with unified query-based navigation
 */
function buildNavigationUrl(
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
function parseUUIDUrl(pathname: string): { queryId?: string } {
    // Unified format
    const queryMatch = pathname.match(/^\/q\/([a-f0-9-]{36})$/);
    if (queryMatch) {
        return { queryId: queryMatch[1] };
    }

    return {};
}

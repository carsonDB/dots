import { useCallback, useEffect, useRef } from 'react';

interface UseInfiniteScrollOptions {
    /** Callback to load more items */
    onLoadMore: () => void;
    /** Whether more items are currently being loaded */
    isLoading: boolean;
    /** Whether there are more items to load */
    hasMore: boolean;
    /** Distance from bottom to trigger load (in pixels) */
    threshold?: number;
}

/**
 * Custom hook for infinite scroll functionality
 * Detects when user scrolls near the bottom and triggers loading more content
 */
export function useInfiniteScroll({
    onLoadMore,
    isLoading,
    hasMore,
    threshold = 100
}: UseInfiniteScrollOptions) {
    const containerRef = useRef<HTMLDivElement>(null);
    const optionsRef = useRef({ onLoadMore, isLoading, hasMore, threshold });
    const lastLoadTimeRef = useRef(0);

    // Update options ref when props change
    optionsRef.current = { onLoadMore, isLoading, hasMore, threshold };

    const handleScroll = useCallback(() => {
        const container = containerRef.current;
        const { onLoadMore: currentOnLoadMore, isLoading: currentIsLoading, hasMore: currentHasMore, threshold: currentThreshold } = optionsRef.current;
        
        if (!container) {
            return;
        }

        if (currentIsLoading || !currentHasMore) {
            return;
        }

        const { scrollTop, scrollHeight, clientHeight } = container;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

        // Trigger load more when within threshold distance from bottom
        if (distanceFromBottom <= currentThreshold) {
            // Prevent rapid successive calls (debounce for 500ms)
            const now = Date.now();
            if (now - lastLoadTimeRef.current > 500) {
                console.log('Triggering load more - distance from bottom:', distanceFromBottom);
                lastLoadTimeRef.current = now;
                currentOnLoadMore();
            }
        }
    }, []); // Empty dependency array since we use refs

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        container.addEventListener('scroll', handleScroll, { passive: true });
        
        return () => {
            container.removeEventListener('scroll', handleScroll);
        };
    }, [handleScroll]);

    return containerRef;
}
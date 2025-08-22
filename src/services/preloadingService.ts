import { TextSegment } from '../types';
import AIService from './aiService';

interface PreloadedSegment {
    segmentId: string;
    expandedSegments: TextSegment[];
    accessOrder: number;
}

interface VisibilityState {
    visibleSegments: Set<string>;
    staticTimer: number | null;
}

/**
 * Service for preloading segment expansions to improve user experience
 * Preloads segments that are fully visible when the list is static for seconds
 */
export class PreloadingService {
    private cache = new Map<string, Promise<PreloadedSegment>>();
    private aiService = new AIService();
    private visibilityState: VisibilityState = {
        visibleSegments: new Set(),
        staticTimer: null
    };
    intersectionObserver: IntersectionObserver | null = null;
    private abortController: AbortController | null = null;
    private isInitialized = false;
    private accessCounter = 0;

    private readonly MAX_CACHE_ITEMS = 10;
    private readonly STATIC_DELAY_MS = 2000;

    /**
     * Initialize the preloading service with intersection observer
     * Simple API - handles all setup and cleanup internally
     */
    initialize(containerElement: HTMLElement) {
        if (this.isInitialized) {
            return;
        }

        this.close();

        // Create intersection observer to track visible segments
        this.intersectionObserver = new IntersectionObserver(
            (entries) => {
                let visibilityChanged = false;

                entries.forEach((entry) => {
                    const segmentId = entry.target.getAttribute('data-segment-id');
                    if (!segmentId) return;

                    const wasVisible = this.visibilityState.visibleSegments.has(segmentId);

                    if (entry.isIntersecting && entry.intersectionRatio >= 0.8) {
                        // Segment is mostly visible (80% threshold for better UX)
                        if (!wasVisible) {
                            this.visibilityState.visibleSegments.add(segmentId);
                            visibilityChanged = true;
                        }
                    } else {
                        // Segment is not fully visible
                        if (wasVisible) {
                            this.visibilityState.visibleSegments.delete(segmentId);
                            visibilityChanged = true;
                        }
                    }
                });

                // Only reset timer if visibility actually changed
                if (visibilityChanged) {
                    this.resetStaticTimer();
                }
            },
            {
                root: containerElement,
                rootMargin: '0px',
                threshold: [0, 0.5, 0.8, 1.0] // More granular tracking
            }
        );

        // Listen for scroll events to reset timer
        containerElement.addEventListener('scroll', this.handleScroll);

        this.isInitialized = true;
    }

    private handleScroll = () => {
        this.resetStaticTimer();
    };

    private resetStaticTimer() {
        if (this.visibilityState.staticTimer) {
            clearTimeout(this.visibilityState.staticTimer);
        }
        this.visibilityState.staticTimer = setTimeout(() => {
            this.preloadVisibleSegments();
        }, this.STATIC_DELAY_MS);
    }

    private async preloadVisibleSegments() {
        const visibleSegmentIds = Array.from(this.visibilityState.visibleSegments);
        if (visibleSegmentIds.length === 0) return;

        if (this.abortController) {
            this.abortController.abort();
        }
        const abortController = this.abortController = new AbortController();

        await Promise.all(visibleSegmentIds.map(async segmentId => {
            try {
                await this.preloadSegment(segmentId, abortController);
                console.log(`Succeeded to preload segment ${segmentId}`);
            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') return;
                console.warn(`Failed to preload segment ${segmentId}:`, error);
            }
        }))
    }

    private async preloadSegment(segmentId: string, abortController: AbortController) {
        if (this.cache.has(segmentId)) return;

        const segmentElement = document.querySelector(`[data-segment-id="${segmentId}"]`);
        if (!segmentElement) return;

        const segmentData = this.extractSegmentDataFromElement(segmentElement);
        if (!segmentData) return;

        const preloadPromise = this.performPreload(segmentData, segmentId, abortController);
        this.cache.set(segmentId, preloadPromise);

        try {
            await preloadPromise;
        } catch (error) {
            this.cache.delete(segmentId);
            throw error;
        }
    }

    private async performPreload(
        segmentData: { segment: TextSegment; contextSegments: TextSegment[]; originalQuery: string },
        segmentId: string,
        abortController: AbortController
    ): Promise<PreloadedSegment> {
        const expandedSegments = await this.aiService.expandSegment(
            segmentData.segment,
            segmentData.contextSegments,
            segmentData.originalQuery,
            abortController
        );

        const result: PreloadedSegment = {
            segmentId,
            expandedSegments,
            accessOrder: ++this.accessCounter
        };

        await this.enforceCacheLimit();
        return result;
    }

    private extractSegmentDataFromElement(element: Element): {
        segment: TextSegment;
        contextSegments: TextSegment[];
        originalQuery: string;
    } | null {
        try {
            const segmentDataStr = element.getAttribute('data-segment-data');
            return segmentDataStr ? JSON.parse(segmentDataStr) : null;
        } catch {
            return null;
        }
    }

    async getPreloadedSegments(segmentId: string): Promise<TextSegment[] | null> {
        const cachedPromise = this.cache.get(segmentId);
        if (!cachedPromise) return null;

        try {
            const cached = await cachedPromise;
            cached.accessOrder = ++this.accessCounter;
            return cached.expandedSegments;
        } catch {
            this.cache.delete(segmentId);
            return null;
        }
    }

    private async enforceCacheLimit() {
        if (this.cache.size <= this.MAX_CACHE_ITEMS) return;

        const resolvedEntries: Array<{ key: string; accessOrder: number }> = [];

        for (const [key, cachedPromise] of this.cache.entries()) {
            try {
                const cached = await cachedPromise;
                resolvedEntries.push({ key, accessOrder: cached.accessOrder });
            } catch {
                this.cache.delete(key);
            }
        }

        resolvedEntries.sort((a, b) => a.accessOrder - b.accessOrder);
        const itemsToRemove = resolvedEntries.length - this.MAX_CACHE_ITEMS;

        if (itemsToRemove > 0) {
            resolvedEntries.slice(0, itemsToRemove).forEach(({ key }) => {
                this.cache.delete(key);
            });
        }
    }



    close() {
        if (this.visibilityState.staticTimer) {
            clearTimeout(this.visibilityState.staticTimer);
            this.visibilityState.staticTimer = null;
        }

        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }

        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
            this.intersectionObserver = null;
        }

        this.visibilityState.visibleSegments.clear();
        this.cache.clear();
        this.isInitialized = false;
    }
}

// Export singleton instance
export const preloadingService = new PreloadingService();
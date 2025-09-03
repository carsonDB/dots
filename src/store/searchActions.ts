import { atom } from 'jotai';
import AIService from '../services/aiService';
import { cacheService } from '../services/cacheService';
import { TextSegment } from '../types';
import { store } from './atoms';

import { SearchController } from '../utils/searchController';

// Create singleton instances
const aiService = new AIService();
const searchController = new SearchController();

// Main query action atom - handles both search and segment expansion
export const performQueryAtom = atom(
    null,
    async (_get, set, params: {
        query: string;
        sourceSegment?: TextSegment;
        parentId?: string;
    }) => {
        const { query, sourceSegment, parentId } = params;

        // Check if we already have this query in history
        const existingQuery = cacheService.findExistingQuery(
            query,
            sourceSegment?.id,
            parentId
        );

        if (existingQuery) {
            // Reuse existing query result
            set(store.searchQueryAtom, existingQuery.query);
            set(store.segmentsAtom, existingQuery.segments);
            set(store.currentSearchIdAtom, existingQuery.id);
            set(store.isSearchingAtom, false);
            set(store.errorAtom, null);
            set(store.expandingSegmentIdAtom, null);
            
            // Reset infinite scroll state for existing queries
            set(store.isLoadingMoreAtom, false);
            set(store.hasMoreSegmentsAtom, true);

            return {
                segments: existingQuery.segments,
                queryId: existingQuery.id
            };
        }

        set(store.searchQueryAtom, query);
        set(store.errorAtom, null);

        try {
            let newSegments: TextSegment[];
            let usePreloaded = false;

            if (sourceSegment) {
                // Start new query with cancellation support for network request
                const abortController = searchController.startSearch(query);

                // Set loading states
                set(store.expandingSegmentIdAtom, sourceSegment.id);
                set(store.isSearchingAtom, true);
                set(store.searchControllerAtom, abortController);

                // Use expand logic for segment-based queries
                newSegments = await aiService.expandSegment(
                    sourceSegment,
                    query,
                    abortController
                );
            } else {
                // Start new query with cancellation support for root queries
                const abortController = searchController.startSearch(query);

                // Set loading states
                set(store.isSearchingAtom, true);
                set(store.searchControllerAtom, abortController);

                // For root queries, reset segments and infinite scroll state
                set(store.segmentsAtom, []);
                set(store.isLoadingMoreAtom, false);
                set(store.hasMoreSegmentsAtom, true);

                // Use search logic for text-based queries
                newSegments = await aiService.generateSegments(query, abortController);
            }

            // Save to unified history
            const queryId = cacheService.saveQueryResult(
                query,
                newSegments,
                parentId,
                sourceSegment?.id
            );

            set(store.segmentsAtom, newSegments);
            set(store.currentSearchIdAtom, queryId);

            // Reset infinite scroll state for new queries
            if (sourceSegment) {
                // For segment expansion, reset infinite scroll
                set(store.isLoadingMoreAtom, false);
                set(store.hasMoreSegmentsAtom, true);
            }

            // Only clear loading states if we were actually loading
            if (!usePreloaded) {
                set(store.isSearchingAtom, false);
                set(store.searchControllerAtom, null);
                set(store.expandingSegmentIdAtom, null);

                // Complete the query
                searchController.completeSearch();
            }

            return { segments: newSegments, queryId };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Query failed. Please try again.';

            // Complete the query (whether cancelled or failed)
            searchController.completeSearch();

            set(store.isSearchingAtom, false);
            set(store.errorAtom, errorMessage);
            set(store.searchControllerAtom, null);
            set(store.expandingSegmentIdAtom, null);

            throw err;
        }
    }
);

// Cancel query action atom
export const cancelSearchAtom = atom(
    null,
    (_get, set) => {
        searchController.cancelSearch();

        set(store.isSearchingAtom, false);
        set(store.errorAtom, null);
        set(store.searchControllerAtom, null);
        set(store.expandingSegmentIdAtom, null);
        set(store.isLoadingMoreAtom, false);
    }
);

// Load more segments action atom
export const loadMoreSegmentsAtom = atom(
    null,
    async (get, set) => {
        const isLoadingMore = get(store.isLoadingMoreAtom);
        const hasMore = get(store.hasMoreSegmentsAtom);
        const currentSegments = get(store.segmentsAtom);
        const searchQuery = get(store.searchQueryAtom);

        // Don't load if already loading or no more segments
        if (isLoadingMore || !hasMore || !searchQuery) {
            return;
        }

        // Limit maximum segments to prevent excessive loading
        const maxSegments = get(store.maxSegmentsAtom);
        if (currentSegments.length >= maxSegments) {
            set(store.hasMoreSegmentsAtom, false);
            return;
        }

        set(store.isLoadingMoreAtom, true);

        try {
            // Generate more segments based on current query
            const abortController = new AbortController();
            set(store.searchControllerAtom, abortController);

            const newSegments = await aiService.extendMoreSegments(
                searchQuery,
                currentSegments,
                abortController
            );

            if (newSegments.length > 0) {
                // Append new segments to existing ones
                set(store.segmentsAtom, [...currentSegments, ...newSegments]);
            } else {
                // No more segments available
                set(store.hasMoreSegmentsAtom, false);
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load more segments';
            console.error('Load more segments failed:', errorMessage);
            
            // Don't show error for cancelled requests
            if (!errorMessage.includes('cancelled')) {
                set(store.errorAtom, errorMessage);
            }
        } finally {
            set(store.isLoadingMoreAtom, false);
            set(store.searchControllerAtom, null);
        }
    }
);
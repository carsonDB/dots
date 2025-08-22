import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useUrlLoader } from '../hooks/useUrlSync';
import { store } from '../store/atoms';
import { performQueryAtom } from '../store/searchActions';
import { preloadingService } from '../services/preloadingService';
import { TextSegment as TextSegmentType } from '../types';
import { TextSegment } from './TextSegment';
import { TopBar } from './TopBar';

/**
 * Main component that orchestrates the finger reader search flow
 * Manages search state, navigation history, and coordinates all child components
 * Now with URL-based navigation state management and Jotai atoms
 */
export function AIExpandableSearch() {
    // Router hooks for URL state management
    const { queryId } = useParams();

    // Jotai atoms
    const segments = useAtomValue(store.segmentsAtom);
    const isSearching = useAtomValue(store.isSearchingAtom);
    const error = useAtomValue(store.errorAtom);
    const currentSearchId = useAtomValue(store.currentSearchIdAtom);
    const expandingSegmentId = useAtomValue(store.expandingSegmentIdAtom);
    const performQuery = useSetAtom(performQueryAtom);
    const searchQuery = useAtomValue(store.searchQueryAtom);

    // URL sync hook
    const loadFromUrl = useUrlLoader();

    const segmentsContainerRef = useRef<HTMLDivElement>(null);

    /**
     * Initialize state from URL on component mount or URL change
     */
    useEffect(() => {
        // Load state from URL when component mounts or URL changes
        loadFromUrl();
    }, [queryId, loadFromUrl]);

    /**
     * Initialize preloading service when segments container is available
     */
    useEffect(() => {
        const container = segmentsContainerRef.current;
        if (container && segments.length > 0) {
            preloadingService.initialize(container);
        }
    }, [segments.length]);

    /**
     * Cleanup preloading service on unmount
     */
    useEffect(() => {
        return () => {
            preloadingService.close();
        };
    }, []);

    /**
     * Handles segment expansion when user clicks on a segment
     */
    const handleSegmentExpand = useCallback(async (segment: TextSegmentType) => {
        try {
            // For context, we'll use current segments since deeper context 
            // should be collected by each segment's parentId relationship
            const contextSegments = segments;

            await performQuery({
                query: segment.title,
                sourceSegment: segment,
                parentId: currentSearchId || undefined,
                contextSegments: contextSegments
            });
            handleScrollToTop(0);
        } catch (err) {
            console.error('Segment expansion failed:', err);
        }
    }, [performQuery, currentSearchId, segments]);

    const handleScrollToTop = useCallback((offset: number) => {
        segmentsContainerRef.current?.scrollTo({ top: offset, behavior: 'smooth' });
    }, []);

    return (
        <div className="flex flex-col h-screen bg-white stable-layout">
            {/* Top Bar with integrated search interface - always show */}
            <TopBar />

            {/* Segments List - only show if we have segments */}
            {segments.length > 0 && (
                <div ref={segmentsContainerRef} className="flex-1 overflow-y-auto p-3 flex flex-col animate-fadeIn md:p-2 sm:p-2 navigation-transition">
                    {segments.map((segment) => (
                        <TextSegment
                            key={segment.id}
                            segment={segment}
                            onClick={() => handleSegmentExpand(segment)}
                            isLoading={expandingSegmentId === segment.id}
                            contextSegments={segments}
                            originalQuery={searchQuery}
                        />
                    ))}
                </div>
            )}

            {/* Empty State - show when no search has been performed */}
            {segments.length === 0 && !isSearching && !error && (
                <div className="flex-1 flex items-center justify-center p-8 navigation-transition">
                    <div className="text-center max-w-md">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-2 md:text-xl">
                            Explore any topic with AI
                        </h2>
                        <p className="text-base text-gray-600 leading-relaxed md:text-sm">
                            Search for anything and dive deeper with expandable segments
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useState } from 'react';
import { HiChevronDoubleUp, HiChevronLeft, HiClock, HiMagnifyingGlass } from 'react-icons/hi2';
import { historyService } from '../services/historyService';
import { currentTitleAtom, shouldShowBackArrowAtom, store } from '../store/atoms';
import { SearchHistoryModal } from './SearchHistoryModal';
import { SearchInterface } from './SearchInterface';


/**
 * TopBar component with centered title, navigation, and integrated search
 * Provides navigation to previous levels and search functionality in two modes:
 * - Expanded: Full search interface at the top
 * - Minimized: Search icon on the right side of the title
 */
export function TopBar() {
    const title = useAtomValue(currentTitleAtom);
    const showBackArrow = useAtomValue(shouldShowBackArrowAtom);
    const [showSearch, setShowSearch] = useAtom(store.showSearch);
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    // Atoms for navigation
    const segments = useAtomValue(store.segmentsAtom);
    const currentQueryId = useAtomValue(store.currentSearchIdAtom);
    const setSearchQuery = useSetAtom(store.searchQueryAtom);
    const setSegments = useSetAtom(store.segmentsAtom);
    const setCurrentQueryId = useSetAtom(store.currentSearchIdAtom);

    const handleBackNavigation = () => {
        if (segments.length > 0 && segments[0].parentId && currentQueryId) {
            // Get current query to find parent
            const currentQuery = historyService.getQueryById(currentQueryId);
            if (currentQuery && currentQuery.parentId) {
                // Navigate to parent segment list
                const parentQuery = historyService.getQueryById(currentQuery.parentId);
                if (parentQuery) {
                    setSearchQuery(parentQuery.query);
                    setSegments(parentQuery.segments);
                    setCurrentQueryId(parentQuery.id);
                    return;
                }
            }
        }
    };

    return (
        <div className="sticky top-0 z-[100] bg-white border-b border-gray-200 shadow-sm stable-layout">
            {/* Expanded Search Interface */}
            {showSearch && (
                <div className="px-6 pt-4 pb-4 bg-white sm:px-4 sm:pt-3 sm:pb-3 border-b border-gray-100 navigation-transition">
                    <SearchInterface />
                </div>
            )}

            {/* Main TopBar */}
            <div className="flex items-center justify-between px-6 py-4 bg-white min-h-[60px] sm:px-4 sm:py-3 sm:min-h-[56px] navigation-transition">
                <div className="flex-none w-15 flex items-center justify-start sm:w-12">
                    {showBackArrow ? (
                        <button
                            className="flex items-center justify-center min-w-[44px] min-h-[44px] w-12 h-12 border-none bg-transparent rounded-lg cursor-pointer text-gray-700 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 active:scale-95 focus:outline-none focus:shadow-[0_0_0_2px_#3b82f6] touch-manipulation"
                            onClick={handleBackNavigation}
                            aria-label="Go back to parent segment list"
                        >
                            <HiChevronLeft size={24} />
                        </button>
                    ) : (
                        <button
                            className="flex items-center justify-center min-w-[44px] min-h-[44px] w-12 h-12 border border-gray-300 bg-white rounded-lg cursor-pointer text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900 active:bg-gray-100 active:scale-95 focus:outline-none focus:shadow-[0_0_0_2px_#3b82f6] touch-manipulation shadow-sm"
                            onClick={() => setShowHistoryModal(true)}
                            aria-label="Show search history"
                        >
                            <HiClock size={20} />
                        </button>
                    )}
                </div>

                <div className="flex-1 flex justify-center items-center text-center min-w-0">
                    <h1 className="text-xl font-semibold text-gray-900 m-0 leading-tight max-w-full overflow-hidden text-ellipsis whitespace-nowrap sm:text-lg navigation-transition">
                        {title}
                    </h1>
                </div>

                <div className="flex-none w-15 flex items-center justify-end gap-1 sm:w-12">
                    <button
                        className="flex items-center justify-center min-w-[44px] min-h-[44px] w-12 h-12 border-none bg-transparent rounded-lg cursor-pointer text-gray-700 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 active:scale-95 focus:outline-none focus:shadow-[0_0_0_2px_#3b82f6] touch-manipulation"
                        onClick={() => setShowSearch(!showSearch)}
                        aria-label={showSearch ? "Show search" : "Hide search"}
                    >
                        {!showSearch ? <HiMagnifyingGlass size={20} /> : <HiChevronDoubleUp />}
                    </button>
                </div>
            </div>

            {/* Search History Modal */}
            <SearchHistoryModal
                isOpen={showHistoryModal}
                onClose={() => setShowHistoryModal(false)}
            />
        </div>
    );
};
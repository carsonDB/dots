import { atom } from 'jotai';
import { TextSegment, SearchState } from '../types';
import { createInitialSearchState } from '../utils/segmentUtils';

// Core query state atoms
export const store = {
    searchQueryAtom: atom<string>(''), // Atom for the search query
    segmentsAtom: atom<TextSegment[]>([]), // Atom for the list of text segments
    isSearchingAtom: atom<boolean>(false), // Atom to track if a search is in progress
    errorAtom: atom<string | null>(null), // Atom for error handling
    showSearch: atom<boolean>(false),
    searchControllerAtom: atom<AbortController | null>(null), // Atom for search cancellation
    expandingSegmentIdAtom: atom<string | null>(null), // Atom for tracking the expanding segment
    currentSearchIdAtom: atom<string | null>(null),
}

// Derived atoms for computed values
export const currentTitleAtom = atom((get) => {
    const searchQuery = get(store.searchQueryAtom);
    const segments = get(store.segmentsAtom);

    // If we have segments and they have a parent, use the search query as title
    if (segments.length > 0 && segments[0].parentId) {
        return searchQuery || 'Expanded View';
    }

    // If we have a search query, use it as title
    if (searchQuery) {
        return searchQuery;
    }

    return 'finger reader';
});

export const shouldShowBackArrowAtom = atom((get) => {
    const segments = get(store.segmentsAtom);
    // Show back arrow if current segments have a parentId (meaning they're nested)
    return segments.length > 0 && segments[0].parentId !== null;
});

export const shouldStartMinimizedAtom = atom((get) => {
    const segments = get(store.segmentsAtom);
    return segments.length > 0;
});

// Search UI state atom for mobile behavior
export const searchUIStateAtom = atom({
    isVisible: true,
    isMinimized: false,
    showStopButton: false,
    searchValue: ''
});

// Combined query state atom for compatibility
export const searchStateAtom = atom<SearchState>((get) => ({
    searchQuery: get(store.searchQueryAtom),
    segments: get(store.segmentsAtom),
    isSearching: get(store.isSearchingAtom),
    error: get(store.errorAtom),
    searchController: get(store.searchControllerAtom),
    urlState: undefined // This will be handled separately if needed
}));

// Reset atoms action
export const resetSearchStateAtom = atom(null, (_get, set) => {
    const initialState = createInitialSearchState();
    set(store.searchQueryAtom, initialState.searchQuery);
    set(store.segmentsAtom, initialState.segments);
    set(store.isSearchingAtom, initialState.isSearching);
    set(store.errorAtom, initialState.error);
    set(store.searchControllerAtom, initialState.searchController || null);
    set(store.currentSearchIdAtom, null);
    set(store.expandingSegmentIdAtom, null);
});
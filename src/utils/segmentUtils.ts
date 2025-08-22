import { v4 as uuid } from 'uuid';
import { TextSegment, SearchState } from '../types'

/**
 * Creates a new TextSegment with default values
 */
export function createTextSegment(
    title: string,
    content: string,
    level: number = 0,
    parentId: string | null = null
): TextSegment {
    return {
        id: `segment_${uuid()}`,
        title,
        content,
        level,
        parentId,
        isExpanded: false,
        children: undefined
    };
}

/**
 * Creates initial SearchState with default values
 */
export function createInitialSearchState(): SearchState {
    return {
        searchQuery: '',
        segments: [],
        isSearching: false,
        error: null,
        urlState: undefined,
        searchController: null,
    };
}
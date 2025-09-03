/**
 * Core data models and interfaces for dots
 */

/**
 * Represents a text segment that can be expanded for more detail
 */
export interface TextSegment {
  /** Unique identifier for the segment */
  id: string;
  /** The title of the segment */
  title: string;
  /** The paragraph content of the segment (max 50 words) */
  content: string;
  /** ID of the parent segment (null for root segments) */
  parentId: string | null;
}

/**
 * URL-based navigation state interface
 */
export interface NavigationState {
  /** Current search query from URL */
  searchQuery?: string;
  /** Segment path from URL for deep linking */
  segmentPath?: string[];
  /** Current navigation level */
  level?: number;
}

/**
 * Application state for managing search and expansion
 */
export interface SearchState {
  /** Current search query */
  searchQuery: string;
  /** Current list of text segments */
  segments: TextSegment[];
  /** Whether a search is in progress */
  isSearching: boolean;
  /** Current error message (null if no error) */
  error: string | null;
  /** URL-based navigation state */
  urlState?: NavigationState;
  /** Current search controller for cancellation support */
  searchController?: AbortController | null;
}
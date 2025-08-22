/**
 * Search controller interface for managing search cancellation
 */
export interface SearchController {
  /** Current active request controller (null if no active request) */
  currentRequest: AbortController | null;
  /** Whether a search is currently in progress */
  isSearching: boolean;
  /** History of search queries */
  searchHistory: string[];
  /** Cancel the current search request */
  cancelSearch: () => void;
  /** Execute a new search with cancellation support */
  executeSearch: (query: string) => Promise<void>;
}

/**
 * Search UI state interface for managing search interface behavior
 */
export interface SearchUIState {
  /** Whether the search interface is visible */
  isVisible: boolean;
  /** Whether the search bar is minimized */
  isMinimized: boolean;
  /** Whether to show the stop button */
  showStopButton: boolean;
  /** Current search input value */
  searchValue: string;
}

/**
 * Enhanced search state that includes cancellation support
 */
export interface EnhancedSearchState {
  /** Search controller for managing cancellation */
  searchController: AbortController | null;
  /** Search UI state */
  searchUIState: SearchUIState;
  /** Whether the current search can be cancelled */
  canCancelSearch: boolean;
}
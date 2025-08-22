import { SearchController, SearchUIState } from '../types/searchController';

/**
 * Implementation of SearchController for managing search cancellation
 */
export class SearchControllerImpl implements SearchController {
  public currentRequest: AbortController | null = null;
  public isSearching: boolean = false;
  public searchHistory: string[] = [];

  /**
   * Cancel the current search request if one is active
   */
  cancelSearch(): void {
    if (this.currentRequest) {
      this.currentRequest.abort();
      this.currentRequest = null;
      this.isSearching = false;
    }
  }

  /**
   * Execute a new search with cancellation support
   * This is a placeholder - actual implementation should be provided by the component
   */
  async executeSearch(_query: string): Promise<void> {
    throw new Error('executeSearch must be implemented by the component using this controller');
  }

  /**
   * Start a new search request
   * @param query - The search query
   * @returns AbortController for the new request
   */
  startSearch(query: string): AbortController {
    // Cancel any existing search
    this.cancelSearch();

    // Create new abort controller
    this.currentRequest = new AbortController();
    this.isSearching = true;

    // Add to search history if not already present
    if (!this.searchHistory.includes(query)) {
      this.searchHistory.push(query);
      // Keep only last 10 searches
      if (this.searchHistory.length > 10) {
        this.searchHistory = this.searchHistory.slice(-10);
      }
    }

    return this.currentRequest;
  }

  /**
   * Complete the current search (success or failure)
   */
  completeSearch(): void {
    this.currentRequest = null;
    this.isSearching = false;
  }

  /**
   * Check if a search can be cancelled
   */
  canCancel(): boolean {
    return this.currentRequest !== null && this.isSearching;
  }

  /**
   * Get the current search state
   */
  getSearchState(): { isSearching: boolean; canCancel: boolean } {
    return {
      isSearching: this.isSearching,
      canCancel: this.canCancel()
    };
  }
}

/**
 * Create default search UI state
 */
export function createDefaultSearchUIState(): SearchUIState {
  return {
    isVisible: true,
    isMinimized: false,
    showStopButton: false,
    searchValue: ''
  };
}

/**
 * Update search UI state based on search controller state
 */
export function updateSearchUIState(
  currentState: SearchUIState,
  searchController: SearchController,
  hasResults: boolean = false
): SearchUIState {
  return {
    ...currentState,
    showStopButton: searchController.isSearching,
    isMinimized: hasResults && !searchController.isSearching
  };
}
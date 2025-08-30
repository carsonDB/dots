import { v4 as uuidv4 } from 'uuid';
import { TextSegment } from '../types';

interface QueryHistoryItem {
    id: string;
    query: string;
    segments: TextSegment[];
    timestamp: number;
    parentId?: string; // For nested queries (expansions)
    sourceSegmentId?: string; // For expand queries
}

class CacheService {
    private readonly QUERY_HISTORY_KEY = 'finger_reader_query_history';
    private readonly MAX_QUERY_HISTORY = 100;

    /**
     * Save a query result to localStorage
     */
    saveQueryResult(
        query: string,
        segments: TextSegment[],
        parentId?: string,
        sourceSegmentId?: string
    ): string {
        const id = uuidv4();
        const item: QueryHistoryItem = {
            id,
            query,
            segments,
            timestamp: Date.now(),
            parentId,
            sourceSegmentId
        };

        const history = this.getQueryHistory();
        history.unshift(item);

        // Keep only the most recent items
        if (history.length > this.MAX_QUERY_HISTORY) {
            history.splice(this.MAX_QUERY_HISTORY);
        }

        localStorage.setItem(this.QUERY_HISTORY_KEY, JSON.stringify(history));
        return id;
    }

    /**
     * Get a query result by ID
     */
    getQueryById(id: string): QueryHistoryItem | null {
        const history = this.getQueryHistory();
        return history.find(item => item.id === id) || null;
    }

    /**
     * Check if a query already exists in history
     */
    findExistingQuery(
        query: string,
        sourceSegmentId?: string,
        parentId?: string
    ): QueryHistoryItem | null {
        const history = this.getQueryHistory();
        return history.find(item => {
            const queryMatch = item.query.toLowerCase().trim() === query.toLowerCase().trim();

            // For expansion queries, also match source segment and parent
            if (sourceSegmentId && parentId) {
                return queryMatch &&
                    item.sourceSegmentId === sourceSegmentId &&
                    item.parentId === parentId;
            }

            // For search queries, just match the query text and ensure no parent/source
            return queryMatch && !item.sourceSegmentId && !item.parentId;
        }) || null;
    }

    /**
     * Get all query history
     */
    getQueryHistory(): QueryHistoryItem[] {
        try {
            const stored = localStorage.getItem(this.QUERY_HISTORY_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error reading query history:', error);
            return [];
        }
    }

    /**
     * Delete a specific history item by ID
     */
    deleteHistoryItem(id: string): void {
        const history = this.getQueryHistory();
        const filteredHistory = history.filter(item => item.id !== id);
        localStorage.setItem(this.QUERY_HISTORY_KEY, JSON.stringify(filteredHistory));
    }

    /**
     * Clear all history
     */
    clearHistory(): void {
        localStorage.removeItem(this.QUERY_HISTORY_KEY);
    }
}

export const cacheService = new CacheService();
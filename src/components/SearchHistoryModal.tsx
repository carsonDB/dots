import { useEffect, useState } from 'react';
import { HiXMark, HiTrash, HiClock } from 'react-icons/hi2';
import { historyService } from '../services/historyService';
import { useSetAtom } from 'jotai';
import { performQueryAtom } from '../store/searchActions';

interface SearchHistoryItem {
    id: string;
    query: string;
    timestamp: number;
    parentId?: string;
    sourceSegmentId?: string;
}

interface SearchHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SearchHistoryModal({ isOpen, onClose }: SearchHistoryModalProps) {
    const [history, setHistory] = useState<SearchHistoryItem[]>([]);
    const performQuery = useSetAtom(performQueryAtom);

    useEffect(() => {
        if (isOpen) {
            // Load history when modal opens
            const allHistory = historyService.getQueryHistory();
            // Filter to only show root queries (not expansions)
            const rootQueries = allHistory.filter(item => !item.parentId && !item.sourceSegmentId);
            setHistory(rootQueries);
        }
    }, [isOpen]);

    const handleQueryClick = async (query: string) => {
        try {
            await performQuery({ query: query.trim() });
            onClose();
        } catch (err) {
            console.error('Search failed:', err);
        }
    };

    const handleClearHistory = () => {
        historyService.clearHistory();
        setHistory([]);
    };

    const handleDeleteItem = (itemId: string, event: React.MouseEvent) => {
        event.stopPropagation(); // Prevent triggering the query click
        historyService.deleteHistoryItem(itemId);
        setHistory(prev => prev.filter(item => item.id !== itemId));
    };

    const formatTimestamp = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)}h ago`;
        } else if (diffInHours < 24 * 7) {
            return `${Math.floor(diffInHours / 24)}d ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200]">
            {/* Full page modal sliding from left */}
            <div className="relative bg-white w-full shadow-xl transform transition-transform duration-300 ease-out animate-slideInLeft flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <HiClock size={20} className="text-gray-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Search History</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                        aria-label="Close history"
                    >
                        <HiXMark size={20} className="text-gray-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 bg-white overflow-y">
                    {history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center">
                            <HiClock size={48} className="text-gray-300 mb-4" />
                            <p className="text-gray-500 text-sm">No search history yet</p>
                            <p className="text-gray-400 text-xs mt-1">Your searches will appear here</p>
                        </div>
                    ) : (
                        <div className="p-2">
                            {history.map((item) => (
                                <div
                                    key={item.id}
                                    className="relative group w-full p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 border border-transparent hover:border-gray-200 mb-2"
                                >
                                    <button
                                        onClick={() => handleQueryClick(item.query)}
                                        className="w-full text-left pr-10"
                                    >
                                        <div className="font-medium text-gray-900 mb-1 line-clamp-2">
                                            {item.query}
                                        </div>
                                        <div className="text-gray-500">
                                            {formatTimestamp(item.timestamp)}
                                        </div>
                                    </button>
                                    <button
                                        onClick={(e) => handleDeleteItem(item.id, e)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded hover:bg-gray-200"
                                        aria-label="Delete this search"
                                    >
                                        <HiTrash size={20} className="text-gray-500 hover:text-red-500" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer with clear button */}
                {history.length > 0 && (
                    <div className="p-4 border-t border-gray-200">
                        <button
                            onClick={handleClearHistory}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors duration-200 text-sm font-medium"
                        >
                            <HiTrash size={16} />
                            Clear All History
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
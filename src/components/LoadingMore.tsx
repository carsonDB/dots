interface LoadingMoreProps {
    /** Whether to show the loading animation */
    isVisible: boolean;
}

/**
 * Loading animation component for infinite scroll
 * Shows a spinner when loading more segments
 */
export function LoadingMore({ isVisible }: LoadingMoreProps) {
    if (!isVisible) return null;

    return (
        <div className="flex items-center justify-center py-6 animate-fadeIn">
            <div className="flex items-center space-x-2 text-gray-500">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                <span className="text-sm font-medium">Loading more...</span>
            </div>
        </div>
    );
}
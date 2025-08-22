import { FormEvent, useEffect, useRef, useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { HiMagnifyingGlass, HiStop } from 'react-icons/hi2';
import { store } from '../store/atoms';
import { performQueryAtom, cancelSearchAtom } from '../store/searchActions';


export function SearchInterface() {
    const [query, setQuery] = useState<string>('');
    const isLoading = useAtomValue(store.isSearchingAtom);
    const error = useAtomValue(store.errorAtom);
    const performQuery = useSetAtom(performQueryAtom);
    const emptyList = useAtomValue(store.segmentsAtom).length == 0;
    const setShowSearch = useSetAtom(store.showSearch);
    const cancelSearch = useSetAtom(cancelSearchAtom);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (emptyList) {
            setShowSearch(true)
        }
    }, [emptyList]);

    useEffect(() => {
        if (inputRef.current) {
            // Small delay to ensure the component is fully rendered
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (query.trim() && !isLoading) {
            try {
                await performQuery({ query: query.trim() });
                setShowSearch(false)
            } catch (err) {
                // Error is handled by the atom
                console.error('Search failed:', err);
            }
        }
    };

    // Enhanced styling for mobile optimization
    const containerClasses = "relative flex items-center bg-white border-2 border-gray-300 rounded-3xl px-5 py-3 transition-all duration-300 focus-within:border-blue-500 focus-within:shadow-[0_0_20px_rgba(59,130,246,0.3)] focus-within:bg-white backdrop-blur-none md:px-5 md:py-3 sm:rounded-2xl sm:px-4 sm:py-3 min-h-[56px]"
    const inputClasses = "flex-1 bg-transparent border-none outline-none text-gray-900 text-lg py-2 font-inherit placeholder:text-gray-400 disabled:opacity-60 disabled:cursor-not-allowed md:text-lg sm:text-base touch-manipulation"
    const spinnerClasses = "w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"

    return (
        <div className="w-full max-w-2xl ml-4 mr-auto mb-8 md:mb-6">
            <form onSubmit={handleSubmit} className="w-full">
                <div className={containerClasses}>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Ask me anything..."
                        className={inputClasses}
                        disabled={isLoading}
                        maxLength={500}
                    />
                    {isLoading && (
                        <button
                            type="button"
                            onClick={() => cancelSearch()}
                            className="search-stop-btn bg-white text-gray-700 border border-gray-300 rounded-2xl min-w-[44px] min-h-[44px] px-4 py-2 text-sm font-semibold cursor-pointer transition-all duration-200 ml-2 hover:bg-gray-50 hover:border-gray-400 hover:shadow-[0_2px_8px_rgba(0,0,0,0.1)] active:bg-gray-100 focus:outline-none focus:shadow-[0_0_0_2px_rgba(0,0,0,0.1)] touch-manipulation flex items-center justify-center"
                            aria-label="Stop search"
                        >
                            <div className={spinnerClasses} />
                            <HiStop size={18} />
                        </button>
                    )}
                    {query && !isLoading && (
                        <button
                            type="submit"
                            className="search-submit-btn bg-white text-gray-700 border border-gray-300 rounded-2xl min-w-[44px] min-h-[44px] px-3 py-2 text-sm font-semibold cursor-pointer transition-all duration-200 ml-2 hover:not(:disabled):bg-gray-50 hover:not(:disabled):border-gray-400 hover:not(:disabled):shadow-[0_2px_8px_rgba(0,0,0,0.1)] active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none touch-manipulation flex items-center justify-center"
                            disabled={!query.trim()}
                            aria-label="Search"
                        >
                            <HiMagnifyingGlass size={18} />
                        </button>
                    )}
                </div>
            </form>
            {error && (
                <div className="search-error flex items-center justify-center mt-4 px-4 py-3 bg-red-50 border border-red-300 rounded-xl text-red-600 text-sm">
                    <span className="mr-2 text-base">⚠️</span>
                    {error}
                </div>
            )}
        </div>
    );
};

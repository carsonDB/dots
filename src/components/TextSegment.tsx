import React, { useEffect, useRef } from 'react';
import { HiChevronRight } from 'react-icons/hi2';
import { TextSegment as TextSegmentType } from '../types';
import { preloadingService } from '../services/preloadingService';

interface TextSegmentProps {
    /** The text segment data */
    segment: TextSegmentType;
    /** Callback when segment is clicked for expansion */
    onClick: () => void;
    /** Whether this segment is currently being expanded */
    isLoading: boolean;
    /** Original query for preloading */
    originalQuery?: string;
}

export function TextSegment({ segment, onClick, isLoading, originalQuery = '' }: TextSegmentProps) {
    const elementRef = useRef<HTMLDivElement>(null);

    // Set up intersection observer for preloading
    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        // Add data attributes for preloading service
        element.setAttribute('data-segment-id', segment.id);
        element.setAttribute('data-segment-data', JSON.stringify({
            segment,
            originalQuery
        }));

        // Start observing for visibility
        preloadingService.intersectionObserver?.observe(element);

        return () => {
            preloadingService.intersectionObserver?.unobserve(element);
        };
    }, [segment, originalQuery]);

    const handleClick = () => {
        if (!isLoading) {
            onClick();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.key === 'Enter' || e.key === ' ') && !isLoading) {
            e.preventDefault();
            onClick();
        }
    };

    const levelPadding = `0.5rem`;
    const levelPaddingMd = `0.5rem`;
    const levelPaddingSm = `0.375rem`;

    return (
        <div ref={elementRef}>
            <div
                className={`group flex items-center justify-between py-4 px-2 bg-transparent border-none border-gray-200 rounded-lg cursor-pointer transition-all duration-200 relative outline-none hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm focus:bg-gray-100 focus:border-blue-300 focus:shadow-[inset_0_0_0_2px_rgba(59,130,246,0.3)] active:bg-gray-100 ${isLoading ? 'cursor-not-allowed opacity-70 bg-gray-50' : ''
                    } md:py-3 md:px-2 sm:py-2.5 sm:px-1.5`}
                style={{
                    paddingLeft: levelPadding,
                    '--md-padding-left': levelPaddingMd,
                    '--sm-padding-left': levelPaddingSm
                } as React.CSSProperties}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                tabIndex={0}
                role="button"
                aria-label={`Expand segment: ${segment.title}`}
                aria-disabled={isLoading}
            >
                <div className="flex-1 mr-2 text-left break-words md:mr-2 sm:mr-1.5">
                    <div className={`text-gray-800 text-lg font-semibold leading-snug mb-1 ${segment.level === 0 ? 'font-medium' : segment.level === 1 ? 'font-normal' : 'font-normal opacity-90'
                        } md:text-base sm:text-sm`}>
                        {segment.title}
                    </div>
                    <div className="text-gray-600 text-base leading-relaxed font-normal md:text-sm sm:text-xs">
                        {segment.content}
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center min-w-[16px] min-h-[16px] md:min-w-[14px] md:min-h-[14px] sm:min-w-[12px] sm:min-h-[12px]">
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin md:w-3.5 md:h-3.5 sm:w-3 sm:h-3" />
                    </div>
                ) : (
                    <div className="flex items-center justify-center text-gray-500 transition-all duration-200 min-w-[16px] min-h-[16px] group-hover:text-blue-500 group-hover:translate-x-0.5 md:min-w-[14px] md:min-h-[14px] sm:min-w-[12px] sm:min-h-[12px]">
                        <HiChevronRight size={16} className="md:w-3.5 md:h-3.5 sm:w-3 sm:h-3" />
                    </div>
                )}
            </div>

            {/* Horizontal separator line */}
            <div className="mt-4 border-b border-gray-100 md:mt-3 sm:mt-2.5"></div>
        </div>
    );
}
/**
 * Context builder utility functions for hierarchical AI expansions
 */

import type { TextSegment } from '../types';

// Global context level limit
const CONTEXT_LEVEL_LIMIT = 4;

/**
 * Contextual information for AI prompts
 */
export interface ContextualInfo {
    /** Additional contextual information from hierarchy */
    contextualInformation: string;
    /** Parent segments in the hierarchy */
    parentSegments: TextSegment[];
}

/**
 * Gets parent segments with level limitation
 */
function getParentSegments(segment: TextSegment, allSegments: TextSegment[]): TextSegment[] {
    const parents: TextSegment[] = [];
    let currentParentId = segment.parentId;
    let levelsTraversed = 0;

    while (currentParentId && levelsTraversed < CONTEXT_LEVEL_LIMIT) {
        const parent = allSegments.find(s => s.id === currentParentId);
        if (!parent) break;

        parents.unshift(parent); // Add to beginning to maintain order
        currentParentId = parent.parentId;
        levelsTraversed++;
    }

    return parents;
}

/**
 * Builds contextual information from the hierarchy (titles only)
 */
function buildContextualInformation(parentSegments: TextSegment[], originalQuery: string): string {
    let contextInfo = `Original search: "${originalQuery}"\n`;

    if (parentSegments.length > 0) {
        contextInfo += `Context path:\n`;
        parentSegments.forEach((parent, index) => {
            const indent = '  '.repeat(index);
            contextInfo += `${indent}- ${parent.title}\n`;
        });
    }

    return contextInfo.trim();
}

/**
 * Creates contextual information for hierarchical AI expansions
 */
export function createContextualInfo(
    segment: TextSegment,
    allSegments: TextSegment[],
    originalQuery: string
) {
    const parentSegments = getParentSegments(segment, allSegments);
    const contextualInformation = buildContextualInformation(parentSegments, originalQuery);
    
    return contextualInformation
}
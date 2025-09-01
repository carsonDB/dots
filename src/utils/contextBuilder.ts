/**
 * Context builder utility functions for hierarchical AI expansions
 */

import type { TextSegment } from '../types';

// Global context level limit
const CONTEXT_LEVEL_LIMIT = 4;

/**
 * Contextual prompt with hierarchical information
 */
interface ContextualPrompt {
    /** Combined prompt with context */
    prompt: string;
    /** Additional contextual information from hierarchy */
    contextualInformation: string;
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
function buildContextualInformation(
    level: number,
    parentSegments: TextSegment[],
    originalQuery: string
): string {
    if (level === 0) {
        return `Original search: "${originalQuery}"`;
    }

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
 * Creates a contextual prompt with hierarchical information
 */
export function createContextualPrompt(
    segment: TextSegment,
    allSegments: TextSegment[],
    originalQuery: string
): ContextualPrompt {
    const parentSegments = getParentSegments(segment, allSegments);
    const contextualInformation = buildContextualInformation(segment.level, parentSegments, originalQuery);
    
    // Merge base prompt with context
    const prompt = `Expand on: '${segment.title}' - '${segment.content}'. Provide 3-5 sub-points with simple explanations (max 50 words each). Use examples and step-by-step details.

CONTEXT: ${contextualInformation}

Please provide 3-5 sub-points that build naturally on this exploration path. Make sure your explanations are relevant to the context above and help the user dive deeper into this specific aspect of "${originalQuery}".

Respond in JSON format:
\`\`\`json
{
  "list": [
    {
      "title": "Sub-point Title",
      "content": "Clear explanation with examples (max 50 words)"
    }
  ]
}
\`\`\``;

    return {
        prompt,
        contextualInformation
    };
}
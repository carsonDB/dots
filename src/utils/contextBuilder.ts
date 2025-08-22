/**
 * Context builder utility for hierarchical AI expansions
 */

import type { TextSegment } from '../types';
import type { SegmentContext, ContextualPrompt, ContextConfig } from '../types/context';

/**
 * Default configuration for context building
 */
const DEFAULT_CONTEXT_CONFIG: ContextConfig = {
  maxContextLength: 2000, // Reasonable limit for API requests
  maxParentSegments: 5,   // Limit depth to prevent overwhelming context
  truncationStrategy: 'balanced'
};

/**
 * Utility class for building contextual information for AI expansions
 */
export class ContextBuilder {
  private config: ContextConfig;

  constructor(config: Partial<ContextConfig> = {}) {
    this.config = { ...DEFAULT_CONTEXT_CONFIG, ...config };
  }

  /**
   * Builds segment context by traversing up the hierarchy
   * @param segment - The segment to expand
   * @param allSegments - All segments in the current state
   * @param originalQuery - The original search query
   * @returns SegmentContext with hierarchical information
   */
  buildSegmentContext(
    segment: TextSegment,
    allSegments: TextSegment[],
    originalQuery: string
  ): SegmentContext {
    const parentSegments = this.getParentSegments(segment, allSegments);
    const fullPath = this.buildFullPath(parentSegments, segment);

    return {
      level: segment.level,
      parentSegments,
      fullPath,
      originalQuery
    };
  }

  /**
   * Creates a contextual prompt with hierarchical information
   * @param segment - The segment to expand
   * @param context - The segment context
   * @returns ContextualPrompt with enhanced context
   */
  createContextualPrompt(segment: TextSegment, context: SegmentContext): ContextualPrompt {
    const basePrompt = this.createBaseExpansionPrompt(segment);
    const contextualInformation = this.buildContextualInformation(context);
    const hierarchyPath = this.buildHierarchyPath(context);

    // Apply intelligent truncation if needed
    const truncatedContext = this.truncateContextIfNeeded(contextualInformation);

    return {
      basePrompt,
      contextualInformation: truncatedContext,
      hierarchyPath
    };
  }

  /**
   * Gets all parent segments by traversing up the hierarchy
   * @param segment - The target segment
   * @param allSegments - All available segments
   * @returns Array of parent segments from root to immediate parent
   */
  private getParentSegments(segment: TextSegment, allSegments: TextSegment[]): TextSegment[] {
    const parents: TextSegment[] = [];
    let currentParentId = segment.parentId;

    // Traverse up the hierarchy
    while (currentParentId) {
      const parent = allSegments.find(s => s.id === currentParentId);
      if (!parent) break;
      
      parents.unshift(parent); // Add to beginning to maintain order
      currentParentId = parent.parentId;
    }

    return parents;
  }

  /**
   * Builds the full path of titles from root to current segment
   * @param parentSegments - Array of parent segments
   * @param currentSegment - The current segment
   * @returns Array of titles representing the full path
   */
  private buildFullPath(parentSegments: TextSegment[], currentSegment: TextSegment): string[] {
    const path = parentSegments.map(segment => segment.title);
    path.push(currentSegment.title);
    return path;
  }

  /**
   * Creates the base expansion prompt for a segment
   * @param segment - The segment to expand
   * @returns Base prompt string
   */
  private createBaseExpansionPrompt(segment: TextSegment): string {
    return `Expand on: '${segment.title}' - '${segment.content}'. Provide 3-5 sub-points with simple explanations (max 50 words each). Use examples and step-by-step details.`;
  }

  /**
   * Builds contextual information from the hierarchy
   * @param context - The segment context
   * @returns Formatted contextual information string
   */
  private buildContextualInformation(context: SegmentContext): string {
    if (context.level === 0) {
      return `Original search: "${context.originalQuery}"`;
    }

    let contextInfo = `Original search: "${context.originalQuery}"\n`;
    
    if (context.parentSegments.length > 0) {
      contextInfo += `Context path:\n`;
      context.parentSegments.forEach((parent, index) => {
        const indent = '  '.repeat(index);
        contextInfo += `${indent}- ${parent.title}: ${parent.content}\n`;
      });
    }

    return contextInfo.trim();
  }

  /**
   * Builds a simple hierarchy path string
   * @param context - The segment context
   * @returns Formatted hierarchy path
   */
  private buildHierarchyPath(context: SegmentContext): string {
    if (context.fullPath.length <= 1) {
      return context.originalQuery;
    }

    return `${context.originalQuery} → ${context.fullPath.slice(0, -1).join(' → ')}`;
  }

  /**
   * Applies intelligent truncation to context if it exceeds limits
   * @param contextInfo - The context information to potentially truncate
   * @returns Truncated context if needed
   */
  private truncateContextIfNeeded(contextInfo: string): string {
    if (contextInfo.length <= this.config.maxContextLength) {
      return contextInfo;
    }

    // Simple truncation strategy - keep the beginning and add ellipsis
    const truncated = contextInfo.substring(0, this.config.maxContextLength - 20);
    const lastNewline = truncated.lastIndexOf('\n');
    
    if (lastNewline > 0) {
      return truncated.substring(0, lastNewline) + '\n... [context truncated for length]';
    }
    
    return truncated + '... [truncated]';
  }

  /**
   * Updates the configuration for context building
   * @param newConfig - Partial configuration to merge
   */
  updateConfig(newConfig: Partial<ContextConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Gets the current configuration
   * @returns Current context configuration
   */
  getConfig(): ContextConfig {
    return { ...this.config };
  }
}

/**
 * Default context builder instance
 */
export const defaultContextBuilder = new ContextBuilder();
/**
 * Context management interfaces for hierarchical AI expansions
 */

import type { TextSegment } from './index';

/**
 * Context information for AI segment expansion
 */
export interface SegmentContext {
  /** Current hierarchical level */
  level: number;
  /** Array of parent segments from root to current */
  parentSegments: TextSegment[];
  /** Full path of segment titles for context */
  fullPath: string[];
  /** Original search query that started the exploration */
  originalQuery: string;
}

/**
 * Contextual prompt with hierarchical information
 */
export interface ContextualPrompt {
  /** Base expansion prompt */
  basePrompt: string;
  /** Additional contextual information from hierarchy */
  contextualInformation: string;
  /** String representation of the hierarchy path */
  hierarchyPath: string;
}

/**
 * Configuration for context truncation
 */
export interface ContextConfig {
  /** Maximum number of characters for context */
  maxContextLength: number;
  /** Maximum number of parent segments to include */
  maxParentSegments: number;
  /** Whether to prioritize recent or early segments when truncating */
  truncationStrategy: 'recent' | 'early' | 'balanced';
}
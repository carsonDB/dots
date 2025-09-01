import type { TextSegment } from '../types';
import { createContextualPrompt } from '../utils/contextBuilder';
import { createTextSegment } from '../utils/segmentUtils';
import { cacheService } from './cacheService';


interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface OpenRouterResponse {
    choices: Array<{
        message: {
            content: string;
            role: string;
        };
    }>;
}

// AI Configuration
const AI_CONFIG = {
    API_KEY: import.meta.env.VITE_OPENROUTER_API_KEY || '',
    MODEL: 'google/gemini-2.0-flash-001',
    BASE_URL: 'https://openrouter.ai/api/v1/chat/completions',
    DEFAULT_TEMPERATURE: 0.7,
    DEFAULT_MAX_TOKENS: 1000
};

class AIService {
    private apiKey: string;
    private baseUrl = AI_CONFIG.BASE_URL;
    private model = AI_CONFIG.MODEL;
    maxWords = 50;

    // Unified request deduplication and caching
    private pendingRequests = new Map<string, Promise<TextSegment[]>>();

    constructor() {
        this.apiKey = AI_CONFIG.API_KEY;
    }

    async sendMessage(messages: ChatMessage[], abortController?: AbortController): Promise<string> {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'Dots PWA'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages,
                    temperature: AI_CONFIG.DEFAULT_TEMPERATURE,
                    max_tokens: AI_CONFIG.DEFAULT_MAX_TOKENS
                }),
                signal: abortController?.signal
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data: OpenRouterResponse = await response.json();
            return data.choices[0]?.message?.content || 'No response received';
        } catch (error) {
            // Handle abort errors specifically
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Search was cancelled');
            }
            console.error('AI Service Error:', error);
            throw new Error('Failed to communicate with AI service');
        }
    }

    /**
     * Generates structured text segments for a search query
     * @param query - The user's search query
     * @param abortController - Optional AbortController for cancellation
     * @returns Promise<TextSegment[]> - Array of text segments
     */
    async generateSegments(query: string, abortController?: AbortController): Promise<TextSegment[]> {
        const cacheKey = this.createSearchCacheKey(query);

        return this.executeWithCache(
            cacheKey,
            () => this.performSearch(query, abortController),
            { query, parentId: undefined, sourceSegmentId: undefined },
        );
    }

    /**
     * Expands a text segment to provide more detailed sub-segments
     * @param segment - The segment to expand
     * @param originalQuery - The original search query for context
     * @param abortController - Optional AbortController for cancellation
     * @returns Promise<TextSegment[]> - Array of child segments
     */
    async expandSegment(
        segment: TextSegment,
        originalQuery: string = '',
        abortController?: AbortController
    ): Promise<TextSegment[]> {
        const cacheKey = this.createExpansionCacheKey(segment, originalQuery);

        return this.executeWithCache(
            cacheKey,
            () => this.performExpansion(segment, originalQuery, abortController),
            {
                query: cacheKey,
                parentId: segment.parentId || undefined,
                sourceSegmentId: segment.id
            },
        );
    }

    /**
     * Unified cache execution with request deduplication
     * Handles memory cache, pending requests, and localStorage persistence
     */
    private async executeWithCache<T extends TextSegment[]>(
        cacheKey: string,
        requestFn: () => Promise<T>,
        cacheParams: { query: string; parentId?: string; sourceSegmentId?: string },
    ): Promise<T> {
        // 1. Check localStorage cache first
        const existingResult = cacheService.findExistingQuery(
            cacheParams.query,
            cacheParams.sourceSegmentId,
            cacheParams.parentId
        );
        if (existingResult) {
            return existingResult.segments as T;
        }

        // 2. Check if request is already pending
        const pendingRequest = this.pendingRequests.get(cacheKey);
        if (pendingRequest) {
            try {
                return await pendingRequest as T;
            } catch (error) {
                // If pending request failed, remove it and continue with new request
                this.pendingRequests.delete(cacheKey);
                if (error instanceof Error && error.name === 'AbortError') {
                    throw error;
                }
            }
        }

        // 3. Create new request and cache the promise
        const requestPromise = this.executeRequest(requestFn, cacheParams);
        this.pendingRequests.set(cacheKey, requestPromise);

        try {
            const result = await requestPromise;
            return result as T;
        } catch (error) {
            this.pendingRequests.delete(cacheKey);
            throw error;
        } finally {
            // Clean up completed request
            this.pendingRequests.delete(cacheKey);
        }
    }

    /**
     * Execute the actual request and handle caching
     */
    private async executeRequest(
        requestFn: () => Promise<TextSegment[]>,
        cacheParams: { query: string; parentId?: string; sourceSegmentId?: string },
    ): Promise<TextSegment[]> {
        try {
            const segments = await requestFn();

            // Save to localStorage cache
            cacheService.saveQueryResult(
                cacheParams.query,
                segments,
                cacheParams.parentId,
                cacheParams.sourceSegmentId
            );

            return segments;
        } catch (error) {
            // Handle abort errors specifically
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Search was cancelled');
            }
            throw error;
        }
    }

    /**
     * Creates a unique cache key for search queries
     */
    private createSearchCacheKey(query: string): string {
        return query.toLowerCase().trim();
    }

    /**
     * Creates a unique cache key for segment expansion
     */
    private createExpansionCacheKey(segment: TextSegment, originalQuery: string): string {
        return `${segment.title}:${segment.content}:${originalQuery}`;
    }

    /**
     * Performs the actual search request
     */
    private async performSearch(query: string, abortController?: AbortController): Promise<TextSegment[]> {
        const prompt = this.createInitialSearchPrompt(query);

        const messages: ChatMessage[] = [
            {
                role: 'system',
                content: `You are an educational assistant. Use simple language, include examples when helpful, and always respond in JSON format. Match the user's language. Use English by default.`
            },
            {
                role: 'user',
                content: prompt
            }
        ];

        return this.requestWithRetry(messages, 0, null, 0, abortController);
    }

    /**
     * Performs the actual expansion request
     */
    private async performExpansion(
        segment: TextSegment,
        originalQuery: string,
        abortController?: AbortController
    ): Promise<TextSegment[]> {
        const prompt = this.createContextualExpansionPrompt(segment, originalQuery);

        const messages: ChatMessage[] = [
            {
                role: 'system',
                content: `You are an educational assistant. Use simple language, include examples when helpful, and always respond in JSON format. Match the user's language. Use English by default. Use the provided context to make your explanations more relevant and coherent with the exploration path.`
            },
            {
                role: 'user',
                content: prompt
            }
        ];

        return this.requestWithRetry(messages, segment.level + 1, segment.id, 0, abortController);
    }

    /**
     * Creates the prompt template for initial search queries
     * @param query - The user's search query
     * @returns string - Formatted prompt
     */
    private createInitialSearchPrompt(query: string): string {
        return `Explain '${query}' for learners. Provide 3-6 key points with clear titles and simple explanations (max 50 words each). Use examples and everyday language.

Respond in JSON format:
\`\`\`json
{
  "list": [
    {
      "title": "Point Title",
      "content": "Simple explanation with examples (max 50 words)"
    }
  ]
}
\`\`\``;
    }

    /**
     * Creates the prompt template for simple segment expansion
     * @param segment - The segment to expand
     * @returns string - Formatted prompt
     */
    private createExpansionPrompt(segment: TextSegment): string {
        return `Expand on: '${segment.title}' - '${segment.content}'. Provide 3-5 sub-points with simple explanations (max 50 words each). Use examples and step-by-step details.

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
    }

    /**
     * Creates a contextual expansion prompt with hierarchical awareness
     * @param segment - The segment to expand
     * @param originalQuery - Original search query
     * @returns string - Contextual prompt
     */
    private createContextualExpansionPrompt(
        segment: TextSegment,
        originalQuery: string
    ): string {
        // For level 0 (initial search results), use simple expansion
        if (segment.level === 0) {
            return this.createExpansionPrompt(segment);
        }

        // Get all cached segments for context building
        const allCachedSegments = cacheService.getAllCachedSegments();
        const contextualPrompt = createContextualPrompt(segment, allCachedSegments, originalQuery);

        return contextualPrompt.prompt;
    }

    /**
     * Sends request with retry mechanism for JSON parsing failures
     * @param messages - Chat messages array
     * @param level - Hierarchical level for the segments
     * @param parentId - ID of parent segment (null for root segments)
     * @param attempt - Current attempt number (0-based)
     * @param abortController - Optional AbortController for cancellation
     * @returns Promise<TextSegment[]> - Array of text segments
     */
    private async requestWithRetry(messages: ChatMessage[], level: number, parentId: string | null = null, attempt: number = 0, abortController?: AbortController): Promise<TextSegment[]> {
        try {
            const response = await this.sendMessage(messages, abortController);
            // console.log(messages, response)
            return this.parseSegmentsFromResponse(response, level, parentId);
        } catch (error) {
            // Don't retry if the request was aborted
            if (error instanceof Error && error.message === 'Search was cancelled') {
                console.warn(error);
                return []
            }

            if (attempt < 2) { // Max 3 attempts (0, 1, 2)
                console.warn(`JSON parsing failed on attempt ${attempt + 1}, retrying...`);

                // Add error message to chat and retry
                const errorMessage: ChatMessage = {
                    role: 'user',
                    content: 'Your previous response was not in the correct JSON format. Please respond exactly in this JSON format:\n```json\n{\n  "list": [\n    {\n      "title": "Title Here",\n      "content": "Content here (max 50 words)"\n    }\n  ]\n}\n```'
                };

                const retryMessages = [...messages, errorMessage];
                return this.requestWithRetry(retryMessages, level, parentId, attempt + 1, abortController);
            } else {
                console.error('Failed to get valid JSON response after 3 attempts');
                throw new Error('Failed to get segments: AI service did not provide valid JSON format after 3 attempts');
            }
        }
    }

    /**
     * Parses AI response into TextSegment array
     * @param response - Raw AI response text
     * @param level - Hierarchical level for the segments
     * @param parentId - ID of parent segment (null for root segments)
     * @returns TextSegment[] - Parsed segments
     */
    private parseSegmentsFromResponse(response: string, level: number, parentId: string | null = null): TextSegment[] {
        // Extract JSON from response (handle markdown code blocks)
        let jsonStr = response.trim();

        // Remove markdown code block markers if present
        const jsonMatch = jsonStr.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
        }

        // Parse JSON response
        const parsedResponse = JSON.parse(jsonStr);

        // Validate structure and extract list
        if (!parsedResponse || !Array.isArray(parsedResponse.list)) {
            throw new Error('Invalid JSON structure: expected { list: [...] }');
        }

        const segments: TextSegment[] = [];
        for (const item of parsedResponse.list) {
            // Handle both old format (string) and new format (object with title/content)
            if (typeof item === 'string' && item.trim().length > 0) {
                // Fallback for old format - use content as both title and content
                const segment = createTextSegment(item.trim(), item.trim(), level, parentId);
                segments.push(segment);
            } else if (typeof item === 'object' && item.title && item.content) {
                // New format with title and content
                const segment = createTextSegment(
                    item.title.trim(),
                    item.content.trim(),
                    level,
                    parentId
                );
                segments.push(segment);
            }
        }

        return segments;
    }
}

export default AIService;
export type { ChatMessage };

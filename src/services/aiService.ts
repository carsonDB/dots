import { v4 as uuid } from 'uuid'
import type { TextSegment } from '../types';
import { createContextualInfo } from '../utils/contextBuilder';
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

    async generateSegments(query: string, abortController?: AbortController): Promise<TextSegment[]> {
        const cacheKey = query.toLowerCase().trim();
        const performSearch = async (query: string, abortController?: AbortController): Promise<TextSegment[]> => {
            const command = `Explain '{QUERY}' for learners. Provide 3-6 key points with clear titles and simple explanations.`;
            const variables = { QUERY: query };
            const messages = this.createPromptMessage(command, variables);
            return this.requestWithRetry(messages, null, 0, abortController);
        }
        return this.executeWithCache(cacheKey, () => performSearch(query, abortController), { query });
    }

    async expandSegment(segment: TextSegment, originalQuery: string = '', abortController?: AbortController): Promise<TextSegment[]> {
        const cacheKey = `${segment.title}:${originalQuery}`;
        const performExpansion = async(segment: TextSegment, originalQuery: string, abortController?: AbortController): Promise<TextSegment[]> => {
            const allCachedSegments = cacheService.getAllCachedSegments();
            const contextualInfo = createContextualInfo(segment, allCachedSegments, originalQuery);
    
            const command = `Expand on: '{TITLE}' - '{CONTENT}'. Provide 3-5 sub-points that build naturally on this exploration path. Make sure your explanations are relevant to the context below and help the user dive deeper into this specific aspect.`;
            const variables = {
                CONTEXT: contextualInfo,
                TITLE: segment.title,
                CONTENT: segment.content,
            };
            const messages = this.createPromptMessage(command, variables);
            return this.requestWithRetry(messages, segment.id, 0, abortController);
        }
        return this.executeWithCache(cacheKey, () => performExpansion(segment, originalQuery, abortController), {
            query: cacheKey,
            parentId: segment.parentId || undefined,
            sourceSegmentId: segment.id
        });
    }

    async extendMoreSegments(query: string, currentSegments: TextSegment[], abortController?: AbortController): Promise<TextSegment[]> {
        const cacheKey = `${query.toLowerCase().trim()}_more_${currentSegments.length}`;
        const performMoreSearch = async(query: string, currentSegments: TextSegment[], abortController?: AbortController): Promise<TextSegment[]> => {
            const command = `Continue exploring '{QUERY}' for learners. You've already provided {CURRENT_TITLES}. Now provide 3-5 additional different aspects or related topics. Focus on practical applications, advanced concepts, or related areas that haven't been covered yet. If you cannot provide meaningful additional content, return an empty list.`;
            const variables = { QUERY: query, CURRENT_TITLES: currentSegments.map(seg => seg.title) };
            const messages = this.createPromptMessage(command, variables);
            return this.requestWithRetry(messages, null, 0, abortController);
        }
        return this.executeWithCache(cacheKey, () => performMoreSearch(query, currentSegments, abortController), { query: cacheKey });
    }

    private async executeWithCache<T extends TextSegment[]>(cacheKey: string, requestFn: () => Promise<T>, cacheParams: { query: string; parentId?: string; sourceSegmentId?: string }): Promise<T> {
        // Check localStorage cache first
        const existingResult = cacheService.findExistingQuery(cacheParams.query, cacheParams.sourceSegmentId, cacheParams.parentId);
        if (existingResult) return existingResult.segments as T;

        // Check if request is already pending
        const pendingRequest = this.pendingRequests.get(cacheKey);
        if (pendingRequest) {
            try {
                return await pendingRequest as T;
            } catch (error) {
                this.pendingRequests.delete(cacheKey);
                if (error instanceof Error && error.name === 'AbortError') throw error;
            }
        }

        // Create new request and cache the promise
        const requestPromise = this.executeRequest(requestFn, cacheParams);
        this.pendingRequests.set(cacheKey, requestPromise);

        try {
            return await requestPromise as T;
        } catch (error) {
            throw error;
        } finally {
            this.pendingRequests.delete(cacheKey);
        }
    }

    private async executeRequest(requestFn: () => Promise<TextSegment[]>, cacheParams: { query: string; parentId?: string; sourceSegmentId?: string }): Promise<TextSegment[]> {
        try {
            const segments = await requestFn();
            cacheService.saveQueryResult(cacheParams.query, segments, cacheParams.parentId, cacheParams.sourceSegmentId);
            return segments;
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Search was cancelled');
            }
            throw error;
        }
    }

    /**
     * Gets the unified system message for all AI requests
     */
    private getSystemMessage(): string {
        return `You are an educational assistant. Always follow these requirements:
- Use simple language and include examples when helpful
- Match the user's language. Use English by default

Respond in JSON format:
\`\`\`json
{
  "list": [
    {
      "title": string,
      "content": string (max ${this.maxWords} words)
    }
  ]
}
\`\`\``;
    }

    private createPromptMessage(command: string, variables: object): ChatMessage[] {
        return [
            { role: 'system', content: this.getSystemMessage() },
            { role: 'user', content: JSON.stringify(variables) + '\n\n' + command }
        ];
    }

    private async requestWithRetry(messages: ChatMessage[], parentId: string | null = null, attempt: number = 0, abortController?: AbortController): Promise<TextSegment[]> {
        try {
            const response = await this.sendMessage(messages, abortController);
            // console.log(messages, response)
            return this.parseSegmentsFromResponse(response, parentId);
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
                return this.requestWithRetry(retryMessages, parentId, attempt + 1, abortController);
            } else {
                console.error('Failed to get valid JSON response after 3 attempts');
                throw new Error('Failed to get segments: AI service did not provide valid JSON format after 3 attempts');
            }
        }
    }

    /**
     * Parses AI response into TextSegment array
     * @param response - Raw AI response text
     * @param parentId - ID of parent segment (null for root segments)
     * @returns TextSegment[] - Parsed segments
     */
    private parseSegmentsFromResponse(response: string, parentId: string | null = null): TextSegment[] {
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
            if (typeof item === 'object' && item.title && item.content) {
                const segment = {
                    id: `segment_${uuid()}`,
                    title: item.title.trim(),
                    content: item.content.trim(),
                    parentId,
                }
                segments.push(segment);
            }
        }

        return segments;
    }
}

export default AIService;
export type { ChatMessage };

# Dots - Knowledge Graph Explorer

**Navigate knowledge like a graph - almost no typing, just exploring**

## 🚀 Elevator Pitch

Dots revolutionizes how you learn by turning knowledge exploration into a visual journey. This PWA mobile app lets you browse and learn through interconnected knowledge "dots" without endless typing. Unlike AI chatbots that give either too brief or overwhelming responses, Dots provides a hierarchical browsing experience where learning feels like traversing a knowledge graph.

## 📖 About the Project

### The Problem with Traditional AI Chat
AI chatbots have a fundamental UX problem: they either give answers that are too concise (leaving you wanting more) or too detailed (overwhelming you with information). The back-and-forth chat interface forces you to constantly type follow-up questions, breaking your flow of learning.

### Our Solution: Graph-Based Knowledge Navigation
Dots reimagines knowledge exploration as a graph traversal experience:

1. **Start with a Search**: Your topic becomes the starting node
2. **Explore Connected Points**: The app presents a concise list of related knowledge points (connected nodes)
3. **Dive Deeper**: Click any point to jump to that node and explore its connections
4. **Keep Traversing**: Continue exploring the knowledge graph naturally, following your curiosity

This creates a seamless learning experience where you're always one click away from deeper understanding, without the friction of typing questions.

### The Graph Metaphor in Action
Think of learning as exploring a knowledge graph:
- **Search Query** = Starting node in the graph
- **Knowledge Points** = Connected nodes with relationships
- **Click to Expand** = Traversing edges to reach new nodes
- **Hierarchical Structure** = Natural graph topology with parent-child relationships

This approach eliminates the need for constant typing while providing structured, explorable knowledge that adapts to your learning path.

### Technical Implementation
Built as a PWA mobile app with focus on touch-first interaction:
- **Graph-like Data Structure**: Knowledge points connected in a hierarchical, explorable tree
- **Touch-Optimized UI**: Large, tappable areas for effortless mobile browsing
- **Smart Caching**: Instant navigation between previously explored nodes
- **PWA Architecture**: Installable mobile app with offline capabilities
- **No-Typing Interface**: Pure browsing experience with minimal text input

### Key Design Principles
1. **Zero Typing**: Learning should flow naturally without constant text input
2. **Visual Hierarchy**: Information organized in digestible, connected chunks
3. **Mobile-First**: Optimized for touch interaction and mobile browsing
4. **Graph Traversal**: Each interaction moves you through the knowledge space
5. **Context Preservation**: Maintain your learning path while exploring new branches

## 🛠 Built With

**Frontend & Core:**
- React 18 with TypeScript
- Jotai for state management
- React Router for navigation
- Tailwind CSS for styling

**AI & Services:**
- OpenRouter API (Google Gemini 2.0 Flash)
- Custom AI service with retry mechanisms
- Intelligent caching and request deduplication

**Development & Deployment:**
- Vite for build tooling
- Vercel for deployment
- PWA capabilities with service workers

**Key Features:**
- Infinite scroll with intersection observer
- localStorage caching system
- URL-based state persistence
- Responsive design with mobile-first approach
- Error boundaries and graceful error handling

## 🔗 Try It Out

- **Live Demo**: [https://dots-pwa.vercel.app](https://dots-pwa.vercel.app)
- **Source Code**: [GitHub Repository](https://github.com/carsondb/dots)
- **Install as PWA**: Visit the live demo and click "Install App" when prompted

## 🤖 How Kiro Was Used in This Project

### Building and Vibe Coding from Scratch

**Conversation Structure:**
Our development process with Kiro followed a natural, iterative approach:

1. **Initial Concept Discussion**: Started by explaining the vision of expandable AI search segments
2. **Architecture Planning**: Worked with Kiro to design the component hierarchy and state management approach
3. **Feature-by-Feature Development**: Built each major component (search, segments, infinite scroll) in focused sessions
4. **Integration and Polish**: Connected all pieces and refined the user experience

**Most Impressive Code Generation:**
The most impressive code generation was the **AI Service with intelligent caching and request deduplication**. Kiro helped create a sophisticated system that:

```typescript
// Unified request deduplication and caching
private pendingRequests = new Map<string, Promise<TextSegment[]>>();

private async executeWithCache<T extends TextSegment[]>(
    cacheKey: string,
    requestFn: () => Promise<T>,
    cacheParams: { query: string; parentId?: string; sourceSegmentId?: string },
): Promise<T> {
    // 1. Check localStorage cache first
    const existingResult = cacheService.findExistingQuery(/*...*/);
    if (existingResult) return existingResult.segments as T;

    // 2. Check if request is already pending
    const pendingRequest = this.pendingRequests.get(cacheKey);
    if (pendingRequest) return await pendingRequest as T;

    // 3. Create new request and cache the promise
    const requestPromise = this.executeRequest(requestFn, cacheParams);
    this.pendingRequests.set(cacheKey, requestPromise);
    
    return await requestPromise as T;
}
```

This code elegantly handles:
- Memory and localStorage caching
- Request deduplication to prevent duplicate API calls
- Promise-based pending request management
- Graceful error handling and cleanup

**Development Highlights:**
- **Hierarchical State Management**: Kiro helped design the Jotai atom structure for managing nested, expandable segments
- **Context Builder**: Created intelligent context building for AI prompts that maintains conversation flow
- **Infinite Scroll Hook**: Built a reusable, performant infinite scroll implementation
- **PWA Configuration**: Set up comprehensive PWA features including manifest, service worker, and installation prompts

**Conversation Flow:**
We structured our Kiro conversations around specific features:
- "Let's build the expandable search component"
- "Help me implement infinite scroll with proper performance"
- "Create a caching system that prevents duplicate API requests"
- "Design the AI service to handle hierarchical content expansion"

Each conversation was focused and goal-oriented, allowing Kiro to provide targeted, high-quality code generation that fit seamlessly into our growing application architecture.

## 🎯 Key Features

- **Graph-Based Navigation**: Explore knowledge by traversing connected concepts
- **One-Click Deep Dives**: Expand any point to explore its details and connections
- **No-Typing Interface**: Pure browsing experience optimized for mobile
- **Hierarchical Learning**: Information structured in digestible, connected layers
- **PWA Mobile App**: Install as a native app for seamless mobile learning
- **Smart Context**: AI understands your exploration path for relevant expansions
- **Instant Navigation**: Cached nodes for immediate traversal between explored areas

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and add your OpenRouter API key
4. Start development server: `npm run dev`
5. Build for production: `npm run build`

## 📱 PWA Installation

Visit the live demo and look for the "Install App" button to add Dots to your home screen for a native app experience.

---

*Built for the hackathon with ❤️ using Kiro AI assistance*
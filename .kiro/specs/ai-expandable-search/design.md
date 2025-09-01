# Design Document

## Overview

The AI Expandable Search application transforms the existing dots PWA into an intelligent search interface that provides hierarchical text exploration. Users can search for topics and progressively drill down into more detailed information through clickable text segments.

## Architecture

The application follows a simplified component-based React architecture with two main layers:

- **Presentation Layer**: React components with integrated state management using hooks for search interface and expandable text display
- **Service Layer**: Enhanced AI service for generating segmented responses

## Components and Interfaces

### Core Components

#### AIExpandableSearch Component (Main Component)
- **Purpose**: Main orchestrating component that manages the entire search and expansion flow
- **State**: Search query, text segments, loading states, error handling, navigation history
- **Behavior**: Handles user input, manages AI requests, renders expandable segments, manages hierarchical navigation
- **Hooks**: useState for search state, segments array, loading states, navigation history stack
- **Requirements Addressed**: 2.1, 2.4, 3.3, 4.1, 4.2, 4.3, 5.3

#### SearchInterface Component
- **Purpose**: Dedicated search input component displayed prominently on front page
- **Props**: `onSearch: (query: string) => void`, `isLoading: boolean`
- **Behavior**: Handles text input, form submission, displays search icon, provides input focus management
- **Requirements Addressed**: 1.1, 1.2, 1.3, 2.5
- **Design Rationale**: Separated from main component to ensure prominent front-page placement and focused responsibility

#### TextSegment Component
- **Purpose**: Individual clickable text segment with structured title and paragraph content, visual feedback and loading states
- **Props**: `segment: TextSegment`, `onClick: () => void`, `isLoading: boolean`
- **Behavior**: Displays segment title prominently with paragraph content (max 50 words), provides immediate visual feedback on hover/click, displays loading state for specific segment being expanded
- **Requirements Addressed**: 3.1, 3.2, 4.1, 4.2, 5.1, 5.2
- **Design Rationale**: Structured title/paragraph format improves readability and content organization while individual loading states prevent UI blocking and provide clear feedback about which segment is being processed

#### ExpandableTextList Component
- **Purpose**: Container component that renders lists of TextSegment components with hierarchy management
- **Props**: `segments: TextSegment[]`, `onSegmentClick: (segment: TextSegment) => void`, `expandingSegmentId?: string`
- **Behavior**: Renders segment lists, manages click delegation, handles empty states and error display
- **Requirements Addressed**: 2.3, 3.3, 4.3, 4.4
- **Design Rationale**: Separates list management from individual segment rendering for better maintainability

#### TopBar Component
- **Purpose**: Navigation component for hierarchical exploration with back navigation
- **Props**: `title: string`, `onBack?: () => void`, `showBackButton: boolean`
- **Behavior**: Displays current level context, provides navigation back to previous levels
- **Requirements Addressed**: 4.3, 5.1
- **Design Rationale**: Provides clear navigation context and maintains hierarchy awareness

### Data Models

#### TextSegment Interface
```typescript
interface TextSegment {
  id: string;
  title: string;
  content: string;
  level: number;
  isExpanded: boolean;
  children?: TextSegment[];
}
```

#### NavigationItem Interface
```typescript
interface NavigationItem {
  id: string;
  title: string;
  segments: TextSegment[];
}
```

### Service Layer Enhancements

#### AIService Extensions
- **generateSegments(query: string): Promise<TextSegment[]>**
  - Prompts AI to return structured segments with titles and paragraphs (max 50 words per paragraph)
  - Parses response into TextSegment objects with unique IDs, titles, and content
  - **Requirements Addressed**: 2.1, 2.2, 2.3
  - **Design Rationale**: Title/paragraph structure with 50-word limit provides better content organization while ensuring quick comprehension
  
- **expandSegment(segment: TextSegment): Promise<TextSegment[]>**
  - Sends segment title and content for detailed expansion
  - Returns new child segments with structured titles and paragraphs (max 50 words each)
  - Preserves hierarchical relationship through parent-child linking
  - **Requirements Addressed**: 3.2, 3.3, 3.4, 4.1, 4.2
  - **Design Rationale**: Maintains consistent title/paragraph structure across all expansion levels for better content organization

#### Prompt Engineering
- **Initial Search Prompt**: "Provide a concise answer to '{query}' as a numbered list. For each point, provide a short title and a paragraph explanation (maximum 50 words). Format as: 'Title: [title]\nContent: [paragraph]'"
- **Expansion Prompt**: "Expand on this topic: '{segment.title}' - '{segment.content}'. Provide 3-5 detailed sub-points, each with a title and paragraph (maximum 50 words). Format as: 'Title: [title]\nContent: [paragraph]'"
- **Design Rationale**: Structured prompts with title/paragraph format ensure consistent AI responses that can be reliably parsed into the required segment format with improved content organization

#### Error Handling and Resilience
- **Request timeout handling**: Prevents hanging requests from blocking the interface
- **Response validation**: Ensures AI responses can be parsed into valid TextSegment objects
- **Graceful failure modes**: Maintains current view state when expansion requests fail
- **Requirements Addressed**: 2.4, 3.5

## Data Flow

```mermaid
graph TD
    A[Application loads] --> B[SearchInterface displayed prominently]
    B --> C[User enters search query]
    C --> D[Show loading indicator]
    D --> E[AIService.generateSegments]
    E --> F[Parse response into TextSegment[]]
    F --> G[ExpandableTextList renders segments]
    G --> H[User clicks segment]
    H --> I[Show segment-specific loading state]
    I --> J[AIService.expandSegment]
    J --> K[Update segment with children]
    K --> L[Re-render with expanded content]
    L --> M[All expanded segments remain clickable]
    M --> H
    
    E --> N[API Error]
    N --> O[Display error message]
    O --> B
    
    J --> P[Expansion Error]
    P --> Q[Show error while preserving current view]
    Q --> G
```

**Design Rationale**: The flow ensures that users always have immediate visual feedback (loading states) and that errors don't disrupt the current exploration state. Multiple expansion levels are supported through recursive segment clicking.

## State Management

### Component State (useState hooks)
- **searchQuery**: Current search input string
- **segments**: Array of TextSegment objects for current results
- **isSearching**: Boolean for search loading state (addresses requirement 2.5)
- **expandingSegmentId**: String ID of segment currently being expanded (addresses requirement 5.2)
- **error**: String for error messages (addresses requirements 2.4, 3.5)
- **navigationHistory**: Array of NavigationItem objects tracking hierarchical exploration path

### State Updates and Behavior
- **Search Initiation**: 
  - Set isSearching to true for immediate feedback (requirement 5.1)
  - Clear previous segments and errors
  - Reset navigation history for new search context
- **Search Completion**: 
  - Replace segments array with new results
  - Set isSearching to false
  - Handle empty results gracefully
- **Segment Expansion**: 
  - Set expandingSegmentId for specific loading feedback (requirement 5.2)
  - Preserve current view during expansion (requirement 3.5)
  - Update segments with expanded content while maintaining hierarchy (requirement 4.3)
- **Error Handling**: 
  - Display appropriate error messages without losing current state (requirements 2.4, 3.5)
  - Clear loading states on error
- **Concurrent Request Management**: 
  - Prevent multiple simultaneous expansions of the same segment (requirement 5.4)
  - Handle race conditions appropriately

**Design Rationale**: State management prioritizes user feedback and maintains exploration context. Individual segment loading states prevent UI blocking while preserving the ability to continue exploring other segments.

## User Interface Design

### Layout Structure
- **Front Page Search Interface**: 
  - Search icon and input bar displayed prominently on front page (requirement 1.1)
  - Centered layout for immediate user attention
  - Input field focuses on click for easy text entry (requirement 1.2)
  - Accepts text input up to reasonable character limits (requirement 1.3)
- **Navigation Area**: TopBar component showing current context with back navigation
- **Results Area**: Scrollable list of text segments with hierarchical indentation
- **Segment Styling**: 
  - Structured layout with prominent title and paragraph content (max 50 words)
  - Visually clickable appearance with hover effects and cursor pointer (requirement 3.1)
  - Individual loading spinners for segments being expanded (requirement 5.2)
  - Clear visual hierarchy showing expansion levels with consistent title/paragraph structure (requirement 4.3)
  - Immediate visual feedback on click (requirement 5.1)

### Interaction Design
- **Search Flow**: 
  - Prominent search interface on application load
  - Loading indicator during query processing (requirement 2.5)
  - Smooth transition to results display (requirement 5.3)
- **Expansion Flow**: 
  - All text segments remain clickable at every level (requirements 4.1, 4.2)
  - Segment-specific loading states prevent interface blocking
  - Expanded content displays smoothly with maintained hierarchy (requirement 4.4)
- **Error States**: 
  - Error messages display without disrupting current view (requirements 2.4, 3.5)
  - Clear distinction between search errors and expansion errors

### Responsive Behavior
- Mobile-first design maintaining PWA compatibility
- Touch-friendly segment sizes for easy interaction
- Smooth animations for expansions and transitions (requirement 5.3)
- Keyboard navigation support for accessibility

**Design Rationale**: The interface prioritizes immediate feedback and maintains exploration context. The prominent front-page search interface ensures users can easily start their exploration, while the hierarchical display and individual loading states provide clear feedback about system state and available actions.

## Error Handling

### API Failures
- **Search Failures**: Display appropriate error messages when AI service fails (requirement 2.4)
- **Expansion Failures**: Show error messages while preserving current view (requirement 3.5)
- **Graceful Degradation**: Maintain application functionality when AI service is temporarily unavailable
- **State Preservation**: Never lose user's current exploration context due to errors

### User Input and Interaction Management
- **Empty Query Handling**: Gracefully handle empty or invalid search queries
- **Concurrent Request Prevention**: Prevent multiple simultaneous requests for the same segment (requirement 5.4)
- **Rate Limiting**: Implement appropriate throttling for rapid user interactions
- **Input Validation**: Ensure text input stays within reasonable character limits (requirement 1.3)

### Network and Performance Issues
- **Request Timeout Handling**: Prevent hanging requests from blocking the interface
- **Connection Retry Logic**: Implement smart retry mechanisms for transient failures
- **Loading State Management**: Ensure loading indicators are properly cleared on errors
- **Memory Management**: Handle large expansion trees efficiently

### User Experience During Errors
- **Clear Error Messaging**: Provide specific, actionable error messages for different failure scenarios
- **Recovery Options**: Allow users to retry failed operations without losing context
- **Fallback States**: Provide meaningful fallback content when possible
- **Accessibility**: Ensure error states are properly announced to screen readers

**Design Rationale**: Error handling is designed to maintain user trust and exploration flow. By preserving the current view during errors and providing clear feedback, users can continue their exploration even when individual operations fail. The system prioritizes graceful degradation over complete failure.

# Message Component Architecture

## Overview

The Message component has been refactored to follow best practices for React component design:

1. **Component Composition**: Breaking down the large component into smaller, focused components
2. **Separation of Concerns**: Completely separating styling from component logic
3. **React-First Approach**: Using React components instead of HTML strings
4. **Type Safety**: Ensuring all components are properly typed
5. **Accessibility**: Improving accessibility with proper ARIA attributes

## Component Structure

### Main Components

- **Message**: The main container component that orchestrates all sub-components
- **MessageAvatar**: Displays the user or bot avatar
- **MessageContent**: Renders the message content using the markdown renderer
- **MessageAttachments**: Displays file attachments with download and view options
- **MessageActions**: Provides reaction, pin, and citation actions
- **ImageDialog**: Displays a confirmation dialog for viewing external images

### Markdown Components

- **MarkdownRenderer**: Processes markdown content and renders it as React components
- **MarkdownImage**: Renders images with click-to-view functionality
- **MarkdownLink**: Renders links with proper external link indicators
- **MarkdownCode**: Renders code blocks with syntax highlighting

## Style Architecture

All styles have been moved to a dedicated style utility file:

- **messageStyles.ts**: Contains all style utilities and the `getMessageStyles` function

## Usage

```tsx
import Message from './components/message/Message';

// In your component
<Message
  message={messageData}
  onMultimediaClick={handleMultimediaClick}
  onReact={handleReaction}
  onPin={handlePin}
  isDarkMode={isDarkMode}
  showCitations={showCitations}
  id={`message-${messageData.id}`}
/>
```

## Benefits

This refactoring provides several key benefits:

1. **Maintainability**: Smaller components are easier to maintain and test
2. **Reusability**: Components can be reused in other parts of the application
3. **Performance**: Better control over component rendering and updates
4. **Readability**: Code is more organized and easier to understand
5. **Extensibility**: Easier to add new features or modify existing ones

## Security

The markdown rendering now uses DOMPurify to sanitize HTML and prevent XSS attacks.

## Accessibility

Improved accessibility with:
- Proper ARIA attributes
- Semantic HTML
- Keyboard navigation support
- Screen reader friendly content

## Future Improvements

Potential future improvements include:

1. Adding more customization options for markdown rendering
2. Implementing virtualization for large message lists
3. Adding animation options for message transitions
4. Improving performance with memoization and optimized rendering
5. Adding support for more markdown extensions

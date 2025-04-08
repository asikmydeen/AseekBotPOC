# Style Refactoring Plan

## Current Status

We've started the process of centralizing styles in the application by:

1. Creating a `messageStyles.ts` file with utility functions for generating style classes
2. Moving animation variants to the style file
3. Implementing key style utilities for the most commonly used components
4. Applying these utilities to the `Message.tsx` component

## Next Steps

To complete the style refactoring, we should:

1. **Identify Component Patterns**: Review all components to identify common styling patterns
2. **Create Style Modules**: Create dedicated style modules for each component or component group
3. **Implement Style Utilities**: Implement utility functions for all inline styles
4. **Apply Style Utilities**: Update components to use the style utilities
5. **Test and Verify**: Ensure all components render correctly with the new styles

## Component-Specific Plans

### Message Component

The `Message.tsx` component has several areas that need style refactoring:

- **Message Container**: Replace inline styles with utility functions
- **Avatar**: Create utilities for avatar styling
- **Typing Indicator**: Create utilities for typing indicator styling
- **Image Confirmation Dialog**: Create utilities for dialog styling
- **File Attachments**: Create utilities for file attachment styling
- **Citations**: Create utilities for citation styling
- **Reports**: Create utilities for report styling

### Other Components

Identify other components that need style refactoring:

- **Chat Interface**: Create utilities for chat interface styling
- **Sidebar**: Create utilities for sidebar styling
- **Forms**: Create utilities for form styling
- **Buttons**: Create utilities for button styling
- **Modals**: Create utilities for modal styling

## Implementation Strategy

1. **Start with High-Impact Components**: Focus on components that are used most frequently
2. **Create Reusable Utilities**: Ensure utilities are reusable across components
3. **Document Style Patterns**: Document style patterns and usage in README files
4. **Maintain Theme Support**: Ensure all utilities support both light and dark themes
5. **Consider CSS Variables**: Evaluate using CSS variables for more dynamic theming

## Benefits

This refactoring will provide several benefits:

1. **Consistency**: Ensure consistent styling across the application
2. **Maintainability**: Make it easier to update styles in one place
3. **Readability**: Improve code readability by separating styles from component logic
4. **Performance**: Reduce duplication of style definitions
5. **Theme Support**: Make it easier to implement and maintain themes

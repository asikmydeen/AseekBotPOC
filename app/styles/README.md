# Styling Architecture

This document outlines the styling architecture for the AseekBot application.

## Centralized Styles

We've moved from inline styles to a more centralized approach using style utility functions and constants. This provides several benefits:

1. **Consistency**: Styles are defined in one place and reused across components
2. **Maintainability**: Changes to styles can be made in one place
3. **Readability**: Components are cleaner and more focused on functionality
4. **Theme Support**: Dark/light mode is easier to implement and maintain

## Style Files

- `messageStyles.ts`: Contains styles for the Message component
  - Animation variants
  - Style utility functions
  - Theme-aware class generators

## Usage

Import style utilities from the appropriate file:

```typescript
import {
  messageAnimationVariants,
  darkMessageAnimationVariants,
  buttonAnimationVariants,
  getMessageContainerClass,
  getMarkdownContentClass
} from '../styles/messageStyles';
```

Then use them in your components:

```typescript
<motion.div
  variants={isDarkMode ? darkMessageAnimationVariants : messageAnimationVariants}
  initial="initial"
  animate="animate"
  whileHover="hover"
  className={getMessageContainerClass(message.sender, isDarkMode)}
>
  {/* Component content */}
</motion.div>
```

## Benefits of This Approach

1. **Separation of Concerns**: UI logic is separated from styling
2. **Reusability**: Styles can be reused across components
3. **Maintainability**: Changes to styles are centralized
4. **Performance**: Reduces duplication of style definitions
5. **Consistency**: Ensures consistent styling across the application

## Future Improvements

1. **Expand to More Components**: Apply this pattern to other components
2. **Theme System**: Develop a more comprehensive theme system
3. **Style Variables**: Use CSS variables for more dynamic theming
4. **Component Library**: Build a reusable component library with consistent styling

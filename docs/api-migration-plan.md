# API Migration Plan: From advancedApi.ts to Zustand

This document outlines the plan for migrating from the current `advancedApi.ts` approach to the new Zustand-based API state management.

## Migration Strategy

We're using a gradual migration approach to minimize disruption:

1. **Phase 1: Create Zustand Stores and Adapter (Current)**
   - Implement Zustand stores for API state management
   - Create an adapter that maintains the old API interface but uses the new implementation
   - Update a few key components to use the adapter

2. **Phase 2: Component Migration**
   - Gradually update components to use the new Zustand hooks directly
   - Test each component thoroughly after migration
   - Keep the adapter in place during this phase

3. **Phase 3: Cleanup**
   - Remove the adapter once all components are migrated
   - Remove the old `advancedApi.ts` file
   - Update tests to use the new API approach

## Current Progress

### Completed
- Created Zustand stores for API state management
  - `apiStore.ts`: Core store for API state
  - `promptsStore.ts`: Store for prompts data
  - `chatStore.ts`: Store for chat state
- Created API service layer (`apiService.ts`)
- Created advanced API hooks (`useApi.ts`, `useApiWithZustand.ts`)
- Created migration adapter (`apiMigrationAdapter.ts`)
- Updated several components to use the adapter:
  - `AppSidebar.tsx`
  - `page.tsx`
  - `useChatMessages.ts`
  - `useAsyncProcessing.ts`

### In Progress
- Updating remaining components to use the adapter
- Testing the new implementation

### Remaining
- Migrate components to use Zustand hooks directly
- Update tests
- Remove adapter and old implementation

## Migration Checklist

### Components to Update

- [ ] `ChatInterface.tsx`
- [ ] `DocumentAnalysisPrompt.tsx`
- [ ] `FileUploadSection.tsx`
- [ ] `PromptsContext.tsx` (partially migrated)
- [ ] `TicketForm.tsx`
- [ ] `useFileUpload.ts`
- [ ] `useTicketSystem.ts`
- [ ] `useFileActions.ts`

### Tests to Update

- [ ] `advancedApi.test.ts` → `apiService.test.ts`
- [ ] `useChatMessages.test.ts`
- [ ] Add tests for Zustand stores

## How to Use the New API

### Using the Migration Adapter

During the migration phase, update imports from:

```typescript
import { someFunction } from '../api/advancedApi';
```

To:

```typescript
import { someFunction } from '../utils/apiMigrationAdapter';
```

### Using Zustand Hooks Directly

Once a component is fully migrated, use the new hooks:

```typescript
// Before
import { getPromptsApi } from '../api/advancedApi';

// After
import { useGetPrompts } from '../hooks/useApi';

function MyComponent() {
  const { data: prompts, isLoading, error } = useGetPrompts();
  
  // Use prompts, isLoading, and error directly
}
```

### Making Direct API Calls

For imperative API calls:

```typescript
// Before
import { sendMessage } from '../api/advancedApi';
const response = await sendMessage(text, sessionId);

// After
import { apiService } from '../utils/apiService';
const response = await apiService.sendMessage(text, sessionId);
```

## Benefits of the New Approach

1. **Centralized State Management**: All API-related state is managed in a single place
2. **Improved Performance**: Zustand's selective re-rendering prevents unnecessary component updates
3. **Better Developer Experience**: Simpler API for making requests and handling responses
4. **Enhanced Caching and Deduplication**: Prevents duplicate API calls and improves performance
5. **Maintainability**: More modular and easier to maintain

## Troubleshooting

If you encounter issues during migration:

1. Check that all imports are updated correctly
2. Ensure the adapter is being used consistently
3. Verify that the API response structure matches what the component expects
4. Look for any missed dynamic imports (`await import('../api/advancedApi')`)

## Timeline

- **Phase 1**: Complete by end of current sprint
- **Phase 2**: Complete by end of next sprint
- **Phase 3**: Complete by end of following sprint

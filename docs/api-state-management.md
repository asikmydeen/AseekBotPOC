# API State Management with Zustand

This document explains the new API state management approach using Zustand in the AseekBot application.

## Overview

We've implemented a more efficient and centralized state management system for API calls using Zustand. This approach offers several advantages:

- **Centralized state management**: All API-related state is stored in a single place
- **Reduced prop drilling**: Components can access API state directly without passing props through multiple levels
- **Improved performance**: Zustand's selective re-rendering prevents unnecessary component updates
- **Better developer experience**: Simpler API for making requests and handling responses
- **Enhanced caching and deduplication**: Prevents duplicate API calls and improves performance

## Architecture

The API state management system consists of several key components:

### 1. API Store (app/store/apiStore.ts)

The core Zustand store that manages all API-related state:

- Tracks all API requests, responses, and errors
- Provides actions for starting requests, setting responses, and handling errors
- Maintains loading states for all API calls

### 2. API Service (app/utils/apiService.ts)

A utility layer that provides methods for making API requests:

- Handles common API operations (GET, POST, etc.)
- Updates the API store with request status
- Provides type-safe methods for all API endpoints

### 3. API Hooks (app/hooks/useApi.ts)

Custom React hooks for making API requests with advanced features:

- Request caching to prevent duplicate requests
- Automatic retries for failed requests
- Loading and error state management
- Success and error callbacks

## Usage Examples

### Basic API Request

```tsx
import { useApi } from '../hooks/useApi';
import { apiService } from '../utils/apiService';

function UserProfile({ userId }) {
  const { data, isLoading, error } = useApi(
    () => apiService.getUserById(userId),
    { enabled: !!userId }
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h1>{data.name}</h1>
      <p>{data.email}</p>
    </div>
  );
}
```

### Manual API Request

```tsx
import { useApi } from '../hooks/useApi';
import { apiService } from '../utils/apiService';

function CreateUserForm() {
  const { execute, isLoading, error } = useApi(
    apiService.createUser,
    { enabled: false }
  );

  const handleSubmit = async (userData) => {
    try {
      const newUser = await execute(userData);
      console.log('User created:', newUser);
    } catch (err) {
      console.error('Failed to create user:', err);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create User'}
      </button>
      {error && <div className="error">{error.message}</div>}
    </form>
  );
}
```

### Using Predefined API Hooks

```tsx
import { useGetPrompts, useCreatePrompt } from '../hooks/useApi';

function PromptsManager() {
  // Get all prompts
  const { 
    data: prompts, 
    isLoading: isLoadingPrompts 
  } = useGetPrompts();

  // Create a new prompt
  const { 
    execute: createPrompt, 
    isLoading: isCreating 
  } = useCreatePrompt();

  const handleCreatePrompt = async (promptData) => {
    await createPrompt(promptData);
  };
  
  return (
    <div>
      <h1>Prompts</h1>
      {isLoadingPrompts ? (
        <div>Loading prompts...</div>
      ) : (
        <ul>
          {prompts?.map(prompt => (
            <li key={prompt.id}>{prompt.title}</li>
          ))}
        </ul>
      )}
      <button 
        onClick={() => handleCreatePrompt({ title: 'New Prompt' })}
        disabled={isCreating}
      >
        {isCreating ? 'Creating...' : 'Create Prompt'}
      </button>
    </div>
  );
}
```

## Migration Guide

To migrate existing components to use the new API state management:

1. Replace direct API calls with calls to the `apiService` or use the `useApi` hook
2. Remove local loading and error states, using the ones provided by the hooks
3. Update any components that relied on the old context-based API state

## Advanced Features

### Request Caching

The `useApi` hook includes built-in caching to prevent duplicate requests:

```tsx
// This will only make one API call even if multiple components use it
const { data } = useApi(
  apiService.getPrompts,
  { cacheTime: 60000 } // Cache for 1 minute
);
```

### Request Deduplication

Multiple components requesting the same data will share a single API call:

```tsx
// Component A
const { data: promptsA } = useApi(apiService.getPrompts);

// Component B (will use the same request as Component A)
const { data: promptsB } = useApi(apiService.getPrompts);
```

### Automatic Retries

Failed requests can automatically retry:

```tsx
const { data } = useApi(
  apiService.getPrompts,
  { 
    retry: 3,        // Retry up to 3 times
    retryDelay: 1000 // Wait 1 second between retries
  }
);
```

## Best Practices

1. Use the predefined hooks when possible for common API operations
2. Set appropriate cache times based on how frequently data changes
3. Use the `enabled` option to control when requests are made
4. Provide meaningful error handling with `onError` callbacks
5. Use the `execute` function for manual control over when requests are made

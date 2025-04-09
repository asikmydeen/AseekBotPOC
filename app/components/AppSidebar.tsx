'use client';

// This is a compatibility file that re-exports the new AppSidebar component
// from its new location to maintain backward compatibility with existing imports.

import AppSidebar from './sidebar/AppSidebar';

// Re-export all the types and interfaces from the new component
export * from './sidebar/AppSidebar';

export default AppSidebar;

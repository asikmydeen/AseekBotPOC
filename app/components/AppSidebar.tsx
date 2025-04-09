'use client';

// This is a temporary compatibility file that will be removed once all imports are updated
// It simply re-exports the AppSidebar component from its new location

import AppSidebar from './sidebar/AppSidebar';
export type { UploadedFile, AppSidebarProps } from './sidebar/AppSidebar';

export default AppSidebar;

"use client";
import React from 'react';
import EnhancedFileDialogTest from '../components/prompts/EnhancedFileDialogTest';

export default function TestEnhancedDialogPage() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Enhanced File Dialog Test Page</h1>
        <EnhancedFileDialogTest />
      </div>
    </div>
  );
}

// app/page.tsx
"use client";
import { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import ChatInterface with SSR disabled
const ChatInterface = dynamic(() => import('./components/chat/ChatInterface'), { ssr: false });

// app/page.tsx
export default function Home() {
  const [triggerMessage, setTriggerMessage] = useState<string | null>(null);
  const [showDocumentAnalysisPrompt, setShowDocumentAnalysisPrompt] = useState<boolean>(false);

  const handleDocumentAnalysis = () => {
    setShowDocumentAnalysisPrompt(true);
  };

  const clearDocumentAnalysisPrompt = () => {
    setShowDocumentAnalysisPrompt(false);
  };

  // Create a handler for the triggerMessage that ensures document analysis is cleared
  const handleTriggerMessage = (message: string) => {
    // Clear any active document analysis before triggering new message
    clearDocumentAnalysisPrompt();
    // Set the trigger message
    setTriggerMessage(message);
  };

  return (
    <div className="flex h-screen w-full">
      <div className="flex-1 h-screen">
        <ChatInterface
          triggerMessage={triggerMessage}
          onTriggerHandled={() => setTriggerMessage(null)}
          showDocumentAnalysisPrompt={showDocumentAnalysisPrompt}
          clearDocumentAnalysisPrompt={clearDocumentAnalysisPrompt}
        />
      </div>
    </div>
  );
}

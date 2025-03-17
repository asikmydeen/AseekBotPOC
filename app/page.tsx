// app/page.tsx
"use client";
import { useState } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from './components/Sidebar';

// Dynamically import ChatInterface with SSR disabled
const ChatInterface = dynamic(() => import('./components/chat/ChatInterface'), { ssr: false });

export default function Home() {
  const [triggerMessage, setTriggerMessage] = useState<string | null>(null);
  const [showDocumentAnalysisPrompt, setShowDocumentAnalysisPrompt] = useState<boolean>(false);

  const handleDocumentAnalysis = () => {
    setShowDocumentAnalysisPrompt(true);
  };

  const clearDocumentAnalysisPrompt = () => {
    setShowDocumentAnalysisPrompt(false);
  };

  return (
    <div className="flex h-screen w-full">
      <Sidebar
        onQuickLinkClick={setTriggerMessage}
        onDocumentAnalysis={handleDocumentAnalysis}
      />
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

// app/components/ArtifactLayout.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCode, FiX, FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import ArtifactDisplay from './ArtifactDisplay';
import { useArtifacts } from '../hooks/useArtifacts';
import { useTheme } from '../hooks/useTheme';

interface ArtifactLayoutProps {
  children: React.ReactNode;
}

const ArtifactLayout: React.FC<ArtifactLayoutProps> = ({ children }) => {
  const { artifacts, selectedArtifactId, setSelectedArtifactId, removeArtifact } = useArtifacts();
  const { isDarkMode } = useTheme();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);

  // Auto-open panel when artifacts are available
  useEffect(() => {
    if (artifacts.length > 0 && !isPanelOpen) {
      setIsPanelOpen(true);
    } else if (artifacts.length === 0 && isPanelOpen) {
      setIsPanelOpen(false);
    }
  }, [artifacts.length, isPanelOpen]);

  // Handle artifact removal
  const handleRemoveArtifact = (id: string) => {
    removeArtifact(id);
  };

  // Handle artifact copy
  const handleCopyArtifact = (artifact: any) => {
    // Logic for handling copy event, if needed
    console.log(`Copied artifact: ${artifact.title}`);
  };

  // Handle artifact download
  const handleDownloadArtifact = (artifact: any) => {
    // Logic for handling download event, if needed
    console.log(`Downloaded artifact: ${artifact.title}`);
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1 overflow-hidden">
        {/* Main content area */}
        <div
          className={`flex-1 transition-all duration-300 ${
            isPanelOpen
              ? isPanelExpanded
                ? 'mr-[85%] md:mr-3/4 lg:mr-2/3'
                : 'mr-[40%] md:mr-1/3 lg:mr-1/3'
              : 'mr-0'
          }`}
        >
          {children}
        </div>

        {/* Artifact panel */}
        <AnimatePresence>
          {isPanelOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{
                width: isPanelExpanded ? '85%' : '40%',
                opacity: 1,
                transition: { duration: 0.3 }
              }}
              exit={{ width: 0, opacity: 0 }}
              className={`
                fixed right-0 top-0 bottom-0 z-10 flex flex-col
                ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}
                border-l ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}
                shadow-xl
              `}
              style={{
                maxWidth: isPanelExpanded ? '85%' : '500px',
              }}
            >
              {/* Panel header */}
              <div className={`
                flex items-center justify-between p-3
                ${isDarkMode ? 'bg-gray-800' : 'bg-white'}
                border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}
              `}>
                <div className="flex items-center">
                  <FiCode className={`mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <h2 className="font-medium">Artifacts ({artifacts.length})</h2>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsPanelExpanded(!isPanelExpanded)}
                    className={`p-2 rounded-md ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                    aria-label={isPanelExpanded ? 'Shrink panel' : 'Expand panel'}
                  >
                    {isPanelExpanded ? <FiMinimize2 /> : <FiMaximize2 />}
                  </button>
                  <button
                    onClick={() => setIsPanelOpen(false)}
                    className={`p-2 rounded-md ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                    aria-label="Close panel"
                  >
                    <FiX />
                  </button>
                </div>
              </div>

              {/* Artifact display area */}
              <div className="flex-1 overflow-hidden p-3">
                <ArtifactDisplay
                  artifacts={artifacts}
                  isDarkMode={isDarkMode}
                  onRemoveArtifact={handleRemoveArtifact}
                  onCopyArtifact={handleCopyArtifact}
                  onDownloadArtifact={handleDownloadArtifact}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating button to toggle panel when closed */}
      {!isPanelOpen && artifacts.length > 0 && (
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`
            fixed right-6 bottom-24 z-10 p-4 rounded-full shadow-lg
            ${isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600'}
            flex items-center justify-center
          `}
          onClick={() => setIsPanelOpen(true)}
          aria-label="Open artifacts panel"
        >
          <FiCode size={20} />
          <span className="ml-2">{artifacts.length}</span>
        </motion.button>
      )}
    </div>
  );
};

export default ArtifactLayout;
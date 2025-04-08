// app/components/ArtifactPanel.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCode, FiX, FiMaximize2, FiMinimize2, FiCopy, FiDownload } from 'react-icons/fi';
import { useArtifacts } from '../hooks/useArtifacts';
import ArtifactDisplay from './ArtifactDisplay';

interface ArtifactPanelProps {
    isOpen: boolean;
    onClose: () => void;
    isDarkMode: boolean;
}

const ArtifactPanel: React.FC<ArtifactPanelProps> = ({ isOpen, onClose, isDarkMode }) => {
    const { artifacts, selectedArtifactId, setSelectedArtifactId, removeArtifact } = useArtifacts();
    const [isExpanded, setIsExpanded] = useState(false);
    const [copySuccess, setCopySuccess] = useState<string | null>(null);

    // Handle artifact removal
    const handleRemoveArtifact = (id: string) => {
        removeArtifact(id);

        // If this was the last artifact, close the panel
        if (artifacts.length <= 1) {
            setTimeout(onClose, 300);
        }
    };

    // Handle copy to clipboard
    const handleCopyArtifact = async (artifact: any) => {
        try {
            await navigator.clipboard.writeText(artifact.content);
            setCopySuccess(artifact.id);

            // Reset copy success after 2 seconds
            setTimeout(() => {
                setCopySuccess(null);
            }, 2000);
        } catch (err) {
            console.error('Failed to copy content:', err);
        }
    };

    // Handle download
    const handleDownloadArtifact = (artifact: any) => {
        let extension = '.txt';

        // Determine appropriate extension based on type/language
        if (artifact.type === 'html') extension = '.html';
        else if (artifact.type === 'react') extension = '.jsx';
        else if (artifact.type === 'svg') extension = '.svg';
        else if (artifact.type === 'markdown') extension = '.md';
        else if (artifact.type === 'mermaid') extension = '.mmd';
        else if (artifact.type === 'code' && artifact.language) {
            switch (artifact.language.toLowerCase()) {
                case 'javascript': extension = '.js'; break;
                case 'typescript': extension = '.ts'; break;
                case 'jsx': extension = '.jsx'; break;
                case 'tsx': extension = '.tsx'; break;
                case 'python': extension = '.py'; break;
                case 'html': extension = '.html'; break;
                case 'css': extension = '.css'; break;
                default: extension = '.txt';
            }
        }

        const filename = `${artifact.title.replace(/\s+/g, '_')}${extension}`;
        const blob = new Blob([artifact.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // If there are no artifacts, don't render the panel
    if (artifacts.length === 0) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ x: '100%', opacity: 0 }}
                    animate={{
                        x: 0,
                        opacity: 1,
                        width: isExpanded ? '60%' : '40%',
                    }}
                    exit={{ x: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className={`
            fixed right-0 top-0 bottom-0 z-10 flex flex-col
            ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}
            border-l ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}
            shadow-xl
          `}
                    style={{
                        maxWidth: isExpanded ? '60%' : '500px',
                    }}
                >
                    {/* Panel header */}
                    <div className={`
            flex items-center justify-between p-3 border-b
            ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}
          `}>
                        <div className="flex items-center">
                            <FiCode className={`mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                            <h2 className="font-medium">Artifacts ({artifacts.length})</h2>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className={`p-2 rounded-md ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                                aria-label={isExpanded ? 'Shrink panel' : 'Expand panel'}
                            >
                                {isExpanded ? <FiMinimize2 /> : <FiMaximize2 />}
                            </button>
                            <button
                                onClick={onClose}
                                className={`p-2 rounded-md ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                                aria-label="Close panel"
                            >
                                <FiX />
                            </button>
                        </div>
                    </div>

                    {/* Tabs header */}
                    <div className={`
            flex items-center overflow-x-auto border-b p-1 hide-scrollbar
            ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-300'}
          `}>
                        {artifacts.map(artifact => (
                            <button
                                key={artifact.id}
                                onClick={() => setSelectedArtifactId(artifact.id)}
                                className={`
                  flex items-center px-3 py-1.5 text-sm rounded-md whitespace-nowrap mr-2
                  ${selectedArtifactId === artifact.id
                                        ? isDarkMode
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-blue-500 text-white'
                                        : isDarkMode
                                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            : 'bg-white text-gray-700 hover:bg-gray-200'
                                    }
                `}
                            >
                                <span className="truncate max-w-[150px]">{artifact.title}</span>
                            </button>
                        ))}
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

                    {/* Footer with actions for current artifact */}
                    {selectedArtifactId && (
                        <div className={`
              flex items-center justify-end p-3 border-t
              ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}
            `}>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => {
                                        const artifact = artifacts.find(a => a.id === selectedArtifactId);
                                        if (artifact) handleCopyArtifact(artifact);
                                    }}
                                    className={`
                    flex items-center px-3 py-1.5 rounded-md text-sm
                    ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}
                  `}
                                >
                                    {copySuccess === selectedArtifactId ? (
                                        <span className="text-green-500">Copied!</span>
                                    ) : (
                                        <>
                                            <FiCopy className="mr-1.5" />
                                            <span>Copy</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        const artifact = artifacts.find(a => a.id === selectedArtifactId);
                                        if (artifact) handleDownloadArtifact(artifact);
                                    }}
                                    className={`
                    flex items-center px-3 py-1.5 rounded-md text-sm
                    ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}
                  `}
                                >
                                    <FiDownload className="mr-1.5" />
                                    <span>Download</span>
                                </button>
                                <button
                                    onClick={() => {
                                        if (selectedArtifactId) handleRemoveArtifact(selectedArtifactId);
                                    }}
                                    className={`
                    flex items-center px-3 py-1.5 rounded-md text-sm
                    ${isDarkMode
                                            ? 'bg-red-900 hover:bg-red-800 text-white'
                                            : 'bg-red-100 hover:bg-red-200 text-red-700'
                                        }
                  `}
                                >
                                    <FiX className="mr-1.5" />
                                    <span>Remove</span>
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ArtifactPanel;
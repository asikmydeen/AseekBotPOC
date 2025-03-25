// app/components/ArtifactDisplay.tsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FiMaximize2, FiMinimize2, FiDownload, FiCopy, FiCheckCircle, FiCode, FiFileText, FiX } from 'react-icons/fi';
import { FaReact, FaHtml5, FaCss3Alt, FaJs, FaPython, FaMarkdown } from 'react-icons/fa';

export interface Artifact {
  id: string;
  title: string;
  content: string;
  type: 'html' | 'react' | 'code' | 'image' | 'markdown' | 'mermaid' | 'svg';
  language?: string;
  createdAt: string;
}

interface ArtifactDisplayProps {
  artifacts: Artifact[];
  isDarkMode: boolean;
  onRemoveArtifact?: (id: string) => void;
  onCopyArtifact?: (artifact: Artifact) => void;
  onDownloadArtifact?: (artifact: Artifact) => void;
}

// A separate component to render HTML content in an iframe
const HtmlPreview: React.FC<{ html: string }> = ({ html }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current && html) {
      const iframeDoc = iframeRef.current.contentDocument;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(html);
        iframeDoc.close();
      }
    }
  }, [html]);

  return (
    <iframe
      ref={iframeRef}
      className="w-full h-full border-0"
      title="HTML Preview"
      sandbox="allow-scripts"
    />
  );
};

const ArtifactDisplay: React.FC<ArtifactDisplayProps> = ({
  artifacts,
  isDarkMode,
  onRemoveArtifact,
  onCopyArtifact,
  onDownloadArtifact
}) => {
  const [selectedArtifact, setSelectedArtifact] = useState<string | null>(
    artifacts.length > 0 ? artifacts[0].id : null
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Update selected artifact when artifacts change
  useEffect(() => {
    if (artifacts.length > 0 && !artifacts.find(a => a.id === selectedArtifact)) {
      setSelectedArtifact(artifacts[0].id);
    }
  }, [artifacts, selectedArtifact]);

  // Handle copy to clipboard
  const handleCopy = async (artifact: Artifact) => {
    try {
      await navigator.clipboard.writeText(artifact.content);
      setCopySuccess(artifact.id);
      if (onCopyArtifact) {
        onCopyArtifact(artifact);
      }
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Handle download
  const handleDownload = (artifact: Artifact) => {
    let extension = '.txt';
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
        case 'java': extension = '.java'; break;
        case 'c': extension = '.c'; break;
        case 'cpp': extension = '.cpp'; break;
        case 'csharp': extension = '.cs'; break;
        case 'go': extension = '.go'; break;
        case 'rust': extension = '.rs'; break;
        case 'ruby': extension = '.rb'; break;
        case 'php': extension = '.php'; break;
        case 'swift': extension = '.swift'; break;
        case 'kotlin': extension = '.kt'; break;
        case 'sql': extension = '.sql'; break;
        case 'css': extension = '.css'; break;
        case 'scss': extension = '.scss'; break;
        case 'json': extension = '.json'; break;
        case 'yaml': extension = '.yaml'; break;
        case 'xml': extension = '.xml'; break;
        case 'bash': extension = '.sh'; break;
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

    if (onDownloadArtifact) {
      onDownloadArtifact(artifact);
    }
  };

  const currentArtifact = artifacts.find(a => a.id === selectedArtifact) || null;

  // Determine icon based on artifact type or language
  const getArtifactIcon = (artifact: Artifact) => {
    switch (artifact.type) {
      case 'html':
        return <FaHtml5 className="text-orange-500" />;
      case 'react':
        return <FaReact className="text-blue-400" />;
      case 'markdown':
        return <FaMarkdown className="text-purple-500" />;
      case 'svg':
        return <FaHtml5 className="text-green-500" />;
      case 'code':
        if (artifact.language) {
          switch (artifact.language.toLowerCase()) {
            case 'javascript':
            case 'js':
              return <FaJs className="text-yellow-400" />;
            case 'typescript':
            case 'ts':
              return <FaJs className="text-blue-500" />;
            case 'css':
              return <FaCss3Alt className="text-blue-500" />;
            case 'python':
              return <FaPython className="text-green-600" />;
            default:
              return <FiCode />;
          }
        }
        return <FiCode />;
      default:
        return <FiFileText />;
    }
  };

  // Render artifact content based on type
  const renderArtifactContent = (artifact: Artifact) => {
    switch (artifact.type) {
      case 'html':
        return <HtmlPreview html={artifact.content} />;
      case 'react':
        return (
          <SyntaxHighlighter
            language="jsx"
            style={isDarkMode ? atomDark : prism}
            className="rounded-md text-sm h-full overflow-auto"
          >
            {artifact.content}
          </SyntaxHighlighter>
        );
      case 'svg':
        return (
          <div className="w-full h-full flex items-center justify-center bg-white dark:bg-gray-800 p-4">
            <div dangerouslySetInnerHTML={{ __html: artifact.content }} />
          </div>
        );
      case 'markdown':
        return (
          <SyntaxHighlighter
            language="markdown"
            style={isDarkMode ? atomDark : prism}
            className="rounded-md text-sm h-full overflow-auto"
          >
            {artifact.content}
          </SyntaxHighlighter>
        );
      case 'mermaid':
        return (
          <SyntaxHighlighter
            language="markdown"
            style={isDarkMode ? atomDark : prism}
            className="rounded-md text-sm h-full overflow-auto"
          >
            {artifact.content}
          </SyntaxHighlighter>
        );
      case 'code':
        return (
          <SyntaxHighlighter
            language={artifact.language || 'text'}
            style={isDarkMode ? atomDark : prism}
            className="rounded-md text-sm h-full overflow-auto"
          >
            {artifact.content}
          </SyntaxHighlighter>
        );
      default:
        return (
          <pre className="whitespace-pre-wrap text-sm p-4 h-full overflow-auto">
            {artifact.content}
          </pre>
        );
    }
  };

  return (
    <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`
          ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}
          ${isFullscreen ? 'w-full h-full' : 'rounded-lg border shadow-lg'}
          ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}
          flex flex-col overflow-hidden
        `}
      >
        {/* Header with tabs */}
        <div className={`
          flex items-center justify-between p-2
          ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}
          border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}
        `}>
          <div className="flex-1 flex items-center space-x-2 overflow-x-auto hide-scrollbar">
            {artifacts.map((artifact) => (
              <button
                key={artifact.id}
                onClick={() => setSelectedArtifact(artifact.id)}
                className={`
                  flex items-center px-3 py-1.5 text-sm rounded-md whitespace-nowrap
                  ${selectedArtifact === artifact.id
                    ? isDarkMode
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : isDarkMode
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'bg-white text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                <span className="mr-2">{getArtifactIcon(artifact)}</span>
                <span className="truncate max-w-[150px]">{artifact.title}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`p-1.5 rounded-md ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            {currentArtifact && (
              <motion.div
                key={currentArtifact.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 overflow-hidden relative"
              >
                <div className="absolute inset-0">
                  {renderArtifactContent(currentArtifact)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer with actions */}
        {currentArtifact && (
          <div className={`
            flex items-center justify-between p-2
            ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}
            border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}
          `}>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(currentArtifact.createdAt).toLocaleString()}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleCopy(currentArtifact)}
                className={`
                  flex items-center px-2 py-1 rounded-md text-sm
                  ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-200'}
                `}
                aria-label="Copy to clipboard"
              >
                {copySuccess === currentArtifact.id ? (
                  <>
                    <FiCheckCircle className="mr-1 text-green-500" />
                    <span className="text-green-500">Copied!</span>
                  </>
                ) : (
                  <>
                    <FiCopy className="mr-1" />
                    <span>Copy</span>
                  </>
                )}
              </button>
              <button
                onClick={() => handleDownload(currentArtifact)}
                className={`
                  flex items-center px-2 py-1 rounded-md text-sm
                  ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-200'}
                `}
                aria-label="Download"
              >
                <FiDownload className="mr-1" />
                <span>Download</span>
              </button>
              {onRemoveArtifact && (
                <button
                  onClick={() => onRemoveArtifact(currentArtifact.id)}
                  className={`
                    flex items-center px-2 py-1 rounded-md text-sm
                    ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-red-400 hover:text-red-300' : 'bg-white hover:bg-gray-200 text-red-500 hover:text-red-600'}
                  `}
                  aria-label="Remove artifact"
                >
                  <FiX className="mr-1" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ArtifactDisplay;

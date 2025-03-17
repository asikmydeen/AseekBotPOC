"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { MdPushPin, MdHistory, MdChevronLeft, MdChevronRight } from 'react-icons/md';
import { MessageType } from './ChatInterface';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  messages: MessageType[];
  filteredMessages: MessageType[];
  isDarkMode: boolean;
}

export default function Sidebar({
  isOpen,
  setIsOpen,
  messages,
  filteredMessages,
  isDarkMode
}: SidebarProps) {
  const pinnedMessages = messages.filter(message => message.pinned);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);

  const scrollToMessage = (timestamp: string) => {
    setActiveMessageId(`message-${timestamp}`);
    const messageElement = document.getElementById(`message-${timestamp}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight the message briefly
      messageElement.classList.add('highlight-message');
      setTimeout(() => {
        messageElement.classList.remove('highlight-message');
      }, 2000);
    }
  };

  const sidebarVariants = {
    open: { width: '300px', opacity: 1 },
    closed: { width: '0px', opacity: 0 }
  };

  return (
    <>
      <motion.button
        className={`fixed top-20 left-0 z-20 p-2 rounded-r-md ${
          isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
        } shadow-md`}
        onClick={() => setIsOpen(!isOpen)}
        initial={false}
        animate={{ left: isOpen ? '300px' : '0px' }}
        transition={{ duration: 0.3 }}
      >
        {isOpen ? <MdChevronLeft size={24} /> : <MdChevronRight size={24} />}
      </motion.button>

      <motion.div
        className={`fixed top-0 left-0 h-full z-10 overflow-hidden ${
          isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
        } shadow-lg`}
        initial={false}
        animate={isOpen ? 'open' : 'closed'}
        variants={sidebarVariants}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <div className="h-full overflow-y-auto p-4 pt-20">
          {/* Pinned Messages Section */}
          <div className="mb-6 sidebar-section">
            <div className="flex items-center mb-3">
              <MdPushPin className="mr-2" size={20} />
              <h3 className="font-semibold text-lg">Pinned Messages</h3>
            </div>
            {pinnedMessages.length > 0 ? (
              <div className="space-y-2">
                {pinnedMessages.map((message) => (
                  <div
                    key={`pinned-${message.timestamp}`}
                    className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      isDarkMode
                        ? 'bg-gray-700 hover:bg-gray-600'
                        : 'bg-gray-100 hover:bg-gray-200'
                    } ${activeMessageId === `message-${message.timestamp}` ? 'active font-medium border border-blue-500' : ''}`}
                    onClick={() => scrollToMessage(message.timestamp)}
                  >
                    <div className="flex items-start">
                      <div className="w-2 h-2 rounded-full mt-2 mr-2 bg-blue-500"></div>
                      <div className="flex-1 truncate">
                        <p className="text-sm font-medium">
                          {message.sender === 'user' ? 'You' : 'AseekBot'}
                        </p>
                        <p className="text-xs truncate">
                          {message.text.length > 60
                            ? `${message.text.substring(0, 60)}...`
                            : message.text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No pinned messages yet
              </p>
            )}
          </div>

          {/* Chat History Section */}
          <div className="sidebar-section">
            <div className="flex items-center mb-3">
              <MdHistory className="mr-2" size={20} />
              <h3 className="font-semibold text-lg">Chat History</h3>
            </div>
            {filteredMessages.length > 0 ? (
              <div className="space-y-2">
                {filteredMessages.map((message) => (
                  <div
                    key={`history-${message.timestamp}`}
                    className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      isDarkMode
                        ? 'bg-gray-700 hover:bg-gray-600'
                        : 'bg-gray-100 hover:bg-gray-200'
                    } ${activeMessageId === `message-${message.timestamp}` ? 'active font-medium border border-blue-500' : ''}`}
                    onClick={() => scrollToMessage(message.timestamp)}
                  >
                    <div className="flex items-start">
                      <div
                        className={`w-2 h-2 rounded-full mt-2 mr-2 ${
                          message.sender === 'user' ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                      ></div>
                      <div className="flex-1 truncate">
                        <p className="text-sm font-medium">
                          {message.sender === 'user' ? 'You' : 'AseekBot'}
                        </p>
                        <p className="text-xs truncate">
                          {message.text.length > 60
                            ? `${message.text.substring(0, 60)}...`
                            : message.text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No messages yet
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}

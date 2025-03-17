// app/components/Sidebar.tsx
import { quickLinks } from '../api/dummyApi';
import { quickLinkApi } from '../api/advancedApi';
import { useTheme } from '../context/ThemeContext';
import { useState } from 'react';

interface SidebarProps {
    onQuickLinkClick: (message: string) => void;
    onDocumentAnalysis?: () => void;
}

export default function Sidebar({ onQuickLinkClick, onDocumentAnalysis }: SidebarProps) {
    const { isDarkMode } = useTheme();
    const [activeLink, setActiveLink] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingLinkIndex, setLoadingLinkIndex] = useState<number | null>(null);

    const handleQuickLinkClick = async (index: number, message: string) => {
        try {
            setActiveLink(index);
            setIsLoading(true);
            setLoadingLinkIndex(index);

            // Extract action and parameter from the quick link
            const link = quickLinks[index];
            const action = link.title.toLowerCase();
            const parameter = link.description;

            // Check if this is the Document Analysis quick link
            if (action === 'document analysis' && onDocumentAnalysis) {
                // Trigger the document analysis modal instead of calling the API
                onDocumentAnalysis();
            } else {
                // For other quick links, call the API as usual
                const response = await quickLinkApi(action, parameter);
                console.log('Quick link API response:', response);
            }

            // Pass the message to the chat interface for all quick links
            onQuickLinkClick(message);
        } catch (error) {
            console.error('Error calling quick link API:', error);
            // Still trigger the chat message even if API fails
            onQuickLinkClick(message);
        } finally {
            setIsLoading(false);
            setLoadingLinkIndex(null);
        }
    };
    return (
        <div className={`w-72 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'} p-6 flex-shrink-0 h-screen overflow-y-auto`}>
            {/* Header Section */}
            <h1 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-[#60A5FA]' : 'text-[#1E40AF]'}`}>AseekBot</h1>
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Your Data Center Procurement Companion</p>

            {/* Quick Links Section */}
            <h2 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Quick Links</h2>
            <div className="sidebar-section space-y-2">
                {quickLinks.map((link, index) => (
                    <div
                        key={index}
                        onClick={() => handleQuickLinkClick(index, link.message)}
                        className={`p-3 rounded-lg cursor-pointer transition-all duration-200 flex items-start
                            ${activeLink === index
                                ? (isDarkMode
                                    ? 'bg-blue-700 border-l-4 border-blue-400'
                                    : 'bg-blue-100 border-l-4 border-blue-600')
                                : (isDarkMode
                                    ? 'bg-gray-700 hover:bg-gray-600'
                                    : 'bg-gray-200 hover:bg-gray-300')
                            }`}
                    >
                        <div className="flex-shrink-0 mr-3">
                            {/* Icon indicator with loading state */}
                            <div className={`w-5 h-5 flex items-center justify-center rounded-full
                                ${activeLink === index
                                    ? (isDarkMode ? 'bg-blue-400 text-gray-900' : 'bg-blue-600 text-white')
                                    : (isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-300 text-gray-600')
                                }`}>
                                {isLoading && loadingLinkIndex === index ? (
                                    <span className="animate-spin">↻</span>
                                ) : (
                                    activeLink === index ? '✓' : '•'
                                )}
                            </div>
                        </div>
                        <div className="flex-1">
                            <h3 className={`font-semibold ${
                                activeLink === index
                                    ? (isDarkMode ? 'text-white' : 'text-blue-800')
                                    : (isDarkMode ? 'text-[#60A5FA]' : 'text-[#1E40AF]')
                            }`}>{link.title}</h3>
                            <p className={`text-sm mt-1 ${
                                activeLink === index
                                    ? (isDarkMode ? 'text-gray-200' : 'text-gray-700')
                                    : (isDarkMode ? 'text-gray-300' : 'text-gray-600')
                            }`}>{link.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer section */}
            <div className={`mt-auto pt-6 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <p>Select a quick link or type your question in the chat.</p>
            </div>
        </div>
    );
}

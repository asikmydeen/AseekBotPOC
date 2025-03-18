// app/hooks/useAgentStyling.ts
import { useMemo } from 'react';

type AgentType = 'default' | 'bid-analysis' | 'supplier-search' | 'product-comparison' | 'technical-support';

interface AgentStyling {
  headerClass: string;
  bubbleClass: string;
  iconClass: string;
  label: string;
}

/**
 * Custom hook that provides styling for different agent types based on the current theme
 * 
 * @param activeAgent - The currently active agent type
 * @param isDarkMode - Whether dark mode is enabled
 * @returns Object containing styling classes and label for the agent
 */
const useAgentStyling = (activeAgent: AgentType | string, isDarkMode: boolean): AgentStyling => {
  return useMemo(() => {
    // Default styling
    let headerClass = isDarkMode ? 'bg-blue-900' : 'bg-blue-600';
    let bubbleClass = isDarkMode ? 'bg-blue-800' : 'bg-blue-500';
    let iconClass = 'text-blue-200';
    let label = 'Aseek Assistant';

    // Agent-specific styling
    switch (activeAgent) {
      case 'bid-analysis':
        headerClass = isDarkMode ? 'bg-purple-900' : 'bg-purple-600';
        bubbleClass = isDarkMode ? 'bg-purple-800' : 'bg-purple-500';
        iconClass = 'text-purple-200';
        label = 'Bid Analysis Agent';
        break;

      case 'supplier-search':
        headerClass = isDarkMode ? 'bg-green-900' : 'bg-green-600';
        bubbleClass = isDarkMode ? 'bg-green-800' : 'bg-green-500';
        iconClass = 'text-green-200';
        label = 'Supplier Search Agent';
        break;

      case 'product-comparison':
        headerClass = isDarkMode ? 'bg-amber-900' : 'bg-amber-600';
        bubbleClass = isDarkMode ? 'bg-amber-800' : 'bg-amber-500';
        iconClass = 'text-amber-200';
        label = 'Product Comparison Agent';
        break;

      case 'technical-support':
        headerClass = isDarkMode ? 'bg-red-900' : 'bg-red-600';
        bubbleClass = isDarkMode ? 'bg-red-800' : 'bg-red-500';
        iconClass = 'text-red-200';
        label = 'Technical Support Agent';
        break;

      default:
        // Default styling already set
        break;
    }

    return {
      headerClass,
      bubbleClass,
      iconClass,
      label
    };
  }, [activeAgent, isDarkMode]);
};

export default useAgentStyling;
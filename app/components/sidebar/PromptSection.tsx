'use client';

import React from 'react';
import { MdLightbulb, MdAdd } from 'react-icons/md';
import PromptsList from '../prompts/PromptsList';
import { Prompt } from '../../types/shared';

interface PromptSectionProps {
  styles: any;
  isDarkMode: boolean;
  prompts: Prompt[];
  onPromptClick: (prompt: Prompt) => void;
  onPromptSelect: (prompt: Prompt) => void;
  onCreatePrompt: () => void;
  onEditPrompt: (prompt: Prompt) => void;
  onDeletePrompt: (promptId: string) => void;
  sessionId?: string;
  chatId?: string;
  userId?: string;
  onStatusUpdate?: (status: string, progress: number) => void;
}

const PromptSection: React.FC<PromptSectionProps> = ({
  styles,
  isDarkMode,
  prompts,
  onPromptClick,
  onPromptSelect,
  onCreatePrompt,
  onEditPrompt,
  onDeletePrompt
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <MdLightbulb className="mr-2" size={20} />
          <h3 className={styles.content.section.title}>Saved Prompts</h3>
        </div>
        <button
          onClick={onCreatePrompt}
          className={styles.content.section.addButton}
          title="Create new prompt"
          aria-label="Create new prompt"
        >
          <MdAdd size={20} />
        </button>
      </div>

      <PromptsList
        isDarkMode={isDarkMode}
        onPromptClick={(prompt) => {
          onPromptSelect(prompt);
          onPromptClick(prompt);
        }}
        onEditPrompt={onEditPrompt}
        onDeletePrompt={onDeletePrompt}
        maxHeight="calc(100vh - 220px)"
      />
    </div>
  );
};

export default PromptSection;

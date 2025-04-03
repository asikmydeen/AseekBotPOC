// app/components/prompts/PromptVariableEditor.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { FiTrash, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import { PromptVariable, VariableSource } from '../../types/shared';

interface PromptVariableEditorProps {
    variable: PromptVariable;
    onChange: (updatedVariable: PromptVariable) => void;
    onRemove: () => void;
    isDarkMode: boolean;
}

const PromptVariableEditor: React.FC<PromptVariableEditorProps> = ({
    variable,
    onChange,
    onRemove,
    isDarkMode
}) => {
    const handleSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onChange({
            ...variable,
            source: e.target.value as VariableSource
        });
    };

    const handleRequiredToggle = () => {
        onChange({
            ...variable,
            required: !variable.required
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-750 border-gray-600' : 'bg-gray-50 border-gray-300'
                }`}
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex-1 mr-2">
                    <input
                        type="text"
                        value={variable.name}
                        onChange={(e) => onChange({ ...variable, name: e.target.value })}
                        placeholder="Variable name"
                        className={`w-full p-1.5 rounded-md ${isDarkMode
                                ? 'bg-gray-700 text-white placeholder-gray-400 border-gray-600'
                                : 'bg-white text-gray-900 placeholder-gray-500 border-gray-300'
                            } border focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm`}
                    />
                </div>

                <button
                    type="button"
                    onClick={onRemove}
                    className={`p-1.5 rounded-full ${isDarkMode
                            ? 'hover:bg-gray-700 text-gray-400 hover:text-red-400'
                            : 'hover:bg-gray-200 text-gray-500 hover:text-red-500'
                        }`}
                    title="Remove variable"
                >
                    <FiTrash size={14} />
                </button>
            </div>

            <div className="grid grid-cols-12 gap-2 mb-2">
                <div className="col-span-7">
                    <input
                        type="text"
                        value={variable.description}
                        onChange={(e) => onChange({ ...variable, description: e.target.value })}
                        placeholder="Description"
                        className={`w-full p-1.5 rounded-md ${isDarkMode
                                ? 'bg-gray-700 text-white placeholder-gray-400 border-gray-600'
                                : 'bg-white text-gray-900 placeholder-gray-500 border-gray-300'
                            } border focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm`}
                    />
                </div>

                <div className="col-span-5">
                    <select
                        value={variable.source}
                        onChange={handleSourceChange}
                        className={`w-full p-1.5 rounded-md ${isDarkMode
                                ? 'bg-gray-700 text-white border-gray-600'
                                : 'bg-white text-gray-900 border-gray-300'
                            } border focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm`}
                    >
                        <option value="USER">User Input</option>
                        <option value="SYSTEM">System</option>
                        <option value="DATABASE">Database</option>
                        <option value="FILE">File</option>
                    </select>
                </div>
            </div>

            <div className="flex items-center justify-between">
                {variable.source === 'USER' && (
                    <input
                        type="text"
                        value={variable.defaultValue || ''}
                        onChange={(e) => onChange({ ...variable, defaultValue: e.target.value })}
                        placeholder="Default value (optional)"
                        className={`flex-1 p-1.5 rounded-md mr-2 ${isDarkMode
                                ? 'bg-gray-700 text-white placeholder-gray-400 border-gray-600'
                                : 'bg-white text-gray-900 placeholder-gray-500 border-gray-300'
                            } border focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm`}
                    />
                )}

                <button
                    type="button"
                    onClick={handleRequiredToggle}
                    className={`flex items-center p-1.5 rounded-md text-xs ${isDarkMode
                            ? 'bg-gray-700 text-gray-300'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                >
                    {variable.required ? (
                        <>
                            <FiToggleRight size={16} className="mr-1 text-green-500" />
                            Required
                        </>
                    ) : (
                        <>
                            <FiToggleLeft size={16} className="mr-1 text-gray-500" />
                            Optional
                        </>
                    )}
                </button>
            </div>
        </motion.div>
    );
};

export default PromptVariableEditor;
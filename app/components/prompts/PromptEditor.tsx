// app/components/prompts/PromptEditor.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiX, FiSave, FiAlertCircle } from 'react-icons/fi';
import { Prompt, PromptType, PromptVariable, CreatePromptRequest, UpdatePromptRequest } from '../../types/shared';
import PromptVariableEditor from './PromptVariableEditor';

interface PromptEditorProps {
    isDarkMode: boolean;
    prompt?: Prompt;
    onSubmit: (promptData: CreatePromptRequest | UpdatePromptRequest) => void | Promise<void>;
    onCancel: () => void;
    isSubmitting?: boolean;
}

const PromptEditor: React.FC<PromptEditorProps> = ({
    isDarkMode,
    prompt,
    onSubmit,
    onCancel,
    isSubmitting = false
}) => {
    // If prompt is provided, we're editing, otherwise creating
    const isEditing = !!prompt;

    const [title, setTitle] = useState(prompt?.title || '');
    const [description, setDescription] = useState(prompt?.description || '');
    const [content, setContent] = useState(prompt?.content || '');
    const [type, setType] = useState<PromptType>(prompt?.type || 'INDIVIDUAL');
    const [variables, setVariables] = useState<PromptVariable[]>(prompt?.variables || []);
    const [tags, setTags] = useState<string[]>(prompt?.tags || []);
    const [tagInput, setTagInput] = useState('');
    const [errors, setErrors] = useState<{
        title?: string;
        description?: string;
        content?: string;
        variables?: string;
    }>({});

    // Validate form
    const validateForm = (): boolean => {
        const newErrors: typeof errors = {};

        if (!title.trim()) {
            newErrors.title = 'Title is required';
        }

        if (!description.trim()) {
            newErrors.description = 'Description is required';
        }

        if (!content.trim()) {
            newErrors.content = 'Content is required';
        }

        // Check for variables in content that don't exist in variables array
        const contentVariables = [...content.matchAll(/\${([^}]+)}/g)].map(m => m[1]);
        const missingVariables = contentVariables.filter(
            v => !variables.some(variable => variable.name === v)
        );

        if (missingVariables.length > 0) {
            newErrors.variables = `Missing variable definition(s): ${missingVariables.join(', ')}`;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const promptData: CreatePromptRequest | UpdatePromptRequest = {
            title,
            description,
            content,
            type,
            variables,
            tags,
            isPublished: true
        };

        onSubmit(promptData);
    };

    // Add a new variable
    const addVariable = () => {
        const newVariable: PromptVariable = {
            name: '',
            description: '',
            source: 'USER',
            required: true
        };

        setVariables([...variables, newVariable]);
    };

    // Update a variable
    const updateVariable = (index: number, updatedVariable: PromptVariable) => {
        const newVariables = [...variables];
        newVariables[index] = updatedVariable;
        setVariables(newVariables);
    };

    // Remove a variable
    const removeVariable = (index: number) => {
        setVariables(variables.filter((_, i) => i !== index));
    };

    // Add a tag
    const addTag = () => {
        if (!tagInput.trim()) return;

        const newTag = tagInput.trim().toLowerCase();
        if (!tags.includes(newTag)) {
            setTags([...tags, newTag]);
        }

        setTagInput('');
    };

    // Remove a tag
    const removeTag = (tag: string) => {
        setTags(tags.filter(t => t !== tag));
    };

    // Handle Enter key in tag input
    const handleTagKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag();
        }
    };

    // Update the title state when prompt changes
    useEffect(() => {
        if (prompt) {
            setTitle(prompt.title);
            setDescription(prompt.description);
            setContent(prompt.content);
            setType(prompt.type);
            setVariables(prompt.variables);
            setTags(prompt.tags);
        }
    }, [prompt]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4`}
        >
            <form onSubmit={handleSubmit}>
                <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {isEditing ? 'Edit Prompt' : 'Create New Prompt'}
                </h2>

                {/* Title Input */}
                <div className="mb-4">
                    <label
                        htmlFor="prompt-title"
                        className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                        Title
                    </label>
                    <input
                        id="prompt-title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className={`w-full p-2 rounded-md transition-colors ${errors.title ? 'border-red-500' : ''} ${isDarkMode
                                ? 'bg-gray-700 text-white placeholder-gray-400 border-gray-600'
                                : 'bg-white text-gray-900 placeholder-gray-500 border-gray-300'
                            } border focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                        placeholder="Enter prompt title"
                    />
                    {errors.title && (
                        <p className="mt-1 text-xs text-red-500 flex items-center">
                            <FiAlertCircle className="mr-1" size={12} /> {errors.title}
                        </p>
                    )}
                </div>

                {/* Description Input */}
                <div className="mb-4">
                    <label
                        htmlFor="prompt-description"
                        className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                        Description
                    </label>
                    <input
                        id="prompt-description"
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className={`w-full p-2 rounded-md transition-colors ${errors.description ? 'border-red-500' : ''} ${isDarkMode
                                ? 'bg-gray-700 text-white placeholder-gray-400 border-gray-600'
                                : 'bg-white text-gray-900 placeholder-gray-500 border-gray-300'
                            } border focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                        placeholder="Enter prompt description"
                    />
                    {errors.description && (
                        <p className="mt-1 text-xs text-red-500 flex items-center">
                            <FiAlertCircle className="mr-1" size={12} /> {errors.description}
                        </p>
                    )}
                </div>

                {/* Type Select */}
                <div className="mb-4">
                    <label
                        htmlFor="prompt-type"
                        className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                        Type
                    </label>
                    <select
                        id="prompt-type"
                        value={type}
                        onChange={(e) => setType(e.target.value as PromptType)}
                        className={`w-full p-2 rounded-md transition-colors ${isDarkMode
                                ? 'bg-gray-700 text-white border-gray-600'
                                : 'bg-white text-gray-900 border-gray-300'
                            } border focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                    >
                        <option value="INDIVIDUAL">Personal</option>
                        <option value="COMMUNITY">Community</option>
                    </select>
                </div>

                {/* Content Textarea */}
                <div className="mb-4">
                    <label
                        htmlFor="prompt-content"
                        className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                        Content
                    </label>
                    <textarea
                        id="prompt-content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={12}
                        className={`w-full p-2 rounded-md transition-colors ${errors.content ? 'border-red-500' : ''} ${isDarkMode
                                ? 'bg-gray-700 text-white placeholder-gray-400 border-gray-600'
                                : 'bg-white text-gray-900 placeholder-gray-500 border-gray-300'
                            } border focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                        placeholder="Enter prompt content, use ${variableName} for variables"
                    />
                    {errors.content && (
                        <p className="mt-1 text-xs text-red-500 flex items-center">
                            <FiAlertCircle className="mr-1" size={12} /> {errors.content}
                        </p>
                    )}
                </div>

                {/* Variables Section */}
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Variables
                        </label>
                        <button
                            type="button"
                            onClick={addVariable}
                            className={`flex items-center p-1.5 rounded-md text-xs ${isDarkMode
                                    ? 'bg-blue-700 hover:bg-blue-600 text-white'
                                    : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                                }`}
                        >
                            <FiPlus size={14} className="mr-1" /> Add Variable
                        </button>
                    </div>

                    {errors.variables && (
                        <p className="mb-2 text-xs text-red-500 flex items-center">
                            <FiAlertCircle className="mr-1" size={12} /> {errors.variables}
                        </p>
                    )}

                    <div className="space-y-3 max-h-60 overflow-y-auto">
                        {variables.length === 0 ? (
                            <p className={`text-sm italic ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                No variables added yet. Use ${"{variableName}"} in your content to define variables.
                            </p>
                        ) : (
                            variables.map((variable, index) => (
                                <PromptVariableEditor
                                    key={index}
                                    variable={variable}
                                    onChange={(updatedVariable) => updateVariable(index, updatedVariable)}
                                    onRemove={() => removeVariable(index)}
                                    isDarkMode={isDarkMode}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Tags Section */}
                <div className="mb-6">
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Tags
                    </label>
                    <div className="flex mb-2">
                        <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleTagKeyDown}
                            className={`flex-1 p-2 rounded-l-md transition-colors ${isDarkMode
                                    ? 'bg-gray-700 text-white placeholder-gray-400 border-gray-600'
                                    : 'bg-white text-gray-900 placeholder-gray-500 border-gray-300'
                                } border focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                            placeholder="Add tag and press Enter"
                        />
                        <button
                            type="button"
                            onClick={addTag}
                            className={`px-4 rounded-r-md ${isDarkMode
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                                }`}
                        >
                            Add
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                            <span
                                key={tag}
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${isDarkMode
                                        ? 'bg-gray-700 text-gray-300'
                                        : 'bg-gray-200 text-gray-700'
                                    }`}
                            >
                                {tag}
                                <button
                                    type="button"
                                    onClick={() => removeTag(tag)}
                                    className="ml-1 focus:outline-none"
                                >
                                    <FiX size={14} />
                                </button>
                            </span>
                        ))}
                        {tags.length === 0 && (
                            <p className={`text-sm italic ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                No tags added yet
                            </p>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className={`px-4 py-2 rounded-md transition-colors ${isDarkMode
                                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                            }`}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className={`px-4 py-2 rounded-md transition-colors flex items-center ${isDarkMode
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                            } ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <FiSave className="mr-1" size={16} />
                                {isEditing ? 'Update Prompt' : 'Create Prompt'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </motion.div>
    );
};
export default PromptEditor;
// frontend/src/components/forms/TagInput.js (New Component)
import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';

const TagInput = ({ tags, setTags }) => {
    const [inputValue, setInputValue] = useState('');

    const handleKeyDown = (e) => {
        if ((e.key === 'Enter' || e.key === ',') && inputValue.trim()) {
            e.preventDefault();
            const newTag = inputValue.trim().toLowerCase();
            if (newTag && !tags.includes(newTag)) {
                setTags([...tags, newTag]);
            }
            setInputValue('');
        } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
            setTags(tags.slice(0, -1));
        }
    };

    const removeTag = (tagToRemove) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    return (
        <div>
            <div className="flex flex-wrap gap-1.5 items-center border border-gray-300 rounded-md p-2 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
                {tags.map(tag => (
                    <span key={tag} className="flex items-center bg-indigo-100 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="ml-1.5 text-indigo-500 hover:text-indigo-700">
                            <XMarkIcon className="h-3 w-3" />
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={tags.length === 0 ? "Add tags (press Enter or comma)" : ""}
                    className="flex-grow p-1 text-sm outline-none bg-transparent"
                />
            </div>
        </div>
    );
};
export default TagInput;
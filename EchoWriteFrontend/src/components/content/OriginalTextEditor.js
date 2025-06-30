// frontend/src/components/content/OriginalTextEditor.js (New File)
import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
// Placeholder for your API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';


// Basic Toolbar (can be greatly expanded)
const MenuBar = ({ editor }) => {
    if (!editor) {
        return null;
    }

    const addImage = () => {
        const url = window.prompt('Enter image URL:'); // Simple prompt for now, will be replaced by upload
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };

    return (
        <div className="border border-gray-300 dark:border-gray-600 rounded-t-md p-2 flex flex-wrap gap-1 bg-gray-50 dark:bg-gray-700">
            <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''}>Bold</button>
            <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''}>Italic</button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>
            <button onClick={() => editor.chain().focus().toggleBulletList().run()}>Bullet List</button>
            <button onClick={addImage}>Add Image (URL)</button>
            {/* Add more buttons for other formatting options */}
            <style jsx>{`
                button { padding: 0.25rem 0.5rem; margin: 0.125rem; border: 1px solid #ccc; border-radius: 3px; }
                button.is-active { background-color: #333; color: white; }
                .dark button.is-active { background-color: #555; }
            `}</style>
        </div>
    );
};


const OriginalTextEditor = ({ content, onChange, onTextSelect, isEditable = true }) => {
    const editor = useEditor({
        editable: isEditable,
        extensions: [
            StarterKit.configure({
                // Disable history if you manage undo/redo externally or want simpler setup
                // history: false,
            }),
            Image.configure({
                inline: false, // Allow images to be block elements
                allowBase64: true, // If you plan to handle base64 uploads initially (not recommended for large files)
            }),
            Link.configure({
                openOnClick: false, // Don't open link on click in editor, but on ctrl/cmd+click
            }),
        ],
        content: content, // Initial content
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML()); // Or editor.getJSON() if you prefer JSON
        },
        onSelectionUpdate: ({ editor }) => {
            // For selected text AI enhancement
            if (onTextSelect) {
                const { from, to } = editor.state.selection;
                const selectedText = editor.state.doc.textBetween(from, to);
                if (selectedText.trim()) {
                    // You might need to get DOM coordinates for the popup
                    // TipTap has utilities for this: editor.view.coordsAtPos(from)
                    onTextSelect(selectedText, { from, to } /*, coords */);
                } else {
                    onTextSelect('', null); // Clear selection
                }
            }
        },
    });

    // --- Drag and Drop & File Upload Logic will be added here ---

    if (!isEditable) { // View mode
        return (
            <div className="prose prose-sm sm:prose-base max-w-none p-3 border bg-gray-50 dark:bg-slate-700 dark:text-slate-100 rounded-md min-h-[100px]">
                <EditorContent editor={editor} />
            </div>
        );
    }

    return (
        <div className="border border-gray-300 dark:border-gray-600 rounded-md">
            <MenuBar editor={editor} />
            <EditorContent editor={editor} className="p-3 min-h-[250px] md:min-h-[350px] focus:outline-none dark:text-slate-100" />
        </div>
    );
};

export default OriginalTextEditor;
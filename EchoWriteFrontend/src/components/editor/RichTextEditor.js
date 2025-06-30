// frontend/src/components/editor/RichTextEditor.js (New directory and file)
import React from 'react';
import { useEditor, EditorContent, BubbleMenu, FloatingMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Dropcursor from '@tiptap/extension-dropcursor';
import Placeholder from '@tiptap/extension-placeholder';
// import axiosInstance from '../../services/axiosInstance'; // Your configured Axios

// Basic Toolbar (can be greatly expanded)
const MenuBar = ({ editor }) => {
    if (!editor) return null;
    return (
        <div className="p-2 border-b dark:border-slate-600 bg-slate-50 dark:bg-slate-700 rounded-t-md flex flex-wrap gap-1">
            <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().toggleBold()} className={editor.isActive('bold') ? 'is-active' : ''}>Bold</button>
            <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().toggleItalic()} className={editor.isActive('italic') ? 'is-active' : ''}>Italic</button>
            <button type="button" onClick={() => editor.chain().focus().setParagraph().run()} className={editor.isActive('paragraph') ? 'is-active' : ''}>P</button>
            <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}>H2</button>
            <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}>H3</button>
            <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active' : ''}>List</button>
            {/* Add image upload button here if not relying solely on drag/drop/paste */}
        </div>
    );
};


const RichTextEditor = ({ content, onChange, onImageUpload }) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                // Disable history if you manage undo/redo externally or it causes issues
                // history: false,
            }),
            Image.configure({
                inline: false, // Allow images to be block elements
                allowBase64: true, // Allow pasting base64 images (will be uploaded)
            }),
            Link.configure({ openOnClick: false }),
            Dropcursor.configure({ color: '#60a5fa', width: 2 }),
            Placeholder.configure({ placeholder: 'Start writing your amazing content...' }),
        ],
        content: content, // Initial content (HTML string)
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML()); // Pass HTML back to parent
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose-base dark:prose-invert max-w-none focus:outline-none p-4 min-h-[300px] bg-white dark:bg-slate-700 dark:text-slate-100 rounded-b-md',
            },
            handleDrop: function(view, event, slice, moved) {
                event.preventDefault();
                const files = event.dataTransfer?.files;
                if (files && files.length > 0) {
                    for (const file of Array.from(files)) {
                        if (file.type.startsWith('image/')) {
                            onImageUpload(file, view, editor); // Pass editor instance too
                        } else if (file.type.startsWith('video/')) {
                            alert("Video drop not fully implemented. Please use an embed for now.");
                        }
                    }
                    return true;
                }
                return false;
            },
            handlePaste: function(view, event, slice) {
                const items = (event.clipboardData || event.originalEvent.clipboardData)?.items;
                if (items) {
                    for (const item of Array.from(items)) {
                        if (item.type.startsWith('image/')) {
                            event.preventDefault();
                            const file = item.getAsFile();
                            if (file) onImageUpload(file, view, editor);
                            return true;
                        }
                    }
                }
                return false; // Let TipTap handle other pastes
            },
        },
    });

    return (
        <div className="border rounded-md shadow-sm dark:border-slate-600">
            <MenuBar editor={editor} />
            <EditorContent editor={editor} />
            {/* Example Bubble Menu for inline formatting */}
            {editor && (
                <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}
                    className="bg-black text-white text-xs rounded-md shadow-xl p-1 flex gap-1"
                >
                    <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'bg-slate-700' : ''}>B</button>
                    <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'bg-slate-700' : ''}>I</button>
                    {/* Add more bubble menu items */}
                </BubbleMenu>
            )}
        </div>
    );
};

export default RichTextEditor;
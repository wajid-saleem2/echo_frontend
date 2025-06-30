// frontend/src/components/modals/SelectFolderModal.js (New File)
import React, { useState, useEffect } from 'react';
import { FolderPlusIcon, CheckIcon } from '@heroicons/react/24/outline';
import axiosInstance from '../../api/apiConfig';

const SelectFolderModal = ({
    isOpen,
    onClose,
    onSaveConfirm, // Changed from onFolderSelect to reflect it now handles title too
    initialContentTitle = "AI Generated Content", // Prop for initial title
    currentContentPreview = "" // Prop for a snippet of the content being saved
}) => {
    const [folders, setFolders] = useState([]);
    const [isLoadingFolders, setIsLoadingFolders] = useState(false);
    const [selectedFolderId, setSelectedFolderId] = useState(''); // Empty string for "Unfoldered"

    const [showNewFolderInput, setShowNewFolderInput] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [modalError, setModalError] = useState('');

     // --- NEW: State for Content Title ---
     const [contentTitle, setContentTitle] = useState(initialContentTitle);
     // --- End New State ---

    useEffect(() => {
        if (isOpen) {
             // Reset title when modal opens, based on the prop
             setContentTitle(initialContentTitle || "New Content Piece");

            const fetchUserFolders = async () => {
                setIsLoadingFolders(true);
                setModalError('');
                try {
                    const response = await axiosInstance.get('/folders');
                    setFolders(response.data || []);
                } catch (err) {
                    console.error("Failed to fetch folders for modal", err);
                    setModalError("Could not load your folders.");
                } finally {
                    setIsLoadingFolders(false);
                }
            };
            fetchUserFolders();
            setSelectedFolderId(''); // Reset selection when modal opens
            setShowNewFolderInput(false);
            setNewFolderName('');
            setModalError('');
        }
    }, [isOpen,initialContentTitle]);

    const handleCreateAndSelectNewFolder = async () => {
        if (!newFolderName.trim()) {
            setModalError("New folder name cannot be empty.");
            return;
        }
        setIsCreatingFolder(true);
        setModalError('');
        try {
            const response = await axiosInstance.post('/folders', { name: newFolderName });
            const newFolder = response.data;
            setFolders(prev => [...prev, newFolder].sort((a, b) => a.name.localeCompare(b.name)));
            setSelectedFolderId(newFolder._id); // Auto-select the new folder
            setShowNewFolderInput(false); // Hide input
            setNewFolderName('');
            // No need to call onFolderSelect yet, user will confirm with "Save to Selected Folder"
        } catch (err) {
            setModalError(err.response?.data?.message || "Failed to create new folder.");
        } finally {
            setIsCreatingFolder(false);
        }
    };

    const handleConfirmSave = () => {
        if (!contentTitle.trim()) {
            setModalError("Content title cannot be empty.");
            return;
        }
        onSaveConfirm(selectedFolderId || null, contentTitle.trim()); // Pass folderId AND title
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-semibold mb-1 text-gray-800 dark:text-slate-100">Save Content To Folder</h3>
            

                {modalError && <p className="text-xs text-red-500 bg-red-100 dark:bg-red-800 dark:text-red-300 p-2 rounded mb-3">{modalError}</p>}
                {/* --- NEW: Title Input --- */}
                <div className="mb-4">
                    <label htmlFor="contentSaveTitle" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                        Title for New Content:
                    </label>
                    <input
                        type="text"
                        id="contentSaveTitle"
                        value={contentTitle}
                        onChange={(e) => setContentTitle(e.target.value)}
                        className="mt-1 block w-full p-2 border dark:border-slate-600 rounded-md shadow-sm sm:text-sm bg-white dark:bg-slate-700 dark:text-slate-100"
                        placeholder="Enter a title..."
                    />
                </div>
                {/* --- End Title Input --- */}
                <div className="mb-3">
                    <label htmlFor="folderSelect" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                        Choose Folder:
                    </label>
                    {isLoadingFolders ? <p className="text-xs text-gray-500 dark:text-gray-400">Loading folders...</p> : (
                        <select
                            id="folderSelect"
                            value={selectedFolderId}
                            onChange={(e) => setSelectedFolderId(e.target.value)}
                            className="mt-1 block w-full p-2 border dark:border-slate-600 rounded-md shadow-sm sm:text-sm bg-white dark:bg-slate-700 dark:text-slate-100"
                        >
                            <option value="">-- Unfoldered --</option>
                            {folders.map(folder => (
                                <option key={folder._id} value={folder._id}>{folder.name}</option>
                            ))}
                        </select>
                    )}
                </div>

                {!showNewFolderInput && (
                    <button
                        type="button"
                        onClick={() => setShowNewFolderInput(true)}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mb-3 flex items-center"
                    >
                        <FolderPlusIcon className="h-4 w-4 mr-1" /> Create New Folder
                    </button>
                )}

                {showNewFolderInput && (
                    <div className="mt-2 mb-3 p-3 border dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700">
                        <label htmlFor="newFolderNameModal" className="block text-xs font-medium text-gray-700 dark:text-slate-300">New Folder Name:</label>
                        <div className="flex items-center gap-2 mt-1">
                            <input
                                type="text"
                                id="newFolderNameModal"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                className="flex-grow p-1.5 border dark:border-slate-500 rounded-md text-sm bg-white dark:bg-slate-600 dark:text-slate-100"
                                placeholder="Enter name..."
                                disabled={isCreatingFolder}
                            />
                            <button
                                type="button"
                                onClick={handleCreateAndSelectNewFolder}
                                disabled={isCreatingFolder || !newFolderName.trim()}
                                className="bg-green-500 hover:bg-green-600 text-white text-xs font-semibold py-1.5 px-2.5 rounded disabled:opacity-50"
                            >
                                {isCreatingFolder ? 'Creating...' : 'Create & Select'}
                            </button>
                        </div>
                        <button type="button" onClick={() => setShowNewFolderInput(false)} className="text-xxs text-gray-500 dark:text-gray-400 hover:underline mt-1">Cancel new folder</button>
                    </div>
                )}

                <div className="mt-5 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500">
                        Cancel Save
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirmSave}
                        className="px-4 py-2 text-sm rounded-md bg-green-500 hover:bg-green-600 text-white flex items-center"
                    >
                        <CheckIcon className="h-4 w-4 mr-1.5" />
                        Save to {selectedFolderId ? (folders.find(f=>f._id === selectedFolderId)?.name || 'Selected Folder') : 'Unfoldered'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SelectFolderModal;
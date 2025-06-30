// frontend/src/components/layout/FolderSidebar.js
import React, { useState, useEffect } from 'react';
import { PlusIcon, FolderIcon, PencilIcon, TrashIcon, DocumentTextIcon, FolderOpenIcon } from '@heroicons/react/24/outline'; // Example icons
import axiosInstance from '../../api/apiConfig';

const FolderSidebar = ({ selectedFolderId, onSelectFolder, onFoldersUpdate }) => {
    const [folders, setFolders] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [newFolderName, setNewFolderName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [editingFolder, setEditingFolder] = useState(null); // { _id, name }
    const [editingFolderName, setEditingFolderName] = useState('');

    const fetchFolders = async () => {
        setIsLoading(true);
        try {
            const response = await axiosInstance.get('/folders');
            setFolders(response.data);
            if (onFoldersUpdate) onFoldersUpdate(response.data); // Notify parent about folder list
        } catch (err) {
            setError('Failed to load folders.');
            console.error("Fetch Folders Error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFolders();
    }, []); // Fetch on mount

    const handleCreateFolder = async (e) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;
        setIsCreating(true);
        setError('');
        try {
            const response = await axiosInstance.post('/folders', { name: newFolderName });
            setFolders(prev => [...prev, response.data].sort((a, b) => a.name.localeCompare(b.name)));
            setNewFolderName('');
            if (onFoldersUpdate) onFoldersUpdate([...folders, response.data]);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create folder.');
        } finally {
            setIsCreating(false);
        }
    };

    const handleStartEdit = (folder) => {
        setEditingFolder(folder);
        setEditingFolderName(folder.name);
    };

    const handleUpdateFolder = async (e) => {
        e.preventDefault();
        if (!editingFolder || !editingFolderName.trim()) return;
        setIsCreating(true); // Reuse for loading state
        setError('');
        try {
            const response = await axiosInstance.put(`/folders/${editingFolder._id}`, { name: editingFolderName });
            setFolders(prev => prev.map(f => f._id === editingFolder._id ? response.data : f).sort((a, b) => a.name.localeCompare(b.name)));
            setEditingFolder(null);
            setEditingFolderName('');
            if (onFoldersUpdate) onFoldersUpdate(folders.map(f => f._id === editingFolder._id ? response.data : f));
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update folder.');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteFolder = async (folderId) => {
        if (window.confirm("Are you sure you want to delete this folder? Content within it will become un-foldered.")) {
            setIsCreating(true); // Reuse for loading state
            setError('');
            try {
                await axiosInstance.delete(`/folders/${folderId}`);
                const updatedFolders = folders.filter(f => f._id !== folderId);
                setFolders(updatedFolders);
                if (selectedFolderId === folderId) {
                    onSelectFolder(null); // Deselect if current folder is deleted
                }
                if (onFoldersUpdate) onFoldersUpdate(updatedFolders);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to delete folder.');
            } finally {
                setIsCreating(false);
            }
        }
    };

    return (
        <div className="w-full md:w-64 bg-slate-50 p-4 rounded-lg shadow space-y-4 h-full">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Folders</h3>
            {isLoading && <p className="text-xs text-gray-500">Loading folders...</p>}
            {error && <p className="text-xs text-red-500 bg-red-100 p-2 rounded">{error}</p>}

            {/* Create New Folder Form */}
            <form onSubmit={handleCreateFolder} className="space-y-2">
                <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="New folder name..."
                    className="w-full p-2 border rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={isCreating}
                />
                <button
                    type="submit"
                    disabled={isCreating || !newFolderName.trim()}
                    className="w-full flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium py-2 px-3 rounded-md disabled:opacity-50"
                >
                    <PlusIcon className="h-4 w-4 mr-1" /> Create Folder
                </button>
            </form>

            {/* Folder List */}
            <ul className="space-y-1 max-h-96 overflow-y-auto">
                {/* All Content Item */}
                <li
                    onClick={() => onSelectFolder(null)}
                    className={`flex items-center p-2.5 text-sm rounded-md cursor-pointer transition-colors
                        ${!selectedFolderId ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'}`}
                >
                    <DocumentTextIcon className="h-5 w-5 mr-2 flex-shrink-0" /> All Content
                </li>
                {/* Unfoldered Item */}
                 <li
                    onClick={() => onSelectFolder('unfoldered')}
                    className={`flex items-center p-2.5 text-sm rounded-md cursor-pointer transition-colors
                        ${selectedFolderId === 'unfoldered' ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'}`}
                >
                    <FolderOpenIcon className="h-5 w-5 mr-2 flex-shrink-0 text-gray-400" /> Unfoldered
                </li>

                {folders.map(folder => (
                    <li key={folder._id}>
                        {editingFolder?._id === folder._id ? (
                            <form onSubmit={handleUpdateFolder} className="flex items-center space-x-1 p-1">
                                <input
                                    type="text"
                                    value={editingFolderName}
                                    onChange={(e) => setEditingFolderName(e.target.value)}
                                    className="flex-grow p-1.5 border rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    autoFocus
                                />
                                <button type="submit" className="p-1.5 text-green-500 hover:text-green-700" disabled={isCreating}>Save</button>
                                <button type="button" onClick={() => setEditingFolder(null)} className="p-1.5 text-gray-500 hover:text-gray-700" disabled={isCreating}>Cancel</button>
                            </form>
                        ) : (
                            <div
                                onClick={() => onSelectFolder(folder._id)}
                                className={`group flex items-center justify-between p-2.5 text-sm rounded-md cursor-pointer transition-colors
                                    ${selectedFolderId === folder._id ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'}`}
                            >
                                <div className="flex items-center truncate">
                                    <FolderIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                                    <span className="truncate" title={folder.name}>{folder.name}</span>
                                </div>
                                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); handleStartEdit(folder); }} className="p-1 text-gray-400 hover:text-blue-500" title="Rename">
                                        <PencilIcon className="h-4 w-4" />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder._id); }} className="p-1 text-gray-400 hover:text-red-500" title="Delete">
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default FolderSidebar;
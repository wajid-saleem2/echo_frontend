// frontend/src/pages/ManagePersonasPage.js
import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import axiosInstance from '../api/apiConfig';

const ManagePersonasPage = () => {
    const [personas, setPersonas] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    // Form state for creating/editing
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [currentPersona, setCurrentPersona] = useState(null); // null for create, persona object for edit
    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');

    const fetchPersonas = async () => { /* ... similar to fetchTemplates ... */ };
    useEffect(() => { fetchPersonas(); }, []);

    const handleOpenForm = (personaToEdit = null) => {
        setError('');
        if (personaToEdit) {
            setCurrentPersona(personaToEdit);
            setFormName(personaToEdit.name);
            setFormDescription(personaToEdit.description);
        } else {
            setCurrentPersona(null);
            setFormName('');
            setFormDescription('');
        }
        setIsFormOpen(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!formName.trim() || !formDescription.trim()) {
            setError("Persona name and description are required."); return;
        }
        setIsLoading(true); setError('');
        try {
            if (currentPersona) { // Update
                const response = await axiosInstance.put(`/personas/${currentPersona._id}`, { name: formName, description: formDescription });
                setPersonas(prev => prev.map(p => p._id === currentPersona._id ? response.data : p));
            } else { // Create
                const response = await axiosInstance.post('/personas', { name: formName, description: formDescription });
                setPersonas(prev => [...prev, response.data].sort((a,b) => a.name.localeCompare(b.name)));
            }
            setIsFormOpen(false); // Close form on success
        } catch (err) { setError(err.response?.data?.message || `Failed to save persona.`); }
        finally { setIsLoading(false); }
    };

    const handleDeletePersona = async (personaId) => { /* ... similar to deleteTemplate ... */ };

    return (
        <div className="max-w-3xl mx-auto mt-8 p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100">Manage Audience Personas</h1>
                <button onClick={() => handleOpenForm()}
                    className="bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-md text-sm flex items-center">
                    <PlusIcon className="h-5 w-5 mr-1" /> Add New Persona
                </button>
            </div>

            {isFormOpen && (
                <form onSubmit={handleFormSubmit} className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-700 space-y-3 mb-6">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-slate-100">{currentPersona ? "Edit Persona" : "Create New Persona"}</h3>
                    <div>
                        <label htmlFor="personaName" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Persona Name</label>
                        <input type="text" id="personaName" value={formName} onChange={(e) => setFormName(e.target.value)}
                            className="mt-1 block w-full p-2 border dark:border-slate-600 rounded-md shadow-sm dark:bg-slate-800 dark:text-slate-100" required />
                    </div>
                    <div>
                        <label htmlFor="personaDescription" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Persona Description (for AI)</label>
                        <textarea id="personaDescription" value={formDescription} onChange={(e) => setFormDescription(e.target.value)}
                            rows="4" className="mt-1 block w-full p-2 border dark:border-slate-600 rounded-md shadow-sm dark:bg-slate-800 dark:text-slate-100" required
                            placeholder="e.g., Busy executives in the tech industry, interested in productivity hacks and AI trends. Prefer concise, actionable advice." />
                    </div>
                    <div className="flex gap-2">
                        <button type="submit" disabled={isLoading} className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md text-sm disabled:opacity-50">
                            {isLoading ? 'Saving...' : (currentPersona ? 'Save Changes' : 'Create Persona')}
                        </button>
                        <button type="button" onClick={() => setIsFormOpen(false)} className="bg-gray-300 hover:bg-gray-400 dark:bg-slate-600 dark:hover:bg-slate-500 text-black dark:text-white py-2 px-4 rounded-md text-sm">Cancel</button>
                    </div>
                    {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
                </form>
            )}

            {/* List of Personas */}
            <div className="space-y-4 mt-4">
                {personas.map(persona => (
                    <div key={persona._id} className="p-4 border rounded-lg shadow-sm bg-white dark:bg-slate-700">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-semibold text-gray-700 dark:text-slate-200">{persona.name}</h4>
                            </div>
                            <div className="flex space-x-2 flex-shrink-0">
                                <button onClick={() => handleOpenForm(persona)} className="p-1 text-blue-500 hover:text-blue-700" title="Edit">
                                    <PencilSquareIcon className="h-5 w-5" />
                                </button>
                                <button onClick={() => handleDeletePersona(persona._id)} className="p-1 text-red-500 hover:text-red-700" title="Delete">
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                        <p className="mt-2 text-xs text-gray-600 dark:text-slate-300 whitespace-pre-wrap break-all">
                            {persona.description}
                        </p>
                    </div>
                ))}
            </div>
            {isLoading && personas.length === 0 && <p>Loading personas...</p>}
            {!isLoading && personas.length === 0 && !isFormOpen && <p className="text-gray-600 dark:text-gray-400">No personas defined yet.</p>}
        </div>
    );
};
export default ManagePersonasPage;
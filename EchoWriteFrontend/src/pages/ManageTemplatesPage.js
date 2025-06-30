// frontend/src/pages/ManageTemplatesPage.js
import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import axiosInstance from '../api/apiConfig';
import { ShareIcon, EyeSlashIcon } from '@heroicons/react/24/outline'; // Example icons
import TagInput from '../components/forms/TagInput';

const ManageTemplatesPage = () => {
    const [templates, setTemplates] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [formMode, setFormMode] = useState(null); // null, 'create', 'edit'
    const [isCreating, setIsCreating] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [newTemplateContent, setNewTemplateContent] = useState('');
    const [newTemplatePlatform, setNewTemplatePlatform] = useState('general');
    const [formDescription, setFormDescription] = useState('');
    const [editingTemplate, setEditingTemplate] = useState(null); // { _id, name, content, platformHint }

     // Add state for category and communityTags in the form
     const [formCategory, setFormCategory] = useState('');
     const [formCommunityTags, setFormCommunityTags] = useState([]); // Manage as array

    const fetchTemplates = async () => {
        setIsLoading(true);
        try {
            const response = await axiosInstance.get('/templates');
            setTemplates(response.data);
        } catch (err) { setError('Failed to load templates.'); }
        finally { setIsLoading(false); }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleCreateOrUpdateTemplate = async (e) => {
        e.preventDefault();
        const name = editingTemplate ? editingTemplate.name : newTemplateName;
        const content = editingTemplate ? editingTemplate.content : newTemplateContent;
        const platformHint = editingTemplate ? editingTemplate.platformHint : newTemplatePlatform;

        if (!name.trim() || !content.trim()) {
            setError("Template name and content are required.");
            return;
        }
        setIsLoading(true); // General loading for submit
        setError('');

        const payload = {
            name: newTemplateName, // Use the form state
            content: newTemplateContent, // Use the form state
            platformHint: newTemplatePlatform, // Use the form state
            description: formDescription.trim() || undefined, // Add description to payload
            category: formCategory.trim() || undefined,
            communityTags: formCommunityTags.filter(t => t.trim()),
        };
        if (formMode === 'edit' && editingTemplate) { // Check formMode and editingTemplate
            payload.isShared = editingTemplate.isShared; // Preserve existing share status
        }
    

        try {
            if (formMode === 'edit' && editingTemplate) { // <<<< FOCUS HERE FOR UPDATE
                if (!editingTemplate._id) {
                    console.error("CRITICAL ERROR: Attempting to update template but editingTemplate._id is undefined!", editingTemplate);
                    setError("Cannot update template: ID is missing. Please refresh and try again.");
                    setIsLoading(false);
                    return;
                }
                console.log(`UPDATING template with ID: ${editingTemplate._id}`); // DEBUG
                console.log("Payload for UPDATE:", payload); // DEBUG
                const response = await axiosInstance.put(`/templates/${editingTemplate._id}`, payload); // URL uses editingTemplate._id
                setTemplates(prev => prev.map(t => t._id === editingTemplate._id ? response.data : t));
            } else { // Create
                console.log("CREATING template with payload:", payload); // DEBUG
                const response = await axiosInstance.post('/templates', payload);
                setTemplates(prev => [...prev, response.data].sort((a,b) => a.name.localeCompare(b.name)));
            }
            fetchTemplates(); // Good to refresh the whole list
            closeForm();    // This should set formMode to null and editingTemplate to null
        } catch (err) {
            setError(err.response?.data?.message || `Failed to ${formMode === 'edit' ? 'update' : 'create'} template.`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteTemplate = async (templateId) => {
        if (window.confirm("Are you sure you want to delete this template?")) {
            setIsLoading(true);
            try {
                await axiosInstance.delete(`/templates/${templateId}`);
                setTemplates(prev => prev.filter(t => t._id !== templateId));
            } catch (err) { setError(err.response?.data?.message || 'Failed to delete template.'); }
            finally { setIsLoading(false); }
        }
    };

    const handleOpenForm = (templateToEdit = null) => {
        setError('');
        if (templateToEdit && templateToEdit._id) { // Good check for _id
            setEditingTemplate(templateToEdit);      // This is where editingTemplate gets its value
            setNewTemplateName(templateToEdit.name); // Populating form states
            setNewTemplateContent(templateToEdit.content);
            setFormDescription(templateToEdit.description || ''); // Load description
            setNewTemplatePlatform(templateToEdit.platformHint || 'general');
            setFormCategory(templateToEdit.category || '');
            setFormCommunityTags(templateToEdit.communityTags || []);
            setFormMode('edit');
        } else {
            setEditingTemplate(null);
            setFormDescription(''); // Reset description
            setNewTemplateName(''); setNewTemplateContent(''); setNewTemplatePlatform('general');
            setFormCategory(''); setFormCommunityTags([]);
            setFormMode('create');
        }
       
    };

    const closeForm = () => {
        setFormMode(null);
        setEditingTemplate(null); // Clear editing state
        setError('');
        // Optionally reset newTemplateName etc. if you want a clean slate next time
        setNewTemplateName(''); setNewTemplateContent(''); setNewTemplatePlatform('general');
        setFormCategory(''); setFormCommunityTags([]);
    };

    const cancelEdit = () => { // This is specifically for the cancel button within the edit form
        closeForm();
    };

    const handleShareToggle = async (template) => {
        let category = template.category || formCategory; // Use formCategory if editing this template
        let communityTags = template.communityTags || formCommunityTags;

        if (!template.isShared) { // If about to share
            if (!category && !formCategory) category = prompt("Enter a category for this shared template (e.g., twitter, marketing):")?.toLowerCase().trim();
            if (!category) { alert("Category is required to share."); return; }

            // Simple prompt for tags, ideally use a TagInput component here too
            const tagsString = prompt(`Enter comma-separated community tags (optional):`, communityTags.join(', '));
            if (tagsString !== null) communityTags = tagsString.split(',').map(t=>t.toLowerCase().trim()).filter(t=>t);
        }

        setIsLoading(true); // Or a specific loading state for this action
        try {
            const response = await axiosInstance.put(`/templates/${template._id}`, {
                isShared: !template.isShared, // Toggle the status
                category: category,
                communityTags: communityTags
            });
            setTemplates(prev => prev.map(t => t._id === template._id ? response.data : t));
            if (editingTemplate?._id === template._id) setEditingTemplate(response.data); // Update editing form if it's this one
        } catch (err) { setError(err.response?.data?.message || 'Failed to update share status.'); }
        finally { setIsLoading(false); }
    };
    

    const renderForm = (isEditMode = false) => {
        const currentName = isEditMode ? editingTemplate?.name : newTemplateName;
        const currentContent = isEditMode ? editingTemplate?.content : newTemplateContent;
        const currentPlatform = isEditMode ? editingTemplate?.platformHint : newTemplatePlatform;

        const setName = isEditMode ? (val) => setEditingTemplate(p => ({...p, name: val})) : setNewTemplateName;
        const setContent = isEditMode ? (val) => setEditingTemplate(p => ({...p, content: val})) : setNewTemplateContent;
        const setPlatform = isEditMode ? (val) => setEditingTemplate(p => ({...p, platformHint: val})) : setNewTemplatePlatform;


        return (
            <form onSubmit={handleCreateOrUpdateTemplate} className="p-4 border rounded-lg bg-slate-50 space-y-3 mb-6">
                <h3 className="text-lg font-medium">{isEditMode ? "Edit Template" : "Create New Template"}</h3>
                <div>
                    <label htmlFor={isEditMode ? "editName" : "newName"} className="block text-sm font-medium text-gray-700">Template Name</label>
                    <input type="text" id={isEditMode ? "editName" : "newName"} value={currentName} onChange={(e) => setName(e.target.value)}
                        className="mt-1 block w-full p-2 border rounded-md shadow-sm" required />
                </div>
                <div>
                <label htmlFor={isEditMode ? "editContent" : "newContent"} className="block text-sm font-medium text-gray-700">
    {'Template Content (use placeholders like {{title}}, {{key_takeaway_1}}, {{original_url}})'}
</label>
                    <textarea id={isEditMode ? "editContent" : "newContent"} value={currentContent} onChange={(e) => setContent(e.target.value)}
                        rows="4" className="mt-1 block w-full p-2 border rounded-md shadow-sm" required
                        placeholder="e.g., Just published: {{title}}! Key takeaway: {{key_takeaway_1}}. Read more: {{original_url}} #myblog"
                    />
                    <p className="text-xs text-gray-500 mt-1">
    {'Available placeholders: {{title}}, {{original_url}}, {{key_takeaway_1}}...{{key_takeaway_5}}, {{excerpt}}'}
</p>
                </div>
                <div>
                    <label htmlFor={isEditMode ? "editPlatform" : "newPlatform"} className="block text-sm font-medium text-gray-700">Platform Hint</label>
                    <select id={isEditMode ? "editPlatform" : "newPlatform"} value={currentPlatform} onChange={(e) => setPlatform(e.target.value)}
                        className="mt-1 block w-full p-2 border rounded-md shadow-sm">
                        <option value="general">General</option>
                        <option value="twitter">Twitter</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="email">Email</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="formDescription" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                        Description (Optional - shown in community library)
                    </label>
                    <textarea
                        id="formDescription"
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        rows="3"
                        className="mt-1 block w-full p-2 border dark:border-slate-600 rounded-md shadow-sm dark:bg-slate-800 dark:text-slate-100"
                        placeholder="Briefly explain what this template is for or its benefits."
                    />
                </div>
                <div>
                     <label htmlFor="formCategory" className="block text-sm font-medium">Category (for sharing)</label>
                     <input type="text" id="formCategory" value={formCategory} onChange={(e) => setFormCategory(e.target.value)} placeholder="e.g., twitter, email-marketing" className="mt-1 p-2 w-full border rounded-md ..."/>
                 </div>
                 <div>
                     <label className="block text-sm font-medium">Community Tags (for sharing)</label>
                     <TagInput tags={formCommunityTags} setTags={setFormCommunityTags} /> {/* Use TagInput */}
                 </div>
                <div className="flex gap-2">
                    <button type="submit" disabled={isLoading} className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md text-sm disabled:opacity-50">
                        {isLoading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Template')}
                    </button>
                    {isEditMode && <button type="button" onClick={cancelEdit} className="bg-gray-300 hover:bg-gray-400 text-black py-2 px-4 rounded-md text-sm">Cancel</button>}
                </div>
                {error && !isEditMode && <p className="text-xs text-red-500">{error}</p>}
            </form>
        );
    };

    return (
        <div className="max-w-3xl mx-auto mt-8 p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Manage Snippet Templates</h1>
                <button onClick={() => formMode ? closeForm() : handleOpenForm()} className="bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-md text-sm flex items-center" >
 
                <PlusIcon className="h-5 w-5 mr-1" /> {formMode ? 'Close Form' : 'Add New Template'}
                </button>
            </div>

            {formMode && renderForm(formMode === 'edit')} {/* Show form if mode is 'create' or 'edit' */}
            {error && editingTemplate && <p className="text-xs text-red-500 bg-red-100 p-2 rounded mb-3">{error}</p>}


            {isLoading && templates.length === 0 && <p>Loading templates...</p>}
            {!isLoading && templates.length === 0 && !isCreating && !editingTemplate && <p className="text-gray-600">No templates created yet. Add one above!</p>}

            <div className="space-y-4 mt-4">
                {templates.map(template => (
                    <div key={template._id} className="p-4 border rounded-lg shadow-sm bg-white">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-semibold text-gray-700">{template.name}</h4>
                                <p className="text-xs text-gray-500 capitalize">Hint: {template.platformHint}</p>
                            </div>
                            <div className="flex space-x-2 flex-shrink-0 items-center">
                            <button onClick={() => handleShareToggle(template)}
                                    className={`p-1 rounded-full hover:bg-opacity-20 ${template.isShared ? 'text-red-500 hover:bg-red-100 dark:hover:bg-red-800' : 'text-green-500 hover:bg-green-100 dark:hover:bg-green-800'}`}
                                    title={template.isShared ? 'Unshare from Community' : 'Share to Community'}>
                                    {template.isShared ? <EyeSlashIcon className="h-5 w-5"/> : <ShareIcon className="h-5 w-5"/>}
                                </button>
                                <button onClick={() => handleOpenForm(template)} className="p-1 text-blue-500 hover:text-blue-700" title="Edit">
            <PencilSquareIcon className="h-5 w-5" />
        </button>
                                <button onClick={() => handleDeleteTemplate(template._id)} className="p-1 text-red-500 hover:text-red-700" title="Delete">
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded whitespace-pre-wrap break-all">
                            {template.content}
                        </pre>
                        {template.isShared && (
                            <div className="mt-2 text-xs">
                                {template.category && <span className="mr-2 inline-block bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 px-2 py-0.5 rounded-full">Category: {template.category}</span>}
                                {template.communityTags && template.communityTags.length > 0 && (
                                    <span className="inline-block bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200 px-2 py-0.5 rounded-full">
                                        Tags: {template.communityTags.join(', ')}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
export default ManageTemplatesPage;
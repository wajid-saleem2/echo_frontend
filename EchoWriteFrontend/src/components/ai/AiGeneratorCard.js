// frontend/src/components/ai/AiGeneratorCard.js (New directory and file)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SparklesIcon, DocumentPlusIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'; // Added DocumentPlusIcon
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/apiConfig';
import { useNavigate } from 'react-router-dom'; // To redirect after saving
import SelectFolderModal from '../modals/SelectFolderModal'; // << IMPOR

const AiGeneratorCard = ({ title, description, inputFields, endpoint, resultProcessor, initialAiProvider = '', generatorType  }) => {
    const { user: authUser } = useAuth();
    const navigate = useNavigate(); // For redirecting
    const [formData, setFormData] = useState({});
    const [aiProvider, setAiProvider] = useState(initialAiProvider);
    const [generatedResult, setGeneratedResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [saveMessage, setSaveMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);
     // --- NEW: State for Folder Selection Modal ---
     const [showFolderSelectModal, setShowFolderSelectModal] = useState(false);
     // --- End New State ---
     const [initialTitleForSave, setInitialTitleForSave] = useState(''); // For the modal

    useEffect(() => {
        // Set default AI provider based on user's configured keys
        if (authUser?.hasOpenAiApiKey) setAiProvider('openai');
        else if (authUser?.hasGeminiApiKey) setAiProvider('gemini');
        else if (authUser?.hasPerplexityApiKey) setAiProvider('perplexity');
        else setAiProvider('');
    }, [authUser]);

    useEffect(() => {
        // Initialize formData based on inputFields
        const initialFormData = {};
        inputFields.forEach(field => {
            initialFormData[field.name] = field.defaultValue || '';
            if (field.type === 'checkbox') initialFormData[field.name] = field.defaultChecked || false;
        });
        setFormData(initialFormData);
    }, [inputFields]);


    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!aiProvider) {
            setError("Please select an AI provider or configure an API key in your profile.");
            return;
        }
        // Basic validation: check if required fields (if any) are filled
        for (const field of inputFields) {
            if (field.required && !formData[field.name]) {
                setError(`${field.label || field.name} is required.`);
                return;
            }
        }

        setIsLoading(true);
        setError('');
        setGeneratedResult(null);

        try {
            const payload = { ...formData, aiProvider };
            const response = await axiosInstance.post(endpoint, payload);
            if (response.data && !response.data.error) {
                setGeneratedResult(resultProcessor(response.data));
            } else {
                setError(response.data.error || "AI generation failed.");
            }
        } catch (err) {
            setError(err.response?.data?.message || "An error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (textToCopy) => {
        if (!textToCopy) return;
        navigator.clipboard.writeText(textToCopy)
            .then(() => alert("Copied to clipboard!")) // Use toast later
            .catch(err => console.error("Copy failed", err));
    };

    // --- NEW: Handler to Save Generated Result as New Content Piece ---
    const handleSaveAsNewContent = async () => {
        if (!generatedResult) {
            setError("No content generated to save.");
            return;
        }
        setIsSaving(true);
        setError('');
        setSaveMessage('');

        let contentToSave = '';
        if (typeof generatedResult === 'string') {
            contentToSave = generatedResult;
        } else if (Array.isArray(generatedResult)) {
            contentToSave = generatedResult.join('\n\n'); // Join array items with double newline
        }

        if (!contentToSave.trim()) {
            setError("Generated content is empty.");
            setIsSaving(false);
            return;
        }

        // Attempt to create a title (e.g., from card title or first line of content)
        let newContentTitle = `${title} - ${new Date().toLocaleTimeString()}`; // Default title
        const firstLine = contentToSave.split('\n')[0].trim();
        if (firstLine.length > 5 && firstLine.length < 100) { // Heuristic for a good title
            newContentTitle = firstLine;
        } else if (title) {
            newContentTitle = `${title} Output`;
        }

         // Determine a more specific contentType if possible
         let specificContentType = 'ai_generated'; // Default
         if (generatorType === 'marketing-email') {
             specificContentType = 'ai_marketing_email';
         } else if (generatorType === 'instagram-caption') {
             specificContentType = 'ai_ig_caption';
         } // Add more else if for other generator types

        try {
            
            const payload = {
                title: newContentTitle,
                originalText: contentToSave,
                contentType: specificContentType, // Or a more specific type based on the generator
                tags: [title.toLowerCase().replace(/\s+/g, '-'), 'ai-generated', generatorType || 'general-tool'] // Example tags
                // folderId: null, // Or allow user to select a folder
            };
            const response = await axiosInstance.post(`/content`, payload); // Your existing create content endpoint
            setSaveMessage(`Saved as new content piece: "${response.data.title}"`);
            // Optionally, redirect to the new content piece or dashboard
            // navigate(`/content/${response.data._id}`);
            alert(`Successfully saved as new content: "${response.data.title}"! You can find it in your content library.`);
            setGeneratedResult(null); // Clear result after saving
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save content.");
        } finally {
            setIsSaving(false);
        }
    };
    // --- End New Handler ---

    const openFolderSelectModal = () => {
        if (!generatedResult) {
            setError("No content generated to save."); // Use main error state or a specific one
            return;
        }

          // Prepare an initial title for the modal
          let suggestedTitle = `${title} - Output`;
          const firstLine = (typeof generatedResult === 'string' ? generatedResult : generatedResult[0] || "")
                            .split('\n')[0].trim();
          if (firstLine.length > 5 && firstLine.length < 100) {
              suggestedTitle = firstLine;
          }
          setInitialTitleForSave(suggestedTitle);
        setShowFolderSelectModal(true);
        setError(''); // Clear previous save errors
        setSaveMessage('');
    };

    const handleFinalSave  = async (selectedFolderId, userDefinedTitle) => {
        // This function is called by SelectFolderModal when a folder is chosen (or null for unfoldered)
        if (!generatedResult || !userDefinedTitle) return; // Should not happen if modal was opened

        setIsSaving(true);
        setError('');
        setSaveMessage('');

        let contentToSave = '';
        if (typeof generatedResult === 'string') contentToSave = generatedResult;
        else if (Array.isArray(generatedResult)) contentToSave = generatedResult.join('\n\n');

        if (!contentToSave.trim()) { /* ... error handling ... */ setIsSaving(false); return; }

        let newContentTitle = `${title} - Output`; // Simplified title logic
        const firstLine = contentToSave.split('\n')[0].trim();
        if (firstLine.length > 5 && firstLine.length < 100) newContentTitle = firstLine;

        try {
            const payload = {
                title: userDefinedTitle,
                originalText: contentToSave,
                contentType: 'ai_generated', // Or more specific based on generatorType prop
                tags: [title.toLowerCase().replace(/\s+/g, '-'), 'ai-generated', generatorType || 'general-tool'],
                folderId: selectedFolderId // <<<< Pass the selected folder ID
            };
            const response = await axiosInstance.post(`/content`, payload);
            setSaveMessage(`Saved as new content piece: "${response.data.title}" ${selectedFolderId ? 'in folder' : ''}.`);
            setGeneratedResult(null); // Clear result after saving
            // alert(...) or use toast
            alert(`Successfully saved as new content: "${response.data.title}"! You can find it in your content library.`);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save content.");
        } finally {
            setIsSaving(false);
        }
    };

    const anyAiKeyConfigured = authUser?.hasOpenAiApiKey || authUser?.hasGeminiApiKey || authUser?.hasPerplexityApiKey;

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg transition-all hover:shadow-2xl">
            <div className="flex items-center mb-3">
                <SparklesIcon className="h-6 w-6 text-indigo-500 dark:text-indigo-400 mr-2" />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100">{title}</h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">{description}</p>

            {!anyAiKeyConfigured && (
                 <p className="text-sm text-center py-4 text-gray-500 dark:text-gray-400 bg-slate-50 dark:bg-slate-700 rounded-md">
                     <Link to="/profile" className="text-blue-500 dark:text-blue-400 hover:underline font-medium">Configure an AI API key</Link> to use this generator.
                 </p>
            )}

            {anyAiKeyConfigured && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {inputFields.map(field => (
                        <div key={field.name}>
                            <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                                {field.label} {field.required && <span className="text-red-500">*</span>}
                            </label>
                            {field.type === 'textarea' ? (
                                <textarea
                                    id={field.name} name={field.name} value={formData[field.name] || ''} onChange={handleChange}
                                    rows={field.rows || 3} placeholder={field.placeholder} required={field.required}
                                    className="mt-1 block w-full p-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                                />
                            ) : field.type === 'checkbox' ? (
                                <div className="mt-1">
                                     <input
                                        id={field.name} name={field.name} type="checkbox"
                                        checked={!!formData[field.name]} onChange={handleChange}
                                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                    />
                                    <label htmlFor={field.name} className="ml-2 text-sm text-gray-700 dark:text-slate-300">{field.checkboxLabel || field.label}</label>
                                </div>
                            ) : (
                                <input
                                    type={field.type || 'text'} id={field.name} name={field.name} value={formData[field.name] || ''} onChange={handleChange}
                                    placeholder={field.placeholder} required={field.required}
                                    className="mt-1 block w-full p-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                                />
                            )}
                        </div>
                    ))}

                    <div>
                        <label htmlFor={`${title}-aiProvider`} className="block text-sm font-medium text-gray-700 dark:text-slate-300">AI Provider</label>
                        <select id={`${title}-aiProvider`} value={aiProvider} onChange={(e) => setAiProvider(e.target.value)}
                            className="mt-1 block w-full p-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                            disabled={isLoading}>
                            {authUser?.hasOpenAiApiKey && <option value="openai">OpenAI</option>}
                            {authUser?.hasGeminiApiKey && <option value="gemini">Gemini</option>}
                            {authUser?.hasPerplexityApiKey && <option value="perplexity">Perplexity</option>}
                        </select>
                    </div>

                    <button type="submit" disabled={isLoading || !aiProvider}
                        className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                        {isLoading ? 'Generating...' : 'Generate'}
                    </button>
                    {error && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{error}</p>}
                </form>
            )}

            {generatedResult && !isLoading && (
                <div className="mt-6 pt-4 border-t dark:border-slate-600 flex-grow flex flex-col"> {/* Allow this section to grow */}
                    <h4 className="text-md font-semibold text-gray-700 dark:text-slate-200 mb-2">Generated Result:</h4>
                    <div className="flex-grow p-3 bg-slate-50 dark:bg-slate-700 rounded-md text-sm text-gray-800 dark:text-slate-100 whitespace-pre-wrap break-words max-h-60 overflow-y-auto">
                    {typeof generatedResult === 'string' ? (
                        <pre className="p-3 bg-slate-50 dark:bg-slate-700 rounded-md text-sm text-gray-800 dark:text-slate-100 whitespace-pre-wrap break-words max-h-60 overflow-y-auto">{generatedResult}</pre>
                    ) : Array.isArray(generatedResult) ? (
                        <ul className="space-y-2 max-h-60 overflow-y-auto">
                            {generatedResult.map((item, index) => (
                                <li key={index} className="p-2 bg-slate-50 dark:bg-slate-700 rounded-md text-sm text-gray-800 dark:text-slate-100 whitespace-pre-wrap break-words">{item}</li>
                            ))}
                        </ul>
                    ) : null}
                    <button onClick={() => copyToClipboard(typeof generatedResult === 'string' ? generatedResult : generatedResult.join('\n\n'))}
                        className="mt-3 text-xs bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 text-gray-700 dark:text-slate-200 py-1.5 px-3 rounded-md">
                        Copy Result
                    </button>
                     {/* --- NEW SAVE BUTTON --- */}
                     <button
                            onClick={openFolderSelectModal}
                            disabled={isSaving}
                            className="flex-1 text-xs bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-3 rounded-md flex items-center justify-center disabled:opacity-50"
                        >
                            <DocumentPlusIcon className="h-4 w-4 mr-1.5" />
                            {isSaving ? 'Saving...' : 'Save as New Content'}
                        </button>
                        {/* --- END NEW SAVE BUTTON --- */}
                </div>
                  {saveMessage && <p className="text-xs text-green-600 dark:text-green-400 mt-2">{saveMessage}</p>}
                  {error && !saveMessage && <p className="text-xs text-red-500 dark:text-red-400 mt-2">{error}</p>} {/* Show main error if no save message */}
                </div>
            )}
              {/* Folder Selection Modal for this AiGeneratorCard */}
              <SelectFolderModal
                isOpen={showFolderSelectModal}
                onClose={() => setShowFolderSelectModal(false)}
                onSaveConfirm={handleFinalSave} // This will receive the folderId
                initialContentTitle={initialTitleForSave} // Pass initial title
                currentContentPreview={ // Pass a snippet of the content
                    typeof generatedResult === 'string' ? generatedResult.substring(0,100) + "..." :
                    (Array.isArray(generatedResult) && generatedResult.length > 0 ? generatedResult[0].substring(0,100) + "..." : "")
                }
            />
        </div>
    );
};
export default AiGeneratorCard;
// frontend/src/pages/ContentDetailPage.js
import React, { useState, useEffect } from 'react';
import {  Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext'; // <<<<<<<<<<<< ADDED: To check for API key status
import axiosInstance from '../api/apiConfig';
import { ShareIcon } from '@heroicons/react/24/outline'; // Added ShareIcon
import TranslationModal from '../components/modals/TranslationModal'; // << IMPORT
import { SUPPORTED_LANGUAGES } from '../utils/constants';

const API_URL = process.env.REACT_APP_API_URL;


const SnippetCard = React.memo(({ snippet, onUpdate, onDelete, originalContentId, contentPieceTitle, contentPieceUrl, contentPieceExcerpt }) => { // <<<<<<<<<<<< ADDED: hasOpenAiApiKey prop
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(snippet.generatedText);
    const [aiLoading, setAiLoading] = useState(false); // <<<<<<<<<<<< ADDED: AI loading state for this card
    const [aiError, setAiError] = useState(''); // <<<<<<<<<<<< ADDED: AI error state for this card
    const [selectedAiProvider, setSelectedAiProvider] = useState('openai'); // Default or from user settings
    const { user: authUser } = useAuth(); // Get user from AuthContext to check configured keys
    const [targetStyle, setTargetStyle] = useState('neutral'); // Default or common styles
    const [customStyle, setCustomStyle] = useState('');
    const [referenceStyleText, setReferenceStyleText] = useState(''); // For providing style example
    const [aiSuggestions, setAiSuggestions] = useState([]); // To hold multiple AI suggestions
    const [isPublishing, setIsPublishing] = useState(false);

    const [userTemplates, setUserTemplates] = useState([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');

    // --- NEW: State for Platform Suggestions ---
    const [platformSuggestions, setPlatformSuggestions] = useState([]);
    const [platformSuggestLoading, setPlatformSuggestLoading] = useState(false);
    const [platformSuggestError, setPlatformSuggestError] = useState('');
    // --- End New State ---

    const [showSnippetTranslationModal, setShowSnippetTranslationModal] = useState(false);
    const [showThisSnippetTranslationModal, setShowThisSnippetTranslationModal] = useState(false);

    const predefinedStyles = ['neutral', 'formal', 'casual', 'witty', 'empathetic', 'persuasive', 'concise', 'detailed'];

    const handleSnippetTranslationComplete = (translatedText, targetLangCode) => {
        // Option 1: Update current snippet's editText
        // setEditText(translatedText);
        // setIsEditing(true); // Allow user to save this translated version

        // Option 2: Create a NEW snippet with the translation
        if (window.confirm(`Create a new snippet with this ${SUPPORTED_LANGUAGES.find(l=>l.code === targetLangCode)?.name || targetLangCode} translation?`)) {
            const newSnippetPayload = {
                platform: `${snippet.platform}_translated_${targetLangCode}`, // Indicate it's translated
                generatedText: translatedText,
                // originalContent, user will be added by backend /repurpose/:contentId/generate
                // Or, if you have a direct /repurpose/snippet POST endpoint:
                // originalContent: originalContentId,
                // user: authUser._id, // This might not be available directly, backend should use req.user
            };
            // This requires a backend endpoint to create a single snippet,
            // or adapting the /repurpose/:contentId/generate to accept a single pre-made snippet.
            // For now, let's just update the current snippet's text for simplicity.
            setEditText(translatedText);
            setIsEditing(true); // Enter edit mode to save the translation
            alert(`Snippet translated to ${SUPPORTED_LANGUAGES.find(l=>l.code === targetLangCode)?.name || targetLangCode}. Save the snippet to keep changes.`);
        }
    };


    // Effect to set a default AI provider if keys are available
    useEffect(() => {
        if (authUser?.hasOpenAiApiKey) {
            setSelectedAiProvider('openai');
        } else if (authUser?.hasGeminiApiKey) {
            setSelectedAiProvider('gemini');
        } else if (authUser?.hasPerplexityApiKey) {
            setSelectedAiProvider('perplexity');
        } else {
            setSelectedAiProvider(''); // No keys configured
        }
    }, [authUser]);

    // Reset editText if snippet prop changes (e.g., after AI update from parent)
    useEffect(() => {
        setEditText(snippet.generatedText);
    }, [snippet.generatedText]);

    


    const handleSave = async () => {
        onUpdate(snippet._id, { generatedText: editText });
        setIsEditing(false);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(editText) // Use editText to copy current view
            .then(() => alert('Copied to clipboard!'))
            .catch(err => console.error('Failed to copy: ', err));
    };

    // <<<<<<<<<<<< ADDED: AI Enhancement Handler >>>>>>>>>>>>>>>
    const handleAiEnhance = async (actionType, customInstruction = null) => {
        setAiLoading(true);
        setAiError('');
        

        if (!selectedAiProvider) {
            setAiError('Please select an AI provider or configure an API key in your profile.');
            setAiLoading(false);
            return;
        }

        // Dynamic check based on selectedAiProvider
        let keyIsConfigured = false;
        if (selectedAiProvider === 'openai' && authUser?.hasOpenAiApiKey) keyIsConfigured = true;
        else if (selectedAiProvider === 'gemini' && authUser?.hasGeminiApiKey) keyIsConfigured = true;
        else if (selectedAiProvider === 'perplexity' && authUser?.hasPerplexityApiKey) keyIsConfigured = true;

        if (!keyIsConfigured) {
            setAiError(`Your ${selectedAiProvider.charAt(0).toUpperCase() + selectedAiProvider.slice(1)} API key is not configured. Please add it in your profile.`);
            setAiLoading(false);
            return;
        }

        const endpoint = `${API_URL}/ai/enhance-text`; // Using the generic endpoint
        const payload = {
            text: editText, // Use current editText for enhancement
            aiProvider: selectedAiProvider,
            action: '',
            options: {}
        };

        switch (actionType) {
            case 'generate-headlines': // Changed from 'headlines' to be more generic for a snippet
                payload.action = 'generate-headlines'; // Backend action might still be 'generate-headlines'
                payload.options.count = 1; // Suggest one rewrite
                break;
            case 'summarize': // Changed from 'summarize_short'
                payload.action = 'summarize';
                payload.options.length = 'short'; // Or make this configurable
                break;
            case 'hashtags':
                payload.action = 'hashtags'; // Assuming you'll implement this in aiService
                payload.options.count = 5;
                break;
            case 'rephrase': // <<<< This is our new generic rephrase
                payload.action = 'rephrase';
                if (customInstruction) { // Allow passing a custom instruction for rephrasing
                    payload.options.instruction = customInstruction;
                }
                // The backend rephraseText function will use a default instruction if none is provided
                break;
            // Keep 'generate-headlines' if you have a separate button for it,
            // or remove if 'rephrase' covers the general need for snippets.
            // case 'generate-headlines':
            //     payload.action = 'generate-headlines';
            //     payload.options.count = 1;
            //     break;
            default:
                setAiError('Unknown AI action.');
                setAiLoading(false);
                return;
        }

        try {
            const response = await axios.post(endpoint, payload);
            let newText = editText; // Fallback

            if (response.data) {
                if (actionType === 'generate-headlines' && Array.isArray(response.data) && response.data.length > 0) {
                    newText = response.data[0];
                } else if (actionType === 'summarize' && response.data.summary) {
                    newText = response.data.summary;
                } else if (actionType === 'hashtags' && Array.isArray(response.data) && response.data.length > 0) {
                    // Append hashtags or replace, depending on desired UX
                    newText = `${editText}\n\nSuggested Hashtags: ${response.data.map(h => `#${h.trim()}`).join(' ')}`;
                } else if (actionType === 'rephrase' && response.data.rephrasedText) {
                    newText = response.data.rephrasedText;

                } else if (typeof response.data === 'string') { // Generic string response
                    newText = response.data;
                }
            }

            setEditText(newText); // Update the editable text
            // alert('AI suggestion applied. Review and save.'); // Or use a toast
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'AI enhancement failed.';
            setAiError(errorMsg);
            console.error("AI Enhancement Error:", err);
        } finally {
            setAiLoading(false);
        }
    };

    const handleAiRewriteStyle = async () => {
        setAiLoading(true);
        // ... (check for API key for selectedAiProvider - as in handleAiEnhance)
        if (!selectedAiProvider) {
            setAiError('Please select an AI provider or configure an API key in your profile.');
            setAiLoading(false);
            return;
        }
        setAiSuggestions([]); // Clear previous suggestions

        // Dynamic check based on selectedAiProvider
        let keyIsConfigured = false;
        if (selectedAiProvider === 'openai' && authUser?.hasOpenAiApiKey) keyIsConfigured = true;
        else if (selectedAiProvider === 'gemini' && authUser?.hasGeminiApiKey) keyIsConfigured = true;
        else if (selectedAiProvider === 'perplexity' && authUser?.hasPerplexityApiKey) keyIsConfigured = true;

        if (!keyIsConfigured) {
            setAiError(`Your ${selectedAiProvider.charAt(0).toUpperCase() + selectedAiProvider.slice(1)} API key is not configured. Please add it in your profile.`);
            setAiLoading(false);
            return;
        }

        const currentTextToRewrite = editText || snippet.generatedText;
        const styleToApply = targetStyle === 'custom' ? customStyle : targetStyle;

        if (!styleToApply) {
            alert("Please select or enter a target style/tone.");
            setAiLoading(false);
            return;
        }

        const payload = {
            text: currentTextToRewrite,
            aiProvider: selectedAiProvider,
            action: 'rewrite-style-tone',
            options: {
                targetStyleOrTone: styleToApply,
                referenceStyleText: referenceStyleText || null
            }
        };

        try {
            const response = await axios.post(`${API_URL}/ai/enhance-text`, payload);
           // Assuming backend returns an object like { rewrittenText: "single" } or { rewrittenTexts: ["option1", "option2"] }
            // Or for headlines, it might directly return an array.
            if (response.data.rewrittenText) { // Single suggestion
                setEditText(response.data.rewrittenText);
                alert('AI rewrite applied. Review and save.');
            } else if (Array.isArray(response.data) && response.data.length > 0) { // Multiple headline suggestions
                setAiSuggestions(response.data);
            } else if (response.data.rewrittenTexts && Array.isArray(response.data.rewrittenTexts) && response.data.rewrittenTexts.length > 0) { // Multiple style suggestions
                setAiSuggestions(response.data.rewrittenTexts);
            } else if (response.data.error) {
                setAiError('AI Rewrite Failed: ' + response.data.error);
            } else {
                setAiError('AI Rewrite did not return expected text.');
            }
        } catch (err) {
            alert('AI Rewrite Failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setAiLoading(false);
        }
    };

     // New handler to apply a selected suggestion
     const applyAiSuggestion = (suggestionText) => {
        setEditText(suggestionText);
        setAiSuggestions([]); // Clear suggestions after applying one
    };

    const handlePublishTweet = async () => {
        setIsPublishing(true);
        setAiError(''); // Use the existing error state for feedback
        try {
            await axiosInstance.post(`/connect/twitter/tweet`, { 
                text: editText,
                snippetId: snippet._id 
            });
            alert("Successfully published to Twitter!"); // Use Toast
            // Optionally update the snippet status in the DB via onUpdate
            // onUpdate(snippet._id, { status: 'published_twitter' });
        } catch (err) {
            setAiError(err.response?.data?.message || "Failed to publish to Twitter.");
        } finally {
            setIsPublishing(false);
        }
   };

    // Fetch user templates when component mounts or authUser changes
    useEffect(() => {
        const fetchTemplatesForSnippet = async () => {
            if (!authUser) return;
            try {
                const response = await axiosInstance.get('/templates');
                setUserTemplates(response.data || []);
            } catch (err) { console.error("Failed to fetch templates for snippet card", err); }
        };
        fetchTemplatesForSnippet();
    }, [authUser]);

    const applySnippetTemplate = () => {
        if (!selectedTemplateId) {
            alert("Please select a template.");
            return;
        }
        const template = userTemplates.find(t => t._id === selectedTemplateId);
        if (!template) {
            alert("Selected template not found.");
            return;
        }

        // Placeholder data - In a real scenario, you'd extract these from originalContent
        // or have a more robust way to get "key takeaways"
        const placeholderData = {
            title: contentPieceTitle || "Your Title", // Pass from ContentDetailPage
            original_url: contentPieceUrl || "https://example.com", // Pass from ContentDetailPage
            key_takeaway_1: "First key point...",
            key_takeaway_2: "Second key point...",
            key_takeaway_3: "Third key point...",
            key_takeaway_4: "Fourth key point...",
            key_takeaway_5: "Fifth key point...",
            excerpt: contentPieceExcerpt || "A short excerpt of the content..." // Pass from ContentDetailPage
            // Add more placeholders as needed
        };

        let populatedContent = template.content;
        for (const key in placeholderData) {
            populatedContent = populatedContent.replace(new RegExp(`{{${key}}}`, 'g'), placeholderData[key]);
        }
        // Replace any unfulfilled placeholders (optional)
        populatedContent = populatedContent.replace(/{{[^}]+}}/g, '[...]');


        setEditText(populatedContent); // Update the snippet's text area
        setIsEditing(true); // Switch to edit mode so user can save
        alert("Template applied! Review and save the snippet.");
    };
   
    // --- NEW: Handler for Platform Suggestions ---
    const handleSuggestPlatforms = async () => {
        if (!editText.trim()) {
            setPlatformSuggestError("Snippet text is empty.");
            return;
        }
        if (!selectedAiProvider) { // Use the same provider as other AI actions on the card
            setPlatformSuggestError("Please select an AI provider or configure an API key.");
            return;
        }
        setPlatformSuggestLoading(true);
        setPlatformSuggestError('');
        setPlatformSuggestions([]);

        try {
            const response = await axiosInstance.post(`/ai/suggest-platforms`, {
                text: editText,
                aiProvider: selectedAiProvider,
                count: 2 // Ask for top 2 suggestions
            });
            if (response.data && response.data.suggestions) {
                setPlatformSuggestions(response.data.suggestions);
            } else if (response.data.error) {
                setPlatformSuggestError(response.data.error);
            } else {
                setPlatformSuggestError("AI did not return platform suggestions as expected.");
            }
        } catch (err) {
            setPlatformSuggestError(err.response?.data?.message || "Failed to get platform suggestions.");
        } finally {
            setPlatformSuggestLoading(false);
        }
    };
    // --- End New Handler ---

    // Determine if any AI key is configured to show the AI section
    const anyAiKeyConfigured = authUser?.hasOpenAiApiKey || authUser?.hasGeminiApiKey || authUser?.hasPerplexityApiKey;

    console.log(`Rendering SnippetCard: ${snippet._id.slice(-5)} - ${snippet.platform}`); // For debugging re-renders
    // <<<<<<<<<<<< END ADDED: AI Enhancement Handler >>>>>>>>>>>>>>>

    return (
        <div className="bg-gray-50 p-4 rounded-md border mb-4 shadow">
            {aiError && <p className="text-xs text-red-600 bg-red-100 p-2 mb-2 rounded">{aiError}</p>}
            {isEditing ? (
                <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full p-2 border rounded min-h-[120px] font-mono text-sm focus:ring-blue-500 focus:border-blue-500"
                />
            ) : (
                <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed min-h-[60px]">
                    {editText} {/* Display editText here so AI changes are visible before save */}
                </pre>
            )}
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>Platform: <span className="font-medium">{snippet.platform.replace(/_/g, ' ')}</span></span>
                <span>Status: <span className="font-medium">{snippet.status}</span></span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 items-center"> {/* Main actions row */}
                {isEditing ? (
                    <>
                        <button onClick={handleSave} className="text-xs bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded shadow-sm">Save</button>
                        <button onClick={() => { setIsEditing(false); setEditText(snippet.generatedText); setAiError(''); }} className="text-xs bg-gray-300 hover:bg-gray-400 text-black py-1 px-3 rounded shadow-sm">Cancel</button>
                    </>
                ) : (
                    <button onClick={() => setIsEditing(true)} className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded shadow-sm">Edit</button>
                )}
                <button onClick={copyToClipboard} className="text-xs bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded shadow-sm">Copy</button>
                <button onClick={() => onDelete(snippet._id)} className="text-xs bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded shadow-sm">Delete</button>
                 {/* Add Publish Button if connected and not editing */}
                 {!isEditing && authUser?.hasTwitterOAuth && (
                    <button
                        onClick={handlePublishTweet}
                        disabled={isPublishing}
                        className="text-xs bg-sky-500 hover:bg-sky-600 text-white py-1 px-3 rounded shadow-sm disabled:opacity-50"
                        title="Post this snippet to Twitter"
                        >
                        {isPublishing ? 'Publishing...' : 'Publish to Twitter'}
                    </button>
                )}
            </div>

             {/* Apply Template Section (shown when not editing snippet text directly) */}
             {!isEditing && userTemplates.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                    <label htmlFor={`template-select-${snippet._id}`} className="block text-xs font-medium text-gray-700 mb-1">Apply Template:</label>
                    <div className="flex items-center gap-2">
                        <select
                            id={`template-select-${snippet._id}`}
                            value={selectedTemplateId}
                            onChange={(e) => setSelectedTemplateId(e.target.value)}
                            className="flex-grow p-1.5 border rounded-md text-xs bg-white"
                        >
                            <option value="">-- Select a Template --</option>
                            {userTemplates.map(t => (
                                <option key={t._id} value={t._id}>{t.name} ({t.platformHint})</option>
                            ))}
                        </select>
                        <button
                            onClick={applySnippetTemplate}
                            disabled={!selectedTemplateId}
                            className="bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold py-1.5 px-3 rounded-md disabled:opacity-50"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            )}

            {/* --- AI Enhancement Section --- */}
            {!isEditing && anyAiKeyConfigured && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center mb-2 space-y-2 sm:space-y-0 sm:space-x-2">
                        <span className="text-xs font-semibold text-gray-700">Enhance with AI:</span>
                        <select
                            value={selectedAiProvider}
                            onChange={(e) => { setSelectedAiProvider(e.target.value); setAiError(''); }}
                            className="text-xs p-1 border rounded bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            disabled={aiLoading}
                        >
                            {/* Dynamically add options based on configured keys */}
                            {authUser?.hasOpenAiApiKey && <option value="openai">OpenAI</option>}
                            {authUser?.hasGeminiApiKey && <option value="gemini">Gemini</option>}
                            {authUser?.hasPerplexityApiKey && <option value="perplexity">Perplexity</option>}
                        </select>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                        <button onClick={() => handleAiEnhance('generate-headlines')} disabled={aiLoading || !selectedAiProvider} className="text-xs bg-purple-500 hover:bg-purple-600 text-white py-1 px-2 rounded disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                            {aiLoading && selectedAiProvider ? '...' : 'AI Headlines'}
                        </button>
                        <button onClick={() => handleAiEnhance('rephrase')} disabled={aiLoading || !selectedAiProvider} className="text-xs bg-purple-500 hover:bg-purple-600 text-white py-1 px-2 rounded disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                            {aiLoading && selectedAiProvider ? '...' : 'AI Rephrase'}
                        </button>
                        <button onClick={() => handleAiEnhance('summarize')} disabled={aiLoading || !selectedAiProvider} className="text-xs bg-teal-500 hover:bg-teal-600 text-white py-1 px-2 rounded disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                            {aiLoading && selectedAiProvider ? '...' : 'AI Summarize'}
                        </button>
                        <button onClick={() => handleAiEnhance('hashtags')} disabled={aiLoading || !selectedAiProvider} className="text-xs bg-pink-500 hover:bg-pink-600 text-white py-1 px-2 rounded disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                            {aiLoading && selectedAiProvider ? '...' : 'Hashtags'}
                        </button>
                    </div>
                    <div className="mt-3 pt-3 border-t dark:border-slate-600">
                        <button
                            onClick={() => {
                                if (!editText.trim()) {
                                    alert("Snippet text is empty, cannot translate.");
                                    return;
                                }
                                setShowThisSnippetTranslationModal(true); // Open THIS snippet's modal
                            }}
                            disabled={aiLoading || !selectedAiProvider || !editText.trim()}
                            className="w-full flex items-center justify-center text-xs bg-green-500 hover:bg-green-600 text-white font-semibold py-1.5 px-3 rounded-md disabled:opacity-50"
                        >
                            {/* Replace DocumentDuplicateIcon if you have a better translate icon */}
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3.75h.008v.008H12v-.008zM3 7.207V6A2.25 2.25 0 015.25 3.75h13.5A2.25 2.25 0 0121 6v1.207m-18 0c0 .346.028.69.083 1.023A3.75 3.75 0 004.5 12H6c.832 0 1.612.246 2.276.672L12 15l3.724-2.328A3.75 3.75 0 0018 12h1.5a3.75 3.75 0 003.417-3.773c.055-.333.083-.677.083-1.023m-18 0c0-1.24.738-2.326 1.835-2.843A6.75 6.75 0 0112 3c2.063 0 3.937.84 5.165 2.157A3.752 3.752 0 0121 7.207" />
                            </svg>
                            Translate Snippet
                        </button>
                    </div>
                </div>
            )}
            {!isEditing && !anyAiKeyConfigured && (
                 <p className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                    AI features available. <Link to="/profile" className="text-blue-500 hover:underline">Configure an API key</Link> to enable.
                </p>
            )}
            {/* --- End AI Enhancement Section --- */}

            
             {/* Style/Tone Rewriting UI */}
             <div className="my-3 p-3 border rounded-md bg-gray-100">
                    <p className="text-xs font-medium mb-1">Rewrite with Style/Tone:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                        <div>
                            <label htmlFor={`style-select-${snippet._id}`} className="text-xs text-gray-600 block">Select Style:</label>
                            <select
                                id={`style-select-${snippet._id}`}
                                value={targetStyle}
                                onChange={(e) => setTargetStyle(e.target.value)}
                                className="text-xs p-1 border rounded w-full bg-white"
                                disabled={aiLoading || isEditing}
                            >
                                {predefinedStyles.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                                <option value="custom">Custom...</option>
                            </select>
                        </div>
                        {targetStyle === 'custom' && (
                            <div>
                                <label htmlFor={`custom-style-${snippet._id}`} className="text-xs text-gray-600 block">Custom Style:</label>
                                <input
                                    type="text"
                                    id={`custom-style-${snippet._id}`}
                                    placeholder="e.g., like a pirate"
                                    value={customStyle}
                                    onChange={(e) => setCustomStyle(e.target.value)}
                                    className="text-xs p-1 border rounded w-full bg-white"
                                    disabled={aiLoading || isEditing}
                                />
                            </div>
                        )}
                    </div>
                    <div>
                        <label htmlFor={`ref-style-${snippet._id}`} className="text-xs text-gray-600 block">Reference Style Text (Optional):</label>
                        <textarea
                            id={`ref-style-${snippet._id}`}
                            placeholder="Paste text here to mimic its style..."
                            value={referenceStyleText}
                            onChange={(e) => setReferenceStyleText(e.target.value)}
                            className="text-xs p-1 border rounded w-full bg-white h-16"
                            disabled={aiLoading || isEditing}
                        />
                    </div>
                    <button
                        onClick={handleAiRewriteStyle}
                        disabled={aiLoading || isEditing || (!customStyle && targetStyle === 'custom')}
                        className="mt-2 text-xs bg-purple-500 hover:bg-purple-600 text-white py-1 px-2 rounded disabled:opacity-50"
                    >
                        {aiLoading ? 'Rewriting...' : 'Apply Style/Tone'}
                    </button>

                    {/* Display AI Suggestions if any */}
                    {aiSuggestions.length > 0 && !aiLoading && (
                            <div className="mt-3 pt-2 border-t">
                                <p className="text-xs font-medium mb-1">AI Suggestions (click to apply):</p>
                                <ul className="space-y-1">
                                    {aiSuggestions.map((suggestion, index) => (
                                        <li key={index}
                                            onClick={() => applyAiSuggestion(suggestion)}
                                            className="text-xs p-2 bg-white border rounded hover:bg-blue-50 cursor-pointer"
                                        >
                                            {suggestion.length > 100 ? suggestion.substring(0, 97) + "..." : suggestion}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                         {/* --- NEW: Platform Suggestion UI --- */}
                    <div className="mt-3 pt-3 border-t dark:border-slate-600">
                        <button
                            onClick={handleSuggestPlatforms}
                            disabled={platformSuggestLoading || !selectedAiProvider || !editText.trim()}
                            className="w-full flex items-center justify-center text-xs bg-sky-500 hover:bg-sky-600 text-white font-semibold py-1.5 px-3 rounded-md disabled:opacity-50"
                        >
                            <ShareIcon className="h-4 w-4 mr-1.5" />
                            {platformSuggestLoading ? 'Suggesting Platforms...' : 'AI Suggest Best Platforms'}
                        </button>
                        {platformSuggestError && <p className="text-xs text-red-500 dark:text-red-400 mt-1.5">{platformSuggestError}</p>}
                        {platformSuggestions.length > 0 && !platformSuggestLoading && (
                            <div className="mt-2 space-y-1.5">
                                <p className="text-xs font-medium text-gray-700 dark:text-slate-300">Platform Suggestions:</p>
                                {platformSuggestions.map((sugg, index) => (
                                    <div key={index} className="p-2 bg-slate-200 dark:bg-slate-700 rounded text-xs">
                                        <strong className="text-slate-800 dark:text-slate-100">{sugg.platform}:</strong>
                                        <span className="ml-1 text-slate-600 dark:text-slate-300">{sugg.reason}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* --- End Platform Suggestion UI --- */}

                     {/* Translation Modal specific to THIS SnippetCard instance */}
            {showThisSnippetTranslationModal && (
                <TranslationModal
                    isOpen={showThisSnippetTranslationModal}
                    onClose={() => setShowThisSnippetTranslationModal(false)}
                    textToTranslate={editText} // Pass this snippet's current editText
                    onTranslationComplete={handleSnippetTranslationComplete}
                    // originalLanguage could be a prop or detected
                />
            )}
                </div>
        </div>
    );
});

export default SnippetCard;

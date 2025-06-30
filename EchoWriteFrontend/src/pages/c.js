// frontend/src/pages/ContentDetailPage.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext'; // <<<<<<<<<<<< ADDED: To check for API key status
import { trackSnippetGenerated } from '../services/analytics'; // Import

const API_URL = process.env.REACT_APP_API_URL;

// Snippet Component (can be moved to its own file later)
const SnippetCard = React.memo(({ snippet, onUpdate, onDelete, hasOpenAiApiKey }) => { // <<<<<<<<<<<< ADDED: hasOpenAiApiKey prop
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

    const predefinedStyles = ['neutral', 'formal', 'casual', 'witty', 'empathetic', 'persuasive', 'concise', 'detailed'];

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
    const handleAiEnhance = async (actionType) => {
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
            case 'rewrite': // Changed from 'headlines' to be more generic for a snippet
                payload.action = 'generate-headlines'; // Backend action might still be 'generate-headlines'
                payload.options.count = 1; // Suggest one rewrite
                break;
            case 'summarize': // Changed from 'summarize_short'
                payload.action = 'summarize';
                payload.options.length = 'short'; // Or make this configurable
                break;
            case 'hashtags':
                payload.action = 'suggest-hashtags'; // Assuming you'll implement this in aiService
                payload.options.count = 5;
                break;
            default:
                setAiError('Unknown AI action.');
                setAiLoading(false);
                return;
        }

        try {
            const response = await axios.post(endpoint, payload);
            let newText = editText; // Fallback

            if (response.data) {
                if (actionType === 'rewrite' && Array.isArray(response.data) && response.data.length > 0) {
                    newText = response.data[0];
                } else if (actionType === 'summarize' && response.data.summary) {
                    newText = response.data.summary;
                } else if (actionType === 'hashtags' && Array.isArray(response.data) && response.data.length > 0) {
                    // Append hashtags or replace, depending on desired UX
                    newText = `${editText}\n\nSuggested Hashtags: ${response.data.map(h => `#${h.trim()}`).join(' ')}`;
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
            </div>

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
                        <button onClick={() => handleAiEnhance('rewrite')} disabled={aiLoading || !selectedAiProvider} className="text-xs bg-purple-500 hover:bg-purple-600 text-white py-1 px-2 rounded disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                            {aiLoading && selectedAiProvider ? '...' : 'Rewrite'}
                        </button>
                        <button onClick={() => handleAiEnhance('summarize')} disabled={aiLoading || !selectedAiProvider} className="text-xs bg-teal-500 hover:bg-teal-600 text-white py-1 px-2 rounded disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                            {aiLoading && selectedAiProvider ? '...' : 'Summarize'}
                        </button>
                        <button onClick={() => handleAiEnhance('hashtags')} disabled={aiLoading || !selectedAiProvider} className="text-xs bg-pink-500 hover:bg-pink-600 text-white py-1 px-2 rounded disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                            {aiLoading && selectedAiProvider ? '...' : 'Hashtags'}
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
                </div>
        </div>
    );
});


const ContentDetailPage = () => {
    const [contentPiece, setContentPiece] = useState(null);
    const [repurposedSnippets, setRepurposedSnippets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [generating, setGenerating] = useState(false); // For initial snippet generation
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth(); // <<<<<<<<<<<< ADDED: Get user from AuthContext

    const { user: authUser } = useAuth(); // For AI key checks

    // --- New State for Selected Text Enhancement ---
    const [isEditingOriginal, setIsEditingOriginal] = useState(false); // To toggle edit mode for original text
    const [editableOriginalText, setEditableOriginalText] = useState(''); // Holds originalText when editing
    const [selectedText, setSelectedText] = useState('');
    const [selectionRange, setSelectionRange] = useState(null); // { start, end } for textarea
    const [showAiEnhancePopup, setShowAiEnhancePopup] = useState(false);
    const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
    const originalTextareaRef = useRef(null); // Ref for the textarea

    // --- AI Modal State (Simplified for now, will expand) ---
    const [showAiActionModal, setShowAiActionModal] = useState(false);
    const [aiActionForSelected, setAiActionForSelected] = useState(''); // e.g., 'rewrite-style-tone'
    const [aiProviderForSelected, setAiProviderForSelected] = useState('openai');
    // ... (other AI options state: targetStyle, customStyle, etc.)
    const [targetStyleForModal, setTargetStyleForModal] = useState(''); // NEW STATE for style/tone input
    const [aiSuggestionsForSelected, setAiSuggestionsForSelected] = useState([]);
    const [aiModalLoading, setAiModalLoading] = useState(false);
    const [aiModalError, setAiModalError] = useState('');

    const fetchContentAndSnippets = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [contentRes, snippetsRes] = await Promise.all([
                axios.get(`${API_URL}/content/${id}`),
                axios.get(`${API_URL}/repurpose/${id}`)
            ]);
            setContentPiece(contentRes.data);
            // When contentPiece is fetched, also set editableOriginalText if not already editing
        if (contentRes.data && !isEditingOriginal) {
            setEditableOriginalText(contentRes.data.originalText);
        }
            setRepurposedSnippets(snippetsRes.data.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt) || a.orderInGroup - b.orderInGroup)); // Sort here
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch data.');
        } finally {
            setLoading(false);
        }
    }, [id, isEditingOriginal]);

    useEffect(() => {
        if (contentPiece && !isEditingOriginal) {
            setEditableOriginalText(contentPiece.originalText);
        }
    }, [contentPiece, isEditingOriginal]);

    const handleToggleEditOriginal = () => {
        if (isEditingOriginal) {
            // If was editing, consider if they want to save changes
            if (contentPiece && editableOriginalText !== contentPiece.originalText) {
                if (window.confirm("You have unsaved changes to the original text. Save them now?")) {
                    handleSaveOriginalText();
                } else {
                    // Revert to original if they cancel
                    setEditableOriginalText(contentPiece.originalText);
                }
            }
        } else {
            // Entering edit mode
            setEditableOriginalText(contentPiece?.originalText || '');
        }
        setIsEditingOriginal(!isEditingOriginal);
        setShowAiEnhancePopup(false); // Hide popup when toggling edit mode
    };

    const handleSaveOriginalText = async () => {
        if (!contentPiece) return;
        setLoading(true); // Use a general loading state or a specific one
        try {
            await axios.put(`${API_URL}/content/${id}`, { originalText: editableOriginalText });
            // Update contentPiece in state to reflect changes
            setContentPiece(prev => ({ ...prev, originalText: editableOriginalText }));
            setIsEditingOriginal(false); // Exit edit mode
            alert("Original content updated successfully!");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save original content.");
        } finally {
            setLoading(false);
        }
    };

    const handleTextSelection = (event) => {
        if (!isEditingOriginal || !originalTextareaRef.current) return;

        const textarea = originalTextareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentSelectedText = textarea.value.substring(start, end);

        if (currentSelectedText.trim().length > 0) {
            setSelectedText(currentSelectedText);
            setSelectionRange({ start, end });

            // Calculate popup position (simplified)
            // For a more robust solution, you'd use a library or more complex calculations
            const rect = textarea.getBoundingClientRect();
            // Attempt to position near the end of the selection
            // This is very basic and might need a library for good positioning
            const tempSpan = document.createElement('span');
            document.body.appendChild(tempSpan);
            tempSpan.textContent = textarea.value.substring(0, end);
            tempSpan.style.whiteSpace = 'pre-wrap'; // Match textarea
            tempSpan.style.visibility = 'hidden';
            // Rough estimate, needs refinement
            const yOffset = (tempSpan.offsetHeight % (textarea.clientHeight - 20)) + rect.top + window.scrollY - 25;
            document.body.removeChild(tempSpan);

            setPopupPosition({
                top: yOffset, // Position above selection
                left: rect.left + window.scrollX + (event.clientX - rect.left) // Near mouse X
            });
            setShowAiEnhancePopup(true);
        } else {
            setShowAiEnhancePopup(false);
            setSelectedText('');
            setSelectionRange(null);
        }
    };

    const openAiModalForSelection = (action) => {
        setAiActionForSelected(action);
        setShowAiActionModal(true);
        setShowAiEnhancePopup(false); // Hide the small popup
        setAiSuggestionsForSelected([]);
        setAiModalError('');
        setTargetStyleForModal(''); // Reset style for new selection
    };

    // This function will replace the selected text in the textarea
    const applyAiSuggestionToSelectedText = (suggestion) => {
        if (selectionRange && editableOriginalText) {
            const { start, end } = selectionRange;
            const newText =
                editableOriginalText.substring(0, start) +
                suggestion +
                editableOriginalText.substring(end);
            setEditableOriginalText(newText);
            setShowAiActionModal(false); // Close modal
            setSelectedText(''); // Clear selection state
            setSelectionRange(null);
        }
    };

    // Handler for AI modal submission (will call backend)
    const handleAiModalSubmit = async (modalOptions) => {
        setAiModalLoading(true);
        setAiModalError('');
        setAiSuggestionsForSelected([]);

        // ... (API key checks for aiProviderForSelected from authUser) ...
        let keyIsConfigured = false;
        if (aiProviderForSelected === 'openai' && authUser?.hasOpenAiApiKey) keyIsConfigured = true;
        else if (aiProviderForSelected === 'gemini' && authUser?.hasGeminiApiKey) keyIsConfigured = true;
        else if (aiProviderForSelected === 'perplexity' && authUser?.hasPerplexityApiKey) keyIsConfigured = true;

        if (!keyIsConfigured) {
            setAiModalError(`Your ${aiProviderForSelected.charAt(0).toUpperCase() + aiProviderForSelected.slice(1)} API key is not configured.`);
            setAiModalLoading(false);
            return;
        }

        const payload = {
            text: selectedText,
            aiProvider: aiProviderForSelected,
            action: aiActionForSelected,
            options: modalOptions // e.g., { targetStyleOrTone: 'witty', referenceStyleText: '...' }
        };
        console.log("Frontend Payload to /ai/enhance-text:", JSON.stringify(payload, null, 2)); // Log this

        try {
            const response = await axios.post(`${API_URL}/ai/enhance-text`, payload);
            if (response.data.error) {
                setAiModalError(response.data.error);
            } else {
                // Handle single or multiple suggestions
                if (response.data.rewrittenText) {
                    setAiSuggestionsForSelected([response.data.rewrittenText]);
                } else if (response.data.rewrittenTexts && Array.isArray(response.data.rewrittenTexts)) {
                    setAiSuggestionsForSelected(response.data.rewrittenTexts);
                } else if (Array.isArray(response.data) && response.data.length > 0 && typeof response.data[0] === 'string') { // For headlines
                    setAiSuggestionsForSelected(response.data);
                } else if (response.data.summary) {
                    setAiSuggestionsForSelected([response.data.summary]);
                }
                // Add more conditions based on your backend response structure for different actions
            }
        } catch (err) {
            setAiModalError(err.response?.data?.message || "AI request failed.");
        } finally {
            setAiModalLoading(false);
        }
    };

    useEffect(() => {
        fetchContentAndSnippets();
    }, [fetchContentAndSnippets]);

    const handleDeleteContent = useCallback(async () => {
        if (window.confirm('Are you sure you want to delete this content piece and all its repurposed snippets? This action cannot be undone.')) {
            try {
                // Optional: Delete all associated snippets first if not handled by backend cascade
                // for (const snippet of repurposedSnippets) {
                //    await axios.delete(`${API_URL}/repurpose/snippet/${snippet._id}`);
                // }
                await axios.delete(`${API_URL}/content/${id}`);
                navigate('/dashboard');
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to delete content piece.');
            }
        }
    }, [id, navigate]);

    const handleGenerateSnippets = useCallback(async (platform) => {
        setGenerating(true);
        setError('');
        try {
            const response = await axios.post(`${API_URL}/repurpose/${id}/generate`, { targetPlatform: platform });
            trackSnippetGenerated(platform);
            // Add new snippets to the existing list, and re-sort
            setRepurposedSnippets(prev => [...prev, ...response.data].sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt) || a.orderInGroup - b.orderInGroup));
        } catch (err) {
            setError(err.response?.data?.message || `Failed to generate ${platform} snippets.`);
        } finally {
            setGenerating(false);
        }
    }, [id]);

    const handleUpdateSnippet = useCallback(async (snippetId, updates) => {
        try {
            const response = await axios.put(`${API_URL}/repurpose/snippet/${snippetId}`, updates);
            setRepurposedSnippets(prev => prev.map(s => s._id === snippetId ? response.data : s)
                                              .sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt) || a.orderInGroup - b.orderInGroup));
        } catch (err) {
            alert('Failed to update snippet: ' + (err.response?.data?.message || err.message));
        }
    }, []);

    const handleDeleteSnippet = useCallback(async (snippetId) => {
        if (window.confirm('Delete this snippet?')) {
            try {
                await axios.delete(`${API_URL}/repurpose/snippet/${snippetId}`);
                setRepurposedSnippets(prev => prev.filter(s => s._id !== snippetId));
            } catch (err) {
                alert('Failed to delete snippet: ' + (err.response?.data?.message || err.message));
            }
        }
    }, []);

    const repurposeOptions = [
        { label: 'Twitter Thread', value: 'twitter_thread' },
        { label: 'LinkedIn Post', value: 'linkedin_post' },
        { label: 'Key Takeaways List', value: 'key_takeaways_list' },
        { label: 'Short Summary', value: 'short_summary' },
    ];

    // if (loading) return <p className="text-center mt-8 text-gray-600">Loading content and snippets...</p>;
      if (loading && !contentPiece) return <p className="text-center mt-8 text-gray-600">Loading content details...</p>;
    if (error && !contentPiece) return <p className="text-center mt-8 text-red-600 bg-red-100 p-4 rounded shadow">{error}</p>;
    if (!contentPiece) return <p className="text-center mt-8 text-gray-700">Content piece not found.</p>;


    return (
        <div className="max-w-4xl mx-auto mt-10 p-6 md:p-8 bg-white shadow-xl rounded-lg"> {/* Enhanced shadow */}
            {error && <p className="mb-4 text-red-600 bg-red-100 p-3 rounded shadow-sm">{error}</p>}
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 pb-4 border-b border-gray-200">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 md:mb-0">{contentPiece.title}</h1>
                
                <div className="flex space-x-2  mt-2 md:mt-0">
                <button
                        onClick={handleToggleEditOriginal}
                        className={`font-semibold py-2 px-3 rounded text-sm shadow hover:shadow-md transition-shadow ${
                            isEditingOriginal ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                        }`}
                    >
                        {isEditingOriginal ? 'Cancel Edit' : 'Edit Original Text'}
                    </button>
                    {isEditingOriginal && (
                        <button
                            onClick={handleSaveOriginalText}
                            disabled={loading || (contentPiece && editableOriginalText === contentPiece.originalText)}
                            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-3 rounded text-sm shadow disabled:opacity-50"
                        >
                            {loading ? "Saving..." : "Save Original"}
                        </button>
                    )}
                <Link
                        to={`/content/${id}/edit`} // Link to the edit page
                        className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-3 rounded text-sm shadow hover:shadow-md transition-shadow"
                    >
                        Edit Original
                    </Link>
                    <button
                        onClick={handleDeleteContent}
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded text-sm shadow hover:shadow-md transition-shadow"
                    >
                        Delete Original Content
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-xs md:text-sm text-gray-600">
                {contentPiece.sourceUrl && (
                    <div><strong>Source:</strong> <a href={contentPiece.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{contentPiece.sourceUrl}</a></div>
                )}
                <div><strong>Type:</strong> <span className="font-medium">{contentPiece.contentType.replace(/_/g, ' ')}</span></div>
                <div><strong>Created:</strong> <span className="font-medium">{new Date(contentPiece.createdAt).toLocaleDateString()}</span></div>
            </div>

             {contentPiece.tags && contentPiece.tags.length > 0 && (
                <div className="mb-6">
                    <strong className="text-sm text-gray-700 mr-2">Tags:</strong>
                    {contentPiece.tags.map(tag => (
                        <span key={tag} className="inline-block bg-gray-200 rounded-full px-3 py-1 text-xs md:text-sm font-semibold text-gray-700 mr-2 mb-2 shadow-sm">
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Original Text Display/Editor */}
            <div className="mb-8">
                <h3 className="font-semibold text-lg text-gray-700 mb-2">Original Text</h3>
                {isEditingOriginal ? (
                    <textarea
                        ref={originalTextareaRef}
                        value={editableOriginalText}
                        onChange={(e) => setEditableOriginalText(e.target.value)}
                        onMouseUp={handleTextSelection} // Or onSelect if preferred
                        onBlur={() => setTimeout(() => setShowAiEnhancePopup(false), 200)} // Hide popup on blur
                        className="w-full p-3 border rounded-md min-h-[200px] md:min-h-[300px] text-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Start writing or paste your content here..."
                    />
                ) : (
                    <pre className="whitespace-pre-wrap break-words font-sans text-sm md:text-base max-h-96 overflow-y-auto p-3 border bg-gray-50 rounded-md">
                        {contentPiece?.originalText || "No original text."}
                    </pre>
                )}
            </div>

            {/* Contextual AI Enhance Popup */}
            {showAiEnhancePopup && selectedText && (
                <div
                    className="absolute z-10 bg-white border shadow-lg rounded-md p-2 space-y-1 text-xs"
                    style={{ top: `${popupPosition.top}px`, left: `${popupPosition.left}px` }}
                >
                    <p className="font-semibold border-b pb-1 mb-1">Enhance "{selectedText.substring(0,20)}..."</p>
                    <button onClick={() => openAiModalForSelection('rewrite-style-tone')} className="block w-full text-left hover:bg-gray-100 p-1 rounded">Rewrite Style/Tone</button>
                    <button onClick={() => openAiModalForSelection('summarize')} className="block w-full text-left hover:bg-gray-100 p-1 rounded">Summarize Selection</button>
                    <button onClick={() => openAiModalForSelection('generate-headlines')} className="block w-full text-left hover:bg-gray-100 p-1 rounded">Suggest Headlines</button>
                    {/* Add more actions */}
                </div>
            )}


            {/* AI Action Modal (Simplified Example) */}
            {showAiActionModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-3">
                            AI Enhance: {aiActionForSelected.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </h3>
                        <p className="text-xs text-gray-600 mb-2">Selected Text: <em className="block bg-gray-100 p-1 rounded max-h-20 overflow-y-auto">"{selectedText}"</em></p>

                        {/* Provider Selection */}
                        <div className="mb-3">
                            <label className="text-xs font-medium">AI Provider:</label>
                            <select value={aiProviderForSelected} onChange={(e) => setAiProviderForSelected(e.target.value)} className="w-full p-1.5 border rounded text-xs mt-1">
                                {authUser?.hasOpenAiApiKey && <option value="openai">OpenAI</option>}
                                {authUser?.hasGeminiApiKey && <option value="gemini">Gemini</option>}
                                {authUser?.hasPerplexityApiKey && <option value="perplexity">Perplexity</option>}
                                {/* Add disabled option if no keys */}
                            </select>
                        </div>

                        {/* TODO: Add action-specific options here (e.g., style dropdown for rewrite-style-tone) */}
                        {aiActionForSelected === 'rewrite-style-tone' && (
                            <div className="mb-3">
                                {/* Add style selection inputs similar to SnippetCard */}
                                <label className="text-xs font-medium">Target Style:</label>
                                <input 
                            type="text" 
                            placeholder="e.g., formal, witty, professional, friendly"
                            value={targetStyleForModal} 
                            onChange={(e) => setTargetStyleForModal(e.target.value)}
                            className="w-full p-1.5 border rounded text-xs mt-1" 
                        />
                            </div>
                        )}


                        <button
                            onClick={() => {
                                // Collect options based on aiActionForSelected
                                let options = {};
                                if (aiActionForSelected === 'rewrite-style-tone') {
                                    options.targetStyleOrTone = targetStyleForModal;
                                } else if (aiActionForSelected === 'generate-headlines') {
                                    options.count = 1; // For selected text, maybe just one headline
                                } else if (aiActionForSelected === 'summarize') {
                                    options.length = 'short';
                                }
                                handleAiModalSubmit(options);
                            }}
                            disabled={aiModalLoading}
                            className="bg-blue-500 text-white py-2 px-4 rounded text-sm w-full mb-2 disabled:opacity-50"
                        >
                            {aiModalLoading ? 'Generating...' : 'Generate with AI'}
                        </button>

                        {aiModalError && <p className="text-xs text-red-500 mb-2">{aiModalError}</p>}

                        {aiSuggestionsForSelected.length > 0 && !aiModalLoading && (
                            <div className="mt-3 border-t pt-2">
                                <p className="text-xs font-medium mb-1">Suggestions (click to apply to selection):</p>
                                <ul className="space-y-1 max-h-40 overflow-y-auto">
                                    {aiSuggestionsForSelected.map((sugg, i) => (
                                        <li key={i} onClick={() => applyAiSuggestionToSelectedText(sugg)}
                                            className="text-xs p-2 bg-gray-100 border rounded hover:bg-blue-100 cursor-pointer">
                                            {sugg}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

<button onClick={() => {
                    setShowAiActionModal(false);
                    setTargetStyleForModal(''); // Reset style when closing
                }} className="text-xs text-gray-600 mt-3 w-full text-center">Close</button>
                    </div>
                </div>
            )}



            <div className="mt-8 p-4 border-t border-gray-200">
                <h2 className="text-xl md:text-2xl font-semibold mb-4 text-gray-800">Repurpose This Content</h2>
                <div className="flex flex-wrap gap-3 mb-8"> {/* Increased gap */}
                    {repurposeOptions.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => handleGenerateSnippets(opt.value)}
                            disabled={generating}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded text-sm disabled:opacity-50 shadow hover:shadow-md transition-shadow"
                        >
                            {generating ? `Generating...` : `Generate ${opt.label}`}
                        </button>
                    ))}
                </div>

                <h3 className="text-lg md:text-xl font-semibold mb-4 text-gray-700">Generated Snippets:</h3>
                {repurposedSnippets.length === 0 && !generating && (
                    <p className="text-gray-600 py-4 text-center bg-gray-50 rounded-md">No snippets generated yet. Choose an option above!</p>
                )}
                {generating && repurposedSnippets.length === 0 && <p className="text-gray-600 animate-pulse">Generating your first snippets...</p>}

                <div className="space-y-6"> {/* Increased space between cards */}
                    {repurposedSnippets.map(snippet => (
                        <SnippetCard
                            key={snippet._id}
                            snippet={snippet}
                            onUpdate={handleUpdateSnippet}
                            onDelete={handleDeleteSnippet}
                            // hasOpenAiApiKey={user?.hasOpenAiApiKey || false} // <<<<<<<<<<<< ADDED: Pass API key status
                        />
                    ))}
                </div>
            </div>

            <Link to="/dashboard" className="mt-10 inline-block text-blue-600 hover:text-blue-800 hover:underline">
                ← Back to Dashboard
            </Link>
        </div>
    );
};

export default ContentDetailPage;
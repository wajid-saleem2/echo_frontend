// frontend/src/pages/ContentDetailPage.js
import React, { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext'; // <<<<<<<<<<<< ADDED: To check for API key status
import { trackSnippetGenerated } from '../services/analytics'; // Import
import ReactMarkdown from 'react-markdown'; // <<<< IMPORT THIS
import remarkGfm from 'remark-gfm';         // <<<< Optional: for GFM support
import axiosInstance from '../api/apiConfig';
import ContentExpansionSidebar from '../components/content/ContentExpansionSidebar';
import { SparklesIcon, ClipboardDocumentIcon, PencilSquareIcon, TrashIcon, ShareIcon } from '@heroicons/react/24/outline'; // Added ShareIcon
import TranslationModal from '../components/modals/TranslationModal'; // << IMPORT
import { DocumentDuplicateIcon } from '@heroicons/react/24/outline'; // For new content piece button
import { SUPPORTED_LANGUAGES } from '../utils/constants';
import { Menu, Transition } from '@headlessui/react'; // << IMPORT Headless UI Menu
import { FolderPlusIcon, FolderArrowDownIcon, NoSymbolIcon, ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline'; // Example icons
import SnippetCard from '../components/SnippetCard';
import Spinner from '../components/layout/Loader';

const API_URL = process.env.REACT_APP_API_URL;

// Helper to format dates (optional)
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric'
    });
};

// // Snippet Component (can be moved to its own file later)
// const SnippetCard = React.memo(({ snippet, onUpdate, onDelete, originalContentId, contentPieceTitle, contentPieceUrl, contentPieceExcerpt }) => { // <<<<<<<<<<<< ADDED: hasOpenAiApiKey prop
//     const [isEditing, setIsEditing] = useState(false);
//     const [editText, setEditText] = useState(snippet.generatedText);
//     const [aiLoading, setAiLoading] = useState(false); // <<<<<<<<<<<< ADDED: AI loading state for this card
//     const [aiError, setAiError] = useState(''); // <<<<<<<<<<<< ADDED: AI error state for this card
//     const [selectedAiProvider, setSelectedAiProvider] = useState('openai'); // Default or from user settings
//     const { user: authUser } = useAuth(); // Get user from AuthContext to check configured keys
//     const [targetStyle, setTargetStyle] = useState('neutral'); // Default or common styles
//     const [customStyle, setCustomStyle] = useState('');
//     const [referenceStyleText, setReferenceStyleText] = useState(''); // For providing style example
//     const [aiSuggestions, setAiSuggestions] = useState([]); // To hold multiple AI suggestions
//     const [isPublishing, setIsPublishing] = useState(false);

//     const [userTemplates, setUserTemplates] = useState([]);
//     const [selectedTemplateId, setSelectedTemplateId] = useState('');

//     // --- NEW: State for Platform Suggestions ---
//     const [platformSuggestions, setPlatformSuggestions] = useState([]);
//     const [platformSuggestLoading, setPlatformSuggestLoading] = useState(false);
//     const [platformSuggestError, setPlatformSuggestError] = useState('');
//     // --- End New State ---

//     const [showSnippetTranslationModal, setShowSnippetTranslationModal] = useState(false);
//     const [showThisSnippetTranslationModal, setShowThisSnippetTranslationModal] = useState(false);

//     const predefinedStyles = ['neutral', 'formal', 'casual', 'witty', 'empathetic', 'persuasive', 'concise', 'detailed'];

//     const handleSnippetTranslationComplete = (translatedText, targetLangCode) => {
//         // Option 1: Update current snippet's editText
//         // setEditText(translatedText);
//         // setIsEditing(true); // Allow user to save this translated version

//         // Option 2: Create a NEW snippet with the translation
//         if (window.confirm(`Create a new snippet with this ${SUPPORTED_LANGUAGES.find(l=>l.code === targetLangCode)?.name || targetLangCode} translation?`)) {
//             const newSnippetPayload = {
//                 platform: `${snippet.platform}_translated_${targetLangCode}`, // Indicate it's translated
//                 generatedText: translatedText,
//                 // originalContent, user will be added by backend /repurpose/:contentId/generate
//                 // Or, if you have a direct /repurpose/snippet POST endpoint:
//                 // originalContent: originalContentId,
//                 // user: authUser._id, // This might not be available directly, backend should use req.user
//             };
//             // This requires a backend endpoint to create a single snippet,
//             // or adapting the /repurpose/:contentId/generate to accept a single pre-made snippet.
//             // For now, let's just update the current snippet's text for simplicity.
//             setEditText(translatedText);
//             setIsEditing(true); // Enter edit mode to save the translation
//             alert(`Snippet translated to ${SUPPORTED_LANGUAGES.find(l=>l.code === targetLangCode)?.name || targetLangCode}. Save the snippet to keep changes.`);
//         }
//     };


//     // Effect to set a default AI provider if keys are available
//     useEffect(() => {
//         if (authUser?.hasOpenAiApiKey) {
//             setSelectedAiProvider('openai');
//         } else if (authUser?.hasGeminiApiKey) {
//             setSelectedAiProvider('gemini');
//         } else if (authUser?.hasPerplexityApiKey) {
//             setSelectedAiProvider('perplexity');
//         } else {
//             setSelectedAiProvider(''); // No keys configured
//         }
//     }, [authUser]);

//     // Reset editText if snippet prop changes (e.g., after AI update from parent)
//     useEffect(() => {
//         setEditText(snippet.generatedText);
//     }, [snippet.generatedText]);

    


//     const handleSave = async () => {
//         onUpdate(snippet._id, { generatedText: editText });
//         setIsEditing(false);
//     };

//     const copyToClipboard = () => {
//         navigator.clipboard.writeText(editText) // Use editText to copy current view
//             .then(() => alert('Copied to clipboard!'))
//             .catch(err => console.error('Failed to copy: ', err));
//     };

//     // <<<<<<<<<<<< ADDED: AI Enhancement Handler >>>>>>>>>>>>>>>
//     const handleAiEnhance = async (actionType, customInstruction = null) => {
//         setAiLoading(true);
//         setAiError('');
        

//         if (!selectedAiProvider) {
//             setAiError('Please select an AI provider or configure an API key in your profile.');
//             setAiLoading(false);
//             return;
//         }

//         // Dynamic check based on selectedAiProvider
//         let keyIsConfigured = false;
//         if (selectedAiProvider === 'openai' && authUser?.hasOpenAiApiKey) keyIsConfigured = true;
//         else if (selectedAiProvider === 'gemini' && authUser?.hasGeminiApiKey) keyIsConfigured = true;
//         else if (selectedAiProvider === 'perplexity' && authUser?.hasPerplexityApiKey) keyIsConfigured = true;

//         if (!keyIsConfigured) {
//             setAiError(`Your ${selectedAiProvider.charAt(0).toUpperCase() + selectedAiProvider.slice(1)} API key is not configured. Please add it in your profile.`);
//             setAiLoading(false);
//             return;
//         }

//         const endpoint = `${API_URL}/ai/enhance-text`; // Using the generic endpoint
//         const payload = {
//             text: editText, // Use current editText for enhancement
//             aiProvider: selectedAiProvider,
//             action: '',
//             options: {}
//         };

//         switch (actionType) {
//             case 'generate-headlines': // Changed from 'headlines' to be more generic for a snippet
//                 payload.action = 'generate-headlines'; // Backend action might still be 'generate-headlines'
//                 payload.options.count = 1; // Suggest one rewrite
//                 break;
//             case 'summarize': // Changed from 'summarize_short'
//                 payload.action = 'summarize';
//                 payload.options.length = 'short'; // Or make this configurable
//                 break;
//             case 'hashtags':
//                 payload.action = 'hashtags'; // Assuming you'll implement this in aiService
//                 payload.options.count = 5;
//                 break;
//             case 'rephrase': // <<<< This is our new generic rephrase
//                 payload.action = 'rephrase';
//                 if (customInstruction) { // Allow passing a custom instruction for rephrasing
//                     payload.options.instruction = customInstruction;
//                 }
//                 // The backend rephraseText function will use a default instruction if none is provided
//                 break;
//             // Keep 'generate-headlines' if you have a separate button for it,
//             // or remove if 'rephrase' covers the general need for snippets.
//             // case 'generate-headlines':
//             //     payload.action = 'generate-headlines';
//             //     payload.options.count = 1;
//             //     break;
//             default:
//                 setAiError('Unknown AI action.');
//                 setAiLoading(false);
//                 return;
//         }

//         try {
//             const response = await axios.post(endpoint, payload);
//             let newText = editText; // Fallback

//             if (response.data) {
//                 if (actionType === 'generate-headlines' && Array.isArray(response.data) && response.data.length > 0) {
//                     newText = response.data[0];
//                 } else if (actionType === 'summarize' && response.data.summary) {
//                     newText = response.data.summary;
//                 } else if (actionType === 'hashtags' && Array.isArray(response.data) && response.data.length > 0) {
//                     // Append hashtags or replace, depending on desired UX
//                     newText = `${editText}\n\nSuggested Hashtags: ${response.data.map(h => `#${h.trim()}`).join(' ')}`;
//                 } else if (actionType === 'rephrase' && response.data.rephrasedText) {
//                     newText = response.data.rephrasedText;

//                 } else if (typeof response.data === 'string') { // Generic string response
//                     newText = response.data;
//                 }
//             }

//             setEditText(newText); // Update the editable text
//             // alert('AI suggestion applied. Review and save.'); // Or use a toast
//         } catch (err) {
//             const errorMsg = err.response?.data?.message || err.message || 'AI enhancement failed.';
//             setAiError(errorMsg);
//             console.error("AI Enhancement Error:", err);
//         } finally {
//             setAiLoading(false);
//         }
//     };

//     const handleAiRewriteStyle = async () => {
//         setAiLoading(true);
//         // ... (check for API key for selectedAiProvider - as in handleAiEnhance)
//         if (!selectedAiProvider) {
//             setAiError('Please select an AI provider or configure an API key in your profile.');
//             setAiLoading(false);
//             return;
//         }
//         setAiSuggestions([]); // Clear previous suggestions

//         // Dynamic check based on selectedAiProvider
//         let keyIsConfigured = false;
//         if (selectedAiProvider === 'openai' && authUser?.hasOpenAiApiKey) keyIsConfigured = true;
//         else if (selectedAiProvider === 'gemini' && authUser?.hasGeminiApiKey) keyIsConfigured = true;
//         else if (selectedAiProvider === 'perplexity' && authUser?.hasPerplexityApiKey) keyIsConfigured = true;

//         if (!keyIsConfigured) {
//             setAiError(`Your ${selectedAiProvider.charAt(0).toUpperCase() + selectedAiProvider.slice(1)} API key is not configured. Please add it in your profile.`);
//             setAiLoading(false);
//             return;
//         }

//         const currentTextToRewrite = editText || snippet.generatedText;
//         const styleToApply = targetStyle === 'custom' ? customStyle : targetStyle;

//         if (!styleToApply) {
//             alert("Please select or enter a target style/tone.");
//             setAiLoading(false);
//             return;
//         }

//         const payload = {
//             text: currentTextToRewrite,
//             aiProvider: selectedAiProvider,
//             action: 'rewrite-style-tone',
//             options: {
//                 targetStyleOrTone: styleToApply,
//                 referenceStyleText: referenceStyleText || null
//             }
//         };

//         try {
//             const response = await axios.post(`${API_URL}/ai/enhance-text`, payload);
//            // Assuming backend returns an object like { rewrittenText: "single" } or { rewrittenTexts: ["option1", "option2"] }
//             // Or for headlines, it might directly return an array.
//             if (response.data.rewrittenText) { // Single suggestion
//                 setEditText(response.data.rewrittenText);
//                 alert('AI rewrite applied. Review and save.');
//             } else if (Array.isArray(response.data) && response.data.length > 0) { // Multiple headline suggestions
//                 setAiSuggestions(response.data);
//             } else if (response.data.rewrittenTexts && Array.isArray(response.data.rewrittenTexts) && response.data.rewrittenTexts.length > 0) { // Multiple style suggestions
//                 setAiSuggestions(response.data.rewrittenTexts);
//             } else if (response.data.error) {
//                 setAiError('AI Rewrite Failed: ' + response.data.error);
//             } else {
//                 setAiError('AI Rewrite did not return expected text.');
//             }
//         } catch (err) {
//             alert('AI Rewrite Failed: ' + (err.response?.data?.message || err.message));
//         } finally {
//             setAiLoading(false);
//         }
//     };

//      // New handler to apply a selected suggestion
//      const applyAiSuggestion = (suggestionText) => {
//         setEditText(suggestionText);
//         setAiSuggestions([]); // Clear suggestions after applying one
//     };

//     const handlePublishTweet = async () => {
//         setIsPublishing(true);
//         setAiError(''); // Use the existing error state for feedback
//         try {
//             await axios.post(`${API_URL}/connect/twitter/tweet`, { text: editText });
//             alert("Successfully published to Twitter!"); // Use Toast
//             // Optionally update the snippet status in the DB via onUpdate
//             // onUpdate(snippet._id, { status: 'published_twitter' });
//         } catch (err) {
//             setAiError(err.response?.data?.message || "Failed to publish to Twitter.");
//         } finally {
//             setIsPublishing(false);
//         }
//    };

//     // Fetch user templates when component mounts or authUser changes
//     useEffect(() => {
//         const fetchTemplatesForSnippet = async () => {
//             if (!authUser) return;
//             try {
//                 const response = await axiosInstance.get('/templates');
//                 setUserTemplates(response.data || []);
//             } catch (err) { console.error("Failed to fetch templates for snippet card", err); }
//         };
//         fetchTemplatesForSnippet();
//     }, [authUser]);

//     const applySnippetTemplate = () => {
//         if (!selectedTemplateId) {
//             alert("Please select a template.");
//             return;
//         }
//         const template = userTemplates.find(t => t._id === selectedTemplateId);
//         if (!template) {
//             alert("Selected template not found.");
//             return;
//         }

//         // Placeholder data - In a real scenario, you'd extract these from originalContent
//         // or have a more robust way to get "key takeaways"
//         const placeholderData = {
//             title: contentPieceTitle || "Your Title", // Pass from ContentDetailPage
//             original_url: contentPieceUrl || "https://example.com", // Pass from ContentDetailPage
//             key_takeaway_1: "First key point...",
//             key_takeaway_2: "Second key point...",
//             key_takeaway_3: "Third key point...",
//             key_takeaway_4: "Fourth key point...",
//             key_takeaway_5: "Fifth key point...",
//             excerpt: contentPieceExcerpt || "A short excerpt of the content..." // Pass from ContentDetailPage
//             // Add more placeholders as needed
//         };

//         let populatedContent = template.content;
//         for (const key in placeholderData) {
//             populatedContent = populatedContent.replace(new RegExp(`{{${key}}}`, 'g'), placeholderData[key]);
//         }
//         // Replace any unfulfilled placeholders (optional)
//         populatedContent = populatedContent.replace(/{{[^}]+}}/g, '[...]');


//         setEditText(populatedContent); // Update the snippet's text area
//         setIsEditing(true); // Switch to edit mode so user can save
//         alert("Template applied! Review and save the snippet.");
//     };
   
//     // --- NEW: Handler for Platform Suggestions ---
//     const handleSuggestPlatforms = async () => {
//         if (!editText.trim()) {
//             setPlatformSuggestError("Snippet text is empty.");
//             return;
//         }
//         if (!selectedAiProvider) { // Use the same provider as other AI actions on the card
//             setPlatformSuggestError("Please select an AI provider or configure an API key.");
//             return;
//         }
//         setPlatformSuggestLoading(true);
//         setPlatformSuggestError('');
//         setPlatformSuggestions([]);

//         try {
//             const response = await axiosInstance.post(`/ai/suggest-platforms`, {
//                 text: editText,
//                 aiProvider: selectedAiProvider,
//                 count: 2 // Ask for top 2 suggestions
//             });
//             if (response.data && response.data.suggestions) {
//                 setPlatformSuggestions(response.data.suggestions);
//             } else if (response.data.error) {
//                 setPlatformSuggestError(response.data.error);
//             } else {
//                 setPlatformSuggestError("AI did not return platform suggestions as expected.");
//             }
//         } catch (err) {
//             setPlatformSuggestError(err.response?.data?.message || "Failed to get platform suggestions.");
//         } finally {
//             setPlatformSuggestLoading(false);
//         }
//     };
//     // --- End New Handler ---

//     // Determine if any AI key is configured to show the AI section
//     const anyAiKeyConfigured = authUser?.hasOpenAiApiKey || authUser?.hasGeminiApiKey || authUser?.hasPerplexityApiKey;

//     console.log(`Rendering SnippetCard: ${snippet._id.slice(-5)} - ${snippet.platform}`); // For debugging re-renders
//     // <<<<<<<<<<<< END ADDED: AI Enhancement Handler >>>>>>>>>>>>>>>

//     return (
//         <div className="bg-gray-50 p-4 rounded-md border mb-4 shadow">
//             {aiError && <p className="text-xs text-red-600 bg-red-100 p-2 mb-2 rounded">{aiError}</p>}
//             {isEditing ? (
//                 <textarea
//                     value={editText}
//                     onChange={(e) => setEditText(e.target.value)}
//                     className="w-full p-2 border rounded min-h-[120px] font-mono text-sm focus:ring-blue-500 focus:border-blue-500"
//                 />
//             ) : (
//                 <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed min-h-[60px]">
//                     {editText} {/* Display editText here so AI changes are visible before save */}
//                 </pre>
//             )}
//             <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
//                 <span>Platform: <span className="font-medium">{snippet.platform.replace(/_/g, ' ')}</span></span>
//                 <span>Status: <span className="font-medium">{snippet.status}</span></span>
//             </div>
//             <div className="mt-3 flex flex-wrap gap-2 items-center"> {/* Main actions row */}
//                 {isEditing ? (
//                     <>
//                         <button onClick={handleSave} className="text-xs bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded shadow-sm">Save</button>
//                         <button onClick={() => { setIsEditing(false); setEditText(snippet.generatedText); setAiError(''); }} className="text-xs bg-gray-300 hover:bg-gray-400 text-black py-1 px-3 rounded shadow-sm">Cancel</button>
//                     </>
//                 ) : (
//                     <button onClick={() => setIsEditing(true)} className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded shadow-sm">Edit</button>
//                 )}
//                 <button onClick={copyToClipboard} className="text-xs bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded shadow-sm">Copy</button>
//                 <button onClick={() => onDelete(snippet._id)} className="text-xs bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded shadow-sm">Delete</button>
//                  {/* Add Publish Button if connected and not editing */}
//                  {!isEditing && authUser?.hasTwitterOAuth && (
//                     <button
//                         onClick={handlePublishTweet}
//                         disabled={isPublishing}
//                         className="text-xs bg-sky-500 hover:bg-sky-600 text-white py-1 px-3 rounded shadow-sm disabled:opacity-50"
//                         title="Post this snippet to Twitter"
//                         >
//                         {isPublishing ? 'Publishing...' : 'Publish to Twitter'}
//                     </button>
//                 )}
//             </div>

//              {/* Apply Template Section (shown when not editing snippet text directly) */}
//              {!isEditing && userTemplates.length > 0 && (
//                 <div className="mt-3 pt-3 border-t border-gray-200">
//                     <label htmlFor={`template-select-${snippet._id}`} className="block text-xs font-medium text-gray-700 mb-1">Apply Template:</label>
//                     <div className="flex items-center gap-2">
//                         <select
//                             id={`template-select-${snippet._id}`}
//                             value={selectedTemplateId}
//                             onChange={(e) => setSelectedTemplateId(e.target.value)}
//                             className="flex-grow p-1.5 border rounded-md text-xs bg-white"
//                         >
//                             <option value="">-- Select a Template --</option>
//                             {userTemplates.map(t => (
//                                 <option key={t._id} value={t._id}>{t.name} ({t.platformHint})</option>
//                             ))}
//                         </select>
//                         <button
//                             onClick={applySnippetTemplate}
//                             disabled={!selectedTemplateId}
//                             className="bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold py-1.5 px-3 rounded-md disabled:opacity-50"
//                         >
//                             Apply
//                         </button>
//                     </div>
//                 </div>
//             )}

//             {/* --- AI Enhancement Section --- */}
//             {!isEditing && anyAiKeyConfigured && (
//                 <div className="mt-3 pt-3 border-t border-gray-200">
//                     <div className="flex flex-col sm:flex-row sm:items-center mb-2 space-y-2 sm:space-y-0 sm:space-x-2">
//                         <span className="text-xs font-semibold text-gray-700">Enhance with AI:</span>
//                         <select
//                             value={selectedAiProvider}
//                             onChange={(e) => { setSelectedAiProvider(e.target.value); setAiError(''); }}
//                             className="text-xs p-1 border rounded bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500"
//                             disabled={aiLoading}
//                         >
//                             {/* Dynamically add options based on configured keys */}
//                             {authUser?.hasOpenAiApiKey && <option value="openai">OpenAI</option>}
//                             {authUser?.hasGeminiApiKey && <option value="gemini">Gemini</option>}
//                             {authUser?.hasPerplexityApiKey && <option value="perplexity">Perplexity</option>}
//                         </select>
//                     </div>
//                     <div className="flex flex-wrap gap-2 items-center">
//                         <button onClick={() => handleAiEnhance('generate-headlines')} disabled={aiLoading || !selectedAiProvider} className="text-xs bg-purple-500 hover:bg-purple-600 text-white py-1 px-2 rounded disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
//                             {aiLoading && selectedAiProvider ? '...' : 'AI Headlines'}
//                         </button>
//                         <button onClick={() => handleAiEnhance('rephrase')} disabled={aiLoading || !selectedAiProvider} className="text-xs bg-purple-500 hover:bg-purple-600 text-white py-1 px-2 rounded disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
//                             {aiLoading && selectedAiProvider ? '...' : 'AI Rephrase'}
//                         </button>
//                         <button onClick={() => handleAiEnhance('summarize')} disabled={aiLoading || !selectedAiProvider} className="text-xs bg-teal-500 hover:bg-teal-600 text-white py-1 px-2 rounded disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
//                             {aiLoading && selectedAiProvider ? '...' : 'AI Summarize'}
//                         </button>
//                         <button onClick={() => handleAiEnhance('hashtags')} disabled={aiLoading || !selectedAiProvider} className="text-xs bg-pink-500 hover:bg-pink-600 text-white py-1 px-2 rounded disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
//                             {aiLoading && selectedAiProvider ? '...' : 'Hashtags'}
//                         </button>
//                     </div>
//                     <div className="mt-3 pt-3 border-t dark:border-slate-600">
//                         <button
//                             onClick={() => {
//                                 if (!editText.trim()) {
//                                     alert("Snippet text is empty, cannot translate.");
//                                     return;
//                                 }
//                                 setShowThisSnippetTranslationModal(true); // Open THIS snippet's modal
//                             }}
//                             disabled={aiLoading || !selectedAiProvider || !editText.trim()}
//                             className="w-full flex items-center justify-center text-xs bg-green-500 hover:bg-green-600 text-white font-semibold py-1.5 px-3 rounded-md disabled:opacity-50"
//                         >
//                             {/* Replace DocumentDuplicateIcon if you have a better translate icon */}
//                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1.5">
//                                 <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3.75h.008v.008H12v-.008zM3 7.207V6A2.25 2.25 0 015.25 3.75h13.5A2.25 2.25 0 0121 6v1.207m-18 0c0 .346.028.69.083 1.023A3.75 3.75 0 004.5 12H6c.832 0 1.612.246 2.276.672L12 15l3.724-2.328A3.75 3.75 0 0018 12h1.5a3.75 3.75 0 003.417-3.773c.055-.333.083-.677.083-1.023m-18 0c0-1.24.738-2.326 1.835-2.843A6.75 6.75 0 0112 3c2.063 0 3.937.84 5.165 2.157A3.752 3.752 0 0121 7.207" />
//                             </svg>
//                             Translate Snippet
//                         </button>
//                     </div>
//                 </div>
//             )}
//             {!isEditing && !anyAiKeyConfigured && (
//                  <p className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
//                     AI features available. <Link to="/profile" className="text-blue-500 hover:underline">Configure an API key</Link> to enable.
//                 </p>
//             )}
//             {/* --- End AI Enhancement Section --- */}

            
//              {/* Style/Tone Rewriting UI */}
//              <div className="my-3 p-3 border rounded-md bg-gray-100">
//                     <p className="text-xs font-medium mb-1">Rewrite with Style/Tone:</p>
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
//                         <div>
//                             <label htmlFor={`style-select-${snippet._id}`} className="text-xs text-gray-600 block">Select Style:</label>
//                             <select
//                                 id={`style-select-${snippet._id}`}
//                                 value={targetStyle}
//                                 onChange={(e) => setTargetStyle(e.target.value)}
//                                 className="text-xs p-1 border rounded w-full bg-white"
//                                 disabled={aiLoading || isEditing}
//                             >
//                                 {predefinedStyles.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
//                                 <option value="custom">Custom...</option>
//                             </select>
//                         </div>
//                         {targetStyle === 'custom' && (
//                             <div>
//                                 <label htmlFor={`custom-style-${snippet._id}`} className="text-xs text-gray-600 block">Custom Style:</label>
//                                 <input
//                                     type="text"
//                                     id={`custom-style-${snippet._id}`}
//                                     placeholder="e.g., like a pirate"
//                                     value={customStyle}
//                                     onChange={(e) => setCustomStyle(e.target.value)}
//                                     className="text-xs p-1 border rounded w-full bg-white"
//                                     disabled={aiLoading || isEditing}
//                                 />
//                             </div>
//                         )}
//                     </div>
//                     <div>
//                         <label htmlFor={`ref-style-${snippet._id}`} className="text-xs text-gray-600 block">Reference Style Text (Optional):</label>
//                         <textarea
//                             id={`ref-style-${snippet._id}`}
//                             placeholder="Paste text here to mimic its style..."
//                             value={referenceStyleText}
//                             onChange={(e) => setReferenceStyleText(e.target.value)}
//                             className="text-xs p-1 border rounded w-full bg-white h-16"
//                             disabled={aiLoading || isEditing}
//                         />
//                     </div>
//                     <button
//                         onClick={handleAiRewriteStyle}
//                         disabled={aiLoading || isEditing || (!customStyle && targetStyle === 'custom')}
//                         className="mt-2 text-xs bg-purple-500 hover:bg-purple-600 text-white py-1 px-2 rounded disabled:opacity-50"
//                     >
//                         {aiLoading ? 'Rewriting...' : 'Apply Style/Tone'}
//                     </button>

//                     {/* Display AI Suggestions if any */}
//                     {aiSuggestions.length > 0 && !aiLoading && (
//                             <div className="mt-3 pt-2 border-t">
//                                 <p className="text-xs font-medium mb-1">AI Suggestions (click to apply):</p>
//                                 <ul className="space-y-1">
//                                     {aiSuggestions.map((suggestion, index) => (
//                                         <li key={index}
//                                             onClick={() => applyAiSuggestion(suggestion)}
//                                             className="text-xs p-2 bg-white border rounded hover:bg-blue-50 cursor-pointer"
//                                         >
//                                             {suggestion.length > 100 ? suggestion.substring(0, 97) + "..." : suggestion}
//                                         </li>
//                                     ))}
//                                 </ul>
//                             </div>
//                         )}

//                          {/* --- NEW: Platform Suggestion UI --- */}
//                     <div className="mt-3 pt-3 border-t dark:border-slate-600">
//                         <button
//                             onClick={handleSuggestPlatforms}
//                             disabled={platformSuggestLoading || !selectedAiProvider || !editText.trim()}
//                             className="w-full flex items-center justify-center text-xs bg-sky-500 hover:bg-sky-600 text-white font-semibold py-1.5 px-3 rounded-md disabled:opacity-50"
//                         >
//                             <ShareIcon className="h-4 w-4 mr-1.5" />
//                             {platformSuggestLoading ? 'Suggesting Platforms...' : 'AI Suggest Best Platforms'}
//                         </button>
//                         {platformSuggestError && <p className="text-xs text-red-500 dark:text-red-400 mt-1.5">{platformSuggestError}</p>}
//                         {platformSuggestions.length > 0 && !platformSuggestLoading && (
//                             <div className="mt-2 space-y-1.5">
//                                 <p className="text-xs font-medium text-gray-700 dark:text-slate-300">Platform Suggestions:</p>
//                                 {platformSuggestions.map((sugg, index) => (
//                                     <div key={index} className="p-2 bg-slate-200 dark:bg-slate-700 rounded text-xs">
//                                         <strong className="text-slate-800 dark:text-slate-100">{sugg.platform}:</strong>
//                                         <span className="ml-1 text-slate-600 dark:text-slate-300">{sugg.reason}</span>
//                                     </div>
//                                 ))}
//                             </div>
//                         )}
//                     </div>
//                     {/* --- End Platform Suggestion UI --- */}

//                      {/* Translation Modal specific to THIS SnippetCard instance */}
//             {showThisSnippetTranslationModal && (
//                 <TranslationModal
//                     isOpen={showThisSnippetTranslationModal}
//                     onClose={() => setShowThisSnippetTranslationModal(false)}
//                     textToTranslate={editText} // Pass this snippet's current editText
//                     onTranslationComplete={handleSnippetTranslationComplete}
//                     // originalLanguage could be a prop or detected
//                 />
//             )}
//                 </div>
//         </div>
//     );
// });


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

    const [repurposeAiProvider, setRepurposeAiProvider] = useState(''); // For the main repurpose buttons

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
    const [aiProviderForSelected, setAiProviderForSelected] = useState('');
    // ... (other AI options state: targetStyle, customStyle, etc.)
    const [targetStyleForModal, setTargetStyleForModal] = useState(''); // NEW STATE for style/tone input
    const [summarizeTypeForModal, setSummarizeTypeForModal] = useState('short');
    const [aiSuggestionsForSelected, setAiSuggestionsForSelected] = useState([]);
    const [aiModalLoading, setAiModalLoading] = useState(false);
    const [aiModalError, setAiModalError] = useState('');

    const anyAiKeyConfiguredForUser = authUser?.hasOpenAiApiKey || authUser?.hasGeminiApiKey || authUser?.hasPerplexityApiKey;

    const [showUploadModal, setShowUploadModal] = useState(false);
    const [fileToUpload, setFileToUpload] = useState(null);
    const [uploadingMedia, setUploadingMedia] = useState(false);
    const [uploadedMediaUrl, setUploadedMediaUrl] = useState('');
    const [uploadError, setUploadError] = useState('');
    // const originalTextareaRef = useRef(null); // You already have this

    // Add to the existing state declarations
const [personas, setPersonas] = useState([]);
const [selectedPersonaId, setSelectedPersonaId] = useState(null);

const [showTranslationModal, setShowTranslationModal] = useState(false);
    const [textForTranslation, setTextForTranslation] = useState('');

    // --- State for Folder Management ---
    const [userFolders, setUserFolders] = useState([]);
    const [isFetchingFolders, setIsFetchingFolders] = useState(false);
    const [showNewFolderModal, setShowNewFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [newFolderLoading, setNewFolderLoading] = useState(false);
    const [newFolderError, setNewFolderError] = useState('');
    // --- End Folder Management State ---

   
  

    const openTranslateOriginalModal = () => {
        if (contentPiece?.originalText) {
            setTextForTranslation(contentPiece.originalText);
            setShowTranslationModal(true);
        } else {
            alert("No original text available to translate.");
        }
    };

    const handleOriginalTranslationComplete = async (translatedText, targetLangCode) => {
        // Option 1: Create a NEW ContentPiece with the translated text
        if (window.confirm(`Create a new content piece with this ${SUPPORTED_LANGUAGES.find(l=>l.code === targetLangCode)?.name || targetLangCode} translation?`)) {
            try {
                setLoading(true); // Use main page loading
                const newTitle = `${contentPiece.title} (${SUPPORTED_LANGUAGES.find(l=>l.code === targetLangCode)?.name || targetLangCode} Translation)`;
                const payload = {
                    title: newTitle,
                    originalText: translatedText,
                    sourceUrl: contentPiece.sourceUrl, // Carry over source if exists
                    contentType: contentPiece.contentType,
                    tags: [...(contentPiece.tags || []), `translated-${targetLangCode}`], // Add a tag
                    // folderId: contentPiece.folder // Optionally carry over folder
                };
                const response = await axiosInstance.post(`/content`, payload);
                alert("New translated content piece created!");
                navigate(`/content/${response.data._id}`); // Navigate to the new piece
            } catch (err) {
                setError(err.response?.data?.message || "Failed to create translated content piece.");
            } finally {
                setLoading(false);
            }
        }
        // Option 2: Replace current originalText (more destructive, use with caution)
        // setEditableOriginalText(translatedText);
        // setIsEditingOriginal(true); // Enter edit mode to save
    };



// Add this useEffect hook
useEffect(() => {
    const fetchPersonas = async () => {
        try {
            const response = await axiosInstance.get('/personas');
            setPersonas(response.data);
        } catch (err) {
            console.error('Error fetching personas:', err);
        }
    };
    fetchPersonas();
}, []);

    const handleFileSelect = (event) => {
        if (event.target.files && event.target.files[0]) {
            setFileToUpload(event.target.files[0]);
            setUploadedMediaUrl(''); // Clear previous URL
            setUploadError('');
        }
    };

    const handleMediaUpload = async () => {
        if (!fileToUpload) {
            setUploadError("Please select a file to upload.");
            return;
        }
        setUploadingMedia(true);
        setUploadError('');
        setUploadedMediaUrl('');

        const formData = new FormData();
        formData.append('mediaFile', fileToUpload); // 'mediaFile' matches multer field name

        try {
            const response = await axiosInstance.post('/utils/upload-media', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setUploadedMediaUrl(response.data.fileUrl);
            // alert("File uploaded! Copy the Markdown to insert."); // Use toast
        } catch (err) {
            setUploadError(err.response?.data?.message || "File upload failed.");
        } finally {
            setUploadingMedia(false);
        }
    };

    const copyMarkdownToClipboard = (isImage = true) => {
        if (!uploadedMediaUrl) return;
        const altText = fileToUpload?.name.split('.')[0] || (isImage ? "image" : "media");
        const markdown = isImage ? `\n![${altText}](${uploadedMediaUrl})\n` : `\n[${altText} Video](${uploadedMediaUrl})\n`; // Simple video link
        navigator.clipboard.writeText(markdown)
            .then(() => alert("Markdown copied! Paste it into your text."))
            .catch(err => console.error("Failed to copy markdown", err));
        setShowUploadModal(false); // Close modal after copying
    };

    // Function to insert markdown at cursor (from previous image suggestion feature)
    const insertMarkdownIntoText = (markdown) => {
         if (originalTextareaRef.current) {
             const textarea = originalTextareaRef.current;
             const start = textarea.selectionStart;
             const end = textarea.selectionEnd;
             const newText = editableOriginalText.substring(0, start) + markdown + editableOriginalText.substring(end);
             setEditableOriginalText(newText);
             setTimeout(() => {
                 textarea.focus();
                 textarea.setSelectionRange(start + markdown.length, start + markdown.length);
             }, 0);
         } else { // Fallback if ref not available or not in edit mode
             setEditableOriginalText(prev => prev + markdown);
         }
         setShowUploadModal(false);
    }

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

      // Fetch user folders for the dropdown
      useEffect(() => {
        const fetchFoldersForPage = async () => {
            if (!authUser) return;
            setIsFetchingFolders(true);
            try {
                const response = await axiosInstance.get('/folders');
                setUserFolders(response.data || []);
            } catch (err) {
                console.error("Failed to fetch folders for detail page", err);
                // setError("Could not load folders."); // Or a more specific error state
            } finally {
                setIsFetchingFolders(false);
            }
        };
        fetchFoldersForPage();
    }, [authUser]);

     // --- Folder Action Handlers ---
     const handleAssignToFolder = async (folderIdToAssign) => {
        if (!contentPiece) return;
        setLoading(true); // Use a specific loading state if needed
        try {
            const response = await axiosInstance.put(`/content/${contentPiece._id}`, {
                folderId: folderIdToAssign // Send null to unassign
            });
            setContentPiece(response.data); // Update contentPiece with new folder info
            alert(`Content ${folderIdToAssign ? 'moved to folder' : 'removed from folder'}.`); // Use toast
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update folder assignment.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateFolderAndAssign = async () => {
        if (!newFolderName.trim()) {
            setNewFolderError("Folder name cannot be empty.");
            return;
        }
        setNewFolderLoading(true);
        setNewFolderError('');
        try {
            // 1. Create the new folder
            const folderResponse = await axiosInstance.post('/folders', { name: newFolderName });
            const newFolder = folderResponse.data;
            setUserFolders(prev => [...prev, newFolder].sort((a,b) => a.name.localeCompare(b.name))); // Add to local list

            // 2. Assign current content piece to this new folder
            await handleAssignToFolder(newFolder._id);

            setShowNewFolderModal(false);
            setNewFolderName('');
        } catch (err) {
            setNewFolderError(err.response?.data?.message || "Failed to create or assign to new folder.");
        } finally {
            setNewFolderLoading(false);
        }
    };
    // --- End Folder Action Handlers ---


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
            setContentPiece(prev => ({ ...prev, originalText: editableOriginalText, updatedAt: new Date().toISOString() }));
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

    // // Handler for AI modal submission (will call backend)
    // const handleAiModalSubmit = async (modalOptions) => {
    //     setAiModalLoading(true);
    //     setAiModalError('');
    //     setAiSuggestionsForSelected([]);

    //     // ... (API key checks for aiProviderForSelected from authUser) ...
    //     let keyIsConfigured = false;
    //     if (aiProviderForSelected === 'openai' && authUser?.hasOpenAiApiKey) keyIsConfigured = true;
    //     else if (aiProviderForSelected === 'gemini' && authUser?.hasGeminiApiKey) keyIsConfigured = true;
    //     else if (aiProviderForSelected === 'perplexity' && authUser?.hasPerplexityApiKey) keyIsConfigured = true;

    //     if (!keyIsConfigured) {
    //         setAiModalError(`Your ${aiProviderForSelected.charAt(0).toUpperCase() + aiProviderForSelected.slice(1)} API key is not configured.`);
    //         setAiModalLoading(false);
    //         return;
    //     }

    //     // Calculate how much text is selected
    // const selectionLengthInChars = selectedText.length;
    // const selectionLengthInWords = selectedText.trim().split(/\s+/).length;
    // const isLongSelection = selectionLengthInWords > 300; // ~1500+ characters
    
    // // Add feedback about length to the UI if selection is very long
    // if (isLongSelection) {
    //     setAiModalError(`Processing ${selectionLengthInWords} words. This may take a moment and results will be optimized for longer text.`);
        
    //     // Give UI time to update before heavy API call
    //     await new Promise(resolve => setTimeout(resolve, 100));
    // }

    // // Add adaptive parameters based on text length
    // const adaptedModalOptions = {...modalOptions};

    // // Add specific optimizations based on action type
    // if (aiActionForSelected === 'rewrite-style-tone') {
    //     // Adjust variation count based on text length
    //     if (selectionLengthInWords > 500) {
    //         adaptedModalOptions.variationCount = 1;
    //     } else if (selectionLengthInWords > 200) {
    //         adaptedModalOptions.variationCount = 2;
    //     } else {
    //         adaptedModalOptions.variationCount = 3;
    //     }
    // } else if (aiActionForSelected === 'summarize') {
    //     // Adjust summary length based on text length
    //     if (selectionLengthInWords > 500) {
    //         adaptedModalOptions.length = 'medium';
    //     }
    // } else if (aiActionForSelected === 'generate-headlines') {
    //     // Adjust headline count based on text length
    //     if (selectionLengthInWords > 300) {
    //         adaptedModalOptions.count = 3;
    //     } else {
    //         adaptedModalOptions.count = 5;
    //     }
    // }

    //     const payload = {
    //         text: selectedText,
    //         aiProvider: aiProviderForSelected,
    //         action: aiActionForSelected,
    //         options: modalOptions // e.g., { targetStyleOrTone: 'witty', referenceStyleText: '...' }
    //     };
    //     console.log("Frontend Payload to /ai/enhance-text:", JSON.stringify(payload, null, 2)); // Log this

    //     try {
    //         const response = await axios.post(`${API_URL}/ai/enhance-text`, payload);

    //         // Clear the temporary error message about long text
    //     if (isLongSelection) {
    //         setAiModalError('');
    //     }
        
    //         if (response.data.error) {
    //             setAiModalError(response.data.error);
    //         } else {
    //              // Handle different response types
    //         if (response.data.rewrittenText) {
    //             // Special handling for "---VARIATION---" separator in rewritten text
    //             if (response.data.rewrittenText.includes('---VARIATION---')) {
    //                 // Split by variation separator and clean up
    //                 const variations = response.data.rewrittenText
    //                     .split('---VARIATION---')
    //                     .map(text => text.trim())
    //                     .filter(text => text.length > 0)
    //                     .map(text => text.replace(/\*\*VARIATION\s*\d+:\*\*/gi, '').trim());
    //                 setAiSuggestionsForSelected(variations);
    //             } else {
    //                 // Handle single rewritten text
    //                 // setAiSuggestionsForSelected([response.data.rewrittenText]);
    //                 setAiSuggestionsForSelected(
    //                     response.data.rewrittenTexts.map(text =>
    //                         text.replace(/\*\*VARIATION\s*\d+:\*\*/gi, '').trim()
    //                     )
    //                 );
    //             }
    //         } else if (response.data.rewrittenTexts && Array.isArray(response.data.rewrittenTexts)) {
    //             setAiSuggestionsForSelected(response.data.rewrittenTexts);
    //         } else if (Array.isArray(response.data) && response.data.length > 0 && typeof response.data[0] === 'string') { // For headlines
    //             setAiSuggestionsForSelected(response.data);
    //         } else if (response.data.summary) {
    //             setAiSuggestionsForSelected([response.data.summary]);
    //         }
    //     }
    //     } catch (err) {
    //         setAiModalError(err.response?.data?.message || "AI request failed.");
    //     } finally {
    //         setAiModalLoading(false);
    //     }
    // };

    const handleAiModalSubmit = async (modalOptions) => {
        setAiModalLoading(true);
        setAiModalError('');
        setAiSuggestionsForSelected([]);
    
        // API key checks
        let keyIsConfigured = false;
        if (aiProviderForSelected === 'openai' && authUser?.hasOpenAiApiKey) keyIsConfigured = true;
        else if (aiProviderForSelected === 'gemini' && authUser?.hasGeminiApiKey) keyIsConfigured = true;
        else if (aiProviderForSelected === 'perplexity' && authUser?.hasPerplexityApiKey) keyIsConfigured = true;
    
        if (!keyIsConfigured) {
            setAiModalError(`Your ${aiProviderForSelected.charAt(0).toUpperCase() + aiProviderForSelected.slice(1)} API key is not configured.`);
            setAiModalLoading(false);
            return;
        }
    
        // Calculate text length metrics
        const selectionLengthInWords = selectedText.trim().split(/\s+/).length;
        const isLongSelection = selectionLengthInWords > 300;
    
        if (isLongSelection) {
            setAiModalError(`Processing ${selectionLengthInWords} words. This may take a moment...`);
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    
        // Prepare options with adaptive parameters
        const adaptedModalOptions = {...modalOptions};
    
        // Add persona description if available for style/tone rewrite
        if (aiActionForSelected === 'rewrite-style-tone') {
            const selectedPersona = personas.find(p => p._id === selectedPersonaId);
            if (selectedPersona) {
                adaptedModalOptions.personaDescription = selectedPersona.description;
            }
        }
    
        // Adaptive parameter adjustments
        if (aiActionForSelected === 'rewrite-style-tone') {
            if (selectionLengthInWords > 500) {
                adaptedModalOptions.variationCount = 1;
            } else if (selectionLengthInWords > 200) {
                adaptedModalOptions.variationCount = 2;
            } else {
                adaptedModalOptions.variationCount = 3;
            }
        } else if (aiActionForSelected === 'summarize') {
            if (selectionLengthInWords > 500) adaptedModalOptions.length = 'medium';
        } else if (aiActionForSelected === 'generate-headlines') {
            adaptedModalOptions.count = selectionLengthInWords > 300 ? 3 : 5;
        }
    
        // Construct payload with adapted options
        const payload = {
            text: selectedText,
            aiProvider: aiProviderForSelected,
            action: aiActionForSelected,
            options: adaptedModalOptions
        };
    
        try {
            const response = await axios.post(`${API_URL}/ai/enhance-text`, payload);
    
            if (isLongSelection) setAiModalError('');
            
            if (response.data.error) {
                setAiModalError(response.data.error);
            } else {
                // Handle response data
                let suggestions = [];
                if (response.data.rewrittenText) {
                    suggestions = response.data.rewrittenText.includes('---VARIATION---') 
                        ? response.data.rewrittenText.split('---VARIATION---').map(cleanVariation)
                        : [response.data.rewrittenText];
                } else if (response.data.rewrittenTexts) {
                    suggestions = response.data.rewrittenTexts.map(cleanVariation);
                } else if (Array.isArray(response.data)) {
                    suggestions = response.data;
                } else if (response.data.summary) {
                    suggestions = [response.data.summary];
                }
                setAiSuggestionsForSelected(suggestions);
            }
        } catch (err) {
            setAiModalError(err.response?.data?.message || "AI request failed.");
        } finally {
            setAiModalLoading(false);
        }
    };
    
    // Helper function to clean variations
    const cleanVariation = (text) => text.replace(/\*\*VARIATION\s*\d+:\*\*/gi, '').trim();

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

    const handleGenerateSnippets = useCallback(async (platformKey, useAi = true) => { // Added useAi flag
        setGenerating(true);
        setError(''); // Use error for this section's errors

        let targetPlatformToSend = platformKey;
        let payload = { targetPlatform: targetPlatformToSend };

        if (useAi) {
            if (!aiProviderForSelected) {
                alert("Please select an AI provider for AI-powered repurposing or configure an API key.");
                setGenerating(false);
                return;
            }
            // Check if selected provider's key is configured (similar to SnippetCard)
            let keyIsConfigured = false;
            if (aiProviderForSelected === 'openai' && authUser?.hasOpenAiApiKey) keyIsConfigured = true;
            else if (aiProviderForSelected === 'gemini' && authUser?.hasGeminiApiKey) keyIsConfigured = true;
            else if (aiProviderForSelected === 'perplexity' && authUser?.hasPerplexityApiKey) keyIsConfigured = true;

            if (!keyIsConfigured) {
                alert(`Your ${aiProviderForSelected} API key is not configured. Please add it in your profile.`);
                setGenerating(false);
                return;
            }

            targetPlatformToSend = `${platformKey}_ai`; // Append _ai to signal AI processing
            payload = { targetPlatform: targetPlatformToSend, aiProvider: aiProviderForSelected };
        }


        try {
            const response = await axios.post(`${API_URL}/repurpose/${id}/generate`, payload);
            trackSnippetGenerated(targetPlatformToSend); // Track with the actual platform sent
            setRepurposedSnippets(prev => [...prev, ...response.data].sort(/* ... */));
        } catch (err) {
            setError(err.response?.data?.message || `Failed to generate ${platformKey} snippets.`);
        } finally {
            setGenerating(false);
        }
    }, [id, authUser, aiProviderForSelected]); // Added dependencies

    // Define repurpose options, now potentially with AI variants
    const repurposeOptions = [
        { label: 'AI Twitter Thread', value: 'twitter_thread', useAi: true },
        { label: 'AI LinkedIn Post', value: 'linkedin_post', useAi: true },
        { label: 'AI Key Takeaways', value: 'key_takeaways', useAi: true },
        { label: 'AI Summary', value: 'summary', useAi: true },
        // You could add non-AI versions too if you keep the rule-based service
        // { label: 'Rule-Based Twitter Thread', value: 'twitter_thread', useAi: false },
    ];

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

    // const repurposeOptions = [
    //     { label: 'Twitter Thread', value: 'twitter_thread' },
    //     { label: 'LinkedIn Post', value: 'linkedin_post' },
    //     { label: 'Key Takeaways List', value: 'key_takeaways_list' },
    //     { label: 'Short Summary', value: 'short_summary' },
    // ];

     // Helper function to group snippets by platform for the history view
     const getRepurposingHistorySummary = (snippets) => {
        if (!snippets || snippets.length === 0) return [];

        const platformSummary = snippets.reduce((acc, snippet) => {
            const platformKey = snippet.platform.replace('_ai', '').replace('_item', ''); // Normalize platform name
            if (!acc[platformKey]) {
                acc[platformKey] = {
                    count: 0,
                    lastGenerated: new Date(0), // Oldest possible date
                    platformDisplayName: platformKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                };
            }
            acc[platformKey].count++;
            if (new Date(snippet.createdAt) > acc[platformKey].lastGenerated) {
                acc[platformKey].lastGenerated = new Date(snippet.createdAt);
            }
            return acc;
        }, {});

        return Object.values(platformSummary).sort((a, b) => b.lastGenerated - a.lastGenerated);
    };

    const repurposingHistory = getRepurposingHistorySummary(repurposedSnippets);

    // --- DERIVE currentFolderId and currentFolderName ---
    // Place this before the main return statement, after contentPiece is potentially populated
    const currentFolderId = contentPiece?.folder?._id || null;
    const currentFolderName = contentPiece?.folder?.name || "Unfoldered";
    // --- END DERIVATION ---


    // if (loading) return <p className="text-center mt-8 text-gray-600">Loading content and snippets...</p>;
      if (loading && !contentPiece) return <p className="text-center mt-8 text-gray-600"><Spinner />Loading content details...</p>;
    if (error && !contentPiece) return <p className="text-center mt-8 text-red-600 bg-red-100 p-4 rounded shadow">{error}</p>;
    if (!contentPiece) return <p className="text-center mt-8 text-gray-700">Content piece not found.</p>;


    return (
        // <div className="max-w-7xl mx-auto mt-8 px-4 sm:px-6 lg:px-8"> {/* Wider max-width for sidebar */}
         <div className="flex flex-col lg:flex-row lg:gap-8"> {/* Main flex container for content + sidebar */}
              {/* Main Content Area (takes up more space, e.g., 2/3) */}
              <main className="w-full lg:w-2/3 flex-grow min-w-0 mb-8 lg:mb-0">
        <div className="max-w-4xl mx-auto mt-10 p-6 md:p-8 bg-white shadow-xl rounded-lg"> {/* Enhanced shadow */}
            {error && <p className="mb-4 text-red-600 bg-red-100 p-3 rounded shadow-sm">{error}</p>}
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 pb-4 border-b border-gray-200">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 md:mb-0">{contentPiece.title}</h1>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                            Currently in: <span className="font-semibold">{currentFolderName}</span>
                        </p>
                <div className="flex space-x-2  mt-2 md:mt-0">
                {/* --- Folder Management Dropdown --- */}
                <Menu as="div" className="relative inline-block text-left">
                            <div>
                                <Menu.Button className="inline-flex justify-center w-full rounded-md border border-gray-300 dark:border-slate-600 shadow-sm px-3 py-2 bg-white dark:bg-slate-700 text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-slate-800 focus:ring-indigo-500">
                                    Organize
                                    <ChevronDownIcon className="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
                                </Menu.Button>
                            </div>
                            <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                            >
                                <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white dark:bg-slate-700 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20 max-h-60 overflow-y-auto">
                                    <div className="py-1">
                                        <Menu.Item>
                                            {({ active }) => (
                                                <button
                                                    onClick={() => setShowNewFolderModal(true)}
                                                    className={`${active ? 'bg-gray-100 dark:bg-slate-600 text-gray-900 dark:text-slate-100' : 'text-gray-700 dark:text-slate-200'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                                >
                                                    <FolderPlusIcon className="mr-2 h-5 w-5 text-indigo-400" aria-hidden="true" />
                                                    Create New Folder & Assign
                                                </button>
                                            )}
                                        </Menu.Item>
                                        {currentFolderId && ( // Only show if currently in a folder
                                             <Menu.Item>
                                                {({ active }) => (
                                                    <button
                                                        onClick={() => handleAssignToFolder(null)} // Pass null to unassign
                                                        className={`${active ? 'bg-gray-100 dark:bg-slate-600 text-gray-900 dark:text-slate-100' : 'text-gray-700 dark:text-slate-200'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                                    >
                                                        <NoSymbolIcon className="mr-2 h-5 w-5 text-red-400" aria-hidden="true" />
                                                        Remove from Folder
                                                    </button>
                                                )}
                                            </Menu.Item>
                                        )}
                                        {userFolders.length > 0 && <div className="my-1 h-px bg-gray-200 dark:bg-slate-600" />} {/* Divider */}
                                        {userFolders.map((folder) => (
                                            <Menu.Item key={folder._id}>
                                                {({ active }) => (
                                                    <button
                                                        onClick={() => handleAssignToFolder(folder._id)}
                                                        disabled={currentFolderId === folder._id}
                                                        className={`${active ? 'bg-gray-100 dark:bg-slate-600 text-gray-900 dark:text-slate-100' : 'text-gray-700 dark:text-slate-200'} group flex w-full items-center rounded-md px-2 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                                                    >
                                                        {currentFolderId === folder._id ? (
                                                             <CheckIcon className="mr-2 h-5 w-5 text-green-500" aria-hidden="true" />
                                                        ) : (
                                                             <FolderArrowDownIcon className="mr-2 h-5 w-5 text-gray-400 dark:text-slate-500 group-hover:text-indigo-400" aria-hidden="true" />
                                                        )}
                                                        Move to: {folder.name}
                                                    </button>
                                                )}
                                            </Menu.Item>
                                        ))}
                                    </div>
                                </Menu.Items>
                            </Transition>
                        </Menu>
                        {/* --- End Folder Management Dropdown --- */}
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


             {/* Original Text Display/Editor Section */}
             <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-lg text-gray-700 dark:text-slate-200">Original Text</h3>
                    {anyAiKeyConfiguredForUser && contentPiece?.originalText && !isEditingOriginal && (
                        <button
                            onClick={openTranslateOriginalModal}
                            className="text-xs bg-sky-500 hover:bg-sky-600 text-white font-semibold py-1 px-2.5 rounded-md flex items-center"
                            title="Translate Original Content"
                        >
                            <DocumentDuplicateIcon className="h-3.5 w-3.5 mr-1" /> Translate
                        </button>
                    )}
                    {isEditingOriginal && ( // Show Add Media button only in edit mode
                        <button
                            type="button"
                            onClick={() => {
                                setFileToUpload(null);
                                setUploadedMediaUrl('');
                                setUploadError('');
                                setShowUploadModal(true);
                            }}
                            className="bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold py-1 px-2.5 rounded"
                        >
                            Add Image/Video
                        </button>
                    )}
                </div>
                {isEditingOriginal ? (
                    <textarea ref={originalTextareaRef} value={editableOriginalText}
                    onChange={(e) => setEditableOriginalText(e.target.value)}
                        onMouseUp={handleTextSelection} // Or onSelect if preferred
                        onBlur={() => setTimeout(() => setShowAiEnhancePopup(false), 200)} // Hide popup on blur
                        className="w-full p-3 border rounded-md min-h-[200px] md:min-h-[300px] text-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Start writing or paste your content here..."
                    />
                ) : ( /* ... view mode with ReactMarkdown ... */
                    <div
                    className="prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl max-w-none p-3 border bg-gray-50 rounded-md cursor-text min-h-[100px] markdown-content" // Added min-h for consistency
                    onClick={() => {
                        if (!isEditingOriginal) {
                            setEditableOriginalText(contentPiece?.originalText || '');
                            setIsEditingOriginal(true);
                        }
                    }}
                    title="Click to edit original text"
                >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {contentPiece?.originalText || "No original text."}
                    </ReactMarkdown>
                </div>
                 )}
            </div>

            {/* Upload Media Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={() => setShowUploadModal(false)}>
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-slate-100">Upload Image/Video</h3>
                        <input type="file" accept="image/*,video/mp4,video/quicktime,video/x-msvideo" onChange={handleFileSelect} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 mb-3 dark:file:bg-slate-700 dark:file:text-slate-200 dark:hover:file:bg-slate-600"/>
                        {fileToUpload && <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Selected: {fileToUpload.name}</p>}
                        <button
                            onClick={handleMediaUpload}
                            disabled={uploadingMedia || !fileToUpload}
                            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded text-sm w-full mb-3 disabled:opacity-60"
                        >
                            {uploadingMedia ? 'Uploading...' : 'Upload File'}
                        </button>
                        {uploadError && <p className="text-xs text-red-500 mb-2">{uploadError}</p>}
                        {uploadedMediaUrl && !uploadingMedia && (
                            <div className="mt-3 border-t pt-3">
                                <p className="text-sm font-medium text-green-600 dark:text-green-400">Upload successful!</p>
                                <input type="text" readOnly value={uploadedMediaUrl} className="w-full p-1.5 border rounded text-xs mt-1 bg-gray-50 dark:bg-slate-700 dark:text-slate-300" />
                                <div className="flex gap-2 mt-2">
                                    <button onClick={() => copyMarkdownToClipboard(fileToUpload?.type.startsWith('image/'))} className="flex-1 text-xs bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 py-1.5 px-3 rounded">Copy Markdown</button>
                                    <button onClick={() => insertMarkdownIntoText(fileToUpload?.type.startsWith('image/') ? `\n![${fileToUpload?.name.split('.')[0] || 'media'}](${uploadedMediaUrl})\n` : `\n[Video: ${fileToUpload?.name.split('.')[0] || 'media'}](${uploadedMediaUrl})\n`)} className="flex-1 text-xs bg-green-500 hover:bg-green-600 text-white py-1.5 px-3 rounded">Insert at Cursor</button>
                                </div>
                            </div>
                        )}
                        <button onClick={() => setShowUploadModal(false)} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mt-4 w-full text-center py-2">Close</button>
                    </div>
                </div>
            )}
            

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
                        {/* <p className="text-xs text-gray-600 mb-2">Selected Text: <em className="block bg-gray-100 p-1 rounded max-h-20 overflow-y-auto">"{selectedText}"</em></p> */}

{/* Selection information */}
<div className="mb-3">
                <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Selected Text:</span>
                    <span className="text-xs text-gray-500">
                        ~{selectedText.trim().split(/\s+/).length} words
                    </span>
                </div>
                <div className="bg-gray-100 p-2 rounded max-h-24 overflow-y-auto text-xs mt-1">
                    {selectedText.length > 200 
                        ? `"${selectedText.substring(0, 200)}..."` 
                        : `"${selectedText}"`
                    }
                </div>
            </div>

                        {/* Provider Selection */}
                        <div className="mb-3">
                            <label className="text-xs font-medium">AI Provider:</label>
                            <select value={aiProviderForSelected} onChange={(e) => setAiProviderForSelected(e.target.value)} className="w-full p-1.5 border rounded text-xs mt-1">
                                {authUser?.hasOpenAiApiKey && <option value="openai">OpenAI</option>}
                                {authUser?.hasGeminiApiKey && <option value="gemini">Gemini</option>}
                                {authUser?.hasPerplexityApiKey && <option value="perplexity">Perplexity</option>}
                                {/* Add disabled option if no keys */}
                                {(!authUser?.hasOpenAiApiKey && !authUser?.hasGeminiApiKey && !authUser?.hasPerplexityApiKey) && 
                        <option value="" disabled>No API keys configured</option>
                    }
                            </select>
                        </div>

                      {/* Action-specific options */}
            {aiActionForSelected === 'rewrite-style-tone' && (
                <div className="mb-3">
                    <label className="text-xs font-medium">Target Style:</label>
                    <input 
                        type="text" 
                        placeholder="e.g., formal, witty, professional, friendly"
                        value={targetStyleForModal} 
                        onChange={(e) => setTargetStyleForModal(e.target.value)}
                        className="w-full p-1.5 border rounded text-xs mt-1" 
                    />

                    {/* Style presets */}
                    <div className="flex flex-wrap gap-1 mt-1">
                        {["formal", "casual", "professional", "friendly", "witty"].map(style => (
                            <button
                                key={style}
                                onClick={() => setTargetStyleForModal(style)}
                                className="px-2 py-1 text-xs border rounded hover:bg-gray-100"
                            >
                                {style}
                            </button>
                        ))}
                    </div>
                     <div className="mb-3">
        <label className="text-xs font-medium">Target Persona:</label>
        <select
            value={selectedPersonaId || ''}
            onChange={(e) => setSelectedPersonaId(e.target.value)}
            className="w-full p-1.5 border rounded text-xs mt-1"
        >
            <option value="">No persona selected</option>
            {personas.map(persona => (
                <option key={persona._id} value={persona._id}>
                    {persona.name}
                </option>
            ))}
        </select>
        {personas.length === 0 && (
            <p className="text-xs text-gray-500 mt-1">
                No personas found. <Link to="/manage-personas" className="text-blue-500">Create one first</Link>
            </p>
        )}
    </div>
                </div>
            )}

            {aiActionForSelected === 'summarize' && (
                <div className="mb-3">
                    <label className="text-xs font-medium">Summary Type:</label>
                    <select 
                        value={summarizeTypeForModal || 'short'} 
                        onChange={(e) => setSummarizeTypeForModal(e.target.value)}
                        className="w-full p-1.5 border rounded text-xs mt-1"
                    >
                        <option value="short">Short Summary</option>
                        <option value="medium">Medium Summary</option>
                        <option value="bullet_points">Bullet Points</option>
                    </select>
                </div>
            )}


                          {/* Generate Button */}
            <button
                onClick={() => {
                    // Collect options based on aiActionForSelected
                    let options = {};
                    if (aiActionForSelected === 'rewrite-style-tone') {
                        options.targetStyleOrTone = targetStyleForModal;
                    } else if (aiActionForSelected === 'generate-headlines') {
                        options.count = 5; // Default to 5 headline options
                    } else if (aiActionForSelected === 'summarize') {
                        options.length = summarizeTypeForModal || 'short';
                    }
                    handleAiModalSubmit(options);
                }}
                disabled={aiModalLoading}
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded text-sm w-full mb-2 disabled:opacity-50"
            >
                {aiModalLoading ? 'Generating...' : 'Generate with AI'}
            </button>

                       {/* Error display */}
            {aiModalError && (
                <div className={`text-xs ${aiModalError.includes('Processing') ? 'text-blue-500' : 'text-red-500'} mb-2 p-2 rounded ${aiModalError.includes('Processing') ? 'bg-blue-50' : 'bg-red-50'}`}>
                    {aiModalError}
                </div>
            )}

                      {/* Suggestions display */}
            {aiSuggestionsForSelected.length > 0 && !aiModalLoading && (
                <div className="mt-3 border-t pt-2">
                    <p className="text-xs font-medium mb-1">
                        {aiSuggestionsForSelected.length > 1
                            ? `Suggestions (${aiSuggestionsForSelected.length}) - Click one to apply:`
                            : "Suggestion - Click to apply:"}
                    </p>
                    <ul className="space-y-2 max-h-64 overflow-y-auto">
                        {aiSuggestionsForSelected.map((sugg, i) => (
                            <li 
                                key={i} 
                                onClick={() => applyAiSuggestionToSelectedText(sugg)}
                                className="text-xs p-3 bg-gray-100 border rounded hover:bg-blue-100 cursor-pointer transition-colors"
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-medium text-blue-600">
                                        {aiSuggestionsForSelected.length > 1 ? `Variation ${i+1}` : 'Generated Result'}
                                    </span>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation(); 
                                            applyAiSuggestionToSelectedText(sugg);
                                            setShowAiActionModal(false);
                                        }}
                                        className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded transition-colors"
                                    >
                                        Use This
                                    </button>
                                </div>
                                <div className="whitespace-pre-wrap">{sugg}</div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

{/* Close button */}
<button 
                onClick={() => {
                    setShowAiActionModal(false);
                    setTargetStyleForModal(''); 
                    if (summarizeTypeForModal) setSummarizeTypeForModal('short');
                }} 
                className="text-xs text-gray-600 hover:text-gray-800 mt-3 w-full text-center"
            >
                Close
            </button>
                    </div>
                </div>
            )}



            {/* Repurpose This Content Section */}
            <div className="mt-10 pt-6 border-t border-gray-300">
                <h2 className="text-xl md:text-2xl font-semibold mb-2 text-gray-800">Repurpose This Content</h2>

                {anyAiKeyConfiguredForUser ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-5 p-3 bg-slate-50 rounded-md border">
                        <label htmlFor="repurposeAiProvider" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                            Use AI Provider:
                        </label>
                        <select
                            id="repurposeAiProvider"
                            value={repurposeAiProvider}
                            onChange={(e) => setRepurposeAiProvider(e.target.value)}
                            className="text-sm p-2 border rounded bg-white focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-auto"
                            disabled={generating}
                        >
                            {authUser?.hasOpenAiApiKey && <option value="openai">OpenAI</option>}
                            {authUser?.hasGeminiApiKey && <option value="gemini">Gemini</option>}
                            {authUser?.hasPerplexityApiKey && <option value="perplexity">Perplexity</option>}
                        </select>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 mb-5 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <Link to="/profile" className="text-blue-600 hover:underline font-medium">Configure an AI API key</Link> to enable AI-powered repurposing options. Rule-based generation will be used otherwise (if available).
                    </p>
                )}


                <div className="flex flex-wrap gap-3 mb-8">
                    {repurposeOptions.map(opt => (
                        <button
                            key={opt.value + (opt.useAi ? '_ai' : '')}
                            onClick={() => handleGenerateSnippets(opt.value, opt.useAi && anyAiKeyConfiguredForUser)} // Pass useAi flag
                            disabled={generating || (opt.useAi && !anyAiKeyConfiguredForUser && !repurposeAiProvider)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded text-sm disabled:opacity-50 shadow hover:shadow-md transition-shadow"
                            title={opt.useAi && !anyAiKeyConfiguredForUser ? "Configure AI Key in Profile to use AI version" : ""}
                        >
                            {generating ? `Generating...` : opt.label}
                        </button>
                    ))}
                </div>

                {error && <p className="text-red-500 bg-red-50 p-2 rounded-md mb-4">{error}</p>} {/* Display errors for this section */}

                {/* --- NEW: Repurposing History Section --- */}
            {repurposedSnippets.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-300">
                    <h3 className="text-lg md:text-xl font-semibold mb-4 text-gray-700">Repurposing Activity</h3>
                    {repurposingHistory.length > 0 ? (
                        <div className="space-y-3">
                            {repurposingHistory.map((item, index) => (
                                <div key={index} className="p-3 bg-slate-100 rounded-md border border-slate-200 shadow-sm">
                                    <p className="font-medium text-slate-700">
                                        <span className="capitalize">{item.platformDisplayName}</span>
                                        <span className="ml-2 bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                                            {item.count} snippet{item.count > 1 ? 's' : ''} generated
                                        </span>
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Last generated: {formatDate(item.lastGenerated)}
                                    </p>
                                    {/* Future: Add publish status if available */}
                                    {item.lastPublished && (
                                        <p className="text-xs text-green-600 mt-0.5">
                                            Last published: {formatDate(item.lastPublished)}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">No specific platform activity yet, but snippets exist.</p>
                    )}
                </div>
            )}
            {/* --- End Repurposing History Section --- */}

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
        </main>
        {/* Right Sidebar for AI Content Expansion (e.g., 1/3 width) */}
        {contentPiece && contentPiece.originalText && ( // Only show if content is loaded
                    <aside className="w-full lg:w-1/3 lg:flex-shrink-0">
                        <div className="lg:sticky lg:top-20"> {/* Make sidebar sticky on larger screens */}
                            <ContentExpansionSidebar
                                originalText={contentPiece.originalText}
                                contentTitle={contentPiece.title}
                            />
                        </div>
                    </aside>
                )}

<TranslationModal
                isOpen={showTranslationModal}
                onClose={() => setShowTranslationModal(false)}
                textToTranslate={textForTranslation}
                onTranslationComplete={handleOriginalTranslationComplete}
                // originalLanguage={...} // You could try to detect or let user specify
            />

            {/* New Folder Creation Modal */}
            {showNewFolderModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={() => setShowNewFolderModal(false)}>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-slate-100">Create New Folder & Assign</h3>
                        <input
                            type="text"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder="Enter folder name"
                            className="w-full p-2 border dark:border-slate-600 rounded-md mb-3 text-sm dark:bg-slate-700 dark:text-slate-100"
                            autoFocus
                        />
                        {newFolderError && <p className="text-xs text-red-500 mb-2">{newFolderError}</p>}
                        <div className="flex justify-end space-x-2">
                            <button onClick={() => setShowNewFolderModal(false)} className="px-4 py-2 text-sm rounded-md bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500">Cancel</button>
                            <button onClick={handleCreateFolderAndAssign} disabled={newFolderLoading || !newFolderName.trim()}
                                className="px-4 py-2 text-sm rounded-md bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50">
                                {newFolderLoading ? 'Creating...' : 'Create & Assign'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>



        // </div>
    );
};

export default ContentDetailPage;

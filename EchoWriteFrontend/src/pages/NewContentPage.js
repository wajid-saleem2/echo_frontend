// frontend/src/pages/NewContentPage.js
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Ensure axios is configured with auth token in AuthContext
import { trackContentCreated } from '../services/analytics'; // Import
import { useAuth } from '../contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import TagInput from '../components/forms/TagInput'; // << IMPORT
import axiosInstance from '../api/apiConfig';
import AiCoPilotSidebar from '../components/ai/AiCoPilotSidebar'; // << IMPORT
import { PhotoIcon, QuestionMarkCircleIcon, SparklesIcon } from '@heroicons/react/24/outline'; // For the trigger button

const API_URL = process.env.REACT_APP_API_URL;
const UNSPLASH_ACCESS_KEY = process.env.REACT_APP_UNSPLASH_ACCESS_KEY;

const NewContentPage = () => {
    const [title, setTitle] = useState('');
    const [originalText, setOriginalText] = useState('');
    const [sourceUrl, setSourceUrl] = useState('');
    const [contentType, setContentType] = useState('general_text');
    const [tags, setTags] = useState(''); // Comma-separated string
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [scrapeInfo, setScrapeInfo] = useState('');
    const [isScraping, setIsScraping] = useState(false); // Loading state for scrape button
    // const { user: authUser } = useAuth();
    // --- New State for AI Structuring ---
    const [isStructuring, setIsStructuring] = useState(false);
    const [structureAiProvider, setStructureAiProvider] = useState(''); // Default or from user settings
    const [structureError, setStructureError] = useState('');
    const { user: authUser } = useAuth(); // Get authenticated user
    // --- End New State ---

     // --- NEW: State for Media Upload Modal (similar to ContentDetailPage) ---
     const [showMediaUploadModal, setShowMediaUploadModal] = useState(false);
     const [fileToUpload, setFileToUpload] = useState(null);
     const [uploadingMedia, setUploadingMedia] = useState(false);
     const [uploadedMediaUrl, setUploadedMediaUrl] = useState('');
     const [mediaUploadError, setMediaUploadError] = useState('');
     // --- End Media Upload Modal State ---

    // --- New State for AI Image Suggestions ---
    const [showImageSuggestionModal, setShowImageSuggestionModal] = useState(false);
    const [imageKeywords, setImageKeywords] = useState([]);
    const [suggestedImages, setSuggestedImages] = useState([]); // From Unsplash
    const [imageSuggestionLoading, setImageSuggestionLoading] = useState(false);
    const [imageSuggestionError, setImageSuggestionError] = useState('');
    const [imageAiProvider, setImageAiProvider] = useState(''); // For keyword generation
    const originalTextTextareaRef = useRef(null); // Ref for the main textarea to insert image markdown
    // --- End New State ---
    const [tagsArray, setTagsArray] = useState([]); // Manage tags as an array
      // --- NEW: State for Co-Pilot Sidebar ---
      const [showCoPilot, setShowCoPilot] = useState(false);
      // --- End New State ---
      const [userSnippetTemplates, setUserSnippetTemplates] = useState([]); // For original text templates
      const [selectedOriginalTextTemplateId, setSelectedOriginalTextTemplateId] = useState('');
    
    const navigate = useNavigate();

    // Example in AllContentPage.js or a layout component
const [folders, setFolders] = useState([]);
const [foldersLoading, setFoldersLoading] = useState(true);
const [selectedFolderId, setSelectedFolderId] = useState(''); // or null

useEffect(() => {
    const fetchUserSnippetTemplates = async () => {
        if (!authUser) return;
        try {
            const response = await axiosInstance.get('/templates'); // Fetch user's own templates
            setUserSnippetTemplates(response.data || []);
        } catch (err) { console.error("Failed to fetch snippet templates for NewContentPage", err); }
    };
    if (authUser) fetchUserSnippetTemplates();
}, [authUser]);

useEffect(() => {
    const fetchFolders = async () => {
        if (!authUser) return;
        setFoldersLoading(true);
        try {
            const response = await axiosInstance.get('/folders'); // Use your axiosInstance
            setFolders(response.data);
        } catch (err) {
            console.error("Failed to fetch folders", err);
            // Handle error (e.g., show a toast)
        } finally {
            setFoldersLoading(false);
        }
    };
    fetchFolders();
}, [authUser]);

    // Effect to set a default AI provider for image keyword generation
    useEffect(() => {
        if (authUser?.hasOpenAiApiKey) setImageAiProvider('openai');
        else if (authUser?.hasGeminiApiKey) setImageAiProvider('gemini');
        else if (authUser?.hasPerplexityApiKey) setImageAiProvider('perplexity');
        else setImageAiProvider('');
    }, [authUser]);



    // NEW: Dedicated Scrape Handler
    const handleScrapeUrl = async () => {
        if (!sourceUrl) {
            setScrapeInfo("Please enter a URL to scrape.");
            return;
        }
        setIsScraping(true);
        setScrapeInfo("Scraping content from URL...");
        setError(''); // Clear main form error
        setOriginalText(''); // Clear existing text
        setTitle('');      // Optionally clear title or let user decide

        try {
            // This new backend endpoint will ONLY scrape and return data, NOT save.
            const response = await axios.post(`${API_URL}/utils/scrape-url`, { url: sourceUrl });
            if (response.data && response.data.textContent) {
                setOriginalText(response.data.textContent);
                setTitle(prevTitle => prevTitle || response.data.title || ''); // Keep user title if typed
                setScrapeInfo("Scraping successful! Review and edit below.");

                // --- ADDED: Automatically structure after successful scrape ---
                if (response.data.textContent.trim().length > 50 && structureAiProvider) {
                    // Wait a tiny bit for originalText state to hopefully update before structuring
                    setTimeout(() => handleAiStructureContent(response.data.textContent, true), 100);
                }
                // --- END ADDED ---

            } else {
                setScrapeInfo(response.data.message || "Scraping failed or no main content found. Please provide text manually.");
            }
        } catch (err) {
            setScrapeInfo(err.response?.data?.message || "Error during scraping process.");
        } finally {
            setIsScraping(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        setScrapeInfo('');

        if (!title ) {
            setError('Please provide a Title.');
            setLoading(false);
            return;
        }
        if (!originalText) {
            setError('Please provide Original Text.');
            setLoading(false);
            return;
        }


        try {
            const payload = {
                title,
                originalText,
                sourceUrl,
                contentType,
                tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
                folderId: selectedFolderId || null // Send null if empty string (no folder)
            };
            await axios.post(`${API_URL}/content`, payload);
            trackContentCreated(payload.contentType || 'unknown');
            navigate('/dashboard'); // Redirect to dashboard after successful creation
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create content. Please try again.');
            setScrapeInfo('');
        } finally {
            setLoading(false);
        }
    };

   // Modified to accept text directly, and a flag to indicate if it's post-scrape
   const handleAiStructureContent = async (textToStructure = originalText, isPostScrape = false) => {
    if (!textToStructure.trim()) {
        setStructureError("Content is empty, cannot structure.");
        if (!isPostScrape) alert("Please paste some content first to structure."); // Alert only for manual trigger
        return;
    }
    if (!structureAiProvider) {
        setStructureError("Please select an AI provider for structuring or configure an API key.");
        if (!isPostScrape) alert("Please select an AI provider or configure an API key.");
        return;
    }

    setIsStructuring(true);
    setStructureError('');
    if (isPostScrape) setScrapeInfo(prev => prev + " Now attempting AI structuring...");


    try {
        const payload = {
            text: textToStructure,
            aiProvider: structureAiProvider
        };
        const response = await axios.post(`${API_URL}/ai/structure-content`, payload);
        if (response.data && response.data.structuredText) {
            setOriginalText(response.data.structuredText);
            if (isPostScrape) {
                setScrapeInfo("Scraping and AI structuring successful! Review below.");
            } else {
                // alert("Content has been structured by AI!"); // Or use a toast
            }
        } else if (response.data.error) {
            setStructureError(response.data.error);
        } else {
            setStructureError("AI did not return structured text as expected.");
        }
    } catch (err) {
        setStructureError(err.response?.data?.message || "Failed to structure content with AI.");
    } finally {
        setIsStructuring(false);
    }
};


    const handleOpenImageSuggestionModal = async () => {
        if (!originalText.trim()) {
            setImageSuggestionError("Please add some content before suggesting images.");
            return;
        }
        if (!imageAiProvider) {
            setImageSuggestionError("Please select an AI provider for keyword generation or configure an API key.");
            return;
        }
        setShowImageSuggestionModal(true);
        setImageSuggestionLoading(true);
        setImageSuggestionError('');
        setImageKeywords([]);
        setSuggestedImages([]);

        try {
            // 1. Get keywords from AI
            const keywordResponse = await axios.post(`${API_URL}/ai/image-keywords`, {
                text: originalText.substring(0, 2000), // Send a snippet of text
                aiProvider: imageAiProvider,
                count: 3 // Ask for 3-5 keywords
            });

            if (keywordResponse.data && keywordResponse.data.length > 0) {
                const keywords = keywordResponse.data;
                setImageKeywords(keywords);

                // 2. Fetch images from Unsplash using the first keyword (or combined)
                if (UNSPLASH_ACCESS_KEY) {
                    const unsplashQuery = keywords.join(','); // Or just keywords[0]
                    const unsplashResponse = await axios.get(`https://api.unsplash.com/search/photos`, {
                        params: {
                            query: unsplashQuery,
                            per_page: 9, // Number of images to fetch
                            orientation: 'landscape'
                        },
                        headers: {
                            Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`
                        }
                    });
                    setSuggestedImages(unsplashResponse.data.results);
                } else {
                    setImageSuggestionError("Unsplash API key not configured. Cannot fetch images.");
                }
            } else {
                setImageSuggestionError("AI could not suggest image keywords for the current text.");
            }
        } catch (err) {
            setImageSuggestionError(err.response?.data?.message || "Failed to get image suggestions.");
        } finally {
            setImageSuggestionLoading(false);
        }
    };

    const handleInsertImageMarkdownFromUnsplash  = (imageUrl, altText = "AI suggested image") => {
        const markdown = `\n![${altText}](${imageUrl})\n`;
        // Insert at current cursor position or end of text
        if (originalTextTextareaRef.current) {
            const textarea = originalTextTextareaRef.current;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newText = originalText.substring(0, start) + markdown + originalText.substring(end);
            setOriginalText(newText);
            // Focus and set cursor after inserted markdown
            setTimeout(() => { // Timeout to allow state to update and textarea to re-render
                textarea.focus();
                textarea.setSelectionRange(start + markdown.length, start + markdown.length);
            }, 0);
        } else {
            setOriginalText(prev => prev + markdown); // Append if ref not available
        }
        setShowImageSuggestionModal(false);
    };

    const handleApplyCoPilotContent = (newBodyText, append = false) => {
        if (append) {
            setOriginalText(prev => `${prev}\n\n${newBodyText}`.trim());
        } else {
            setOriginalText(newBodyText);
        }
    };
    const handleApplyCoPilotTitle = (newTitle) => {
        setTitle(newTitle);
    };

     // --- NEW: Handlers for Media Upload Modal ---
     const handleFileSelectForUpload = (event) => {
        if (event.target.files && event.target.files[0]) {
            setFileToUpload(event.target.files[0]);
            setUploadedMediaUrl('');
            setMediaUploadError('');
        }
    };

    const handleActualMediaUpload = async () => {
        if (!fileToUpload) {
            setMediaUploadError("Please select a file to upload.");
            return;
        }
        setUploadingMedia(true);
        setMediaUploadError('');
        setUploadedMediaUrl('');

        const formData = new FormData();
        formData.append('mediaFile', fileToUpload);

        try {
            const response = await axiosInstance.post('/utils/upload-media', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setUploadedMediaUrl(response.data.fileUrl); // Assuming backend returns { fileUrl: '...' }
        } catch (err) {
            setMediaUploadError(err.response?.data?.message || "File upload failed.");
        } finally {
            setUploadingMedia(false);
        }
    };

    const insertUploadedMediaMarkdown = (isImage = true) => {
        if (!uploadedMediaUrl) return;
        const altText = fileToUpload?.name.split('.')[0] || (isImage ? "uploaded image" : "uploaded video");
        const markdown = isImage
            ? `\n![${altText}](${uploadedMediaUrl})\n`
            : `\n[Video: ${altText}](${uploadedMediaUrl})\n`; // Simple link for video, or use <video> if RTE

        if (originalTextTextareaRef.current) {
            const textarea = originalTextTextareaRef.current;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newText = originalText.substring(0, start) + markdown + originalText.substring(end);
            setOriginalText(newText);
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + markdown.length, start + markdown.length);
            }, 0);
        } else {
            setOriginalText(prev => prev + markdown);
        }
        setShowMediaUploadModal(false); // Close modal
    };
    // --- End Media Upload Handlers ---

    const handleApplyOriginalTextTemplate = () => {
        if (!selectedOriginalTextTemplateId) return;
        const template = userSnippetTemplates.find(t => t._id === selectedOriginalTextTemplateId);
        if (template) {
            // For original text, we usually just apply the content.
            // Placeholders like {{title}} might be filled by the user AFTER applying the template,
            // or you could have a very simple {{user_input_topic}} placeholder.
            // For now, let's assume the template content is mostly boilerplate/structure.
            let templateContent = template.content;
            // Simple placeholder replacement (if you define any for original text templates)
            // templateContent = templateContent.replace(/{{topic_placeholder}}/g, title || "My New Topic");
    
            setOriginalText(templateContent);
            if (!title && template.name.toLowerCase().includes("template")) { // Basic title suggestion
                setTitle(template.name.replace(/template/gi, '').trim() || "New Content from Template");
            }
            // alert("Template applied to original text!"); // Use toast
        }
    };

    const anyAiKeyConfiguredForUser = authUser?.hasOpenAiApiKey || authUser?.hasGeminiApiKey || authUser?.hasPerplexityApiKey;

   // Replace the return statement section with this improved version:

return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-slate-900">
        {/* Main Content Form Area */}
        <div className={`transition-all duration-300 ease-in-out ${showCoPilot ? 'lg:pr-[450px]' : 'pr-0'}`}>
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6 lg:p-8">
                    <h1 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-slate-100">
                        Add New Content Piece
                    </h1>
                    
                    {/* Error and Info Messages */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
                            {error}
                        </div>
                    )}
                    {scrapeInfo && (
                        <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-lg mb-6">
                            {scrapeInfo}
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Title Input */}
                        <div>
                            <label htmlFor="title" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                                Title
                                <span className="text-gray-400 text-xs font-normal ml-2">
                                    (Optional if scraping from URL)
                                </span>
                            </label>
                            <input
                                id="title"
                                type="text"
                                placeholder="My Awesome Blog Post"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 transition-colors"
                            />
                        </div>

                        {/* Folder Selection */}
                        <div>
                            <label htmlFor="folderId" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                                Folder (Optional)
                            </label>
                            <select
                                id="folderId"
                                value={selectedFolderId}
                                onChange={(e) => setSelectedFolderId(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                            >
                                <option value="">-- No Folder --</option>
                                {folders.map(folder => (
                                    <option key={folder._id} value={folder._id}>
                                        {folder.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Source URL with Scrape Button */}
                        <div>
                            <label htmlFor="sourceUrl" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                                Source URL
                                <span className="text-gray-400 text-xs font-normal ml-2">(Optional)</span>
                            </label>
                            <div className="flex gap-3">
                                <input
                                    id="sourceUrl"
                                    type="url"
                                    placeholder="https://example.com/my-article"
                                    value={sourceUrl}
                                    onChange={(e) => setSourceUrl(e.target.value)}
                                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                                />
                                <button
                                    type="button"
                                    onClick={handleScrapeUrl}
                                    disabled={isScraping || !sourceUrl.trim()}
                                    className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
                                >
                                    {isScraping ? 'Scraping...' : 'Fetch & Scrape'}
                                </button>
                            </div>
                        </div>
                        {/* --- Template for Original Text --- */}
            {userSnippetTemplates.length > 0 && (
                <div className="mb-4 p-3 border rounded-md bg-slate-50 dark:bg-slate-700">
                    <label htmlFor="originalTextTemplateSelect" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                        Start with a Template for Original Text (Optional):
                    </label>
                    <div className="flex items-center gap-2">
                        <select
                            id="originalTextTemplateSelect"
                            value={selectedOriginalTextTemplateId}
                            onChange={(e) => setSelectedOriginalTextTemplateId(e.target.value)}
                            className="flex-grow p-2 border dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-800 dark:text-slate-100"
                        >
                            <option value="">-- Select a Template --</option>
                            {userSnippetTemplates.map(t => (
                                // You might filter these templates by a specific platformHint like 'document_structure'
                                <option key={t._id} value={t._id}>{t.name}</option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={handleApplyOriginalTextTemplate}
                            disabled={!selectedOriginalTextTemplateId}
                            className="bg-purple-500 hover:bg-purple-600 text-white text-sm font-semibold py-2 px-3 rounded-md disabled:opacity-50"
                        >
                            Apply Template
                        </button>
                    </div>
                </div>
            )}
            {/* --- End Template for Original Text --- */}

                        {/* Original Text Area */}
                        <div>
                            <label htmlFor="originalText" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                                Original Text
                                <span className="text-gray-400 text-xs font-normal ml-2">
                                    (Required if not scraping from URL)
                                </span>
                            </label>
                            
                            {/* AI Controls Row */}
                            <div className="flex flex-wrap items-center gap-3 mb-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                                {/* AI Structuring Controls */}
                                {anyAiKeyConfiguredForUser && originalText.trim().length > 50 && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600 dark:text-slate-400">AI Structure:</span>
                                        <select
                                            value={structureAiProvider}
                                            onChange={(e) => setStructureAiProvider(e.target.value)}
                                            disabled={isStructuring}
                                            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                                        >
                                            {authUser?.hasOpenAiApiKey && <option value="openai">OpenAI</option>}
                                            {authUser?.hasGeminiApiKey && <option value="gemini">Gemini</option>}
                                            {authUser?.hasPerplexityApiKey && <option value="perplexity">Perplexity</option>}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => handleAiStructureContent(originalText, false)}
                                            disabled={isStructuring || !structureAiProvider || !originalText.trim()}
                                            className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-400 text-white text-sm font-medium rounded-md transition-colors"
                                        >
                                            {isStructuring ? 'Structuring...' : 'Add Headings'}
                                        </button>
                                    </div>
                                )}

                                {/* Add Media Button */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFileToUpload(null);
                                        setUploadedMediaUrl('');
                                        setMediaUploadError('');
                                        setShowMediaUploadModal(true);
                                    }}
                                    className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-md transition-colors flex items-center gap-1"
                                    title="Add Image/Video from Device"
                                >
                                    <PhotoIcon className="h-4 w-4" />
                                    Add Media
                                </button>

                                {/* AI Image Suggestions */}
                                {anyAiKeyConfiguredForUser && UNSPLASH_ACCESS_KEY && originalText.trim().length > 50 && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600 dark:text-slate-400">AI Images:</span>
                                        <select
                                            value={imageAiProvider}
                                            onChange={(e) => setImageAiProvider(e.target.value)}
                                            disabled={imageSuggestionLoading}
                                            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                                        >
                                            {authUser?.hasOpenAiApiKey && <option value="openai">OpenAI</option>}
                                            {authUser?.hasGeminiApiKey && <option value="gemini">Gemini</option>}
                                            {authUser?.hasPerplexityApiKey && <option value="perplexity">Perplexity</option>}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={handleOpenImageSuggestionModal}
                                            disabled={imageSuggestionLoading || !imageAiProvider}
                                            className="px-3 py-1.5 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-400 text-white text-sm font-medium rounded-md transition-colors"
                                        >
                                            {imageSuggestionLoading ? 'Getting Ideas...' : 'Suggest Images'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {structureError && (
                                <div className="text-red-500 text-sm mb-3 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                                    {structureError}
                                </div>
                            )}

                            <textarea
                                ref={originalTextTextareaRef}
                                id="originalText"
                                placeholder="Paste content, scrape from URL, or use AI to structure and add media."
                                value={originalText}
                                onChange={(e) => setOriginalText(e.target.value)}
                                rows={16}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 resize-y"
                            />

                            {/* Markdown Preview */}
                            {originalText.trim() && (
                                <details className="mt-3 border border-gray-200 dark:border-slate-600 rounded-lg">
                                    <summary className="px-4 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 text-sm font-medium text-gray-700 dark:text-slate-300">
                                        Show Markdown Preview
                                    </summary>
                                    <div className="px-4 py-3 bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-600 max-h-80 overflow-y-auto">
                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {originalText || "Preview will appear here..."}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                </details>
                            )}

                            {!UNSPLASH_ACCESS_KEY && anyAiKeyConfiguredForUser && (
                                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                                    Unsplash API key not configured. Image suggestions disabled.
                                </p>
                            )}
                        </div>

                        {/* Content Type and Tags */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="contentType" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                                    Content Type
                                </label>
                                <select
                                    id="contentType"
                                    value={contentType}
                                    onChange={(e) => setContentType(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                                >
                                    <option value="general_text">General Text</option>
                                    <option value="blog_post">Blog Post</option>
                                    <option value="video_script">Video Script</option>
                                    <option value="podcast_transcript">Podcast Transcript</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="tags" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                                    Tags
                                    <span className="text-gray-400 text-xs font-normal ml-2">
                                        (Optional, comma-separated)
                                    </span>
                                </label>
                                <input
                                    id="tags"
                                    type="text"
                                    placeholder="e.g., marketing, tech, productivity"
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold text-lg rounded-lg transition-colors focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        >
                            {loading ? (scrapeInfo ? 'Scraping & Saving...' : 'Saving...') : 'Add Content Piece'}
                        </button>
                    </form>
                </div>
            </div>
        </div>

        {/* Co-Pilot Trigger Button - Fixed position with proper z-index */}
        {!showCoPilot && anyAiKeyConfiguredForUser && (
            <button
                onClick={() => setShowCoPilot(true)}
                className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-xl z-40 transition-all hover:scale-110 focus:ring-4 focus:ring-indigo-300"
                title="Need help? Ask AI Co-Pilot!"
            >
                <SparklesIcon className="h-6 w-6" />
            </button>
        )}

        {/* AI Co-Pilot Sidebar - Fixed position with proper z-index */}
        {anyAiKeyConfiguredForUser && (
               <div className={`fixed top-16 right-0 h-[calc(100%-4rem)] w-[450px] bg-white dark:bg-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${showCoPilot ? 'translate-x-0' : 'translate-x-full'}`}>
                <AiCoPilotSidebar
                    isOpen={showCoPilot}
                    onClose={() => setShowCoPilot(false)}
                    currentTitle={title}
                    currentBody={originalText}
                    onApplyContent={handleApplyCoPilotContent}
                    onApplyTitle={handleApplyCoPilotTitle}
                />
            </div>
        )}

        {/* Modals remain the same - Media Upload Modal */}
        {showMediaUploadModal && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={() => setShowMediaUploadModal(false)}>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                    <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-slate-100">Upload Image/Video</h3>
                    <input
                        type="file"
                        accept="image/*,video/mp4,video/quicktime,video/x-msvideo,video/webm"
                        onChange={handleFileSelectForUpload}
                        className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 dark:file:bg-slate-700 file:text-violet-700 dark:file:text-violet-200 hover:file:bg-violet-100 dark:hover:file:bg-slate-600 mb-4"
                    />
                    {fileToUpload && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Selected: {fileToUpload.name} ({(fileToUpload.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                    )}
                    <button
                        onClick={handleActualMediaUpload}
                        disabled={uploadingMedia || !fileToUpload}
                        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium transition-colors mb-4"
                    >
                        {uploadingMedia ? 'Uploading...' : 'Upload File'}
                    </button>
                    {mediaUploadError && (
                        <div className="text-sm text-red-500 dark:text-red-400 mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded">
                            {mediaUploadError}
                        </div>
                    )}
                    {uploadedMediaUrl && !uploadingMedia && (
                        <div className="border-t dark:border-slate-600 pt-4">
                            <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">Upload successful!</p>
                            <input 
                                type="text" 
                                readOnly 
                                value={uploadedMediaUrl} 
                                className="w-full p-2 border dark:border-slate-600 rounded text-sm bg-gray-50 dark:bg-slate-700 dark:text-slate-300 mb-3" 
                            />
                            <button 
                                onClick={() => insertUploadedMediaMarkdown(fileToUpload?.type.startsWith('image/'))}
                                className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                            >
                                Insert Markdown at Cursor
                            </button>
                        </div>
                    )}
                    <button 
                        onClick={() => setShowMediaUploadModal(false)} 
                        className="w-full text-center py-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        )}

        {/* Image Suggestion Modal */}
        {showImageSuggestionModal && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={() => setShowImageSuggestionModal(false)}>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                    <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-slate-100">AI Image Suggestions</h3>
                    
                    {imageSuggestionLoading && (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading suggestions...</p>
                        </div>
                    )}
                    
                    {imageSuggestionError && (
                        <div className="text-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-4">
                            {imageSuggestionError}
                        </div>
                    )}

                    {!imageSuggestionLoading && imageKeywords.length > 0 && (
                        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-medium">AI Suggested Keywords:</span> {imageKeywords.join(', ')}
                            </p>
                        </div>
                    )}
                    
                    {!imageSuggestionLoading && suggestedImages.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {suggestedImages.map(img => (
                                <div 
                                    key={img.id} 
                                    className="relative border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow" 
                                    onClick={() => handleInsertImageMarkdownFromUnsplash(img.urls.regular, img.alt_description || img.description || imageKeywords[0] || "suggested image")}
                                >
                                    <img 
                                        src={img.urls.small} 
                                        alt={img.alt_description || "Suggested image"} 
                                        className="w-full h-32 object-cover group-hover:opacity-90 transition-opacity" 
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                        By {img.user.name}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {!imageSuggestionLoading && !imageSuggestionError && suggestedImages.length === 0 && imageKeywords.length > 0 && (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-8">No images found on Unsplash for the suggested keywords.</p>
                    )}
                    
                    <button 
                        onClick={() => setShowImageSuggestionModal(false)} 
                        className="w-full mt-6 py-3 text-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        )}
    </div>
);
};

export default NewContentPage;
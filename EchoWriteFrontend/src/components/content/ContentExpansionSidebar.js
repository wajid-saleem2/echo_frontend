// frontend/src/components/content/ContentExpansionSidebar.js (New File)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LightBulbIcon, QuestionMarkCircleIcon, ListBulletIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/apiConfig';

const API_URL = process.env.REACT_APP_API_URL; // Not strictly needed if axiosInstance has baseURL

const ContentExpansionSidebar = ({ originalText, contentTitle }) => {
    const { user: authUser } = useAuth();
    const [ideas, setIdeas] = useState([]);
    const [ideaType, setIdeaType] = useState('outlines'); // 'outlines', 'questions', 'subtopics', 'follow_ups'
    const [aiProvider, setAiProvider] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (authUser?.hasOpenAiApiKey) setAiProvider('openai');
        else if (authUser?.hasGeminiApiKey) setAiProvider('gemini');
        else if (authUser?.hasPerplexityApiKey) setAiProvider('perplexity');
        else setAiProvider('');
    }, [authUser]);

    const fetchExpansionIdeas = async (type = ideaType) => {
        if (!originalText || !aiProvider) {
            setError(aiProvider ? "Content is too short or missing." : "Please configure an AI provider in your profile.");
            return;
        }
        setIsLoading(true);
        setError('');
        setIdeas([]); // Clear previous ideas for the new type

        try {
            const response = await axiosInstance.post(`/ai/expansion-ideas`, {
                text: originalText,
                aiProvider,
                ideaType: type,
                count: 3 // Request 3 ideas by default
            });
            setIdeas(response.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to generate expansion ideas.');
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch initial ideas when component mounts or text/provider changes (optional)
    useEffect(() => {
        if (originalText && aiProvider && originalText.length > 100) { // Only fetch if there's enough text
            fetchExpansionIdeas(ideaType);
        } else {
            setIdeas([]); // Clear ideas if not enough text or no provider
        }
    }, [originalText, aiProvider, ideaType]); // Re-fetch if these change

    const ideaTypes = [
        { value: 'outlines', label: 'New Outlines', icon: ListBulletIcon },
        { value: 'questions', label: 'Key Questions', icon: QuestionMarkCircleIcon },
        { value: 'subtopics', label: 'Related Sub-topics', icon: LightBulbIcon },
        { value: 'follow_ups', label: 'Follow-up Ideas', icon: ArrowPathIcon },
    ];

    // renderIdea function as you have it (it seems correct)
    const renderIdea = (idea, index) => {
        if (ideaType === 'outlines' && typeof idea === 'object' && idea !== null && idea.title !== undefined) { // More robust check
            return (
                <div key={`${ideaType}-${index}`} className="p-3 bg-slate-100 dark:bg-slate-700 rounded-md mb-2"> {/* Added mb-2 */}
                    <h5 className="font-semibold text-sm text-indigo-700 dark:text-indigo-400 mb-1">{idea.title || "Outline Idea"}</h5>
                    {idea.outlinePoints && idea.outlinePoints.length > 0 && (
                        <ul className="list-disc list-inside text-xs text-gray-600 dark:text-gray-300 space-y-0.5">
                            {idea.outlinePoints.map((point, i) => <li key={i}>{point}</li>)}
                        </ul>
                    )}
                </div>
            );
        } else if (typeof idea === 'string') { // For questions, subtopics, follow_ups
            return (
                <p key={`${ideaType}-${index}`} className="p-2.5 bg-slate-100 dark:bg-slate-700 rounded-md text-sm text-gray-700 dark:text-gray-200 mb-2"> {/* Added mb-2 */}
                    {idea}
                </p>
            );
        }
        // Fallback or if idea is not in expected format for the current ideaType
        console.warn("RenderIdea: Unexpected idea format or type mismatch", { idea, ideaType });
        return null; // Or some placeholder
    };

    if (!authUser || (!authUser.hasOpenAiApiKey && !authUser.hasGeminiApiKey && !authUser.hasPerplexityApiKey)) {
        return (
            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md text-sm text-gray-600 dark:text-gray-300">
                <LightBulbIcon className="h-6 w-6 text-yellow-500 mb-2" />
                Connect an AI provider in your <Link to="/profile" className="text-blue-500 hover:underline">profile</Link> to get content expansion ideas.
            </div>
        );
    }


    return (
        <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-lg h-full flex flex-col">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100 mb-1">Content Expansion AI</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Get ideas to expand on "{contentTitle.substring(0,30)}..."</p>

            <div className="mb-3">
                <label htmlFor="ideaTypeSelect" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Idea Type:</label>
                <select
                    id="ideaTypeSelect"
                    value={ideaType}
                    onChange={(e) => { setIdeaType(e.target.value); /* fetchExpansionIdeas(e.target.value); // Optionally fetch on change */ }}
                    className="mt-1 block w-full p-2 text-sm border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                >
                    {ideaTypes.map(it => <option key={it.value} value={it.value}>{it.label}</option>)}
                </select>
            </div>
             <div className="mb-3">
                 <label htmlFor="aiProviderSelectSidebar" className="block text-xs font-medium text-gray-700 dark:text-gray-300">AI Provider:</label>
                 <select
                    id="aiProviderSelectSidebar"
                    value={aiProvider}
                    onChange={(e) => setAiProvider(e.target.value)}
                    className="mt-1 block w-full p-2 text-sm border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                    disabled={isLoading}
                 >
                     {authUser?.hasOpenAiApiKey && <option value="openai">OpenAI</option>}
                     {authUser?.hasGeminiApiKey && <option value="gemini">Gemini</option>}
                     {authUser?.hasPerplexityApiKey && <option value="perplexity">Perplexity</option>}
                     {(!authUser?.hasOpenAiApiKey && !authUser?.hasGeminiApiKey && !authUser?.hasPerplexityApiKey) && <option value="" disabled>No Keys</option>}
                 </select>
             </div>


            <button
                onClick={() => fetchExpansionIdeas(ideaType)}
                disabled={isLoading || !aiProvider || !originalText || originalText.length < 50}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-4 rounded-md text-sm disabled:opacity-50 mb-3"
            >
                {isLoading ? 'Generating...' : 'Get Fresh Ideas'}
            </button>

            {error && <p className="text-xs text-red-500 bg-red-100 dark:bg-red-800 dark:text-red-300 p-2 rounded mb-2">{error}</p>}
            <div className="flex-grow overflow-y-auto space-y-2 pr-1 -mr-1 mt-3"> {/* Adjusted space-y and mt */}
                {isLoading && <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">Generating ideas...</p>}
                {!isLoading && ideas.length === 0 && <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">Select an idea type and click "Get Fresh Ideas".</p>}
                
                {!isLoading && ideas.length > 0 && ideas.map((ideaItem, index) => {
                    // Directly call renderIdea here. It should return JSX or null.
                    const renderedElement = renderIdea(ideaItem, index);
                    if (React.isValidElement(renderedElement)) {
                        return renderedElement;
                    } else if (renderedElement === null) {
                        return null; // Explicitly handle null if renderIdea can return it
                    } else {
                        // This case should ideally not be hit if renderIdea is correct
                        console.error("RenderIdea did not return a valid React element for:", ideaItem);
                        return <p key={`error-${index}`} className="text-red-500 text-xs">Error rendering idea.</p>;
                    }
                })}
            </div>
        </div>
    );
};
export default ContentExpansionSidebar;
// frontend/src/components/ai/AiCoPilotSidebar.js (New File)
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { PaperAirplaneIcon, SparklesIcon, XMarkIcon, ArrowUpTrayIcon } from '@heroicons/react/24/solid';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import axiosInstance from '../../api/apiConfig';

const AiCoPilotSidebar = ({ isOpen, onClose, currentTitle, currentBody, onApplyContent, onApplyTitle }) => {
    const { user: authUser } = useAuth();
    const [messages, setMessages] = useState([]); // { role: 'user' | 'assistant', content: string }
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [aiProvider, setAiProvider] = useState('');
    const [generationTarget, setGenerationTarget] = useState('general_assistance'); // "titles_only", "blog_post_intro", "full_article_draft"

    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (authUser?.hasOpenAiApiKey) setAiProvider('openai');
        else if (authUser?.hasGeminiApiKey) setAiProvider('gemini');
        else if (authUser?.hasPerplexityApiKey) setAiProvider('perplexity');
        else setAiProvider('');
    }, [authUser]);

    useEffect(() => { // Scroll to bottom when new messages are added
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => { // Initial message from AI when sidebar opens
        if (isOpen && messages.length === 0) {
            setMessages([{ role: 'assistant', content: "Hi there! How can I help you create some amazing content today? Tell me about your topic or what you'd like to generate (e.g., a title, an intro, or a full draft)." }]);
        } else if (!isOpen) {
            // setMessages([]); // Optionally clear messages when closed
        }
    }, [isOpen]);


    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!userInput.trim() || !aiProvider) {
            setError(!aiProvider ? "Please select an AI provider in your profile." : "Please enter your request.");
            return;
        }
        const newUserMessage = { role: 'user', content: userInput };
        setMessages(prev => [...prev, newUserMessage]);
        setUserInput('');
        setIsLoading(true);
        setError('');

        try {
            const payload = {
                userPrompt: userInput,
                conversationHistory: messages.slice(-6), // Send last 3 turns of conversation for context
                generationTarget: generationTarget, // User can specify this or AI can infer
                existingTitle: currentTitle,
                existingBody: currentBody.substring(0, 500), // Send some context
                aiProvider,
                numVariations: generationTarget === 'titles_only' ? 3 : 1 // Example: 3 variations for titles
            };
            const response = await axiosInstance.post(`/ai/chat-content-assist`, payload);

            if (response.data && response.data.generatedText) {
                // AI might return multiple options separated by a delimiter
                // For simplicity, we'll treat the whole response as one message for now.
                // You can parse for "Option 1:", "Option 2:" if AI is prompted to provide them.
                const assistantResponse = { role: 'assistant', content: response.data.generatedText };
                setMessages(prev => [...prev, assistantResponse]);
            } else if (response.data.error) {
                setError(response.data.error);
                setMessages(prev => [...prev, {role: 'assistant', content: `Sorry, I encountered an error: ${response.data.error}`}]);
            } else {
                throw new Error("Unexpected response from AI assistant.");
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || "AI assistant request failed.";
            setError(errorMsg);
            setMessages(prev => [...prev, {role: 'assistant', content: `Sorry, something went wrong: ${errorMsg}`}]);
        } finally {
            setIsLoading(false);
        }
    };

    // Function to extract parts of AI response if it's structured
    // This is a simple example; you'll need to refine based on AI output format
    const extractContentForField = (text, fieldType) => {
        if (!text) return "";
        if (fieldType === 'title') {
            const titleMatch = text.match(/^(?:Title:|##\s)(.*)/im); // Matches "Title: Actual Title" or "## Actual Title"
            if (titleMatch && titleMatch[1]) return titleMatch[1].trim();
            // If no explicit title, take the first short line as a guess
            const lines = text.split('\n');
            if (lines[0] && lines[0].length < 100 && lines[0].length > 3) return lines[0].trim();
            return ""; // No clear title found
        }
        if (fieldType === 'body') {
            // Try to remove a title if it's the first line
            const lines = text.split('\n');
            if (lines[0] && (lines[0].toLowerCase().startsWith('title:') || lines[0].startsWith('## '))) {
                return lines.slice(1).join('\n').trim();
            }
            return text; // Return full text as body
        }
        return text; // Default
    };


    if (!isOpen) return null;

    const anyAiKeyConfigured = authUser?.hasOpenAiApiKey || authUser?.hasGeminiApiKey || authUser?.hasPerplexityApiKey;

    return (
        <div className="fixed top-0 right-0 h-full w-full sm:w-96 md:w-[450px] bg-white dark:bg-slate-800 shadow-2xl z-40 flex flex-col transform transition-transform duration-300 ease-in-out"
             style={{ transform: isOpen ? 'translateX(0)' : 'translateX(100%)' }}>
            <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100 flex items-center">
                    <SparklesIcon className="h-5 w-5 text-indigo-500 mr-2"/> AI Content Co-Pilot
                </h3>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <XMarkIcon className="h-6 w-6" />
                </button>
            </div>

            {/* Conversation Area */}
            <div className="flex-grow p-4 space-y-3 overflow-y-auto">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-2.5 rounded-lg shadow ${
                            msg.role === 'user'
                                ? 'bg-indigo-500 text-white rounded-br-none'
                                : 'bg-slate-100 dark:bg-slate-700 text-gray-800 dark:text-slate-100 rounded-bl-none'
                        }`}>
                            {/* Render AI responses as Markdown if they contain it */}
                            {msg.role === 'assistant' ? (
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                </div>
                            ) : (
                                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                            )}
                            {/* "Use this" buttons for assistant messages */}
                            {msg.role === 'assistant' && msg.content && !msg.content.toLowerCase().includes("sorry") && (
                                <div className="mt-2 pt-2 border-t border-indigo-400 dark:border-slate-600 flex flex-wrap gap-1.5">
                                    <button onClick={() => onApplyTitle(extractContentForField(msg.content, 'title'))}
                                        className="text-xxs bg-indigo-100 dark:bg-indigo-700 text-indigo-700 dark:text-indigo-200 hover:bg-indigo-200 dark:hover:bg-indigo-600 px-2 py-0.5 rounded-full">
                                        Use as Title
                                    </button>
                                    <button onClick={() => onApplyContent(extractContentForField(msg.content, 'body'))}
                                        className="text-xxs bg-indigo-100 dark:bg-indigo-700 text-indigo-700 dark:text-indigo-200 hover:bg-indigo-200 dark:hover:bg-indigo-600 px-2 py-0.5 rounded-full">
                                        Use as Body
                                    </button>
                                     <button onClick={() => onApplyContent(msg.content, true)} // true to append
                                        className="text-xxs bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-500 px-2 py-0.5 rounded-full">
                                        Append to Body
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} /> {/* For scrolling to bottom */}
                {isLoading && <p className="text-xs text-center text-gray-500 dark:text-gray-400 animate-pulse">AI is thinking...</p>}
                {error && <p className="text-xs text-red-500 dark:text-red-400 p-2 bg-red-50 dark:bg-red-900 rounded">{error}</p>}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                 {/* --- AI PROVIDER SELECTION --- */}
                 {anyAiKeyConfigured && (
                    <div className="mb-2">
                        <label htmlFor="coPilotAiProvider" className="text-xs font-medium text-gray-600 dark:text-gray-300">AI Provider:</label>
                        <select
                            id="coPilotAiProvider"
                            value={aiProvider}
                            onChange={(e) => setAiProvider(e.target.value)}
                            className="w-full p-1.5 mt-1 text-xs border-gray-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700 dark:text-slate-100 focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={isLoading}
                        >
                            <option value="" disabled={!!aiProvider}>-- Select Provider --</option>
                            {authUser?.hasOpenAiApiKey && <option value="openai">OpenAI</option>}
                            {authUser?.hasGeminiApiKey && <option value="gemini">Gemini</option>}
                            {authUser?.hasPerplexityApiKey && <option value="perplexity">Perplexity</option>}
                        </select>
                    </div>
                )}
                {/* --- END AI PROVIDER SELECTION --- */}

                {/* Optional: Dropdown for generationTarget */}
                <div className="mb-2">
                    <label htmlFor="generationTarget" className="text-xs font-medium text-gray-600 dark:text-gray-300">I want AI to help me with:</label>
                    <select id="generationTarget" value={generationTarget} onChange={(e) => setGenerationTarget(e.target.value)}
                        className="w-full p-1.5 mt-1 text-xs border-gray-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700 dark:text-slate-100">
                        <option value="general_assistance">General Help / Refine</option>
                        <option value="titles_only">Suggest Titles</option>
                        <option value="blog_post_intro">Write an Introduction</option>
                        <option value="body_paragraph">Write a Paragraph</option>
                        <option value="full_article_draft">Draft Full Article</option>
                        {/* Add more specific targets */}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <textarea
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder={!aiProvider ? "Configure AI Provider in Profile" : "Ask AI for help or provide instructions..."}
                        className="flex-grow p-2.5 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm text-sm bg-white dark:bg-slate-700 dark:text-slate-100 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                        rows="2"
                        disabled={isLoading || !aiProvider}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }}
                    />
                    <button type="submit" disabled={isLoading || !userInput.trim() || !aiProvider}
                        className="p-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md disabled:opacity-50">
                        <PaperAirplaneIcon className="h-5 w-5" />
                    </button>
                </div>
            </form>
        </div>
    );
};
export default AiCoPilotSidebar;
// frontend/src/components/modals/TranslationModal.js (New File)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SUPPORTED_LANGUAGES } from '../../utils/constants'; // Assuming you created this
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/apiConfig';

const TranslationModal = ({ isOpen, onClose, textToTranslate, onTranslationComplete, originalLanguage = "English" }) => {
    const { user: authUser } = useAuth();
    const [targetLanguage, setTargetLanguage] = useState('es'); // Default to Spanish
    const [aiProvider, setAiProvider] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (authUser?.hasOpenAiApiKey) setAiProvider('openai');
        else if (authUser?.hasGeminiApiKey) setAiProvider('gemini');
        else if (authUser?.hasPerplexityApiKey) setAiProvider('perplexity');
        else setAiProvider('');
    }, [authUser]);

    useEffect(() => { // Reset when modal opens with new text
        if (isOpen) {
            setTranslatedText('');
            setError('');
        }
    }, [isOpen, textToTranslate]);

    const handleTranslate = async () => {
        if (!textToTranslate || !targetLanguage || !aiProvider) {
            setError("Missing text, target language, or AI provider.");
            return;
        }
        setIsLoading(true);
        setError('');
        setTranslatedText('');
        try {
            const response = await axiosInstance.post(`/ai/translate-text`, {
                text: textToTranslate,
                targetLanguage: SUPPORTED_LANGUAGES.find(l => l.code === targetLanguage)?.name || targetLanguage, // Send full name
                aiProvider,
                // sourceLanguage: "auto" // Backend defaults to auto
            });
            if (response.data && response.data.translatedText) {
                setTranslatedText(response.data.translatedText);
            } else if (response.data.error) {
                setError(response.data.error);
            } else {
                setError("Translation failed to return text.");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Error during translation.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const anyAiKeyConfigured = authUser?.hasOpenAiApiKey || authUser?.hasGeminiApiKey || authUser?.hasPerplexityApiKey;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-slate-100">Translate Content</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Original Text (Snippet):</p>
                <pre className="text-sm bg-gray-100 dark:bg-slate-700 p-2 rounded max-h-20 overflow-y-auto mb-4 whitespace-pre-wrap break-words dark:text-slate-200">
                    {textToTranslate.substring(0, 200)}{textToTranslate.length > 200 && "..."}
                </pre>

                {!anyAiKeyConfigured && <p className="text-sm text-center py-4 text-red-600 dark:text-red-400">Please <Link to="/profile" className="underline">configure an AI API key</Link> to use translation.</p>}

                {anyAiKeyConfigured && (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label htmlFor="targetLanguage" className="block text-xs font-medium text-gray-700 dark:text-slate-300">Translate to:</label>
                                <select id="targetLanguage" value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)}
                                    className="mt-1 block w-full p-2 border dark:border-slate-600 rounded-md shadow-sm sm:text-sm bg-white dark:bg-slate-700 dark:text-slate-100">
                                    {SUPPORTED_LANGUAGES.map(lang => (
                                        <option key={lang.code} value={lang.code}>{lang.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="translateAiProvider" className="block text-xs font-medium text-gray-700 dark:text-slate-300">Using AI Provider:</label>
                                <select id="translateAiProvider" value={aiProvider} onChange={(e) => setAiProvider(e.target.value)}
                                    className="mt-1 block w-full p-2 border dark:border-slate-600 rounded-md shadow-sm sm:text-sm bg-white dark:bg-slate-700 dark:text-slate-100"
                                    disabled={isLoading}>
                                    {authUser?.hasOpenAiApiKey && <option value="openai">OpenAI</option>}
                                    {authUser?.hasGeminiApiKey && <option value="gemini">Gemini</option>}
                                    {authUser?.hasPerplexityApiKey && <option value="perplexity">Perplexity</option>}
                                </select>
                            </div>
                        </div>

                        <button onClick={handleTranslate} disabled={isLoading || !aiProvider}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2.5 px-4 rounded-md text-sm disabled:opacity-60 mb-3">
                            {isLoading ? 'Translating...' : 'Translate Text'}
                        </button>
                    </>
                )}

                {error && <p className="text-xs text-red-500 dark:text-red-400 mb-3 p-2 bg-red-50 dark:bg-red-900 rounded">{error}</p>}

                {translatedText && !isLoading && (
                    <div className="mt-4 border-t dark:border-slate-600 pt-3">
                        <p className="text-sm font-semibold mb-1 text-gray-700 dark:text-slate-200">Translated Text:</p>
                        <pre className="p-3 bg-slate-50 dark:bg-slate-700 rounded-md text-sm text-gray-800 dark:text-slate-100 whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
                            {translatedText}
                        </pre>
                        <button onClick={() => { onTranslationComplete(translatedText, targetLanguage); onClose(); }}
                            className="mt-3 w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md text-sm">
                            Use This Translation
                        </button>
                    </div>
                )}
                <button onClick={onClose} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mt-4 w-full text-center py-2">
                    Cancel
                </button>
            </div>
        </div>
    );
};
export default TranslationModal;
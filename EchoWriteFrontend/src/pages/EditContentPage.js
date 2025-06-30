// frontend/src/pages/EditContentPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../api/apiConfig';

const API_URL = process.env.REACT_APP_API_URL;

const EditContentPage = () => {
    const [title, setTitle] = useState('');
    const [originalText, setOriginalText] = useState('');
    const [sourceUrl, setSourceUrl] = useState('');
    const [contentType, setContentType] = useState('general_text');
    const [tags, setTags] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const {authUser} = useAuth();
    const navigate = useNavigate();
    const { id } = useParams(); // Get content ID from URL

    // Example in AllContentPage.js or a layout component
const [folders, setFolders] = useState([]);
const [foldersLoading, setFoldersLoading] = useState(true);

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

    const fetchContentPiece = useCallback(async () => {
        setInitialLoading(true);
        try {
            const response = await axios.get(`${API_URL}/content/${id}`);
            const content = response.data;
            setTitle(content.title);
            setOriginalText(content.originalText);
            setSourceUrl(content.sourceUrl || '');
            setContentType(content.contentType);
            setTags(content.tags ? content.tags.join(', ') : '');
        } catch (err) {
            setError('Failed to load content piece for editing.');
            console.error(err);
        } finally {
            setInitialLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchContentPiece();
    }, [fetchContentPiece]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!title || !originalText) {
            setError('Title and Original Text are required.');
            setLoading(false);
            return;
        }

        try {
            const payload = {
                title,
                originalText,
                sourceUrl,
                contentType,
                tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
            };
            await axios.put(`${API_URL}/content/${id}`, payload);
            navigate(`/content/${id}`); // Redirect to content detail page after update
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update content. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return <p className="text-center mt-10">Loading content for editing...</p>;
    }

    return (
        <div className="max-w-2xl mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg">
            <h1 className="text-3xl font-bold text-center mb-8">Edit Content Piece</h1>
            {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</p>}
            <form onSubmit={handleSubmit}>
                {/* Form fields are identical to NewContentPage.js */}
                {/* Title */}
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">Title</label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                        id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
                    />
                </div>
                {/* Source URL */}
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="sourceUrl">Source URL (Optional)</label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                        id="sourceUrl" type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)}
                    />
                </div>
                {/* Original Text */}
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="originalText">Original Text</label>
                    <textarea
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 h-48"
                        id="originalText" value={originalText} onChange={(e) => setOriginalText(e.target.value)} required
                    />
                </div>
                {/* Content Type */}
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="contentType">Content Type</label>
                    <select
                        id="contentType" value={contentType} onChange={(e) => setContentType(e.target.value)}
                        className="shadow border rounded w-full py-2 px-3 text-gray-700"
                    >
                        <option value="general_text">General Text</option>
                        <option value="blog_post">Blog Post</option>
                        <option value="video_script">Video Script</option>
                        <option value="podcast_transcript">Podcast Transcript</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                {/* Tags */}
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="tags">Tags (Comma-separated)</label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                        id="tags" type="text" value={tags} onChange={(e) => setTags(e.target.value)}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
                        type="submit" disabled={loading}
                    >
                        {loading ? 'Saving Changes...' : 'Save Changes'}
                    </button>
                </div>
                <Link to={`/content/${id}`} className="mt-4 inline-block text-center w-full text-gray-600 hover:text-gray-800">
                    Cancel
                </Link>
            </form>
        </div>
    );
};

export default EditContentPage;
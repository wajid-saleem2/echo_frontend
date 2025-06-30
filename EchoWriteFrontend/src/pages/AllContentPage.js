// frontend/src/pages/AllContentPage.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import FolderSidebar from '../components/layout/FolderSidebar'; // Assuming this path is correct
import axiosInstance from '../api/apiConfig';
import { TrashIcon } from '@heroicons/react/24/outline';

// const API_URL = process.env.REACT_APP_API_URL; // Not strictly needed if axiosInstance has baseURL

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric'
    });
};

const AllContentPage = () => {
    const { user: authUser } = useAuth();
    const [contentData, setContentData] = useState({
        data: [],
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        limit: 9 // Adjusted to 9 for better grid layout (3x3)
    });
    const [loading, setLoading] = useState(true);
    const [itemActionLoading, setItemActionLoading] = useState(null); // For delete loading state, stores ID of item being acted upon
    const [error, setError] = useState('');
    const { id } = useParams();

    const [searchParams, setSearchParams] = useSearchParams();

    // --- Folder State ---
    const [folders, setFolders] = useState([]); // To display folder name in title, fetched by FolderSidebar
    const [currentFolderFilter, setCurrentFolderFilter] = useState(searchParams.get('folderId') || null);

    // --- Tag Filter State ---
    const [allUserTags, setAllUserTags] = useState([]);
    const [selectedFilterTags, setSelectedFilterTags] = useState(
        searchParams.get('tags') ? searchParams.get('tags').split(',') : (searchParams.get('tagsAny') ? searchParams.get('tagsAny').split(',') : [])
    );
    const [tagFilterLogic, setTagFilterLogic] = useState(searchParams.get('tags') ? 'AND' : (searchParams.get('tagsAny') ? 'OR' : 'AND'));

// First, add this at the top of your component:
const [isFetching, setIsFetching] = useState(false);
const fetchTimeoutRef = useRef(null);

const [loadingInitialized, setLoadingInitialized] = useState(false);

// 1. Fixed loading state management in fetchAllContent
const fetchAllContent = useCallback(async (
    page = 1, 
    limit = contentData.limit, 
    folderToFilter = currentFolderFilter, 
    tagsToFilter = selectedFilterTags, 
    logicType = tagFilterLogic
) => {
    if (!authUser) return;
    
    // Clear any pending fetch
    if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
    }
    
    // Set loading state immediately for UI feedback
    setLoading(true);
    
    // Use a small timeout to debounce rapid requests
    fetchTimeoutRef.current = setTimeout(async () => {
        try {
            console.log(`[DEBUG] Fetching page ${page} with filter:`, {
                folder: folderToFilter,
                tags: tagsToFilter,
                logic: logicType
            });
            
            const params = { page, limit };
            if (folderToFilter) {
                params.folderId = folderToFilter;
            }
            if (tagsToFilter.length > 0) {
                if (logicType === 'AND') params.tags = tagsToFilter.join(',');
                else params.tagsAny = tagsToFilter.join(',');
            }

            const response = await axiosInstance.get(`/content`, { params });
            
            // Important: Only update state if the component is still mounted
            // and if the response matches our current request parameters
            console.log('[DEBUG] Fetch successful:', response.data);
            setContentData(response.data);
            setLoading(false); // Set loading to false AFTER setting content data
            
        } catch (err) {
            console.error("[DEBUG] Fetch Error:", err);
            setError(err.response?.data?.message || 'Failed to fetch content pieces.');
            setLoading(false); // Make sure to set loading to false even on error
        }
    }, 100); // Small debounce time
    
}, [authUser, contentData.limit, currentFolderFilter]);

// 2. Add content debugging and more robust loading check
// Add this right before your return statement
useEffect(() => {
    console.log("[DEBUG] Content state:", {
        isLoading: loading,
        contentLength: contentData?.data?.length || 0,
        hasError: !!error
    });
}, [loading, contentData, error]);

// 3. Add cleanup for the timeout
useEffect(() => {
    return () => {
        if (fetchTimeoutRef.current) {
            clearTimeout(fetchTimeoutRef.current);
        }
    };
}, []);

// Then add this effect to prevent premature loading
useEffect(() => {
    if (!loadingInitialized && authUser) {
        setLoadingInitialized(true);
        // Get initial page and filters from URL
        const initialPage = parseInt(searchParams.get('page')) || 1;
        const initialFolder = searchParams.get('folderId') || null;
        const initialTagsAnd = searchParams.get('tags') || '';
        const initialTagsOr = searchParams.get('tagsAny') || '';
        const initialTags = initialTagsAnd || initialTagsOr;
        const initialTagsArray = initialTags ? initialTags.split(',') : [];
        const initialLogic = initialTagsAnd ? 'AND' : 'OR';

        // Initial content fetch
        fetchAllContent(initialPage, contentData.limit, initialFolder, initialTagsArray, initialLogic);
    }
}, [authUser, loadingInitialized, searchParams, contentData.limit, fetchAllContent]);

    // Effect to fetch content when page, folder, or tags change via URL or state
    // Modified useEffect
  // 4. Enhanced useEffect for URL changes to fix pagination
useEffect(() => {
    // Extract all relevant URL parameters
    const pageFromUrl = parseInt(searchParams.get('page')) || 1;
    const folderFromUrl = searchParams.get('folderId') || null;
    const tagsFromUrl = searchParams.get('tags') || '';
    const tagsAnyFromUrl = searchParams.get('tagsAny') || '';
    const currentUrlTags = tagsFromUrl || tagsAnyFromUrl;
    const currentUrlTagsArray = currentUrlTags ? currentUrlTags.split(',') : [];
    const currentUrlLogic = tagsFromUrl ? 'AND' : 'OR';
    
    console.log(`[DEBUG] URL params changed: page=${pageFromUrl}, folder=${folderFromUrl}, tags=${currentUrlTags}`);

    // Update state to match URL
    if (folderFromUrl !== currentFolderFilter) {
        setCurrentFolderFilter(folderFromUrl);
    }
    
    if (JSON.stringify(currentUrlTagsArray) !== JSON.stringify(selectedFilterTags)) {
        setSelectedFilterTags(currentUrlTagsArray);
    }
    
    if (currentUrlLogic !== tagFilterLogic && currentUrlTags) {
        setTagFilterLogic(currentUrlLogic);
    }
    
    // Always fetch content when URL changes - this is key for pagination to work
    fetchAllContent(
        pageFromUrl,
        contentData.limit,
        folderFromUrl,
        currentUrlTagsArray,
        currentUrlLogic
    );
}, [searchParams, contentData.limit, fetchAllContent]);

    useEffect(() => {
        const fetchUserUniqueTags = async () => {
            if (!authUser) return;
            try {
                console.log("[FRONTEND] Fetching unique user tags..."); // DEBUG
                const response = await axiosInstance.get('/content/tags/unique'); // Endpoint path
                console.log("[FRONTEND] Received unique tags:", response.data); // DEBUG
                setAllUserTags(response.data || []); // Set state, ensure it's an array
            } catch (err) {
                console.error("Failed to fetch user tags", err);
                setAllUserTags([]); // Set to empty on error
            }
        };
        if (authUser) { // Ensure authUser is available before fetching
            fetchUserUniqueTags();
        }
    }, [authUser]); // Dependency: authUser


    const handleSelectFolder = (folderId) => {
        // This will update searchParams, triggering the useEffect above to refetch
        const newSearchParams = new URLSearchParams(searchParams);
        if (folderId) {
            newSearchParams.set('folderId', folderId);
        } else {
            newSearchParams.delete('folderId');
        }
        newSearchParams.set('page', '1'); // Reset to page 1
        setSearchParams(newSearchParams, { replace: true });
    };

    // 1. Modified handleTagFilterChange function
const handleTagFilterChange = (tag) => {
    // Update selected tags directly
    const newSelectedTags = selectedFilterTags.includes(tag)
        ? selectedFilterTags.filter(t => t !== tag)
        : [...selectedFilterTags, tag];
    
    setSelectedFilterTags(newSelectedTags); // Update state immediately
    
    // Then update URL without triggering unnecessary fetches
    const newSearchParams = new URLSearchParams(searchParams);
    if (newSelectedTags.length > 0) {
        // Use the current tag logic to determine which param to set
        if (tagFilterLogic === 'AND') {
            newSearchParams.set('tags', newSelectedTags.join(','));
            newSearchParams.delete('tagsAny');
        } else {
            newSearchParams.set('tagsAny', newSelectedTags.join(','));
            newSearchParams.delete('tags');
        }
    } else {
        // No tags selected, clear both params
        newSearchParams.delete('tags');
        newSearchParams.delete('tagsAny');
    }
    newSearchParams.set('page', '1'); // Reset to page 1
    
    // Update URL and fetch content manually instead of relying on URL change effect
    setSearchParams(newSearchParams, { replace: true });
    fetchAllContent(1, contentData.limit, currentFolderFilter, newSelectedTags, tagFilterLogic);
};

// 2. Modified handleTagLogicChange function
const handleTagLogicChange = (newLogic) => {
    if (selectedFilterTags.length > 0) {
        // First update the state
        setTagFilterLogic(newLogic);
        
        // Then update URL params based on new logic
        const newSearchParams = new URLSearchParams(searchParams);
        if (newLogic === 'AND') {
            newSearchParams.set('tags', selectedFilterTags.join(','));
            newSearchParams.delete('tagsAny');
        } else {
            newSearchParams.set('tagsAny', selectedFilterTags.join(','));
            newSearchParams.delete('tags');
        }
        newSearchParams.set('page', '1'); // Reset to page 1
        
        // Update URL and fetch content directly
        setSearchParams(newSearchParams, { replace: true });
        fetchAllContent(1, contentData.limit, currentFolderFilter, selectedFilterTags, newLogic);
    } else {
        setTagFilterLogic(newLogic); // Just update state
    }
};



   // 1. Fixed handlePageChange function with direct fetching
const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= contentData.totalPages) {
        // Update URL params
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('page', newPage.toString());
        setSearchParams(newSearchParams, { replace: true });
        
        // Directly fetch content with the new page
        fetchAllContent(
            newPage, 
            contentData.limit, 
            currentFolderFilter, 
            selectedFilterTags, 
            tagFilterLogic
        );
    }
};

    const getPageTitle = () => {
        if (currentFolderFilter && currentFolderFilter !== 'unfoldered') {
            const folder = folders.find(f => f._id === currentFolderFilter);
            return folder ? `Content in "${folder.name}"` : 'Folder Content';
        }
        if (currentFolderFilter === 'unfoldered') {
            return 'Unfoldered Content';
        }
        return 'All Your Content';
    };

    // --- NEW: Handler for Deleting a Content Piece ---
    const handleDeleteContentPiece = async (pieceIdToDelete) => {
        if (window.confirm("Are you sure you want to delete this content piece? This action cannot be undone.")) {
            setItemActionLoading(pieceIdToDelete); // Set loading for this specific item
            setError('');
            try {
                await axiosInstance.delete(`/content/${pieceIdToDelete}`);
                // Refetch content for the current page OR remove item from local state
                // Option 1: Refetch (simpler, ensures data consistency)
                fetchAllContent(contentData.currentPage, contentData.limit, currentFolderFilter, selectedFilterTags, tagFilterLogic);
                // Option 2: Remove from local state (faster UI update, but might get out of sync if totalItems changes significantly)
                // setContentData(prev => ({
                //     ...prev,
                //     data: prev.data.filter(p => p._id !== pieceIdToDelete),
                //     totalItems: prev.totalItems - 1
                //     // Note: totalPages might need recalculation if an item is removed from the last page
                // }));
                // alert("Content piece deleted successfully."); // Use toast
            } catch (err) {
                setError(err.response?.data?.message || "Failed to delete content piece.");
                console.error("Delete Content Piece Error:", err);
            } finally {
                setItemActionLoading(null);
            }
        }
    };
    // --- End New Handler ---


    if (loading && contentData.data.length === 0 && !authUser) {
        return <p className="text-center mt-10 text-gray-600">Loading...</p>;
    }
     if (!authUser && !loading) { // Check after loading attempt if still no authUser
        return <p className="text-center mt-10 text-gray-600">Please log in to view content.</p>;
    }


    return (
        <div className="max-w-7xl mx-auto mt-8 p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                 {/* Sidebar Area - Fixed position on larger screens, sticky on medium screens */}
                 <div className="md:w-72 lg:w-80 flex-shrink-0 md:sticky md:top-20 md:self-start">
                    <div className="space-y-6">
                        <FolderSidebar
                            selectedFolderId={currentFolderFilter}
                            onSelectFolder={handleSelectFolder}
                            onFoldersUpdate={setFolders}
                        />
                        {/* Tag Filter Section - Now wrapped in a div with max-height and overflow */}
                        <div className="bg-slate-50 p-4 rounded-lg shadow">
                            <h3 className="text-md font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-3">Filter by Tags</h3>
                            {allUserTags.length === 0 && <p className="text-xs text-gray-500">No tags available to filter.</p>}
                            <div className="mb-3">
                                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pb-1">
                                    {allUserTags.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => handleTagFilterChange(tag)}
                                            className={`px-2.5 py-1 text-xs rounded-full border transition-colors
                                                ${selectedFilterTags.includes(tag)
                                                    ? 'bg-blue-500 text-white border-blue-500'
                                                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'}`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {selectedFilterTags.length > 0 && (
                                <div className="flex items-center space-x-3 text-xs pt-2 border-t border-gray-200">
                                    <label className="font-medium text-gray-600">Match:</label>
                                    <button onClick={() => handleTagLogicChange('AND')} className={`px-2 py-0.5 rounded ${tagFilterLogic === 'AND' ? 'font-bold text-white bg-blue-500' : 'text-gray-600 hover:bg-gray-200'}`}>All</button>
                                    <button onClick={() => handleTagLogicChange('OR')} className={`px-2 py-0.5 rounded ${tagFilterLogic === 'OR' ? 'font-bold text-white bg-blue-500' : 'text-gray-600 hover:bg-gray-200'}`}>Any</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content Listing Area */}
                <div className="flex-grow min-w-0"> {/* Added min-w-0 for flex child to prevent overflow */}
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 truncate" title={getPageTitle()}>
                            {getPageTitle()}
                        </h1>
                        <Link
                            to="/content/new"
                            className="mt-3 sm:mt-0 bg-green-500 hover:bg-green-700 text-white font-bold py-2.5 px-5 rounded-md shadow hover:shadow-lg transition-shadow flex-shrink-0"
                        >
                            + Add New Content
                        </Link>
                    </div>

                    {/* {loading && <p className="text-center py-10 text-gray-500">Loading content...</p>} */}
                    {error && <p className="text-center py-10 text-red-500 bg-red-100 p-4 rounded shadow">{error}</p>}
                    
                    {!error && (
    <>
        {loading && (
            <div className="text-center py-10">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                <p className="text-gray-500">Loading content...</p>
            </div>
        )}
        
        {!loading && contentData.data.length === 0 && (
            <div className="text-center py-16 bg-slate-50 shadow rounded-lg">
                <h2 className="text-xl font-semibold mb-3 text-gray-700">No content found.</h2>
                <p className="text-gray-600">Try adjusting your filters or add new content.</p>
            </div>
        )}

        {!loading && contentData.data.length > 0 && (
            <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                {contentData.data.map(piece => (
                                      <div key={piece._id} className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-5 flex flex-col justify-between hover:shadow-xl transition-shadow relative group"> {/* Added relative and group */}
                                       
                            {/* --- NEW: Delete Button --- */}
                            <button
                                            onClick={() => handleDeleteContentPiece(piece._id)}
                                            disabled={itemActionLoading === piece._id}
                                            className="absolute top-2 right-2 p-1.5 bg-red-100 dark:bg-red-700 text-red-500 dark:text-red-200 rounded-full hover:bg-red-200 dark:hover:bg-red-600 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity disabled:opacity-50"
                                            title="Delete Content Piece"
                                        >
                                            {itemActionLoading === piece._id ? (
                                                <svg className="animate-spin h-4 w-4 text-red-500 dark:text-red-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            ) : (
                                                <TrashIcon className="h-4 w-4" />
                                            )}
                                        </button>
                                        {/* --- End Delete Button --- */}
                                            <h3 className="text-md font-semibold text-gray-800 mb-1.5 truncate" title={piece.title}>
                                                {piece.title}
                                            </h3>
                                            {piece.folder && (
                                                <p className="text-xxs text-indigo-600 mb-1.5 font-medium">
                                                    In: {piece.folder.name}
                                                </p>
                                            )}
                                            <p className="text-gray-500 text-xs mb-1">
                                                Type: <span className="font-medium">{piece.contentType.replace('_', ' ')}</span>
                                            </p>
                                            <p className="text-gray-500 text-xs mb-2">
                                                Updated: {formatDate(piece.updatedAt)}
                                            </p>
                                            <p className="text-xs text-gray-600 mb-3 h-10 overflow-hidden text-ellipsis">
                                                {piece.originalTextSnippet || "No preview..."}
                                            </p>
                                            {piece.tags && piece.tags.length > 0 && (
                                                <div className="mb-3 flex flex-wrap gap-1">
                                                    {piece.tags.slice(0, 3).map(tag => (
                                                        <span key={tag} className="inline-block bg-gray-200 rounded-full px-2 py-0.5 text-xxs font-semibold text-gray-700">
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                    {piece.tags.length > 3 && <span className="text-xxs text-gray-500">...</span>}
                                                </div>
                                            )}
                                        
                                        <Link
                                            to={`/content/${piece._id}`}
                                            className="mt-auto block text-center bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-3 rounded w-full text-sm shadow hover:shadow-md transition-shadow"
                                        >
                                            View & Repurpose
                                        </Link>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination Controls */}
                            {contentData.totalPages > 1 && (
                                <div className="mt-10 flex justify-center items-center space-x-1 sm:space-x-2">
                                    <button
                                        onClick={() => handlePageChange(contentData.currentPage - 1)}
                                        disabled={contentData.currentPage === 1 || loading}
                                        className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    {/* Page numbers rendering logic (as before) */}
                                    {[...Array(contentData.totalPages).keys()].map(num => {
                                        const pageNum = num + 1;
                                        if ( contentData.totalPages <= 7 || pageNum === 1 || pageNum === contentData.totalPages || (pageNum >= contentData.currentPage - 1 && pageNum <= contentData.currentPage + 1) || (contentData.currentPage <= 3 && pageNum <= 3) || (contentData.currentPage >= contentData.totalPages - 2 && pageNum >= contentData.totalPages - 2) ) {
                                            return ( <button key={pageNum} onClick={() => handlePageChange(pageNum)} disabled={loading} className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium border rounded-md ${contentData.currentPage === pageNum ? 'bg-blue-500 text-white border-blue-500 z-10' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50' }`}>{pageNum}</button> );
                                        } else if ( (contentData.currentPage > 4 && pageNum === 2) || (contentData.currentPage < contentData.totalPages - 3 && pageNum === contentData.totalPages - 1) ) {
                                            return <span key={pageNum} className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-700">...</span>;
                                        }
                                        return null;
                                    })}
                                    <button
                                        onClick={() => handlePageChange(contentData.currentPage + 1)}
                                        disabled={contentData.currentPage === contentData.totalPages || loading}
                                        className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                            <p className="text-center text-sm text-gray-500 mt-4">
                                Page {contentData.currentPage} of {contentData.totalPages} (Total: {contentData.totalItems} items)
                            </p>
                        </>
                    )}
                    </>
                    )}
                    <Link to="/dashboard" className="mt-10 block text-center text-blue-600 hover:text-blue-800 hover:underline">
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AllContentPage;
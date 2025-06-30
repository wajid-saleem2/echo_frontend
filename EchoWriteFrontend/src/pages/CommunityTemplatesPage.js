// frontend/src/pages/CommunityRecipesPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { StarIcon, DocumentDuplicateIcon, ArrowDownTrayIcon } from '@heroicons/react/24/solid'; // Example icons
import axiosInstance from '../api/apiConfig';
import Spinner from '../components/layout/Loader';
// ... (Pagination component if you have one)

const CommunityTemplatesPage = () => {
    const [recipes, setRecipes] = useState([]);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0, limit: 12 });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Filters
    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedTag, setSelectedTag] = useState('');
    const [sortBy, setSortBy] = useState('sharedAt'); // 'sharedAt', 'popularity', 'rating'
    const [searchQuery, setSearchQuery] = useState('');

    const fetchCommunityRecipes = useCallback(async (page = 1) => {
        setIsLoading(true); setError('');
        try {
            const params = {
                page,
                limit: pagination.limit,
                sortBy,
                category: selectedCategory || undefined,
                tag: selectedTag || undefined,
                searchQuery: searchQuery || undefined,
            };
            const response = await axiosInstance.get('/templates/community', { params });
            setRecipes(response.data.data);
            setPagination({
                currentPage: response.data.currentPage,
                totalPages: response.data.totalPages,
                totalItems: response.data.totalItems,
                limit: response.data.limit,
            });
        } catch (err) { setError("Failed to load community recipes."); }
        finally { setIsLoading(false); }
    }, [pagination.limit, sortBy, selectedCategory, selectedTag, searchQuery]);

    useEffect(() => {
        fetchCommunityRecipes(1); // Fetch on initial load or when filters change
    }, [fetchCommunityRecipes]); // useCallback ensures stable function reference

    useEffect(() => { // Fetch categories and tags for filters
        const fetchFilters = async () => {
            try {
                const [catRes, tagRes] = await Promise.all([
                    axiosInstance.get('/templates/community/categories'),
                    axiosInstance.get('/templates/community/tags')
                ]);
                setCategories(catRes.data || []);
                setTags(tagRes.data || []);
            } catch (err) { console.error("Failed to load filters", err); }
        };
        fetchFilters();
    }, []);

    const handleCloneRecipe = async (recipeId, recipeName) => {
        if (window.confirm(`Clone "${recipeName}" to your recipes?`)) {
            try {
                await axiosInstance.post(`/templates/community/${recipeId}/clone`);
                alert("Recipe cloned successfully! You can find it in 'My Templates/Recipes'.");
                // Optionally refetch community recipes to update 'communityUses' count if displayed
                fetchCommunityRecipes(pagination.currentPage);
            } catch (err) { alert(err.response?.data?.message || "Failed to clone recipe."); }
        }
    };

    const handleRateRecipe = async (recipeId, rating) => { /* ... API call to POST /recipes/community/:recipeId/rate ... */ };


    return (
        <div className="max-w-6xl mx-auto mt-8 p-4 md:p-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100 mb-6">Community Recipes Library</h1>

            {/* Filters and Sort Section */}
            <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg shadow-md grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Search, Category, Tag, SortBy dropdowns */}
                <div>
                    <label htmlFor="searchRecipes" className="block text-xs font-medium text-gray-700 dark:text-slate-300">Search</label>
                    <input type="text" id="searchRecipes" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search recipes..." className="mt-1 p-2 w-full border dark:border-slate-600 rounded-md text-sm dark:bg-slate-700 dark:text-slate-100"/>
                </div>
                <div>
                    <label htmlFor="categoryFilter" className="block text-xs font-medium text-gray-700 dark:text-slate-300">Category</label>
                    <select id="categoryFilter" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="mt-1 p-2 w-full border dark:border-slate-600 rounded-md text-sm dark:bg-slate-700 dark:text-slate-100">
                        <option value="">All Categories</option>
                        {categories.map(cat => <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>)}
                    </select>
                </div>
                {/* Add Tag filter similarly if needed, or rely on search for tags */}
                <div>
                    <label htmlFor="sortByFilter" className="block text-xs font-medium text-gray-700 dark:text-slate-300">Sort By</label>
                    <select id="sortByFilter" value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="mt-1 p-2 w-full border dark:border-slate-600 rounded-md text-sm dark:bg-slate-700 dark:text-slate-100">
                        <option value="sharedAt">Newest Shared</option>
                        <option value="popularity">Popularity (Uses)</option>
                        <option value="rating">Highest Rated</option>
                        <option value="name">Name (A-Z)</option>
                    </select>
                </div>
                <button onClick={() => fetchCommunityRecipes(1)} className="self-end bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-md">Apply Filters</button>
            </div>


            {isLoading && <p className="text-center py-10"><Spinner />Loading community recipes...</p>}
            {error && <p className="text-center py-10 text-red-500">{error}</p>}
            {!isLoading && recipes.length === 0 && <p className="text-center py-10 text-gray-600 dark:text-gray-300">No community recipes found matching your criteria. Be the first to share one!</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recipes.map(recipe => (
                    <div key={recipe._id} className="bg-white dark:bg-slate-700 rounded-lg shadow-lg p-5 flex flex-col">
                        <h4 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-1 truncate" title={recipe.name}>{recipe.name}</h4>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">By: {recipe.user?.username || 'Unknown Creator'}</p>
                        {recipe.category && <p className="text-xxs bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-slate-200 inline-block px-2 py-0.5 rounded-full mb-2 capitalize">{recipe.category}</p>}
                        <p className="text-sm text-gray-600 dark:text-slate-300 mb-3 flex-grow min-h-[60px]">{recipe.description?.substring(0,100) || 'No description.'}{recipe.description?.length > 100 && '...'}</p>
                        <div className="text-xs text-gray-500 dark:text-slate-400 mb-3">
                            <span>Uses: {recipe.communityUses || 0}</span>
                            <span className="mx-2">|</span>
                            <span>Rating: {recipe.averageRating ? recipe.averageRating.toFixed(1) : 'N/A'} ({recipe.communityRating?.count || 0} votes)</span>
                        </div>
                        {/* TODO: Add simple star rating input for handleRateRecipe */}
                        <div className="mt-auto flex gap-2">
                            <button onClick={() => handleCloneRecipe(recipe._id, recipe.name)}
                                className="flex-1 text-xs bg-green-500 hover:bg-green-600 text-white font-medium py-1.5 px-3 rounded-md flex items-center justify-center">
                                <DocumentDuplicateIcon className="h-4 w-4 mr-1"/> Clone to My Recipes
                            </button>
                            {/* <Link to={`/recipes/community/${recipe._id}/view`} className="flex-1 ...">View Details</Link> */}
                        </div>
                    </div>
                ))}
            </div>
            {/* Pagination Controls (use your existing pagination logic from AllContentPage) */}
        </div>
    );
};
export default CommunityTemplatesPage;

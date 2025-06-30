// // frontend/src/pages/DashboardPage.js
// import React, { useState, useEffect, useMemo, useRef } from 'react';
// import { useAuth } from '../contexts/AuthContext';
// import { Link } from 'react-router-dom';
// import axios from 'axios';
// import { trackEvent } from '../services/analytics'; // If you want to track this interaction
// // Import Swiper React components
// import { Swiper, SwiperSlide } from 'swiper/react';
// import { Navigation, Pagination, A11y, Autoplay } from 'swiper/modules'; // Import necessary modules

// // Import Swiper styles
// import 'swiper/css';
// import 'swiper/css/navigation';
// import 'swiper/css/pagination';
// import axiosInstance from '../api/apiConfig';
// // import 'swiper/css/scrollbar'; // If you want a scrollbar
// const API_URL = process.env.REACT_APP_API_URL;

// // Helper to format dates (optional)
// const formatDate = (dateString) => {
//     if (!dateString) return 'N/A';
//     return new Date(dateString).toLocaleDateString(undefined, {
//         year: 'numeric', month: 'short', day: 'numeric'
//     });
// };

// // --- Custom Arrow Components for Swiper (Optional, for styling) ---
// const PrevArrow = ({ onClick }) => (
//     <button onClick={onClick} className="swiper-custom-prev absolute top-1/2 -translate-y-1/2 left-2 z-10 bg-black bg-opacity-30 hover:bg-opacity-50 text-white p-2 rounded-full transition-opacity">
//         --
//     </button>
// );
// const NextArrow = ({ onClick }) => (
//     <button onClick={onClick} className="swiper-custom-next absolute top-1/2 -translate-y-1/2 right-2 z-10 bg-black bg-opacity-30 hover:bg-opacity-50 text-white p-2 rounded-full transition-opacity">
//         --
//     </button>
// );
// // --- End Custom Arrow Components ---

// const DashboardPage = () => {
//     const { user: authUser } = useAuth(); // Renamed to authUser for clarity
//     const [contentPieces, setContentPieces] = useState([]);
//     const [pageLoading, setPageLoading] = useState(true); // Renamed from 'loading'
//     const [pageError, setPageError] = useState(''); // Renamed from 'error'

//      // --- New State for Dashboard Enhancements ---
//      const [dashboardStats, setDashboardStats] = useState(null);
//      const [statsLoading, setStatsLoading] = useState(true);
//      const [statsError, setStatsError] = useState('');

//     const [suggestedTopics, setSuggestedTopics] = useState([]);
//     const [topicLoading, setTopicLoading] = useState(false);
//     const [topicError, setTopicError] = useState('');
//     const [selectedTopicAiProvider, setSelectedTopicAiProvider] = useState('openai'); // Default



//     // Refs for Swiper custom navigation
//     const swiperNavPrevRef = useRef(null);
//     const swiperNavNextRef = useRef(null);

//     // Example in AllContentPage.js or a layout component
// const [folders, setFolders] = useState([]);
// const [foldersLoading, setFoldersLoading] = useState(true);

// useEffect(() => {
//     const fetchFolders = async () => {
//         if (!authUser) return;
//         setFoldersLoading(true);
//         try {
//             const response = await axiosInstance.get('/folders'); // Use your axiosInstance
//             setFolders(response.data);
//         } catch (err) {
//             console.error("Failed to fetch folders", err);
//             // Handle error (e.g., show a toast)
//         } finally {
//             setFoldersLoading(false);
//         }
//     };
//     fetchFolders();
// }, [authUser]);

//      // Effect to set default AI provider for topic suggestions
//      useEffect(() => {
//         if (authUser?.hasOpenAiApiKey) setSelectedTopicAiProvider('openai');
//         else if (authUser?.hasGeminiApiKey) setSelectedTopicAiProvider('gemini');
//         else if (authUser?.hasPerplexityApiKey) setSelectedTopicAiProvider('perplexity');
//         else setSelectedTopicAiProvider('');
//     }, [authUser]);


//   // Fetch main content pieces list (existing logic)
//   useEffect(() => {
//     const fetchContentPieces = async () => {
//         if (!authUser) return;
//         setPageLoading(true);
//         setPageError('');
//         try {
//             // Assuming you want the first page for the dashboard's main list, or all if not paginated
//             const response = await axios.get(`${API_URL}/content`, {
//                 params: { page: 1, limit: 1000 } // Fetch a large limit to get "all" for dashboard display
//                                                 // OR, if your backend defaults to no pagination if no params, just:
//                                                 // await axios.get(`${API_URL}/content`);
//             });
//             console.log("Dashboard - Received content data from backend:", JSON.stringify(response.data, null, 2)); // <<<< LOG THIS
//             if (response.data && Array.isArray(response.data.data)) { // Check if response.data.data is an array
//                 setContentPieces(response.data.data);
//             } else if (Array.isArray(response.data)) { // Fallback if backend returns raw array (old behavior)
//                  setContentPieces(response.data);
//             } else {
//                 console.error("Unexpected response structure for content pieces:", response.data);
//                 setContentPieces([]); // Default to empty array on unexpected structure
//             }
//         } catch (err) {
//             setPageError(err.response?.data?.message || 'Failed to fetch content pieces.');
//             setContentPieces([]); // Set to empty array on error
//         } finally {
//             setPageLoading(false);
//         }
//     };
//     if (authUser) { // Only fetch if user is loaded
//         fetchContentPieces();
//     } else {
//         setPageLoading(false); // No user, no content to load
//     }
// }, [authUser]);

// // Fetch dashboard stats
// useEffect(() => {
//     const fetchDashboardStats = async () => {
//         if (!authUser) return;
//         setStatsLoading(true);
//         setStatsError('');
//         try {
//             const response = await axios.get(`${API_URL}/dashboard/stats`);
//             setDashboardStats(response.data);
//         } catch (err) {
//             setStatsError(err.response?.data?.message || 'Failed to fetch dashboard stats.');
//         } finally {
//             setStatsLoading(false);
//         }
//     };
//     if (authUser) {
//         fetchDashboardStats();
//     } else {
//         setStatsLoading(false);
//     }
// }, [authUser]);

// const handleSuggestTopics = async () => {
//     setTopicLoading(true);
//     setTopicError('');
//     setSuggestedTopics([]);

//     if (selectedTopicAiProvider === 'openai' && !authUser?.hasOpenAiApiKey) { /* ... alert and return ... */ }
//     if (selectedTopicAiProvider === 'gemini' && !authUser?.hasGeminiApiKey) { /* ... alert and return ... */ }
//     if (selectedTopicAiProvider === 'perplexity' && !authUser?.hasPerplexityApiKey) { /* ... alert and return ... */ }


//     try {
//         const response = await axios.post(`${API_URL}/ai/suggest-topics`, {
//             aiProvider: selectedTopicAiProvider,
//             count: 5
//         });
//         setSuggestedTopics(response.data || []);
//         trackEvent('AI', 'Suggested Topics', selectedTopicAiProvider);
//     } catch (err) {
//         setTopicError(err.response?.data?.message || 'Failed to suggest topics.');
//     } finally {
//         setTopicLoading(false);
//     }
// };


// const filteredAndSortedPieces = useMemo(() => {
//     // Ensure contentPieces is an array before trying to use array methods
//     if (!Array.isArray(contentPieces)) {
//         console.warn("contentPieces is not an array in useMemo for filteredAndSortedPieces. Value:", contentPieces);
//         return []; // Return empty array if not an array
//     }
//     console.log("Calculating filteredAndSortedPieces from:", contentPieces);

//     // Your existing filter logic
//     return contentPieces
//         .filter(piece => piece.contentType === 'blog_post' && piece.tags && piece.tags.includes('featured')) // Added check for piece.tags existence
//         .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
//         .map(piece => ({ ...piece, title: piece.title.toUpperCase() }));
// }, [contentPieces]);

//     const anyAiKeyConfiguredForUser = authUser?.hasOpenAiApiKey || authUser?.hasGeminiApiKey || authUser?.hasPerplexityApiKey;

//     if (pageLoading && statsLoading && !authUser) { // Initial loading before authUser is resolved
//         return <p className="text-center mt-10 text-gray-600">Loading Dashboard...</p>;
//     }
//     if (!authUser) { // Should be caught by ProtectedRoute, but good fallback
//         return <p className="text-center mt-10 text-gray-600">Please log in to view your dashboard.</p>;
//     }

//     // Determine which content to use for the hero slider
//     // Using dashboardStats.recentContentPieces is a good choice as it's already fetched and sorted by recency
//     const sliderContent = dashboardStats?.recentContentPieces || [];

//     return (
//         <div className="space-y-10"> {/* Overall page spacing */}
//             <div className="flex flex-col sm:flex-row justify-between items-center">
//                 <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">Dashboard</h1>
//                 <Link
//                     to="/content/new"
//                     className="bg-green-500 hover:bg-green-700 text-white font-bold py-2.5 px-5 rounded-md shadow hover:shadow-lg transition-shadow"
//                 >
//                     + Add New Content
//                 </Link>
//             </div>


//             {authUser && <p className="text-xl mb-6">Welcome back, {authUser.username}!</p>}

//  {/* --- Stats Section --- */}
//  <div className="mt-6"> {/* Added margin-top */}
//                 {statsLoading && <p className="text-sm text-gray-500 py-4 text-center">Loading stats...</p>}
//                 {statsError && <p className="text-sm text-red-500 bg-red-100 p-3 rounded-md shadow">{statsError}</p>}
//                 {dashboardStats && !statsLoading && (
//                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
//                         <div className="bg-white p-6 rounded-xl shadow-xl text-center transition-all hover:scale-105">
//                             <h3 className="text-4xl font-bold text-indigo-600">{dashboardStats.totalContentPieces ?? 0}</h3>
//                             <p className="text-gray-500 mt-1 text-sm">Total Content Pieces</p>
//                         </div>
//                         <div className="bg-white p-6 rounded-xl shadow-xl text-center transition-all hover:scale-105">
//                             <h3 className="text-4xl font-bold text-teal-600">{dashboardStats.totalRepurposedSnippets ?? 0}</h3>
//                             <p className="text-gray-500 mt-1 text-sm">Snippets Generated</p>
//                         </div>
//                         {/* You can add more stat cards here if dashboardStats provides more data */}
//                         {/* Example:
//                         <div className="bg-white p-6 rounded-xl shadow-xl text-center transition-all hover:scale-105">
//                             <h3 className="text-4xl font-bold text-sky-600">{dashboardStats.someOtherStat ?? 0}</h3>
//                             <p className="text-gray-500 mt-1 text-sm">Some Other Metric</p>
//                         </div>
//                         */}
//                     </div>
//                 )}
//             </div>


//             {/* --- Main Content Area (Recent Items & AI Tools) --- */}
//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//                 {/* Recent Content Pieces */}
//                 <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-lg">
//                     <h2 className="text-xl font-semibold text-gray-700 mb-4">Recently Updated Content</h2>
//                     {statsLoading && <p className="text-xs text-gray-500">Loading recent items...</p>}
//                     {dashboardStats?.recentContentPieces && dashboardStats.recentContentPieces.length > 0 ? (
//                         <ul className="space-y-3">
//                             {dashboardStats.recentContentPieces.map(piece => (
//                                 <li key={piece._id} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-md transition-colors shadow-sm">
//                                     <Link to={`/content/${piece._id}`} className="font-medium text-blue-600 hover:underline block truncate" title={piece.title}>
//                                         {piece.title}
//                                     </Link>
//                                     <p className="text-xs text-gray-500">
//                                         Type: {piece.contentType.replace('_', ' ')} - Last Updated: {formatDate(piece.updatedAt)}
//                                     </p>
//                                 </li>
//                             ))}
//                         </ul>
//                     ) : (
//                         !statsLoading && <p className="text-sm text-gray-500">No recent content pieces found.</p>
//                     )}
//                     {contentPieces.length > 5 && ( // Show if more than 5 pieces exist in total
//                          <Link to="/all-content" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
//                             View All Content Pieces →
//                         </Link>
//                         // You'll need to create an /all-content page that lists all content, perhaps with pagination
//                     )}
//                 </div>
               

//                  {/* --- Hero Content Slider Section --- */}
//             {sliderContent.length > 0 && !statsLoading && (
//                 <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 sm:p-8 rounded-xl shadow-2xl text-white relative ">
//                     <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center">Your Recent Work</h2>
//                     <Swiper
//                         modules={[Navigation, Pagination, A11y, Autoplay]}
//                         spaceBetween={30} // Space between slides
//                         slidesPerView={1} // Show one slide at a time
//                         navigation={{ // Use custom navigation elements
//                             prevEl: swiperNavPrevRef.current,
//                             nextEl: swiperNavNextRef.current,
//                         }}
//                         pagination={{ clickable: true, dynamicBullets: true }}
//                         loop={sliderContent.length > 1} // Loop if more than one slide
//                         autoplay={{
//                             delay: 5000,
//                             disableOnInteraction: false,
//                         }}
//                         onBeforeInit={(swiper) => { // Initialize custom nav refs
//                             swiper.params.navigation.prevEl = swiperNavPrevRef.current;
//                             swiper.params.navigation.nextEl = swiperNavNextRef.current;
//                         }}
//                         className="rounded-lg overflow-hidden" // Add styling to Swiper container
//                     >
//                         {sliderContent.map(piece => (
//                             <SwiperSlide key={piece._id} className="p-4 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg">
//                                 <div className="text-center">
//                                     <h3 className="text-xl sm:text-2xl font-semibold mb-2 truncate" title={piece.title}>
//                                         {piece.title}
//                                     </h3>
//                                     <p className="text-sm text-indigo-200 mb-1">
//                                         Type: {piece.contentType.replace('_', ' ')}
//                                     </p>
//                                     <p className="text-xs text-purple-200 mb-4">
//                                         Last Updated: {formatDate(piece.updatedAt)}
//                                     </p>
//                                     {/* You might want a short snippet of text here if available from recentContentPieces */}
//                                     <p className="text-sm mb-4 h-12 overflow-hidden text-ellipsis">
//                                         {piece.originalTextSnippet || "No preview..."}
//                                     </p>
//                                     <Link
//                                         to={`/content/${piece._id}`}
//                                         className="inline-block bg-yellow-400 hover:bg-yellow-500 text-indigo-700 font-semibold py-2 px-6 rounded-md text-sm shadow-md hover:shadow-lg transition-all"
//                                     >
//                                         View & Repurpose
//                                     </Link>
//                                 </div>
//                             </SwiperSlide>
//                         ))}
//                     </Swiper>
//                     {/* Custom Navigation Buttons */}
//                     {sliderContent.length > 1 && (
//                         <>
//                             <button ref={swiperNavPrevRef} className="swiper-custom-prev absolute top-1/2 -translate-y-1/2 left-1 sm:left-2 z-20 bg-black bg-opacity-20 hover:bg-opacity-40 text-white p-2 sm:p-3 rounded-full transition-opacity focus:outline-none">
//                                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
//                             </button>
//                             <button ref={swiperNavNextRef} className="swiper-custom-next absolute top-1/2 -translate-y-1/2 right-1 sm:right-2 z-20 bg-black bg-opacity-20 hover:bg-opacity-40 text-white p-2 sm:p-3 rounded-full transition-opacity focus:outline-none">
//                                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
//                             </button>
//                         </>
//                     )}
//                 </div>
//             )}
//             {sliderContent.length === 0 && !statsLoading && (
//                 <div className="text-center py-6 bg-slate-100 rounded-lg shadow">
//                     <p className="text-gray-600">No recent content to showcase here yet. <Link to="/content/new" className="text-blue-600 hover:underline">Add some content!</Link></p>
//                 </div>
//             )}


//                 {/* AI Tools & Quick Access */}
//                 <div className="space-y-6">
//                     <div className="bg-white p-6 rounded-lg shadow-lg">
//                         <h2 className="text-xl font-semibold text-gray-700 mb-4">AI Content Idea Generator</h2>
//                         {anyAiKeyConfiguredForUser ? (
//                             <>
//                                 <div className="flex items-center mb-3 space-x-2 ">
//                                     <select
//                                         value={selectedTopicAiProvider}
//                                         onChange={(e) => setSelectedTopicAiProvider(e.target.value)}
//                                         className="text-sm p-2 border rounded select bg-gray-50 w-full focus:ring-indigo-500 focus:border-indigo-500 "
//                                         disabled={topicLoading}
//                                     >
//                                         {authUser?.hasOpenAiApiKey && <option value="openai">OpenAI</option>}
//                                         {authUser?.hasGeminiApiKey && <option value="gemini">Gemini</option>}
//                                         {authUser?.hasPerplexityApiKey && <option value="perplexity">Perplexity</option>}
//                                     </select>
//                                 </div>
//                                 <button
//                                     onClick={handleSuggestTopics}
//                                     disabled={topicLoading || !selectedTopicAiProvider}
//                                     className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2.5 px-4 rounded text-sm disabled:opacity-50 shadow hover:shadow-md transition-shadow"
//                                 >
//                                     {topicLoading ? 'Generating Ideas...' : 'Suggest New Topics'}
//                                 </button>
//                                 {topicError && <p className="text-red-500 text-xs mt-2">{topicError}</p>}
//                                 {suggestedTopics.length > 0 && !topicLoading && (
//                                     <div className="mt-4">
//                                         <h3 className="font-medium text-sm mb-1 text-gray-600">Suggested Topics:</h3>
//                                         <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 bg-slate-50 p-3 rounded">
//                                             {suggestedTopics.map((topic, index) => (
//                                                 <li key={index}>{topic}</li>
//                                             ))}
//                                         </ul>
//                                     </div>
//                                 )}
//                             </>
//                         ) : (
//                             <p className="text-sm text-gray-500">
//                                 <Link to="/profile" className="text-blue-600 hover:underline">Configure an AI API key</Link> to enable topic suggestions.
//                             </p>
//                         )}
//                     </div>
//                     {/* You can add another card here for "Quick Actions" or "Performance Overview" if direct publishing is added */}
//                 </div>

             

//                  {/* Link to Ai Generators */}
//                  <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center justify-center">
//                     <h2 className="text-xl font-semibold text-gray-700 mb-4">Ai Generators</h2>
//                     <p className="text-sm text-gray-600 mb-4 text-center">
//                         Access all AI-Powered Generators.
//                     </p>
//                     <Link
//                         to="/ai-tools"
//                         className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-md shadow hover:shadow-lg transition-shadow"
//                     >
//                         View All Generators →
//                     </Link>
//                 </div>

//                     {/* Link to Full Content Library */}
//                     <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center justify-center">
//                     <h2 className="text-xl font-semibold text-gray-700 mb-4">Your Content Library</h2>
//                     <p className="text-sm text-gray-600 mb-4 text-center">
//                         Access all your created content pieces, manage snippets, and continue repurposing.
//                     </p>
//                     <Link
//                         to="/all-content"
//                         className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-md shadow hover:shadow-lg transition-shadow"
//                     >
//                         View Full Library →
//                     </Link>
//                 </div>
//             </div>

           
//             </div>
        
//     );
// };

// export default DashboardPage;

// frontend/src/pages/DashboardPage.js
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { trackEvent } from '../services/analytics';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y, Autoplay } from 'swiper/modules';
import { Helmet } from 'react-helmet-async';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import Spinner from '../components/layout/Loader';

const API_URL = process.env.REACT_APP_API_URL;

// Helper to format dates
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric'
    });
};

const DashboardPage = () => {
    const { user: authUser, loading: authLoading } = useAuth();
    
    // Dashboard stats state
    const [dashboardStats, setDashboardStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(false);
    const [statsError, setStatsError] = useState('');

    // Topic suggestions state
    const [suggestedTopics, setSuggestedTopics] = useState([]);
    const [topicLoading, setTopicLoading] = useState(false);
    const [topicError, setTopicError] = useState('');
    const [selectedTopicAiProvider, setSelectedTopicAiProvider] = useState('openai');

   // Refs for Swiper navigation
    const swiperNavPrevRef = useRef(null);
    const swiperNavNextRef = useRef(null);


    // Set default AI provider based on user's API keys
    useEffect(() => {
        if (!authUser) return;
        
        if (authUser.hasOpenAiApiKey) setSelectedTopicAiProvider('openai');
        else if (authUser.hasGeminiApiKey) setSelectedTopicAiProvider('gemini');
        else if (authUser.hasPerplexityApiKey) setSelectedTopicAiProvider('perplexity');
        else setSelectedTopicAiProvider('');
    }, [authUser]);

    // Fetch dashboard stats
    useEffect(() => {
        const fetchDashboardStats = async () => {
            if (!authUser) return;
            
            setStatsLoading(true);
            setStatsError('');
            
            try {
                const response = await axios.get(`${API_URL}/dashboard/stats`);
                setDashboardStats(response.data);
            } catch (err) {
                console.error('Failed to fetch dashboard stats:', err);
                setStatsError(err.response?.data?.message || 'Failed to fetch dashboard stats.');
            } finally {
                setStatsLoading(false);
            }
        };

        fetchDashboardStats();
    }, [authUser]);

    const handleSuggestTopics = async () => {
        // Validate AI provider selection
        if (selectedTopicAiProvider === 'openai' && !authUser?.hasOpenAiApiKey) {
            alert('OpenAI API key is required for this feature.');
            return;
        }
        if (selectedTopicAiProvider === 'gemini' && !authUser?.hasGeminiApiKey) {
            alert('Gemini API key is required for this feature.');
            return;
        }
        if (selectedTopicAiProvider === 'perplexity' && !authUser?.hasPerplexityApiKey) {
            alert('Perplexity API key is required for this feature.');
            return;
        }

        setTopicLoading(true);
        setTopicError('');
        setSuggestedTopics([]);

        try {
            const response = await axios.post(`${API_URL}/ai/suggest-topics`, {
                aiProvider: selectedTopicAiProvider,
                count: 5
            });
            setSuggestedTopics(response.data || []);
            trackEvent('AI', 'Suggested Topics', selectedTopicAiProvider);
        } catch (err) {
            console.error('Failed to suggest topics:', err);
            setTopicError(err.response?.data?.message || 'Failed to suggest topics.');
        } finally {
            setTopicLoading(false);
        }
    };

    // Show loading while auth context is loading
    if (authLoading) {
        return (
            <div className="text-center mt-20">
                <p className="text-gray-600 dark:text-gray-300"><Spinner />Loading...</p>
            </div>
        );
    }

    // Show login prompt if no user
    if (!authUser) {
        return (
            <div className="text-center mt-10">
                <p className="text-gray-600 dark:text-gray-300">Please log in to view your dashboard.</p>
            </div>
        );
    }

    const anyAiKeyConfigured = authUser.hasOpenAiApiKey || authUser.hasGeminiApiKey || authUser.hasPerplexityApiKey;
    const sliderContent = dashboardStats?.recentContentPieces || [];

    return (
       <>
         <Helmet>
        <title>EchoWrite - Dashboard</title>
        <meta name="description" content="View your activity, stats, and recent projects." />
      </Helmet>
        <div className="space-y-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">Dashboard</h1>
                <Link
                    to="/content/new"
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2.5 px-5 rounded-md shadow hover:shadow-lg transition-shadow"
                >
                    + Add New Content
                </Link>
            </div>

            {/* Welcome Message */}
            <p className="text-xl mb-6">Welcome back, {authUser.username}!</p>

            {/* Stats Section */}
            <div className="mt-6">
                {statsLoading && (
                    <div className="text-center py-8">
                        <p className="text-gray-500"><Spinner />Loading dashboard stats...</p>
                    </div>
                )}
                
                {statsError && (
                    <div className="text-center py-4">
                        <p className="text-red-500 bg-red-100 p-3 rounded-md shadow">{statsError}</p>
                    </div>
                )}
                
           
          {dashboardStats && !statsLoading && (
  <div className="flex justify-center">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
      <div className="bg-white p-8 rounded-xl shadow-xl text-center transition-all hover:scale-105">
        <h3 className="text-5xl font-bold text-indigo-600 mb-2">
          {dashboardStats.totalContentPieces ?? 0}
        </h3>
        <p className="text-gray-500 text-base font-medium">
          Total Content Pieces
        </p>
      </div>
      <div className="bg-white p-8 rounded-xl shadow-xl text-center transition-all hover:scale-105">
        <h3 className="text-5xl font-bold text-teal-600 mb-2">
          {dashboardStats.totalRepurposedSnippets ?? 0}
        </h3>
        <p className="text-gray-500 text-base font-medium">
          Snippets Generated
        </p>
      </div>
      <div className="bg-white p-8 rounded-xl shadow-xl text-center transition-all hover:scale-105">
        <h3 className="text-5xl font-bold text-green-600 mb-2">
          {dashboardStats.totalPublishedSnippets ?? 0}
        </h3>
        <p className="text-gray-500 text-base font-medium">
          Published Snippets
        </p>
      </div>
    </div>
  </div>
)}

            </div>
            {/* Hero Content Slider */}
            {sliderContent.length > 0 && !statsLoading && (
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 sm:p-8 rounded-xl shadow-2xl text-white relative">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center">Your Recent Work</h2>
           <Swiper
                        modules={[Navigation, Pagination, A11y, Autoplay]}
                        spaceBetween={30}
                        slidesPerView={1}
                        navigation={{
                            prevEl: swiperNavPrevRef.current,
                            nextEl: swiperNavNextRef.current,
                        }}
                        pagination={{ clickable: true, dynamicBullets: true }}
                        loop={sliderContent.length > 1}
                        autoplay={{
                            delay: 5000,
                            disableOnInteraction: false,
                        }}
                        onBeforeInit={(swiper) => {
                            swiper.params.navigation.prevEl = swiperNavPrevRef.current;
                            swiper.params.navigation.nextEl = swiperNavNextRef.current;
                        }}
                        className="rounded-lg overflow-hidden"
                    >

                        {sliderContent.map(piece => (
                            <SwiperSlide key={piece._id} className="p-4 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg">
                                <div className="text-center">
                                    <h3 className="text-xl sm:text-2xl font-semibold mb-2 truncate" title={piece.title}>
                                        {piece.title}
                                    </h3>
                                    <p className="text-sm text-indigo-200 mb-1">
                                        Type: {piece.contentType.replace('_', ' ')}
                                    </p>
                                    <p className="text-xs text-purple-200 mb-4">
                                        Last Updated: {formatDate(piece.updatedAt)}
                                    </p>
                                    <p className="text-sm mb-4 h-12 overflow-hidden text-ellipsis">
                                        {piece.originalTextSnippet || "No preview..."}
                                    </p>
                                    <Link
                                        to={`/content/${piece._id}`}
                                        className="inline-block bg-yellow-400 hover:bg-yellow-500 text-indigo-700 font-semibold py-2 px-6 rounded-md text-sm shadow-md hover:shadow-lg transition-all"
                                    >
                                        View & Repurpose
                                    </Link>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                    
                    {/* Custom Navigation Buttons */}
                    {sliderContent.length > 1 && (
                        <>
                            <button 
                                ref={swiperNavPrevRef} 
                                className="absolute top-1/2 -translate-y-1/2 left-1 sm:left-2 z-20 bg-black bg-opacity-20 hover:bg-opacity-40 text-white p-2 sm:p-3 rounded-full transition-opacity focus:outline-none"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                </svg>
                            </button>
                            <button 
                                ref={swiperNavNextRef} 
                                className="absolute top-1/2 -translate-y-1/2 right-1 sm:right-2 z-20 bg-black bg-opacity-20 hover:bg-opacity-40 text-white p-2 sm:p-3 rounded-full transition-opacity focus:outline-none"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                </svg>
                            </button>
                        </>
                    )}
                </div>
            )}
            
            {sliderContent.length === 0 && !statsLoading && (
                <div className="text-center py-6 bg-slate-100 rounded-lg shadow">
                    <p className="text-gray-600">
                        No recent content to showcase here yet. 
                        <Link to="/content/new" className="text-blue-600 hover:underline ml-1">Add some content!</Link>
                    </p>
                </div>
            )}

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Content Pieces */}
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Recently Updated Content</h2>
                    
                    {statsLoading && <p className="text-xs text-gray-500"><Spinner />Loading recent items...</p>}
                    
                    {dashboardStats?.recentContentPieces && dashboardStats.recentContentPieces.length > 0 ? (
                        <>
                            <ul className="space-y-3">
                                {dashboardStats.recentContentPieces.map(piece => (
                                    <li key={piece._id} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-md transition-colors shadow-sm">
                                        <Link 
                                            to={`/content/${piece._id}`} 
                                            className="font-medium text-blue-600 hover:underline block truncate" 
                                            title={piece.title}
                                        >
                                            {piece.title}
                                        </Link>
                                        <p className="text-xs text-gray-500">
                                            Type: {piece.contentType.replace('_', ' ')} - Last Updated: {formatDate(piece.updatedAt)}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                            <Link 
                                to="/all-content" 
                                className="mt-4 inline-block text-sm text-blue-600 hover:underline"
                            >
                                View All Content Pieces →
                            </Link>
                        </>
                    ) : (
                        !statsLoading && <p className="text-sm text-gray-500">No recent content pieces found.</p>
                    )}
                </div>

                {/* AI Tools & Quick Access */}
                <div className="space-y-6">
                    {/* AI Content Idea Generator */}
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-semibold text-gray-700 mb-4">AI Content Idea Generator</h2>
                        
                        {anyAiKeyConfigured ? (
                            <>
                                <div className="flex items-center mb-3 space-x-2">
                                    <select
                                        value={selectedTopicAiProvider}
                                        onChange={(e) => setSelectedTopicAiProvider(e.target.value)}
                                        className="text-sm p-2 border rounded select bg-gray-50 w-full focus:ring-indigo-500 focus:border-indigo-500"
                                        disabled={topicLoading}
                                    >
                                        {authUser.hasOpenAiApiKey && <option value="openai">OpenAI</option>}
                                        {authUser.hasGeminiApiKey && <option value="gemini">Gemini</option>}
                                        {authUser.hasPerplexityApiKey && <option value="perplexity">Perplexity</option>}
                                    </select>
                                </div>
                                
                                <button
                                    onClick={handleSuggestTopics}
                                    disabled={topicLoading || !selectedTopicAiProvider}
                                    className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2.5 px-4 rounded text-sm disabled:opacity-50 shadow hover:shadow-md transition-shadow"
                                >
                                    {topicLoading ? 'Generating Ideas...' : 'Suggest New Topics'}
                                </button>
                                
                                {topicError && <p className="text-red-500 text-xs mt-2">{topicError}</p>}
                                
                                {suggestedTopics.length > 0 && !topicLoading && (
                                    <div className="mt-4">
                                        <h3 className="font-medium text-sm mb-1 text-gray-600">Suggested Topics:</h3>
                                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 bg-slate-50 p-3 rounded">
                                            {suggestedTopics.map((topic, index) => (
                                                <li key={index}>{topic}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </>
                        ) : (
                            <p className="text-sm text-gray-500">
                                <Link to="/profile" className="text-blue-600 hover:underline">
                                    Configure an AI API key
                                </Link> to enable topic suggestions.
                            </p>
                        )}
                    </div>

                    {/* AI Generators Link */}
                    <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center justify-center">
                        <h2 className="text-xl font-semibold text-gray-700 mb-4">AI Generators</h2>
                        <p className="text-sm text-gray-600 mb-4 text-center">
                            Access all AI-Powered Generators.
                        </p>
                        <Link
                            to="/ai-tools"
                            className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-md shadow hover:shadow-lg transition-shadow"
                        >
                            View All Generators →
                        </Link>
                    </div>

                    {/* Content Library Link */}
                    <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center justify-center">
                        <h2 className="text-xl font-semibold text-gray-700 mb-4">Your Content Library</h2>
                        <p className="text-sm text-gray-600 mb-4 text-center">
                            Access all your created content pieces, manage snippets, and continue repurposing.
                        </p>
                        <Link
                            to="/all-content"
                            className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-md shadow hover:shadow-lg transition-shadow"
                        >
                            View Full Library →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
      </>
    );
};

export default DashboardPage;

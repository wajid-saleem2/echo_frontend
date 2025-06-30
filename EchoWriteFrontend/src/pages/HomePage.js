// // frontend/src/pages/HomePage.js
// import React from 'react';
// import { Link } from 'react-router-dom';
// import { useAuth } from '../contexts/AuthContext';
// import { Helmet } from 'react-helmet-async';

// const HomePage = () => {
//     const { user } = useAuth();
//     return (
//         <>
//         <Helmet>
//         <title>EchoWrite - AI Content Repurposing & Syndication</title>
//         <meta name="description" content="Effortlessly repurpose your blog posts, videos, and podcasts into engaging content for Twitter, LinkedIn, email, and more with EchoWrite." />
//       </Helmet>
//         <div className="text-center">
//             <h1 className="text-4xl font-bold mb-6">Welcome to EchoWrite!</h1>
//             <p className="text-xl mb-8">
//                 The smartest way to repurpose your content across all platforms.
//             </p>
//             {user ? (
//                 <Link
//                     to="/dashboard"
//                     className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg"
//                 >
//                     Go to Dashboard
//                 </Link>
//             ) : (
//                 <div className="space-x-4">
//                     <Link
//                         to="/login"
//                         className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg"
//                     >
//                         Login
//                     </Link>
//                     <Link
//                         to="/register"
//                         className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg text-lg"
//                     >
//                         Register
//                     </Link>
//                 </div>
//             )}
//              <div className="mt-12 p-6 bg-white shadow-lg rounded-lg">
//                 <h2 className="text-2xl font-semibold mb-4">How it Works</h2>
//                 <ol className="list-decimal list-inside text-left space-y-2">
//                     <li>Input your primary content (blog post, video script, etc.).</li>
//                     <li>EchoWrite intelligently extracts key points and ideas.</li>
//                     <li>Instantly generate drafts for Twitter, LinkedIn, emails, and more!</li>
//                     <li>(Future) Enhance with AI, schedule, and syndicate.</li>
//                 </ol>
//             </div>
//         </div>
//         </>
//     );
// };

// export default HomePage;

// frontend/src/pages/HomePage.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Helmet } from 'react-helmet-async';
import { ArrowRightIcon, SparklesIcon, KeyIcon, UsersIcon, ShareIcon, PencilSquareIcon, PaperAirplaneIcon, FolderIcon, LightBulbIcon } from '@heroicons/react/24/outline'; // Example icons

const HomePage = () => {
    const { user } = useAuth();

    const featureSections = [
        {
            icon: <SparklesIcon className="h-12 w-12 text-indigo-500 mb-4" />,
            title: "AI-Powered Content Repurposing",
            description: "Transform a single piece of content—blog posts, video scripts, podcast transcripts—into dozens of platform-optimized snippets. Let our AI handle the heavy lifting of summarization, tone adaptation, and format conversion.",
            imgSrc: "/images/features/ai-repurpose-flow.png", // Placeholder
            imgAlt: "AI repurposing content into multiple formats"
        },
        {
            icon: <PencilSquareIcon className="h-12 w-12 text-teal-500 mb-4" />,
            title: "Intelligent Writing & Generation Tools",
            description: "Conquer writer's block with a suite of AI generators. From crafting compelling marketing emails and Instagram captions to brainstorming blog titles and product descriptions, EchoWrite provides the creative spark you need.",
            imgSrc: "/images/features/ai-generators-suite.png", // Placeholder
            imgAlt: "Suite of AI content generator tools"
        },
        {
            icon: <FolderIcon className="h-12 w-12 text-sky-500 mb-4" />,
            title: "Organize & Strategize Your Content",
            description: "Keep your content universe in perfect order. Manage original pieces and all their repurposed variations with intuitive folders and tagging. Plan your distribution with clarity and foresight.",
            imgSrc: "/images/features/content-organization.png", // Placeholder
            imgAlt: "Organized content library with folders and tags"
        },
        {
            icon: <ShareIcon className="h-12 w-12 text-rose-500 mb-4" />,
            title: "Direct Publishing & Community Power",
            description: "Seamlessly publish your polished snippets directly to platforms like Twitter. Plus, tap into a vibrant community by sharing and discovering effective repurposing templates (recipes).",
            imgSrc: "/images/features/direct-publishing-community.png", // Placeholder
            imgAlt: "Direct publishing to social media and community templates"
        }
    ];

    return (
        <>
            <Helmet>
                <title>EchoWrite - AI Content Repurposing & Generation Suite</title>
                <meta name="description" content="EchoWrite: Transform your content with AI. Effortlessly repurpose articles, videos, and podcasts into engaging social media posts, emails, and more. Maximize reach, save time." />
            </Helmet>

            <div className="bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-200">
                {/* --- Hero Section --- */}
                <section className="py-20 md:py-32 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white">
                    <div className="container mx-auto px-6 text-center">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                            EchoWrite
                        </h1>
                        <h1 className="text-5xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                            Stop Repeating. Start <span className="text-yellow-300">Echoing</span>.
                        </h1>
                        <p className="text-lg md:text-xl lg:text-2xl mb-10 max-w-3xl mx-auto">
                            EchoWrite is your AI co-pilot for content repurposing and generation. Turn one piece of content into a symphony of engaging posts across all your platforms, effortlessly.
                        </p>
                        {user ? (
                            <Link
                                to="/dashboard"
                                className="bg-yellow-400 hover:bg-yellow-500 text-indigo-700 font-bold py-4 px-10 rounded-lg text-lg shadow-lg transform transition-transform hover:scale-105"
                            >
                                Go to Your Dashboard <ArrowRightIcon className="inline h-5 w-5 ml-2" />
                            </Link>
                        ) : (
                            <Link
                                to="/register"
                                className="bg-white hover:bg-gray-100 text-indigo-600 font-bold py-4 px-10 rounded-lg text-lg shadow-lg transform transition-transform hover:scale-105"
                            >
                                Get Started <ArrowRightIcon className="inline h-5 w-5 ml-2" />
                            </Link>
                        )}
                        <p className="mt-6 text-sm text-indigo-100">Unlock your content's true potential for only $5.99.</p>
                    </div>
                </section>

                {/* --- Why EchoWrite Section --- */}
                <section className="py-16 md:py-24 bg-slate-50 dark:bg-slate-800">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-slate-100 mb-4">The Smarter Way to Create & Distribute Content</h2>
                            <p className="text-lg text-gray-600 dark:text-slate-300 max-w-2xl mx-auto">
                                EchoWrite isn't just another tool; it's your strategic partner in amplifying your message and reclaiming your valuable time.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {featureSections.map((feature, index) => (
                                <div key={index} className="bg-white dark:bg-slate-700 p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow text-center">
                                    {feature.icon}
                                    <h3 className="text-xl font-semibold text-gray-800 dark:text-slate-100 mb-3">{feature.title}</h3>
                                    <p className="text-sm text-gray-600 dark:text-slate-300">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* --- How-To Guides Section --- */}
                <section className="py-16 md:py-24">
                    <div className="container mx-auto px-6">
                        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 dark:text-slate-100 mb-16">Unlock EchoWrite's Power: Step-by-Step</h2>

                        {/* How to Publish to Twitter */}
                        <div className="flex flex-col md:flex-row items-center mb-20 gap-8 md:gap-12">
                            <div className="md:w-1/2">
                                <span className="text-indigo-500 dark:text-indigo-400 font-semibold text-sm uppercase">Seamless Sharing</span>
                                <h3 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-slate-100 mt-2 mb-4">Publish to Twitter in Seconds</h3>
                                <p className="text-gray-600 dark:text-slate-300 mb-6">
                                    Once your snippet or thread is perfected, sending it to your Twitter audience is a breeze:
                                </p>
                                <ol className="list-decimal list-inside space-y-3 text-gray-600 dark:text-slate-300">
                                    <li>Navigate to your <Link to="/profile" className="text-indigo-600 dark:text-indigo-400 hover:underline">Profile</Link> and connect your Twitter account securely via OAuth.</li>
                                    <li>Go to any <Link to="/dashboard" className="text-indigo-600 dark:text-indigo-400 hover:underline">Content Detail</Link> page and view your generated snippets.</li>
                                    <li>Click the "Publish to Twitter" button on the desired snippet.</li>
                                    <li>Confirm, and EchoWrite posts it directly to your connected Twitter profile!</li>
                                </ol>
                            </div>
                            <div className="md:w-1/2">
                                <img src="/images/how-to/publish-to-twitter.gif" alt="Publishing a tweet from EchoWrite" className="rounded-lg shadow-xl w-full" /> {/* Placeholder */}
                            </div>
                        </div>

                        {/* How to Use API Keys */}
                        <div className="flex flex-col md:flex-row-reverse items-center mb-20 gap-8 md:gap-12">
                            <div className="md:w-1/2">
                                <span className="text-teal-500 dark:text-teal-400 font-semibold text-sm uppercase">Your AI, Your Control</span>
                                <h3 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-slate-100 mt-2 mb-4">Integrate Your Favorite AI Models (BYOK)</h3>
                                <p className="text-gray-600 dark:text-slate-300 mb-6">
                                    EchoWrite empowers you to use your own API keys from OpenAI, Google (Gemini), and Perplexity for enhanced AI features, giving you full control and leveraging your existing subscriptions:
                                </p>
                                <ol className="list-decimal list-inside space-y-3 text-gray-600 dark:text-slate-300">
                                    <li>Go to your <Link to="/profile" className="text-teal-600 dark:text-teal-400 hover:underline">Profile Settings</Link>.</li>
                                    <li>Find the "API Key Configuration" section.</li>
                                    <li>Securely enter your API key for each provider (e.g., OpenAI, Gemini). Your keys are stored encrypted.</li>
                                    <li>Now, when using AI features like Style Transfer or Topic Generation, you can select your preferred configured provider!</li>
                                </ol>
                            </div>
                            <div className="md:w-1/2">
                                <img src="/images/how-to/configure-api-keys.png" alt="Configuring API keys in EchoWrite profile" className="rounded-lg shadow-xl w-full" /> {/* Placeholder */}
                            </div>
                        </div>

                        {/* How to Use Generators */}
                        <div className="flex flex-col md:flex-row items-center mb-20 gap-8 md:gap-12">
                            <div className="md:w-1/2">
                                <span className="text-sky-500 dark:text-sky-400 font-semibold text-sm uppercase">Instant Content Creation</span>
                                <h3 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-slate-100 mt-2 mb-4">Unleash Creativity with AI Generators</h3>
                                <p className="text-gray-600 dark:text-slate-300 mb-6">
                                    Need a marketing email, Instagram caption, or blog ideas? Our AI Generators are here to help:
                                </p>
                                <ol className="list-decimal list-inside space-y-3 text-gray-600 dark:text-slate-300">
                                    <li>Navigate to the "<Link to="/ai-tools" className="text-sky-600 dark:text-sky-400 hover:underline">AI Tools</Link>" section from your dashboard or navbar.</li>
                                    <li>Select the generator you need (e.g., "Marketing Email Generator").</li>
                                    <li>Provide the required inputs (like product details, target audience).</li>
                                    <li>Choose your preferred AI provider (if you've configured keys).</li>
                                    <li>Click "Generate" and get instant, ready-to-use content! You can then copy it or save it as a new content piece.</li>
                                </ol>
                            </div>
                            <div className="md:w-1/2">
                                <img src="/images/how-to/using-ai-generators.png" alt="Using AI content generators in EchoWrite" className="rounded-lg shadow-xl w-full" /> {/* Placeholder */}
                            </div>
                        </div>

                        {/* How to Access Community Templates */}
                        <div className="flex flex-col md:flex-row-reverse items-center gap-8 md:gap-12">
                            <div className="md:w-1/2">
                                <span className="text-rose-500 dark:text-rose-400 font-semibold text-sm uppercase">Learn & Share</span>
                                <h3 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-slate-100 mt-2 mb-4">Discover & Use Community Templates</h3>
                                <p className="text-gray-600 dark:text-slate-300 mb-6">
                                    Tap into the collective wisdom of the EchoWrite community:
                                </p>
                                <ol className="list-decimal list-inside space-y-3 text-gray-600 dark:text-slate-300">
                                    <li>Find the "<Link to="/community-templates" className="text-rose-600 dark:text-rose-400 hover:underline">Community Templates</Link>" link in your navbar or dashboard.</li>
                                    <li>Browse or search for templates shared by other users, filtered by category or tags.</li>
                                    <li>Found a template you like? Click "Clone to My Templates."</li>
                                    <li>The template is now available in your private "<Link to="/templates" className="text-rose-600 dark:text-rose-400 hover:underline">My Templates</Link>" section, ready for you to use and customize!</li>
                                </ol>
                                <p className="mt-4 text-gray-600 dark:text-slate-300">You can also share your own successful snippet templates from the "My Templates" page.</p>
                            </div>
                            <div className="md:w-1/2">
                                <img src="/images/how-to/community-templates.png" alt="Browsing community templates in EchoWrite" className="rounded-lg shadow-xl w-full" /> {/* Placeholder */}
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- Final Call to Action --- */}
                <section className="py-20 md:py-32 bg-indigo-700 dark:bg-indigo-800 text-white">
                    <div className="container mx-auto px-6 text-center">
                        <SparklesIcon className="h-16 w-16 text-yellow-300 mx-auto mb-6" />
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Revolutionize Your Content Workflow?</h2>
                        <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto">
                            Join EchoWrite today and experience the future of content repurposing and generation. Save time, amplify your voice, and never let great content go to waste again.
                        </p>
                        {user ? (
                             <Link
                                to="/dashboard"
                                className="bg-yellow-400 hover:bg-yellow-500 text-indigo-700 font-bold py-4 px-10 rounded-lg text-lg shadow-lg transform transition-transform hover:scale-105"
                            >
                                Back to Dashboard
                            </Link>
                        ) : (
                            <Link
                                to="/register"
                                className="bg-white hover:bg-gray-100 text-indigo-600 font-bold py-4 px-10 rounded-lg text-lg shadow-lg transform transition-transform hover:scale-105"
                            >
                                Sign Up & Start Echoing!
                            </Link>
                        )}
                    </div>
                </section>
            </div>
        </>
    );
};

export default HomePage;

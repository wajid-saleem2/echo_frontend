import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Initialize theme from localStorage or default to 'light'
    const [theme, setTheme] = useState(() => {
        const storedTheme = localStorage.getItem('echowrite-theme');
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        return storedTheme || (prefersDark ? 'dark' : 'light');
    });

    // Apply theme to document when it changes
    useEffect(() => {
        const root = window.document.documentElement;
        
        // First remove both classes to ensure clean state
        root.classList.remove('light', 'dark');
        
        // Then add the current theme class
        root.classList.add(theme);
        
        // Also store in localStorage
        localStorage.setItem('echowrite-theme', theme);
        
        // Apply a style tag with detailed CSS rules for dashboard components
        let styleEl = document.getElementById('theme-styles');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'theme-styles';
            document.head.appendChild(styleEl);
        }
        
        // More detailed styling for different components
        if (theme === 'dark') {
            styleEl.innerHTML = `

                /* Base container styles */
                .dashboard section, .card, .content-section, input, pre, form, textarea, select,
                div[class*="bg-white"] { 
                    background-color: rgb(15, 23, 42) !important; 
                    color: #f9fafb !important; 
                    border-color: #374151 !important; 
                }
                
                /* Text colors - Making ALL text much more visible */
                h1, h2, h3, h4, h5, h6 { color: #f9fafb !important; }
                p { color: #f9fafb !important; }
                .text-gray-500 { color: #e5e7eb !important; }
                .text-gray-600 { color: #f9fafb !important; }
                .text-gray-700 { color: #f9fafb !important; }
                .text-sm, .text-xs { color: #f9fafb !important; }
                
                /* Stat cards - ensuring text is highly visible */
                div[class*="text-center"] { 
                    background-color: rgb(30, 41, 59) !important; 
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3) !important;
                }
                .text-4xl { color: #f9fafb !important; }
                .text-indigo-600, .text-teal-600, .text-sky-600 { color: #f9fafb !important; }
                
                /* List items */
                li[class*="bg-slate-50"] {
                    background-color: rgb(30, 41, 59) !important;
                    border: 1px solid #4b5563 !important; 
                }
                li[class*="bg-slate-50"]:hover {
                    background-color: rgb(51, 65, 85) !important;
                }
                
                /* Swiper overrides */
                .swiper-slide {
                    background-color: rgb(30, 41, 59) !important;
                    color: #f9fafb !important;
                }
                .bg-gradient-to-r {
                    background: rgb(30, 41, 59) !important; /* Dark background instead of gradient */
                    border: 1px solid #4b5563 !important;
                }
                .bg-white.bg-opacity-10 {
                    background-color: rgb(15, 23, 42) !important; /* Darker inner container */
                    border: 1px solid #1f2937 !important;
                }
                .text-indigo-200 { color: #f9fafb !important; }
                .text-purple-200 { color: #f9fafb !important; }
                
                /* Navigation buttons */
                .swiper-custom-prev, .swiper-custom-next {
                    background-color: rgba(0, 0, 0, 0.5) !important;
                }
                
                /* Pagination bullets */
                .swiper-pagination-bullet {
                    background-color: #9ca3af !important;
                }
                .swiper-pagination-bullet-active {
                    background-color: #f9fafb !important;
                }
                
                /* Select dropdowns */
                select.bg-gray-50 {
                    background-color: rgb(30, 41, 59) !important;
                    color: #f9fafb !important;
                    border-color: #4b5563 !important;
                }
                
                /* Buttons */
                button:not([disabled]), a[class*="bg-"] {
                    /* Remove filter brightness which was making buttons too dark */
                    filter: none !important;
                }
                
                /* Specific button styles to ensure they stand out */
                .bg-green-500, .bg-green-600, .bg-green-700 {
                    background-color: #10b981 !important; /* Emerald-500 */
                    color: white !important;
                    border: none !important;
                }
                
                .bg-indigo-500, .bg-indigo-600, .bg-indigo-700 {
                    background-color: #6366f1 !important; /* Indigo-500 */
                    color: white !important;
                    border: none !important;
                }
                
                .bg-blue-500, .bg-blue-600, .bg-blue-700 {
                    background-color: #3b82f6 !important; /* Blue-500 */
                    color: white !important;
                    border: none !important;
                }
                
                .bg-teal-500, .bg-teal-600, .bg-teal-700 {
                    background-color: #14b8a6 !important; /* Teal-500 */
                    color: white !important;
                    border: none !important;
                }

                .bg-gray-300, .bg-gray-500, .bg-gray-600 .bg-gray-700 {
                    background-color:rgb(103, 101, 105) !important; /* Teal-500 */
                    color: white !important;
                    border: none !important;
                }
                
                .bg-yellow-400, .bg-yellow-500 {
                    background-color: #eab308 !important; /* Yellow-500 */
                    color: #1e293b !important; /* Slate-800 for contrast */
                    border: none !important;
                }
                
                /* Hover effects for buttons */
                button:hover:not([disabled]), a[class*="bg-"]:hover {
                    opacity: 0.9 !important;
                    transform: translateY(-1px) !important;
                    transition: all 0.2s !important;
                }
                
                /* Links */
                a.text-blue-600 {
                    color: #93c5fd !important;
                }
                
                /* Suggested topics container */
                ul.bg-slate-50 {
                    background-color: rgb(30, 41, 59) !important;
                    border: 1px solid #4b5563 !important;
                }
                
                /* Additional text fixes to ensure visibility */
                span { color: #f9fafb !important; }
                
                /* Make sure all text is visible within the slider components */
                .swiper-slide h3, 
                .swiper-slide p, 
                .swiper-slide .text-sm, 
                .swiper-slide .text-xs {
                    color: #f9fafb !important;
                }
                
                /* Add a subtle border to make components stand out better */
                .bg-white {
                    border: 1px solid #374151 !important;
                }

                /* ===========================================
                   SNIPPET COMPONENTS & CONTENT DETAIL STYLES 
                   =========================================== */
                
                /* From the snippet card component */
                .bg-gray-50 { 
                    background-color: rgb(30, 41, 59) !important;
                    border-color: #4b5563 !important;
                }
                
                /* Pre elements and code displays */
                pre.whitespace-pre-wrap, pre.font-mono {
                    background-color: rgb(22, 30, 46) !important;
                    color: #e5e7eb !important;
                    border-color: #4b5563 !important;
                }
                
                /* Error messages */
                .text-red-600, p.text-red-500 {
                    color: #f87171 !important; /* Red-400 for better visibility */
                }
                
                .bg-red-100 {
                    background-color: rgba(248, 113, 113, 0.2) !important;
                    border: 1px solid rgba(248, 113, 113, 0.3) !important;
                }
                
                /* AI enhancement section buttons */
                .bg-purple-500, .bg-purple-600 {
                    background-color: #a855f7 !important; /* Purple-500 */
                    color: white !important;
                }
                
                .bg-pink-500, .bg-pink-600 {
                    background-color: #ec4899 !important; /* Pink-500 */
                    color: white !important;
                }
                
                .bg-sky-500, .bg-sky-600 {
                    background-color: #0ea5e9 !important; /* Sky-500 */
                    color: white !important;
                }
                
                /* Input areas and textareas */
                textarea.font-mono, textarea.border {
                    background-color: rgb(22, 30, 46) !important;
                    color: #e5e7eb !important;
                    border-color: #4b5563 !important;
                }
                
                /* Style/Tone Rewriting UI */
                div.bg-gray-100 {
                    background-color: rgb(30, 41, 59) !important;
                    border-color: #4b5563 !important;
                }
                
                select.bg-white, input.bg-white, textarea.bg-white {
                    background-color: rgb(22, 30, 46) !important;
                    color: #e5e7eb !important;
                    border-color: #4b5563 !important;
                }
                
                /* AI Suggestions area */
                li.bg-white, li.hover\\:bg-blue-50:hover {
                    background-color: rgb(22, 30, 46) !important;
                    border-color: #4b5563 !important;
                }
                
                li.hover\\:bg-blue-50:hover {
                    background-color: rgb(30, 58, 138, 0.3) !important;
                }
                
                /* Content Details page */
                .max-w-4xl.mx-auto.mt-10.p-6.bg-white {
                    background-color: rgb(15, 23, 42) !important;
                    border-color: #4b5563 !important;
                }
                
                /* Section headers and borders */
                .border-b.border-gray-200, .border-t.border-gray-300 {
                    border-color: #4b5563 !important;
                }
                
                /* Text-only buttons */
                button.text-blue-500, button.text-blue-600 {
                    color: #93c5fd !important;
                }
                
                /* AI Contextual popup */
                div.absolute.z-10.bg-white {
                    background-color: rgb(30, 41, 59) !important;
                    border: 1px solid #4b5563 !important;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5) !important;
                }
                
                button.hover\\:bg-gray-100:hover {
                    background-color: rgb(51, 65, 85) !important;
                }
                
                /* Modal backgrounds */
                .fixed.inset-0.bg-black.bg-opacity-50 {
                    background-color: rgba(0, 0, 0, 0.7) !important;
                }
                
                .bg-white.p-6.rounded-lg.shadow-xl {
                    background-color: rgb(30, 41, 59) !important;
                    border: 1px solid #4b5563 !important;
                }
                
                /* Selection highlighting */
                .bg-gray-100.p-2.rounded.max-h-24 {
                    background-color: rgb(51, 65, 85) !important;
                    border: 1px solid #4b5563 !important;
                }
                
                /* AI suggestions in modal */
                .bg-gray-100.border.rounded.hover\\:bg-blue-100 {
                    background-color: rgb(30, 41, 59) !important;
                    border-color: #4b5563 !important;
                }
                
                .hover\\:bg-blue-100:hover {
                    background-color: rgb(30, 58, 138, 0.3) !important;
                }
                
                /* Markdown content area */
                .prose.prose-sm.bg-gray-50 {
                    background-color: rgb(22, 30, 46) !important;
                    color: #e5e7eb !important;
                    border-color: #4b5563 !important;
                }
                
                /* Markdown content - ensure all text is visible */
                .markdown-content * {
                    color: #e5e7eb !important;
                }
                
                /* Tags styling */
                .bg-gray-200.rounded-full {
                    background-color: rgb(51, 65, 85) !important;
                    color: #e5e7eb !important;
                }
                
                /* Warning/info areas */
                .bg-yellow-50.border.border-yellow-200 {
                    background-color: rgba(234, 179, 8, 0.2) !important;
                    border-color: rgba(234, 179, 8, 0.3) !important;
                    color: #e5e7eb !important;
                }
                
                /* Repurposing section */
                .bg-slate-50.rounded-md.border {
                    background-color: rgb(30, 41, 59) !important;
                    border-color: #4b5563 !important;
                }
                
                /* Repurposing history items */
                .bg-slate-100.rounded-md.border.border-slate-200 {
                    background-color: rgb(30, 41, 59) !important;
                    border-color: #4b5563 !important;
                }
                
                /* Status badges */
                .bg-indigo-100.text-indigo-700 {
                    background-color: rgba(99, 102, 241, 0.2) !important;
                    color: #a5b4fc !important; /* Indigo-300 for better visibility */
                }
                
                /* Blue info areas */
                .text-blue-500.bg-blue-50, .text-blue-600.bg-blue-50 {
                    background-color: rgba(59, 130, 246, 0.2) !important;
                    color: #93c5fd !important;
                }

                /* --- FROM AllContent.js --- */
        
        /* Main container */
        .max-w-7xl {
            background-color: rgb(15, 23, 42) !important;
            color: #f9fafb !important;
        }

        /* Sidebar Card - Filter by Tags container */
        .bg-slate-50 {
            background-color: rgb(30, 41, 59) !important;
            color: #f9fafb !important;
            border: 1px solid #4b5563 !important;
        }

        /* Heading inside sidebar */
        .text-gray-700 {
            color: #f9fafb !important;
        }

        /* Paragraph (e.g. No tags available) */
        .text-gray-500 {
            color: #d1d5db !important;
        }

        /* Tag buttons (unselected) */
        .bg-gray-100 {
            background-color: rgb(51, 65, 85) !important;
            color: #f9fafb !important;
            border-color: #4b5563 !important;
        }

        .hover\\:bg-gray-200:hover {
            background-color: rgb(71, 85, 105) !important;
        }

        /* Tag buttons (selected) */
        .bg-blue-500 {
            background-color: #3b82f6 !important;
            color: white !important;
            border: none !important;
        }

        /* Match label text (text-gray-600) */
        .text-gray-600 {
            color: #f9fafb !important;
        }

        /* Match logic buttons */
        .font-bold.text-white.bg-blue-500 {
            background-color: #2563eb !important;
        }

        /* Border under Filter by Tags */
        .border-gray-200 {
            border-color: #374151 !important;
        }

        /* Border-gray-300 in unselected buttons */
        .border-gray-300 {
            border-color: #4b5563 !important;
        }

        /* Rounded corners and shadows already handled globally */
        
        /* General text fix */
        span, p, h3, h4 {
            color: #f9fafb !important;
        }

        /* Extra fix for .text-xs and .text-sm */
        .text-xs, .text-sm {
            color: #f9fafb !important;
        }

        /* Overflow scrollbars (optional beautification) */
        .overflow-y-auto::-webkit-scrollbar {
            width: 6px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
            background-color: #334155;
            border-radius: 3px;
        }

        /* Pagination Buttons Fix */
.bg-white {
    background-color: #1e293b !important; /* dark bg */
    color: #f9fafb !important; /* light text */
}

.text-gray-700 {
    color: #f9fafb !important;
}

.border-gray-300 {
    border-color: #4b5563 !important;
}

.hover\:bg-gray-100:hover {
    background-color: #334155 !important;
}

.text-gray-500 {
    color: #d1d5db !important;
}

            `;
        } else {
            styleEl.innerHTML = '';
        }
            
        console.log(`Theme set to: ${theme}`);
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme(prevTheme => {
            const newTheme = prevTheme === 'light' ? 'dark' : 'light';
            console.log(`Toggling theme from ${prevTheme} to ${newTheme}`);
            return newTheme;
        });
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
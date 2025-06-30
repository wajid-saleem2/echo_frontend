
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid'; // Or outline

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme} // Use the toggleTheme directly without an extra wrapper function
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
        >
            {theme === 'light' ? (
                <MoonIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />
            ) : (
                <SunIcon className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400" />
            )}
        </button>
    );
};

export default ThemeToggle;
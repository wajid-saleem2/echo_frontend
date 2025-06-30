// frontend/src/pages/LoginPage.js
import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { trackUserLogin } from '../services/analytics'; // Import
import { Helmet } from 'react-helmet-async';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/dashboard";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            trackUserLogin();
            navigate(from, { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to login. Please check your credentials.');
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        // Redirect the user to your backend's Google OAuth initiation route
        window.location.href = `${process.env.REACT_APP_API_URL}/auth/google`;
    };

    return (
         <>
        <Helmet>
       <title>EchoWrite - Login</title>
       <meta name="description" content="Login to access your EchoWrite dashboard." />
     </Helmet>
        <div className="max-w-md mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg">
            <h2 className="text-3xl font-bold text-center mb-8">Login to EchoWrite</h2>
            {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</p>}
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                        Email
                    </label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                        Password
                    </label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                        id="password"
                        type="password"
                        placeholder="******************"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div className="flex items-center justify-between">
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Sign In'}
                    </button>
                </div>
            </form>
            <div className="mt-6">
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400">Or continue with</span>
                </div>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-3">
                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-slate-700 text-sm font-medium text-gray-500 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600"
                >
                    <span className="sr-only">Sign in with Google</span>
                    {/* Simple Google Icon (replace with better SVG if desired) */}
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10c2.396 0 4.599-.857 6.32-2.265l-2.582-2.582C12.795 15.69 11.455 16 10 16c-3.314 0-6-2.686-6-6s2.686-6 6-6c1.766 0 3.34.756 4.455 1.969L17.535 3A9.96 9.96 0 0010 0zm5.5 10c0-.828-.072-1.624-.208-2.387H10v4.515h3.09c-.14.948-.564 1.773-1.185 2.363v1.53h1.978c1.156-1.068 1.925-2.595 1.925-4.221z" clipRule="evenodd" />
                    </svg>
                    Sign in with Google
                </button>
            </div>
        </div>
            <p className="text-center text-gray-600 text-sm mt-6">
                Don't have an account?{' '}
                <Link to="/register" className="font-bold text-blue-500 hover:text-blue-800">
                    Sign Up
                </Link>
            </p>
        </div>
    </>
    );
};

export default LoginPage;

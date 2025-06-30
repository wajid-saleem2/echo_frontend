// frontend/src/pages/OAuthCallbackPage.js (New File)
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Spinner from '../components/layout/Loader';

const OAuthCallbackPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { fetchFullUserProfile } = useAuth(); // Assuming fetchFullUserProfile updates context and localStorage
    const [message, setMessage] = useState('Processing authentication...');
    const [error, setError] = useState('');

    useEffect(() => {
        const token = searchParams.get('token');
        const oauthError = searchParams.get('oauth_error'); // From failureRedirect

        if (oauthError) {
            setError(`OAuth failed: ${searchParams.get('message') || oauthError}. Please try again.`);
            setMessage('');
            // Optionally redirect to login after a delay
            setTimeout(() => navigate('/login'), 4000);
            return;
        }

        if (token) {
            localStorage.setItem('echowrite-token', token); // Store the token
            // Fetch user profile to update AuthContext and confirm login
            fetchFullUserProfile(token)
                .then((user) => {
                    if (user) {
                        setMessage('Authentication successful! Redirecting...');
                        navigate('/dashboard'); // Redirect to dashboard
                    } else {
                        setError('Failed to verify authentication. Please try logging in.');
                        localStorage.removeItem('echowrite-token'); // Clean up bad token
                    }
                })
                .catch(err => {
                    setError('Error processing authentication. Please try again.');
                    localStorage.removeItem('echowrite-token');
                });
        } else {
            setError('Authentication token not found. Please try logging in again.');
            // Optionally redirect to login
            setTimeout(() => navigate('/login'), 3000);
        }
    }, [searchParams, navigate, fetchFullUserProfile]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
            {message && !error && (
                <>
                    <Spinner />
                    <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">{message}</p>
                </>
            )}
            {error && (
                <>
                    <p className="mt-4 text-lg text-red-600 dark:text-red-400">{error}</p>
                    <Link to="/login" className="mt-4 text-blue-500 hover:underline">Go to Login</Link>
                </>
            )}
        </div>
    );
};

export default OAuthCallbackPage;
// frontend/src/pages/PricingPage.js (New File)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { Helmet } from 'react-helmet-async';
import axiosInstance from '../api/apiConfig';

// Load Stripe.js with your publishable key (outside component for single load)
// Ensure REACT_APP_STRIPE_PUBLISHABLE_KEY is in your .env
// const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const PricingPage = () => {
    const { user, loading: authLoading, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams(); // For callback messages
    const [isLoadingCheckout, setIsLoadingCheckout] = useState(false);
    const [error, setError] = useState('');
    const [paymentMessage, setPaymentMessage] = useState('');

    const PADDLE_PLAN_ID_PRO = process.env.REACT_APP_PADDLE_PLAN_ID_PRO; // Get from .env

    useEffect(() => {
        // Check for callback messages from Paddle (via your success/cancel URLs)
        const paddleSuccess = searchParams.get('paddle_success');
        // Paddle might also send error codes or messages in query params on failure
        // For now, success is primarily handled by webhooks updating user status

        if (paddleSuccess === 'true') {
            setPaymentMessage("Payment processing initiated! Your subscription will be active shortly. Refreshing profile...");
            if (refreshUser) refreshUser(); // Trigger a refresh to get updated subscription status
        }
        // You might also check for paddle_error or other params if you set them in cancel_url
    }, [searchParams, refreshUser]);

    useEffect(() => {
        if (user && user.paddleSubscription?.status === 'active') {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const handleSubscribe = async () => {
        if (!PADDLE_PLAN_ID_PRO) {
            setError("Plan information is missing. Please contact support.");
            return;
        }
        setIsLoadingCheckout(true);
        setError('');
        try {
            const response = await axiosInstance.post('/payments/paddle-pay-link', {
                planId: PADDLE_PLAN_ID_PRO
            });
            if (response.data.payLink) {
                window.location.href = response.data.payLink; // Redirect to Paddle Checkout
            } else {
                throw new Error("Could not retrieve Paddle payment link.");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to initiate subscription. Please try again.");
            setIsLoadingCheckout(false);
        }
        // setIsLoadingCheckout(false); // Will be false if redirect happens or on error
    };
 



    if (authLoading) return <p className="text-center mt-20">Loading user status...</p>;
    // If user is already subscribed (e.g. navigated here by mistake), redirect
    if (user && user.subscription?.status === 'active') {
        // navigate('/dashboard'); // This might cause redirect loop if useEffect above also runs
        return <p className="text-center mt-20">You are already subscribed! Redirecting...</p>;
    }


    const planFeatures = [
        "Unlimited Content Piece Creation",
        "Unlimited Snippet Repurposing",
        "AI-Powered Structuring & Headings",
        "AI-Powered Style & Tone Transfer",
        "AI Content Idea Generator",
        "Access to All AI Writing Tools",
        "Folder Organization",
        "User-Defined Snippet Templates",
        "Community Template Library Access",
        "Direct Publishing to Twitter (X)",
        // "Priority Support",
    ];

    return (
        <>
        <Helmet><title>EchoWrite - Choose Your Plan</title></Helmet>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-800 p-8 sm:p-10 rounded-xl shadow-2xl">
                <div>
                    <img className="mx-auto h-12 w-auto" src="/images/logo/echowrite-logo-dark.png" alt="EchoWrite" /> {/* Adjust logo path */}
                    <h2 className="mt-6 text-center text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-slate-100">
                        Unlock EchoWrite Pro
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600 dark:text-slate-300">
                        Supercharge your content strategy with our full suite of AI tools.
                    </p>
                </div>

                {paymentMessage && <p className="text-center text-sm text-blue-600 dark:text-blue-400 p-3 bg-blue-50 dark:bg-blue-900 rounded-md">{paymentMessage}</p>}
                {error && <p className="text-center text-sm text-red-600 dark:text-red-400 p-3 bg-red-50 dark:bg-red-900 rounded-md">{error}</p>}

                <div className="border dark:border-slate-700 rounded-lg p-6 bg-slate-50 dark:bg-slate-800/50">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-slate-100">Pro Plan</h3>
                    <p className="mt-4 flex items-baseline text-gray-900 dark:text-slate-50">
                        <span className="text-4xl font-extrabold tracking-tight">$5.99</span>
                        <span className="ml-1 text-xl font-semibold">/month</span>
                    </p>
                    <ul role="list" className="mt-6 space-y-3">
                        {planFeatures.map((feature, index) => (
                            <li key={index} className="flex space-x-3">
                                <CheckCircleIcon className="flex-shrink-0 h-5 w-5 text-green-500 dark:text-green-400" aria-hidden="true" />
                                <span className="text-sm text-gray-600 dark:text-slate-300">{feature}</span>
                            </li>
                        ))}
                    </ul>
                    <button
                        onClick={handleSubscribe}
                        disabled={isLoadingCheckout}
                        className="mt-8 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg shadow-md disabled:opacity-50 transition-colors"
                    >
                        {isLoadingCheckout ? 'Processing...' : 'Get Started with Pro'}
                    </button>
                </div>
                <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                    You can cancel your subscription at any time.
                    <Link to="/dashboard" className="ml-1 font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">
                        Maybe later? Go to Dashboard (Free features)
                    </Link>
                </p>
            </div>
        </div>
        </>
    );
};
export default PricingPage;
// frontend/src/pages/PaymentStatusPage.js (New File)
import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Spinner from '../components/layout/Loader';

const PaymentStatusPage = () => {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [message, setMessage] = useState("Verifying your payment, please wait...");

    useEffect(() => {
        const paddleSuccess = searchParams.get('paddle_success');

        if (paddleSuccess === 'true') {
            setMessage("Thank you for your payment! We're updating your account. You'll be redirected shortly.");
            if (refreshUser) {
                refreshUser().then(() => {
                    // User state in AuthContext should now be updated by webhook + refresh
                    // The useEffect below will handle redirect if status is active
                });
            }
        } else {
            // Handle potential failure cases if Paddle sends error params here
            setMessage("There might have been an issue with the payment or redirect. Checking status...");
        }
        // Redirect to dashboard or pricing after a delay, relying on webhook for actual status
        const timer = setTimeout(() => {
            if (user && user.paddleSubscription?.status === 'active') {
                navigate('/dashboard');
            } else {
                navigate('/pricing', { state: { message: "Please check your subscription status or try again." } });
            }
        }, 4000); // Increased delay to allow webhooks time

        return () => clearTimeout(timer);

    }, [searchParams, navigate, refreshUser, user]); // Added user to deps

    // If user becomes active while on this page
   // If user becomes active while on this page due to webhook + refresh
   useEffect(() => {
    if (user && user.paddleSubscription?.status === 'active') {
        navigate('/dashboard');
    }
}, [user, navigate]);


    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
            <Spinner />
            <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">{message}</p>
            <Link to="/dashboard" className="mt-6 text-sm text-blue-500 hover:underline">Go to Dashboard now</Link>
        </div>
    );
};
export default PaymentStatusPage;
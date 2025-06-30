// frontend/src/pages/RefundPolicyPage.js
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const RefundPolicyPage = () => {
    const YOUR_APP_NAME = "EchoWrite";
    const YOUR_CONTACT_EMAIL = "adnanhaider4878@gmail.com"; // Replace
    const EFFECTIVE_DATE = "May 17, 2025"; // Replace
    const REFUND_WINDOW_DAYS = 7; // Example: 7-day refund window

    return (
        <>
            <Helmet>
                <title>{YOUR_APP_NAME} - Refund Policy</title>
                <meta name="description" content={`Refund Policy for ${YOUR_APP_NAME}.`} />
            </Helmet>
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 dark:text-slate-200">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-6">Refund Policy</h1>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">Effective Date: {EFFECTIVE_DATE}</p>

                <p className="mb-4">Thank you for subscribing to {YOUR_APP_NAME}. We strive to provide a valuable service. This policy outlines the terms under which refunds may be granted for our subscription services.</p>

                <h2 className="text-2xl font-semibold text-gray-800 dark:text-slate-200 mt-6 mb-3">1. Subscription Services</h2>
                <p className="mb-4">Our primary offering is a recurring subscription service. Payments are processed by Paddle.com, our Merchant of Record.</p>

                <h2 className="text-2xl font-semibold text-gray-800 dark:text-slate-200 mt-6 mb-3">2. Refund Eligibility</h2>
                <p className="mb-2">We offer a refund under the following conditions:</p>
                <ul className="list-disc list-inside mb-4 space-y-1 pl-4">
                    <li><strong>Initial Subscription Period:</strong> If you are a new subscriber, you may request a full refund within {REFUND_WINDOW_DAYS} days of your initial subscription payment if you are unsatisfied with the Service.</li>
                    <li><strong>Technical Issues:</strong> If you experience significant technical issues that prevent you from using the core functionalities of the Service, and we are unable to resolve these issues within a reasonable timeframe after you report them.</li>
                    <li><strong>Billing Errors:</strong> If you have been incorrectly billed due to an error on our part or by our payment processor.</li>
                </ul>
                <p className="mb-4">Refunds are generally not provided for partial subscription periods, downgrades, or if you have violated our <Link to="/terms-of-service" className="text-indigo-600 dark:text-indigo-400 hover:underline">Terms of Service</Link>.</p>
                <p className="mb-4">Usage of "Bring Your Own Key" (BYOK) features with third-party AI providers (OpenAI, Gemini, Perplexity AI) incurs costs directly with those providers, and {YOUR_APP_NAME} is not responsible for refunding those third-party costs.</p>


                <h2 className="text-2xl font-semibold text-gray-800 dark:text-slate-200 mt-6 mb-3">3. How to Request a Refund</h2>
                <p className="mb-4">To request a refund, please contact our support team at <a href={`mailto:${YOUR_CONTACT_EMAIL}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">{YOUR_CONTACT_EMAIL}</a> within the eligible period. Please include your account email, the date of your subscription, and a clear reason for your refund request.</p>
                <p className="mb-4">We will review your request and typically respond within 3-5 business days. Approved refunds will be processed back to the original payment method through Paddle.com, which may take several additional business days to reflect in your account.</p>

                <h2 className="text-2xl font-semibold text-gray-800 dark:text-slate-200 mt-6 mb-3">4. Subscription Cancellations</h2>
                <p className="mb-4">You can cancel your subscription at any time through your account settings or by contacting Paddle.com support (as they are the Merchant of Record). If you cancel, your subscription will remain active until the end of your current paid billing period, and you will not be charged further. No refunds are typically provided for the remaining portion of the current billing period upon cancellation.</p>

                <h2 className="text-2xl font-semibold text-gray-800 dark:text-slate-200 mt-6 mb-3">5. Changes to This Policy</h2>
                <p className="mb-4">We reserve the right to modify this Refund Policy at any time. Any changes will be effective immediately upon posting the updated policy on our website.</p>

                <h2 className="text-2xl font-semibold text-gray-800 dark:text-slate-200 mt-6 mb-3">6. Contact Us</h2>
                <p className="mb-4">If you have questions about our Refund Policy, please contact us at <a href={`mailto:${YOUR_CONTACT_EMAIL}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">{YOUR_CONTACT_EMAIL}</a>.</p>
            </div>
        </>
    );
};

export default RefundPolicyPage;
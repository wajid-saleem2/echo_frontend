// === ADMIN PANEL FRONTEND ===
// frontend/src/pages/AdminPanel.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../api/apiConfig';

const AdminPanel = () => {
    const [pendingPayments, setPendingPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [confirmingPayment, setConfirmingPayment] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        fetchPendingPayments();
    }, []);

    const fetchPendingPayments = async () => {
        try {
            const response = await axiosInstance.get('/payment/admin/pending');
            setPendingPayments(response.data);
        } catch (error) {
            console.error('Error fetching pending payments:', error);
            if (error.response) {
                setError(error.response.data?.message || 'Failed to fetch pending payments');
            } else if (error.request) {
                setError('Network error. Please check your connection and try again.');
            } else {
                setError('Error fetching pending payments');
            }
        } finally {
            setLoading(false);
        }
    };

    const confirmPayment = async (userId, paymentId) => {
        setConfirmingPayment(paymentId);
        try {
            const response = await axiosInstance.post(`/payment/admin-confirm/${paymentId}`, {
                userId
            });

            alert('Payment confirmed and subscription activated!');
            fetchPendingPayments(); // Refresh the list
        } catch (error) {
            console.error('Error confirming payment:', error);
            let errorMessage = 'Error confirming payment';
            
            if (error.response) {
                errorMessage = error.response.data?.message || 'Failed to confirm payment';
            } else if (error.request) {
                errorMessage = 'Network error. Please check your connection and try again.';
            }
            
            alert(`Error: ${errorMessage}`);
        } finally {
            setConfirmingPayment(null);
        }
    };

    if (user?.role !== 'admin') {
        return (
            <div className="max-w-4xl mx-auto mt-10 p-8">
                <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
                <p>You don't have permission to access this page.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto mt-10 p-8">
                <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>
                <p>Loading pending payments...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto mt-10 p-8">
            <h1 className="text-3xl font-bold mb-8">Admin Panel - Pending Payments</h1>
            
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {pendingPayments.length === 0 ? (
                <div className="bg-gray-100 p-8 rounded-lg text-center">
                    <h2 className="text-xl font-semibold text-gray-600 mb-2">No Pending Payments</h2>
                    <p className="text-gray-500">All payments have been processed.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {pendingPayments.map((item) => (
                        <div key={item.paymentId} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
                                    <div className="space-y-2 text-sm">
                                        <p><strong>Username:</strong> {item.username}</p>
                                        <p><strong>Email:</strong> {item.email}</p>
                                        <p><strong>Plan:</strong> {item.plan}</p>
                                        <p><strong>User ID:</strong> {item.userId}</p>
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Payment Details</h3>
                                    <div className="space-y-2 text-sm">
                                        <p><strong>Amount:</strong> {item.payment.amount} {item.payment.currency}</p>
                                        <p><strong>To Address:</strong> 
                                            <span className="font-mono text-xs break-all">
                                                {item.payment.toAddress}
                                            </span>
                                        </p>
                                        <p><strong>Payment Date:</strong> {new Date(item.payment.paymentDate).toLocaleString()}</p>
                                        <p><strong>Confirmation Date:</strong> {new Date(item.payment.confirmationDate).toLocaleString()}</p>
                                        {item.payment.blockchainTxHash && (
                                            <p><strong>Transaction Hash:</strong>
                                                <span className="font-mono text-xs break-all">
                                                    {item.payment.blockchainTxHash}
                                                </span>
                                            </p>
                                        )}
                                        <p><strong>Status:</strong> 
                                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs ml-2">
                                                {item.payment.status}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-6 pt-4 border-t border-gray-200">
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                                    <h4 className="font-semibold text-yellow-800 mb-2">Action Required:</h4>
                                    <p className="text-sm text-yellow-700">
                                        Please verify this payment in your {item.payment.currency} wallet before confirming. 
                                        Once confirmed, the user's subscription will be automatically activated.
                                    </p>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                    <div className="text-sm text-gray-500">
                                        Payment ID: {item.paymentId}
                                    </div>
                                    <button
                                        onClick={() => confirmPayment(item.userId, item.paymentId)}
                                        disabled={confirmingPayment === item.paymentId}
                                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {confirmingPayment === item.paymentId ? 'Confirming...' : 'Confirm Payment & Activate Subscription'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Instructions:</h3>
                <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
                    <li>Check your Solana/Bitcoin wallet for incoming transactions</li>
                    <li>Verify the amount and sender address match the payment details</li>
                    <li>Only confirm payments after manual verification in your wallet</li>
                    <li>Once confirmed, the user will receive an email and their subscription will be activated</li>
                </ol>
            </div>
        </div>
    );
};

export default AdminPanel;
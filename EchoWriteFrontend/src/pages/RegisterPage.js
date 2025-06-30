// // frontend/src/pages/RegisterPage.js
// import React, { useState } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { useAuth } from '../contexts/AuthContext';
// import { trackUserRegistration } from '../services/analytics'; // Import
// import { Helmet } from 'react-helmet-async';

// const RegisterPage = () => {
//     const [username, setUsername] = useState('');
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');
//     const [confirmPassword, setConfirmPassword] = useState('');
//     const [error, setError] = useState('');
//     const [loading, setLoading] = useState(false);
//     const { register } = useAuth();
//     const navigate = useNavigate();

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         if (password !== confirmPassword) {
//             setError('Passwords do not match');
//             return;
//         }
//         setError('');
//         setLoading(true);
//         try {
//             await register(username, email, password);
//             trackUserRegistration();
//             navigate('/dashboard');
//         } catch (err) {
//             setError(err.response?.data?.message || 'Failed to register. Please try again.');
//             setLoading(false);
//         }
//     };

//     return (
//          <>
//         <Helmet>
//        <title>EchoWrite - Register</title>
//        <meta name="description" content="Create an EchoWrite account and start writing smarter.." />
//      </Helmet>
//         <div className="max-w-md mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg">
//             <h2 className="text-3xl font-bold text-center mb-8">Create Your EchoWrite Account</h2>
//             {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</p>}
//             <form onSubmit={handleSubmit}>
//                 <div className="mb-4">
//                     <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
//                         Username
//                     </label>
//                     <input
//                         className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//                         id="username"
//                         type="text"
//                         placeholder="Your Username"
//                         value={username}
//                         onChange={(e) => setUsername(e.target.value)}
//                         required
//                     />
//                 </div>
//                 <div className="mb-4">
//                     <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
//                         Email
//                     </label>
//                     <input
//                         className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//                         id="email"
//                         type="email"
//                         placeholder="you@example.com"
//                         value={email}
//                         onChange={(e) => setEmail(e.target.value)}
//                         required
//                     />
//                 </div>
//                 <div className="mb-4">
//                     <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
//                         Password
//                     </label>
//                     <input
//                         className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//                         id="password"
//                         type="password"
//                         placeholder="******************"
//                         value={password}
//                         onChange={(e) => setPassword(e.target.value)}
//                         required
//                     />
//                 </div>
//                 <div className="mb-6">
//                     <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
//                         Confirm Password
//                     </label>
//                     <input
//                         className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
//                         id="confirmPassword"
//                         type="password"
//                         placeholder="******************"
//                         value={confirmPassword}
//                         onChange={(e) => setConfirmPassword(e.target.value)}
//                         required
//                     />
//                 </div>
//                 <div className="flex items-center justify-between">
//                     <button
//                         className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
//                         type="submit"
//                         disabled={loading}
//                     >
//                         {loading ? 'Creating Account...' : 'Sign Up'}
//                     </button>
//                 </div>
//             </form>
//             <p className="text-center text-gray-600 text-sm mt-6">
//                 Already have an account?{' '}
//                 <Link to="/login" className="font-bold text-blue-500 hover:text-blue-800">
//                     Sign In
//                 </Link>
//             </p>
//         </div>
//     </>
//     );
// };

// export default RegisterPage;

// import React, { useEffect, useState } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { useAuth } from '../contexts/AuthContext';
// import { Helmet } from 'react-helmet-async';
// import axiosInstance from '../api/apiConfig';
// import { useLocation } from 'react-router-dom';

// const RegisterPage = () => {
//     const [formData, setFormData] = useState({
//         username: '',
//         email: '',
//         password: '',
//         confirmPassword: '',
//         plan: 'basic'
//     });
//     const [currentStep, setCurrentStep] = useState(1);
//     const [error, setError] = useState('');
//     const [loading, setLoading] = useState(false);
//     const [paymentData, setPaymentData] = useState(null);
//     const [paymentMethod, setPaymentMethod] = useState('SOL');
//     const [paymentStatus, setPaymentStatus] = useState('');
//     const [checkingPayment, setCheckingPayment] = useState(false);
//     const [userRegistered, setUserRegistered] = useState(false);
    
//     const { register, user } = useAuth();
//     const navigate = useNavigate();

//     const plans = {
//         basic: { name: 'Basic Plan', price: 29, features: ['10 AI generations/day', 'Basic templates', 'Email support'] },
//         pro: { name: 'Pro Plan', price: 59, features: ['50 AI generations/day', 'Premium templates', 'Priority support', 'API access'] },
//         premium: { name: 'Premium Plan', price: 99, features: ['Unlimited AI generations', 'All templates', '24/7 support', 'API access', 'Custom integrations'] }
//     };

//     // Add this inside the RegisterPage component, after the existing state declarations
// const location = useLocation();

// // Add this useEffect to handle URL parameters
// useEffect(() => {
//     const urlParams = new URLSearchParams(location.search);
//     const step = urlParams.get('step');
    
//     // If user is already logged in and wants to go to step 2
//     if (step === '2' && user) {
//         setFormData(prev => ({
//             ...prev,
//             username: user.username,
//             email: user.email
//         }));
//         setUserRegistered(true);
//         setCurrentStep(2);
//     }
// }, [location.search, user]);

//     const handleInputChange = (e) => {
//         setFormData({
//             ...formData,
//             [e.target.name]: e.target.value
//         });
//     };

//     const handleStep1Submit = async (e) => {
//         e.preventDefault();
//         if (formData.password !== formData.confirmPassword) {
//             setError('Passwords do not match');
//             return;
//         }
//         if (formData.password.length < 6) {
//             setError('Password must be at least 6 characters long');
//             return;
//         }
        
//         setLoading(true);
//         setError('');

//         try {
//             // Register the user in step 1
//             await register(formData.username, formData.email, formData.password);
//             setUserRegistered(true);
//             setCurrentStep(2);
//         } catch (err) {
//             // Handle registration errors
//             if (err.response) {
//                 setError(err.response.data?.message || 'Failed to register user');
//             } else if (err.request) {
//                 setError('Network error. Please check your connection and try again.');
//             } else {
//                 setError(err.message || 'An unexpected error occurred during registration');
//             }
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleStep2Submit = async (e) => {
//         e.preventDefault();
//         setLoading(true);
//         setError('');

//         try {
//             // Create payment - user is already registered at this point
//             const paymentResponse = await axiosInstance.post('/payment/create', {
//                 plan: formData.plan,
//                 paymentMethod: paymentMethod
//             });

//             const paymentResult = paymentResponse.data;
//             setPaymentData(paymentResult);
//             setCurrentStep(3);
            
//         } catch (err) {
//             // Handle payment creation errors
//             if (err.response) {
//                 setError(err.response.data?.message || 'Failed to create payment');
//             } else if (err.request) {
//                 setError('Network error. Please check your connection and try again.');
//             } else {
//                 setError(err.message || 'An unexpected error occurred');
//             }
//         } finally {
//             setLoading(false);
//         }
//     };

//     const checkPaymentStatus = async () => {
//         if (!paymentData) return;
        
//         setCheckingPayment(true);
//         try {
//             const response = await axiosInstance.get(`/payment/check-solana/${paymentData.paymentId}`);
//             const result = response.data;
            
//             if (result.status === 'confirmed') {
//                 setPaymentStatus('confirmed');
//                 setTimeout(() => {
//                     // Redirect to pricing page since subscription won't be active yet
//                     navigate('/dashboard');
//                 }, 3000);
//             } else {
//                 setPaymentStatus('pending');
//             }
//         } catch (error) {
//             console.error('Error checking payment:', error);
//             if (error.response) {
//                 setError(error.response.data?.message || 'Error checking payment status');
//             } else if (error.request) {
//                 setError('Network error while checking payment status');
//             } else {
//                 setError('Error checking payment status');
//             }
//         } finally {
//             setCheckingPayment(false);
//         }
//     };

//     const copyToClipboard = (text) => {
//         navigator.clipboard.writeText(text);
//         alert('Copied to clipboard!');
//     };

//     const renderStep1 = () => (
//         <div className="max-w-md mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg">
//             <h2 className="text-3xl font-bold text-center mb-8">Create Your EchoWrite Account</h2>
//             {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</p>}
            
//             <form onSubmit={handleStep1Submit}>
//                 <div className="mb-4">
//                     <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
//                         Username
//                     </label>
//                     <input
//                         className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//                         id="username"
//                         name="username"
//                         type="text"
//                         placeholder="Your Username"
//                         value={formData.username}
//                         onChange={handleInputChange}
//                         required
//                         disabled={loading}
//                     />
//                 </div>
//                 <div className="mb-4">
//                     <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
//                         Email
//                     </label>
//                     <input
//                         className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//                         id="email"
//                         name="email"
//                         type="email"
//                         placeholder="you@example.com"
//                         value={formData.email}
//                         onChange={handleInputChange}
//                         required
//                         disabled={loading}
//                     />
//                 </div>
//                 <div className="mb-4">
//                     <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
//                         Password
//                     </label>
//                     <input
//                         className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//                         id="password"
//                         name="password"
//                         type="password"
//                         placeholder="******************"
//                         value={formData.password}
//                         onChange={handleInputChange}
//                         required
//                         disabled={loading}
//                     />
//                 </div>
//                 <div className="mb-6">
//                     <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
//                         Confirm Password
//                     </label>
//                     <input
//                         className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
//                         id="confirmPassword"
//                         name="confirmPassword"
//                         type="password"
//                         placeholder="******************"
//                         value={formData.confirmPassword}
//                         onChange={handleInputChange}
//                         required
//                         disabled={loading}
//                     />
//                 </div>
//                 <div className="flex items-center justify-between">
//                     <button
//                         className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50"
//                         type="submit"
//                         disabled={loading}
//                     >
//                         {loading ? 'Creating Account...' : 'Create Account & Continue'}
//                     </button>
//                 </div>
//             </form>
//             <p className="text-center text-gray-600 text-sm mt-6">
//                 Already have an account?{' '}
//                 <Link to="/login" className="font-bold text-blue-500 hover:text-blue-800">
//                     Sign In
//                 </Link>
//             </p>
//         </div>
//     );

//     const renderStep2 = () => (
//         <div className="max-w-4xl mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg">
//             <div className="mb-6">
//                 <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
//                     <h3 className="font-bold">Account Created Successfully!</h3>
//                     <p>Welcome {formData.username}! Now choose your plan to get started.</p>
//                 </div>
//             </div>

//             <h2 className="text-3xl font-bold text-center mb-8">Choose Your Plan</h2>
//             {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</p>}
            
//             <div className="grid md:grid-cols-3 gap-6 mb-8">
//                 {Object.entries(plans).map(([key, plan]) => (
//                     <div 
//                         key={key}
//                         className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
//                             formData.plan === key 
//                                 ? 'border-blue-500 bg-blue-50' 
//                                 : 'border-gray-200 hover:border-gray-300'
//                         }`}
//                         onClick={() => setFormData({...formData, plan: key})}
//                     >
//                         <div className="text-center">
//                             <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
//                             <div className="text-3xl font-bold text-blue-600 mb-4">
//                                 ${plan.price}<span className="text-sm text-gray-500">/month</span>
//                             </div>
//                             <ul className="text-sm text-gray-600 space-y-2">
//                                 {plan.features.map((feature, index) => (
//                                     <li key={index} className="flex items-center">
//                                         <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
//                                         </svg>
//                                         {feature}
//                                     </li>
//                                 ))}
//                             </ul>
//                         </div>
//                         <input
//                             type="radio"
//                             name="plan"
//                             value={key}
//                             checked={formData.plan === key}
//                             onChange={handleInputChange}
//                             className="mt-4 mx-auto block"
//                         />
//                     </div>
//                 ))}
//             </div>

//             <div className="mb-6">
//                 <h3 className="text-lg font-bold mb-4">Choose Payment Method</h3>
//                 <div className="flex space-x-4">
//                     <button
//                         type="button"
//                         className={`px-6 py-3 rounded-lg font-medium ${
//                             paymentMethod === 'SOL' 
//                                 ? 'bg-purple-500 text-white' 
//                                 : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
//                         }`}
//                         onClick={() => setPaymentMethod('SOL')}
//                     >
//                         Solana (SOL) - Recommended
//                     </button>
//                     <button
//                         type="button"
//                         className={`px-6 py-3 rounded-lg font-medium ${
//                             paymentMethod === 'BTC' 
//                                 ? 'bg-orange-500 text-white' 
//                                 : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
//                         }`}
//                         onClick={() => setPaymentMethod('BTC')}
//                     >
//                         Bitcoin (BTC)
//                     </button>
//                 </div>
//                 <p className="text-sm text-gray-600 mt-2">
//                     {paymentMethod === 'SOL' 
//                         ? 'Faster transactions, lower fees' 
//                         : 'Slower transactions, higher fees'}
//                 </p>
//             </div>

//             <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
//                 <h4 className="font-bold">Important:</h4>
//                 <p className="text-sm">Your account has been created but your subscription won't be active until payment is confirmed and approved by our admin team.</p>
//             </div>

//             <form onSubmit={handleStep2Submit}>
//                 <div className="flex justify-between">
//                     <button
//                         type="button"
//                         onClick={() => navigate('/pricing')}
//                         className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
//                     >
//                         Skip for Now
//                     </button>
//                     <button
//                         type="submit"
//                         disabled={loading}
//                         className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50"
//                     >
//                         {loading ? 'Processing...' : `Pay with ${paymentMethod}`}
//                     </button>
//                 </div>
//             </form>
//         </div>
//     );

//     const renderStep3 = () => (
//         <div className="max-w-2xl mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg">
//             <h2 className="text-3xl font-bold text-center mb-8">Complete Your Payment</h2>
            
//             {paymentStatus === 'confirmed' ? (
//                 <div className="text-center">
//                     <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
//                         <h3 className="font-bold">Payment Confirmed!</h3>
//                         <p>Your payment has been confirmed and is being processed.</p>
//                         <p className="mt-2">You will receive an email once your subscription is activated by our admin team.</p>
//                         <p className="mt-2 text-sm">This usually takes 1-2 business hours during business days.</p>
//                     </div>
//                     <p className="text-gray-600">Redirecting to your account dashboard...</p>
//                 </div>
//             ) : (
//                 <div>
//                     <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-6">
//                         <h3 className="font-bold">Send Payment</h3>
//                         <p>Please send exactly <strong>{paymentData?.amount} {paymentData?.currency}</strong> to the address below:</p>
//                     </div>

//                     <div className="bg-gray-50 p-4 rounded-lg mb-6">
//                         <div className="mb-4">
//                             <label className="block text-sm font-medium text-gray-700 mb-2">
//                                 Payment Address ({paymentData?.currency}):
//                             </label>
//                             <div className="flex">
//                                 <input
//                                     type="text"
//                                     value={paymentData?.toAddress || ''}
//                                     readOnly
//                                     className="flex-1 p-2 border border-gray-300 rounded-l bg-white text-sm"
//                                 />
//                                 <button
//                                     onClick={() => copyToClipboard(paymentData?.toAddress)}
//                                     className="px-4 py-2 bg-blue-500 text-white rounded-r hover:bg-blue-600 text-sm"
//                                 >
//                                     Copy
//                                 </button>
//                             </div>
//                         </div>
                        
//                         <div className="mb-4">
//                             <label className="block text-sm font-medium text-gray-700 mb-2">
//                                 Amount to Send:
//                             </label>
//                             <div className="flex">
//                                 <input
//                                     type="text"
//                                     value={`${paymentData?.amount} ${paymentData?.currency}`}
//                                     readOnly
//                                     className="flex-1 p-2 border border-gray-300 rounded-l bg-white text-sm"
//                                 />
//                                 <button
//                                     onClick={() => copyToClipboard(paymentData?.amount.toString())}
//                                     className="px-4 py-2 bg-blue-500 text-white rounded-r hover:bg-blue-600 text-sm"
//                                 >
//                                     Copy
//                                 </button>
//                             </div>
//                         </div>

//                         <div className="text-sm text-gray-600">
//                             <p><strong>Plan:</strong> {paymentData?.plan?.name}</p>
//                             <p><strong>USD Value:</strong> ${paymentData?.usdAmount}</p>
//                         </div>
//                     </div>

//                     <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
//                         <h4 className="font-bold">Important:</h4>
//                         <ul className="list-disc list-inside text-sm mt-2">
//                             <li>Send the exact amount shown above</li>
//                             <li>Use only {paymentData?.currency} network</li>
//                             <li>Payment confirmation may take a few minutes</li>
//                             <li>Admin will manually verify and activate your subscription</li>
//                             <li>You'll receive an email confirmation once payment is detected</li>
//                             <li>Subscription activation usually takes 1-2 business hours</li>
//                         </ul>
//                     </div>

//                     <div className="text-center space-y-4">
//                         <button
//                             onClick={checkPaymentStatus}
//                             disabled={checkingPayment}
//                             className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50"
//                         >
//                             {checkingPayment ? 'Checking...' : 'Check Payment Status'}
//                         </button>
                        
//                         {paymentStatus === 'pending' && (
//                             <p className="text-gray-600">Payment not yet confirmed. Please try again in a few minutes.</p>
//                         )}

//                         <div className="border-t pt-4">
//                             <p className="text-sm text-gray-600 mb-2">You can also complete payment later from your account:</p>
//                             <button
//                                 onClick={() => navigate('/dashboard')}
//                                 className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
//                             >
//                                 Go to Account Dashboard
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );

//     return (
//         <>
//             <Helmet>
//                 <title>EchoWrite - Register</title>
//                 <meta name="description" content="Create an EchoWrite account and start writing smarter." />
//             </Helmet>
            
//             <div className="min-h-screen bg-gray-100 py-8">
//                 {/* Progress indicator */}
//                 <div className="max-w-4xl mx-auto mb-8">
//                     <div className="flex items-center justify-center">
//                         {[1, 2, 3].map((step) => (
//                             <div key={step} className="flex items-center">
//                                 <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
//                                     currentStep >= step ? 'bg-blue-500' : 'bg-gray-300'
//                                 }`}>
//                                     {step}
//                                 </div>
//                                 {step < 3 && (
//                                     <div className={`w-16 h-1 mx-2 ${
//                                         currentStep > step ? 'bg-blue-500' : 'bg-gray-300'
//                                     }`}></div>
//                                 )}
//                             </div>
//                         ))}
//                     </div>
//                     <div className="flex justify-center mt-2 text-sm text-gray-600">
//                         <span className="mr-16">Create Account</span>
//                         <span className="mr-16">Choose Plan</span>
//                         <span>Payment</span>
//                     </div>
//                 </div>

//                 {currentStep === 1 && renderStep1()}
//                 {currentStep === 2 && renderStep2()}
//                 {currentStep === 3 && renderStep3()}
//             </div>
//         </>
//     );
// };

// export default RegisterPage;
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Helmet } from 'react-helmet-async';
import axiosInstance from '../api/apiConfig';
import { useLocation } from 'react-router-dom';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        plan: 'basic'
    });
    const [currentStep, setCurrentStep] = useState(1);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [paymentData, setPaymentData] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('SOL');
    const [paymentStatus, setPaymentStatus] = useState('');
    const [checkingPayment, setCheckingPayment] = useState(false);
    
    const { register, user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const plans = {
        basic: { name: 'Basic Plan', price: 29, features: ['10 AI generations/day', 'Basic templates', 'Email support'] },
        pro: { name: 'Pro Plan', price: 59, features: ['50 AI generations/day', 'Premium templates', 'Priority support', 'API access'] },
        premium: { name: 'Premium Plan', price: 99, features: ['Unlimited AI generations', 'All templates', '24/7 support', 'API access', 'Custom integrations'] }
    };

   // Handle URL parameters on mount
useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const step = urlParams.get('step');
    
    if (step === '2' && user) {
        setFormData(prev => ({
            ...prev,
            username: user.username,
            email: user.email
        }));
        setCurrentStep(2);
    }
}, [location.search, user]);

// Handle redirect if user is already logged in with active subscription
// BUT don't interfere if we're in the middle of registration process
useEffect(() => {
    // Only redirect if user has active subscription AND we're not in registration flow
    if (user && user.subscription?.isActive && !location.search.includes('step=2') && currentStep === 1) {
        // Add a small delay to avoid interfering with registration flow
        const timer = setTimeout(() => {
            if (currentStep === 1) { // Double check we're still on step 1
                navigate('/dashboard');
            }
        }, 1000);
        
        return () => clearTimeout(timer);
    }
}, [user, navigate, location.search, currentStep]);

// Debug useEffect - remove this after fixing
useEffect(() => {
    console.log('=== STEP DEBUG ===');
    console.log('Current step:', currentStep);
    console.log('Current user:', user);
    console.log('Auth loading:', authLoading);
    console.log('Location search:', location.search);
    console.log('==================');
}, [currentStep, user, authLoading, location.search]);

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleStep1Submit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }
        
        setLoading(true);
        setError('');
    
        try {
            console.log('Starting registration...');
            console.log('Current step before registration:', currentStep);
            
            // Register the user and wait for complete user profile
            const result = await register(formData.username, formData.email, formData.password);
            console.log('Registration successful:', result);
            
            // Update form data with the returned user info
            const userData = result.user || result;
            setFormData(prev => ({
                ...prev,
                username: userData.username || formData.username,
                email: userData.email || formData.email
            }));
            
            console.log('About to set step to 2');
            console.log('Current step before setting to 2:', currentStep);
            
            // UPDATE THE URL FIRST - this will trigger your useEffect to set step to 2
            navigate('/register?step=2', { replace: true });
            
            console.log('URL updated to step=2');
            
        } catch (err) {
            console.error('Registration error:', err);
            if (err.response) {
                setError(err.response.data?.message || 'Failed to register user');
            } else if (err.request) {
                setError('Network error. Please check your connection and try again.');
            } else {
                setError(err.message || 'An unexpected error occurred during registration');
            }
        } finally {
            setLoading(false);
            console.log('Registration handler completed');
        }
    };

    // Add this useEffect to your RegisterPage component to debug step changes
useEffect(() => {
    console.log('Current step changed to:', currentStep);
    console.log('Current user:', user);
    console.log('Auth loading:', authLoading);
}, [currentStep, user, authLoading]);

// Also add this useEffect to monitor when the user state changes
useEffect(() => {
    console.log('User state changed:', user);
    if (user && currentStep === 1) {
        console.log('User is logged in but still on step 1, this might be the issue');
    }
}, [user]);

    const handleStep2Submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const paymentResponse = await axiosInstance.post('/payment/create', {
                plan: formData.plan,
                paymentMethod: paymentMethod
            });

            const paymentResult = paymentResponse.data;
            setPaymentData(paymentResult);
            setCurrentStep(3);
            
        } catch (err) {
            if (err.response) {
                setError(err.response.data?.message || 'Failed to create payment');
            } else if (err.request) {
                setError('Network error. Please check your connection and try again.');
            } else {
                setError(err.message || 'An unexpected error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    const checkPaymentStatus = async () => {
        if (!paymentData) return;
        
        setCheckingPayment(true);
        try {
            const response = await axiosInstance.get(`/payment/check-solana/${paymentData.paymentId}`);
            const result = response.data;
            
            if (result.status === 'confirmed') {
                setPaymentStatus('confirmed');
                setTimeout(() => {
                    navigate('/dashboard');
                }, 3000);
            } else {
                setPaymentStatus('pending');
            }
        } catch (error) {
            console.error('Error checking payment:', error);
            if (error.response) {
                setError(error.response.data?.message || 'Error checking payment status');
            } else if (error.request) {
                setError('Network error while checking payment status');
            } else {
                setError('Error checking payment status');
            }
        } finally {
            setCheckingPayment(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    // Show loading spinner while auth is loading
    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    const renderStep1 = () => (
        <div className="max-w-md mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg">
            <h2 className="text-3xl font-bold text-center mb-8">Create Your EchoWrite Account</h2>
            {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</p>}
            
            <form onSubmit={handleStep1Submit}>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                        Username
                    </label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="username"
                        name="username"
                        type="text"
                        placeholder="Your Username"
                        value={formData.username}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                        Email
                    </label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                        Password
                    </label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="password"
                        name="password"
                        type="password"
                        placeholder="******************"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
                        Confirm Password
                    </label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="******************"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Creating Account...' : 'Create Account & Continue'}
                    </button>
                </div>
            </form>
            <p className="text-center text-gray-600 text-sm mt-6">
                Already have an account?{' '}
                <Link to="/login" className="font-bold text-blue-500 hover:text-blue-800">
                    Sign In
                </Link>
            </p>
        </div>
    );

    const renderStep2 = () => (
        <div className="max-w-4xl mx-auto mt-10 p-8 bg-white dark:bg-gray-900 shadow-lg rounded-lg text-gray-900 dark:text-gray-100">
            <div className="mb-6">
                <div className="bg-green-100 dark:bg-green-800 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-100 px-4 py-3 rounded">
                    <h3 className="font-bold">Account Created Successfully!</h3>
                    <p>Welcome {formData.username || user?.username}! Now choose your plan to get started.</p>
                </div>
            </div>
    
            <h2 className="text-3xl font-bold text-center mb-8">Choose Your Plan</h2>
            {error && <p className="bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-100 p-3 rounded mb-4">{error}</p>}
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
                {Object.entries(plans).map(([key, plan]) => (
                    <div 
                        key={key}
                        className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                            formData.plan === key 
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' 
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                        onClick={() => setFormData({...formData, plan: key})}
                    >
                        <div className="text-center">
                            <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                                ${plan.price}<span className="text-sm text-gray-500 dark:text-gray-400">/month</span>
                            </div>
                            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                                {plan.features.map((feature, index) => (
                                    <li key={index} className="flex items-center">
                                        <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                        </svg>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <input
                            type="radio"
                            name="plan"
                            value={key}
                            checked={formData.plan === key}
                            onChange={handleInputChange}
                            className="mt-4 mx-auto block"
                        />
                    </div>
                ))}
            </div>
    
            <div className="mb-6">
                <h3 className="text-lg font-bold mb-4">Choose Payment Method</h3>
                <div className="flex space-x-4">
                    <button
                        type="button"
                        className={`px-6 py-3 rounded-lg font-medium ${
                            paymentMethod === 'SOL' 
                                ? 'bg-purple-500 text-white' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600'
                        }`}
                        onClick={() => setPaymentMethod('SOL')}
                    >
                        Solana (SOL) - Recommended
                    </button>
                    <button
                        type="button"
                        className={`px-6 py-3 rounded-lg font-medium ${
                            paymentMethod === 'BTC' 
                                ? 'bg-orange-500 text-white' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600'
                        }`}
                        onClick={() => setPaymentMethod('BTC')}
                    >
                        Bitcoin (BTC)
                    </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {paymentMethod === 'SOL' 
                        ? 'Faster transactions, lower fees' 
                        : 'Slower transactions, higher fees'}
                </p>
            </div>
    
            <div className="bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-600 text-yellow-700 dark:text-yellow-100 px-4 py-3 rounded mb-6">
                <h4 className="font-bold">Important:</h4>
                <p className="text-sm">Your account has been created but your subscription won't be active until payment is confirmed and approved by our admin team.</p>
            </div>
    
            <form onSubmit={handleStep2Submit}>
                <div className="flex justify-between">
                    <button
                        type="button"
                        onClick={() => navigate('/pricing')}
                        className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Skip for Now
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : `Pay with ${paymentMethod}`}
                    </button>
                </div>
            </form>
        </div>
    );
    

    const renderStep3 = () => (
        <div className="max-w-2xl mx-auto mt-10 p-8 bg-white dark:bg-gray-900 shadow-lg rounded-lg text-gray-900 dark:text-gray-100">
            <h2 className="text-3xl font-bold text-center mb-8">Complete Your Payment</h2>
            
            {paymentStatus === 'confirmed' ? (
                <div className="text-center">
                    <div className="bg-green-100 dark:bg-green-800 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-100 px-4 py-3 rounded mb-4">
                        <h3 className="font-bold">Payment Confirmed!</h3>
                        <p>Your payment has been confirmed and is being processed.</p>
                        <p className="mt-2">You will receive an email once your subscription is activated by our admin team.</p>
                        <p className="mt-2 text-sm">This usually takes 1-2 business hours during business days.</p>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">Redirecting to your account dashboard...</p>
                </div>
            ) : (
                <div>
                    <div className="bg-blue-100 dark:bg-blue-900 border border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-100 px-4 py-3 rounded mb-6">
                        <h3 className="font-bold">Send Payment</h3>
                        <p>Please send exactly <strong>{paymentData?.amount} {paymentData?.currency}</strong> to the address below:</p>
                    </div>
    
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-6">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                Payment Address ({paymentData?.currency}):
                            </label>
                            <div className="flex">
                                <input
                                    type="text"
                                    value={paymentData?.toAddress || ''}
                                    readOnly
                                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-l bg-white dark:bg-gray-700 text-sm dark:text-white"
                                />
                                <button
                                    onClick={() => copyToClipboard(paymentData?.toAddress)}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-r hover:bg-blue-600 text-sm"
                                >
                                    Copy
                                </button>
                            </div>
                        </div>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                Amount to Send:
                            </label>
                            <div className="flex">
                                <input
                                    type="text"
                                    value={`${paymentData?.amount} ${paymentData?.currency}`}
                                    readOnly
                                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-l bg-white dark:bg-gray-700 text-sm dark:text-white"
                                />
                                <button
                                    onClick={() => copyToClipboard(paymentData?.amount.toString())}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-r hover:bg-blue-600 text-sm"
                                >
                                    Copy
                                </button>
                            </div>
                        </div>
    
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            <p><strong>Plan:</strong> {paymentData?.plan?.name}</p>
                            <p><strong>USD Value:</strong> ${paymentData?.usdAmount}</p>
                        </div>
                    </div>
    
                    <div className="bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-600 text-yellow-700 dark:text-yellow-100 px-4 py-3 rounded mb-6">
                        <h4 className="font-bold">Important:</h4>
                        <ul className="list-disc list-inside text-sm mt-2">
                            <li>Send the exact amount shown above</li>
                            <li>Use only {paymentData?.currency} network</li>
                            <li>Payment confirmation may take a few minutes</li>
                            <li>Admin will manually verify and activate your subscription</li>
                            <li>You'll receive an email confirmation once payment is detected</li>
                            <li>Subscription activation usually takes 1-2 business hours</li>
                        </ul>
                    </div>
    
                    <div className="text-center space-y-4">
                        <button
                            onClick={checkPaymentStatus}
                            disabled={checkingPayment}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50"
                        >
                            {checkingPayment ? 'Checking...' : 'Check Payment Status'}
                        </button>
                        
                        {paymentStatus === 'pending' && (
                            <p className="text-gray-600 dark:text-gray-400">Payment not yet confirmed. Please try again in a few minutes.</p>
                        )}
    
                        <div className="border-t border-gray-300 dark:border-gray-700 pt-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">You can also complete payment later from your account:</p>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                            >
                                Go to Account Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
    

    return (
        <>
            <Helmet>
                <title>EchoWrite - Register</title>
                <meta name="description" content="Create an EchoWrite account and start writing smarter." />
            </Helmet>
            
            <div className="min-h-screen bg-gray-100 py-8">
                {/* Progress indicator */}
                <div className="max-w-4xl mx-auto mb-8">
                    <div className="flex items-center justify-center">
                        {[1, 2, 3].map((step) => (
                            <div key={step} className="flex items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                                    currentStep >= step ? 'bg-blue-500' : 'bg-gray-300'
                                }`}>
                                    {step}
                                </div>
                                {step < 3 && (
                                    <div className={`w-16 h-1 mx-2 ${
                                        currentStep > step ? 'bg-blue-500' : 'bg-gray-300'
                                    }`}></div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-center mt-2 text-sm text-gray-600">
                        <span className="mr-16">Create Account</span>
                        <span className="mr-16">Choose Plan</span>
                        <span>Payment</span>
                    </div>
                </div>

                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
            </div>
        </>
    );
};

export default RegisterPage;
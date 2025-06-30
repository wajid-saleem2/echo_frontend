import React, { useState, useEffect } from 'react';
import { CreditCard, Globe, Smartphone, CheckCircle, AlertCircle, Loader } from 'lucide-react';

const PaymentIntegration = () => {
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('payoneer');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [user, setUser] = useState({
    id: '12345',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+923001234567'
  });

  const plans = {
    basic: {
      name: 'Basic',
      price: 9.99,
      currency: 'USD',
      pkrPrice: 2800,
      features: ['Basic AI Writing', '1000 words/month', 'Email Support'],
      popular: false
    },
    pro: {
      name: 'Pro',
      price: 19.99,
      currency: 'USD',
      pkrPrice: 5600,
      features: ['Advanced AI Writing', '5000 words/month', 'Grammar Check', 'Priority Support'],
      popular: true
    },
    premium: {
      name: 'Premium',
      price: 39.99,
      currency: 'USD',
      pkrPrice: 11200,
      features: ['All Features', 'Unlimited words', '24/7 Support', 'Custom Templates'],
      popular: false
    }
  };

  const paymentMethods = {
    payoneer: {
      name: 'Payoneer',
      icon: Globe,
      description: 'International payments via Payoneer',
      currency: 'USD',
      available: true
    },
    jazzcash: {
      name: 'JazzCash',
      icon: Smartphone,
      description: 'Mobile wallet payment (Pakistan)',
      currency: 'PKR',
      available: true
    },
    paypro: {
      name: 'PayPro',
      icon: CreditCard,
      description: 'Credit/Debit cards (Pakistan)',
      currency: 'PKR',
      available: true
    }
  };

  const handlePaymentMethodChange = (method) => {
    setSelectedPaymentMethod(method);
    setPaymentStatus(null);
  };

  const createPayment = async (paymentMethod) => {
    setIsProcessing(true);
    setPaymentStatus(null);

    try {
      const endpoint = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/payment/create-${paymentMethod}-payment`;
      
      const paymentData = {
        userId: user.id,
        planType: selectedPlan,
        userEmail: user.email,
        userName: user.name,
        userPhone: user.phone
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();

      if (result.success) {
        if (paymentMethod === 'payoneer') {
          // Redirect to Payoneer payment page
          window.location.href = result.paymentUrl;
        } else if (paymentMethod === 'jazzcash') {
          // Submit form to JazzCash
          submitJazzCashForm(result.paymentData, result.paymentUrl);
        } else if (paymentMethod === 'paypro') {
          // Redirect to PayPro checkout
          window.location.href = result.checkoutUrl;
        }
      } else {
        setPaymentStatus({ type: 'error', message: result.error || 'Payment creation failed' });
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus({ type: 'error', message: 'Failed to process payment. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const submitJazzCashForm = (paymentData, actionUrl) => {
    // Create a form dynamically and submit to JazzCash
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = actionUrl;
    form.style.display = 'none';

    Object.keys(paymentData).forEach(key => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = paymentData[key];
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  };

  const handlePayment = () => {
    createPayment(selectedPaymentMethod);
  };

  const getCurrentPrice = () => {
    const plan = plans[selectedPlan];
    const method = paymentMethods[selectedPaymentMethod];
    
    if (method.currency === 'PKR') {
      return `PKR ${plan.pkrPrice}`;
    }
    return `$${plan.price}`;
  };

  // Check for payment status on component mount (for return from payment gateways)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentRef = urlParams.get('payment_ref');
    const status = urlParams.get('status');
    
    if (paymentRef && status) {
      if (status === 'success') {
        setPaymentStatus({ type: 'success', message: 'Payment completed successfully!' });
      } else {
        setPaymentStatus({ type: 'error', message: 'Payment was cancelled or failed.' });
      }
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your AI Writing Plan</h1>
        <p className="text-gray-600">Unlock the power of AI-driven content creation</p>
      </div>

      {/* Payment Status */}
      {paymentStatus && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          paymentStatus.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {paymentStatus.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{paymentStatus.message}</span>
        </div>
      )}

      {/* Plan Selection */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {Object.entries(plans).map(([key, plan]) => (
          <div
            key={key}
            className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all ${
              selectedPlan === key
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedPlan(key)}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}
            
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                <span className="text-gray-500 ml-1">/month</span>
              </div>
              <div className="text-sm text-gray-600 mb-4">
                ≈ PKR {plan.pkrPrice}/month
              </div>
              
              <ul className="space-y-2 text-sm text-gray-600">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Payment Method Selection */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Select Payment Method</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {Object.entries(paymentMethods).map(([key, method]) => {
            const IconComponent = method.icon;
            return (
              <div
                key={key}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedPaymentMethod === key
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${!method.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => method.available && handlePaymentMethodChange(key)}
              >
                <div className="flex items-center gap-3">
                  <IconComponent className="w-6 h-6 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{method.name}</h3>
                    <p className="text-sm text-gray-600">{method.description}</p>
                    <span className="text-xs text-blue-600 font-medium">
                      Pay in {method.currency}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Summary */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Plan:</span>
            <span className="font-medium">{plans[selectedPlan].name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Payment Method:</span>
            <span className="font-medium">{paymentMethods[selectedPaymentMethod].name}</span>
          </div>
          <div className="flex justify-between text-lg font-semibold border-t pt-2">
            <span>Total:</span>
            <span>{getCurrentPrice()}</span>
          </div>
        </div>
      </div>

      {/* Payment Button */}
      <button
        onClick={handlePayment}
        disabled={isProcessing}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            Pay {getCurrentPrice()}
          </>
        )}
      </button>

      {/* Payment Method Info */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>
          {selectedPaymentMethod === 'payoneer' && 
            'You will be redirected to Payoneer\'s secure payment page'
          }
          {selectedPaymentMethod === 'jazzcash' && 
            'You will be redirected to JazzCash mobile payment'
          }
          {selectedPaymentMethod === 'paypro' && 
            'You will be redirected to PayPro\'s secure checkout'
          }
        </p>
        <p className="mt-2">🔒 Your payment information is secure and encrypted</p>
      </div>
    </div>
  );
};

export default PaymentIntegration;
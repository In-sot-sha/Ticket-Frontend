import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { 
  CreditCard, 
  Smartphone, 
  Wallet, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  Banknote,
  Loader2
} from 'lucide-react';

// Type for payment methods
type PaymentMethod = 'paystack' | 'opay' | 'bank-transfer' | 'cash';

// Define types for payment states
type PaymentStatus = 'idle' | 'processing' | 'success' | 'failed' | 'pending-verification';

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get order details from location state or use mock data
  const orderData = location.state || {
    eventId: 1,
    eventName: "Tech Conference 2023",
    ticketType: "VIP",
    quantity: 2,
    totalAmount: 30000,
    currency: "NGN"
  };
  
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [paymentDetails, setPaymentDetails] = useState({
    phone: '',
    email: ''
  });
  const [opayTransactionId, setOpayTransactionId] = useState<string | null>(null);
  
  // Handle Paystack payment
  const handlePaystackPayment = async () => {
    if (!paymentDetails.email) {
      alert('Please enter your email address');
      return;
    }
    
    setPaymentStatus('processing');
    
    try {
      // In a real application, you would initialize the Paystack transaction here
      // This is a simplified implementation - in real app you'd use Paystack's inline script
      // Example:
      // const response = await fetch('/api/paystack/initialize', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     amount: orderData.totalAmount,
      //     email: paymentDetails.email,
      //     reference: `tx_${Date.now()}`
      //   })
      // });
      // const data = await response.json();
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo purposes, we'll simulate success
      setPaymentStatus('success');
      
      // In a real app, you'd handle the Paystack redirect or inline payment form here
      // Paystack.configure({
      //   key: process.env.REACT_APP_PAYSTACK_KEY,
      //   email: paymentDetails.email,
      //   amount: orderData.totalAmount * 100, // Paystack uses kobo
      //   ref: `tx_${Date.now()}`,
      //   onClose: () => {
      //     setPaymentStatus('failed');
      //   },
      //   callback: (response) => {
      //     // Verify transaction
      //     verifyTransaction(response.reference);
      //   }
      // }).openIframe();
    } catch (error) {
      console.error('Paystack payment error:', error);
      setPaymentStatus('failed');
      alert('There was an error processing your payment. Please try again.');
    }
  };

  // Handle OPay payment
  const handleOPayPayment = async () => {
    if (!paymentDetails.phone) {
      alert('Please enter your phone number');
      return;
    }
    
    setPaymentStatus('processing');
    
    try {
      // In a real application, you would initialize the OPay transaction here
      // This is a simplified implementation
      const newTransactionId = `opay_${Date.now()}`;
      setOpayTransactionId(newTransactionId);
      
      // Simulate OPay payment process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, you'd redirect to OPay app or open their payment page
      // For this demo, we'll simulate the process
      setPaymentStatus('pending-verification');
      
      // Simulate verification after some time
      setTimeout(() => {
        setPaymentStatus('success');
      }, 3000);
    } catch (error) {
      console.error('OPay payment error:', error);
      setPaymentStatus('failed');
      alert('There was an error processing your payment. Please try again.');
    }
  };

  // Handle other payment methods
  const handleOtherPayment = async () => {
    setPaymentStatus('processing');
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For bank transfer or cash, we might just record the intent
      // and follow up later, so we'll show success
      setPaymentStatus('success');
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('failed');
      alert('There was an error processing your payment. Please try again.');
    }
  };

  // Reset payment process
  const resetPayment = () => {
    setPaymentStatus('idle');
    setSelectedMethod(null);
    setOpayTransactionId(null);
  };

  // Payment methods configuration
  const paymentMethods = [
    {
      id: 'paystack',
      name: 'Paystack',
      icon: <CreditCard className="h-6 w-6" />,
      description: 'Pay with debit/credit card',
      color: 'bg-[#313c87]' // Paystack brand color
    },
    {
      id: 'opay',
      name: 'OPay',
      icon: <Smartphone className="h-6 w-6" />,
      description: 'Pay with OPay wallet',
      color: 'bg-[#ff6600]' // OPay brand color
    },
    {
      id: 'bank-transfer',
      name: 'Bank Transfer',
      icon: <Banknote className="h-6 w-6" />,
      description: 'Pay via bank transfer',
      color: 'bg-[#00a651]' // Green for bank transfer
    },
    {
      id: 'cash',
      name: 'Cash at Gate',
      icon: <Wallet className="h-6 w-6" />,
      description: 'Pay at the event venue',
      color: 'bg-gray-700'
    }
  ];

  // Effect to handle OPay callback simulation
  useEffect(() => {
    if (paymentStatus === 'pending-verification') {
      // This would be where you poll the backend for payment status
      // or wait for a callback from OPay
    }
  }, [paymentStatus]);

  return (
    <div className="min-h-screen py-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button 
                  onClick={() => navigate(-1)}
                  className="mr-3 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="text-2xl font-bold">Complete Payment</h1>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  ₦{orderData.totalAmount.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {orderData.quantity} × {orderData.ticketType} tickets
                </div>
              </div>
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-3">Order Summary</h2>
            <div className="flex justify-between mb-1">
              <span className="text-gray-600 dark:text-gray-300">{orderData.eventName}</span>
              <span className="font-medium">₦{orderData.totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                {orderData.quantity} × {orderData.ticketType}
              </span>
              <span className="text-gray-500 dark:text-gray-400 text-sm">NGN</span>
            </div>
          </div>
          
          {/* Payment Status */}
          {paymentStatus === 'processing' && (
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center">
                <Loader2 className="h-5 w-5 animate-spin mr-3" />
                <span>Processing your payment...</span>
              </div>
            </div>
          )}
          
          {paymentStatus === 'pending-verification' && (
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900/20">
              <div className="flex items-center">
                <Loader2 className="h-5 w-5 animate-spin mr-3 text-yellow-500" />
                <span>Verifying payment with OPay...</span>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Please complete the payment in the OPay app if it opens automatically.
              </p>
            </div>
          )}
          
          {paymentStatus === 'success' && (
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/20">
              <div className="flex items-center text-green-700 dark:text-green-400 mb-4">
                <CheckCircle className="h-6 w-6 mr-2" />
                <span className="text-lg font-medium">Payment Successful!</span>
              </div>
              
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold">{orderData.eventName}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {orderData.quantity} × {orderData.ticketType} tickets
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">₦{orderData.totalAmount.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Paid</div>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="text-sm">
                    <p className="mb-1"><span className="font-medium">Payment Method:</span> {selectedMethod?.toUpperCase()}</p>
                    <p><span className="font-medium">Transaction ID:</span> {selectedMethod === 'opay' && opayTransactionId ? opayTransactionId : `TXN_${Date.now()}`}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <Button 
                  onClick={() => navigate('/ticket-confirmation', { state: orderData })}
                  className="w-full"
                >
                  View Ticket
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/organizer/events')}
                  className="w-full"
                >
                  View Dashboard
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="w-full"
                >
                  Browse Events
                </Button>
              </div>
            </div>
          )}
          
          {paymentStatus === 'failed' && (
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-900/20">
              <div className="flex items-center text-red-700 dark:text-red-400">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>Payment failed. Please try again.</span>
              </div>
              <Button 
                onClick={resetPayment}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          )}
          
          {/* Payment Methods */}
          {paymentStatus === 'idle' && (
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Select Payment Method</h2>
              
              <div className="space-y-3 mb-6">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedMethod === method.id
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary'
                    }`}
                    onClick={() => setSelectedMethod(method.id as PaymentMethod)}
                  >
                    <div className="flex items-center">
                      <div className={`${method.color} rounded-lg p-2 mr-4 text-white`}>
                        {method.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{method.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {method.description}
                        </p>
                      </div>
                      {selectedMethod === method.id && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Payment Details Form */}
              {selectedMethod === 'paystack' && (
                <div className="mb-6">
                  <h3 className="font-medium mb-3">Payment Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={paymentDetails.email}
                        onChange={(e) => setPaymentDetails({...paymentDetails, email: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {selectedMethod === 'opay' && (
                <div className="mb-6">
                  <h3 className="font-medium mb-3">OPay Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        value={paymentDetails.phone}
                        onChange={(e) => setPaymentDetails({...paymentDetails, phone: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="+234 801 234 5678"
                        required
                      />
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Make sure you have the OPay app installed on your phone.
                    </div>
                  </div>
                </div>
              )}
              
              {/* Action Button */}
              <div className="pt-4">
                <Button
                  className="w-full"
                  size="lg"
                  disabled={!selectedMethod}
                  onClick={() => {
                    if (selectedMethod === 'paystack') {
                      handlePaystackPayment();
                    } else if (selectedMethod === 'opay') {
                      handleOPayPayment();
                    } else {
                      handleOtherPayment();
                    }
                  }}
                >
                  {selectedMethod ? `Pay ₦${orderData.totalAmount.toLocaleString()}` : 'Select Payment Method'}
                </Button>
                
                <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  Your payment is secured with industry-standard encryption
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
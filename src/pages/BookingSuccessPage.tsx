import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

const BookingSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [statusMessage, setStatusMessage] = useState('Verifying payment and generating tickets...');
  const [errorOccurred, setErrorOccurred] = useState(false);

  useEffect(() => {
    const processOpayReturn = async () => {
      const orderId = searchParams.get('orderId');
      const status = searchParams.get('status');

      if (!orderId) {
        setStatusMessage('Error: Missing order reference.');
        setErrorOccurred(true);
        return;
      }

      if (status !== 'success') {
        setStatusMessage('Payment was cancelled or failed. Redirecting to home...');
        setErrorOccurred(true);
        setTimeout(() => navigate('/'), 3000);
        return;
      }

      // Retrieve guest transaction info from localStorage
      const cachedOrderStr = localStorage.getItem(`opay_order_${orderId}`);
      if (!cachedOrderStr) {
        setStatusMessage('Error: Could not retrieve reservation metadata.');
        setErrorOccurred(true);
        return;
      }

      try {
        const cachedOrder = JSON.parse(cachedOrderStr);
        
        // Execute checkout on backend
        const checkoutRes = await api.post<any>('/tickets/checkout/guest', {
          firstName: cachedOrder.firstName,
          lastName: cachedOrder.lastName,
          email: cachedOrder.email,
          phone: cachedOrder.phone,
          eventId: cachedOrder.eventId,
          ticketTypeId: cachedOrder.ticketTypeId,
          quantity: cachedOrder.quantity
        });

        if (checkoutRes.status === 201) {
          // Clean up localstorage cache
          localStorage.removeItem(`opay_order_${orderId}`);
          
          const confirmedOrder = {
            eventId: cachedOrder.eventId,
            eventName: cachedOrder.eventName,
            ticketType: cachedOrder.ticketType || 'General Admission',
            quantity: cachedOrder.quantity,
            totalAmount: cachedOrder.totalAmount,
            currency: 'NGN',
            tickets: checkoutRes.data.tickets
          };
          
          setStatusMessage('Payment verified! Redirecting to confirmation page...');
          setTimeout(() => {
            navigate('/ticket-confirmation', { state: confirmedOrder });
          }, 1500);
        } else {
          throw new Error('Server rejected checkout creation.');
        }
      } catch (err: any) {
        console.error('Error completing OPay guest checkout:', err);
        setStatusMessage('Payment succeeded, but ticket generation failed: ' + (err.response?.data?.message || err.message));
        setErrorOccurred(true);
      }
    };

    processOpayReturn();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-3xl p-8 border border-neutral-200 dark:border-neutral-800 shadow-lg text-center">
        {!errorOccurred ? (
          <div className="flex flex-col items-center">
            <div className="h-12 w-12 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mb-4" />
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">Processing checkout</h2>
            <p className="text-sm text-neutral-500">{statusMessage}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="h-12 w-12 bg-red-50 dark:bg-red-950/20 rounded-full flex items-center justify-center text-red-500 mb-4 font-bold text-xl">
              !
            </div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">Checkout Issue</h2>
            <p className="text-sm text-red-500 mb-6">{statusMessage}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-neutral-900 text-white rounded-xl text-xs font-bold px-6 py-2.5 hover:opacity-90 transition-opacity"
            >
              Back to Explore
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingSuccessPage;

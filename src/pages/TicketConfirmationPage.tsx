import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { CheckCircle, Calendar, MapPin, Clock, Ticket } from 'lucide-react';
import QRCode from 'qrcode.react';

const TicketConfirmationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get order details from location state
  const orderData = location.state || {
    eventId: 1,
    eventName: "Tech Conference 2023",
    ticketType: "VIP",
    quantity: 2,
    totalAmount: 30000,
    currency: "NGN"
  };

  // Generate a mock ticket ID
  const ticketId = `TXN_${Date.now()}`;
  
  // Format the date for display
  const formatDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen py-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {/* Success Header */}
          <div className="p-6 bg-green-50 dark:bg-green-900/20 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col items-center text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Successful!</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Your tickets have been confirmed and sent to your email
              </p>
            </div>
          </div>
          
          {/* Ticket Summary */}
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold">{orderData.eventName}</h2>
                <p className="text-gray-600 dark:text-gray-300">Order ID: {ticketId}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  ₦{orderData.totalAmount.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Paid on {formatDate()}
                </div>
              </div>
            </div>

            {/* Ticket Details */}
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-6 mb-6">
              <div className="flex items-center mb-4">
                <Ticket className="h-5 w-5 text-primary mr-2" />
                <h3 className="font-semibold">Your Tickets</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Ticket Type</p>
                  <p className="font-medium">{orderData.ticketType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Quantity</p>
                  <p className="font-medium">{orderData.quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Amount</p>
                  <p className="font-medium">₦{orderData.totalAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <p className="font-medium text-green-600">Confirmed</p>
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center mb-8">
              <h3 className="font-semibold mb-3">Your Ticket QR Code</h3>
              <div className="bg-white p-4 rounded-lg">
                <QRCode 
                  value={`eventify_ticket_${ticketId}`} 
                  size={150} 
                />
              </div>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                Show this QR code at the event entrance for verification
              </p>
            </div>

            {/* Event Details */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="font-semibold mb-4">Event Details</h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Date & Time</p>
                    <p className="font-medium">December 15, 2023 • 9:00 AM - 6:00 PM</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                    <p className="font-medium">Eko Convention Centre, Lagos, Nigeria</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Clock className="h-5 w-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Check-in Time</p>
                    <p className="font-medium">8:00 AM - 9:00 AM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => navigate('/organizer/events')}
                className="flex-1"
              >
                View Dashboard
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/')}
                className="flex-1"
              >
                Browse Events
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  // In a real app, this would download the ticket
                  alert('Ticket has been downloaded');
                }}
                className="flex-1"
              >
                Download Ticket
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketConfirmationPage;
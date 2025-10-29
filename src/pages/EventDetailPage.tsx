import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, Users, Ticket, Share2, Heart, CheckCircle, Store, User, Mail, Building } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import QRCode from 'qrcode.react';

// Mock event data
const mockEvent = {
  id: 1,
  title: "Tech Conference 2023",
  description: "Join us for the largest technology conference in Nigeria. Network with industry leaders, attend workshops, and learn about the latest trends in tech.",
  date: "2023-12-15",
  startTime: "09:00 AM",
  endTime: "06:00 PM",
  location: "Eko Convention Centre, Lagos, Nigeria",
  category: "Technology",
  price: 5000,
  ticketsAvailable: 250,
  image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
  organizer: {
    name: "Tech Events Nigeria",
    email: "info@techevents.com",
    phone: "+234 801 234 5678"
  },
  ticketTypes: [
    { id: 1, name: "General Admission", price: 5000, quantity: 200 },
    { id: 2, name: "VIP", price: 15000, quantity: 50 },
    { id: 3, name: "Student", price: 2500, quantity: 100 }
  ],
  amenities: [
    "Free WiFi",
    "Lunch Provided",
    "Networking Sessions",
    "Workshops",
    "Swag Bag"
  ],
  vendorApplicationsAllowed: true,
  vendorApplications: [
    {
      id: 1,
      vendorName: "Tech Gadgets Ltd",
      businessName: "Tech Gadgets Nigeria",
      category: "Electronics",
      description: "Latest tech gadgets and accessories",
      status: "pending" // pending, approved, rejected
    }
  ]
};

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [showVendorApplication, setShowVendorApplication] = useState(false);
  const [showVendorApplications, setShowVendorApplications] = useState(false);
  const [vendorApplication, setVendorApplication] = useState({
    vendorName: user?.firstName || '',
    businessName: '',
    email: user?.email || '',
    phone: user?.phone || '',
    category: '',
    description: ''
  });

  const event = mockEvent; // In a real app, this would come from an API

  const handlePurchaseTicket = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (selectedTicket === null) {
      alert('Please select a ticket type');
      return;
    }

    // Prepare order data and navigate to payment page
    const selectedTicketType = event.ticketTypes.find(t => t.id === selectedTicket);
    const orderData = {
      eventId: event.id,
      eventName: event.title,
      ticketType: selectedTicketType?.name || 'Unknown',
      quantity: ticketQuantity,
      totalAmount: (parseFloat(selectedTicketType?.price || '0') * ticketQuantity),
      currency: "NGN"
    };

    // Navigate to payment page with order data
    navigate('/payment', { state: orderData });
  };

  const handleVendorApply = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would submit the vendor application via an API
    console.log('Vendor application submitted:', vendorApplication);
    alert('Your vendor application has been submitted and is pending approval');
    setShowVendorApplication(false);
    // Reset the form
    setVendorApplication({
      vendorName: user?.firstName || '',
      businessName: '',
      email: user?.email || '',
      phone: user?.phone || '',
      category: '',
      description: ''
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content */}
          <div className="lg:w-2/3">
            <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg">
              <img 
                src={event.image} 
                alt={event.title} 
                className="w-full h-64 md:h-96 object-cover"
              />
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h1 className="text-3xl font-bold">{event.title}</h1>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="icon">
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-primary" />
                    <span>{formatDate(event.date)}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-primary" />
                    <span>{event.startTime} - {event.endTime}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-primary" />
                    <span>{event.location}</span>
                  </div>
                </div>
                
                <div className="prose dark:prose-invert max-w-none mb-8">
                  <h2 className="text-xl font-semibold mb-3">About this event</h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    {event.description}
                  </p>
                  
                  <h3 className="text-lg font-semibold mt-6 mb-3">What's Included</h3>
                  <ul className="space-y-2">
                    {event.amenities.map((amenity, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                        <span>{amenity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Vendor Applications Section */}
                {event.vendorApplicationsAllowed && (
                  <div className="mt-12 border-t border-gray-200 dark:border-gray-700 pt-8">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold flex items-center">
                        <Store className="h-6 w-6 mr-2 text-primary" />
                        Vendor Opportunities
                      </h2>
                      {user?.role === 'VENDOR' && (
                        <Button 
                          onClick={() => setShowVendorApplication(true)}
                        >
                          <Store className="h-4 w-4 mr-2" />
                          Apply as Vendor
                        </Button>
                      )}
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      Are you interested in showcasing your products or services at this event? Apply to become a vendor.
                    </p>
                    
                    {!isAuthenticated ? (
                      <div className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg text-center">
                        <p className="mb-3">To apply as a vendor, you need to be logged in to your account.</p>
                        <Button onClick={() => navigate('/login')}>Log in to Apply</Button>
                      </div>
                    ) : user?.role !== 'VENDOR' ? (
                      <div className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg text-center">
                        <p className="mb-3">You need to register as a vendor to apply for vendor opportunities.</p>
                        <Button onClick={() => navigate('/become-organizer')}>Become a Vendor</Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {event.vendorApplications.map((vendorApp) => (
                          <div key={vendorApp.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div className="flex items-center mb-3">
                              <div className="bg-gray-200 dark:bg-gray-600 rounded-lg w-12 h-12 mr-3 flex items-center justify-center">
                                <Building className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-medium">{vendorApp.businessName}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{vendorApp.category}</p>
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                              {vendorApp.description}
                            </p>
                            
                            <div className="flex items-center">
                              <div className={`h-3 w-3 rounded-full mr-2 ${
                                vendorApp.status === 'approved' ? 'bg-green-500' : 
                                vendorApp.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
                              }`}></div>
                              <span className="text-xs font-medium capitalize">
                                {vendorApp.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="lg:w-1/3">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sticky top-24">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">₦{event.price.toLocaleString()}</h2>
                <span className="bg-primary/10 text-primary text-sm font-medium px-2 py-1 rounded">
                  {event.ticketsAvailable} tickets left
                </span>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Includes access to all conference sessions, lunch, and networking events.
              </p>
              
              {/* Ticket selection */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Select Ticket Type</h3>
                <div className="space-y-3">
                  {event.ticketTypes.map(ticket => (
                    <label 
                      key={ticket.id}
                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer ${
                        selectedTicket === ticket.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-primary'
                      }`}
                    >
                      <div>
                        <div className="font-medium">{ticket.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          ₦{ticket.price.toLocaleString()}
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="ticketType"
                        value={ticket.id}
                        checked={selectedTicket === ticket.id}
                        onChange={() => setSelectedTicket(ticket.id)}
                        className="h-4 w-4 text-primary focus:ring-primary"
                      />
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block font-medium mb-2">Quantity</label>
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-r-none"
                    onClick={() => setTicketQuantity(q => Math.max(1, q - 1))}
                  >
                    -
                  </Button>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={ticketQuantity}
                    onChange={(e) => setTicketQuantity(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="h-9 w-16 border-y text-center [-moz-appearance:_textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-l-none"
                    onClick={() => setTicketQuantity(q => Math.min(10, q + 1))}
                  >
                    +
                  </Button>
                </div>
              </div>
              
              <Button 
                className="w-full mb-4" 
                size="lg"
                onClick={handlePurchaseTicket}
              >
                <Ticket className="h-5 w-5 mr-2" />
                Purchase Ticket
              </Button>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                You agree to the Terms of Service and Privacy Policy.
              </p>
            </div>
            
            {/* Organizer info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mt-6">
              <h3 className="font-semibold mb-3">Organized by</h3>
              <div className="flex items-center">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-full w-12 h-12 flex items-center justify-center mr-3">
                  <span className="font-bold">{event.organizer.name.charAt(0)}</span>
                </div>
                <div>
                  <div className="font-medium">{event.organizer.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Contact: {event.organizer.email}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Vendor Application Modal */}
        {showVendorApplication && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <Store className="h-5 w-5 mr-2 text-primary" />
                Apply as Vendor
              </h3>
              
              <form onSubmit={handleVendorApply}>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="vendorName" className="block text-sm font-medium mb-1">
                        Your Name
                      </label>
                      <input
                        type="text"
                        id="vendorName"
                        value={vendorApplication.vendorName}
                        onChange={(e) => setVendorApplication({...vendorApplication, vendorName: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="businessName" className="block text-sm font-medium mb-1">
                        Business Name
                      </label>
                      <input
                        type="text"
                        id="businessName"
                        value={vendorApplication.businessName}
                        onChange={(e) => setVendorApplication({...vendorApplication, businessName: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Your Business Name"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={vendorApplication.email}
                        onChange={(e) => setVendorApplication({...vendorApplication, email: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        value={vendorApplication.phone}
                        onChange={(e) => setVendorApplication({...vendorApplication, phone: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="+234 801 234 5678"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium mb-1">
                      Business Category
                    </label>
                    <select
                      id="category"
                      value={vendorApplication.category}
                      onChange={(e) => setVendorApplication({...vendorApplication, category: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      <option value="">Select a category</option>
                      <option value="food">Food & Beverage</option>
                      <option value="electronics">Electronics</option>
                      <option value="fashion">Fashion</option>
                      <option value="arts">Arts & Crafts</option>
                      <option value="services">Services</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium mb-1">
                      Business Description
                    </label>
                    <textarea
                      id="description"
                      value={vendorApplication.description}
                      onChange={(e) => setVendorApplication({...vendorApplication, description: e.target.value})}
                      rows={4}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Tell us about your products or services and why you'd like to be part of this event"
                      required
                    ></textarea>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowVendorApplication(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      Submit Application
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
        

      </div>
    </div>
  );
};

export default EventDetailPage;
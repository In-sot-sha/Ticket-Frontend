import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Ticket, Search, Star, TrendingUp, Clock, Tag } from 'lucide-react';
import { Button } from '../components/ui/Button';

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for featured events
  const featuredEvents = [
    {
      id: 1,
      title: "Tech Conference 2023",
      date: "2023-12-15",
      location: "Lagos, Nigeria",
      image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      ticketsAvailable: 250,
      category: "Technology",
      rating: 4.8,
      price: "₦25,000"
    },
    {
      id: 2,
      title: "Music Festival",
      date: "2023-11-20",
      location: "Abuja, Nigeria",
      image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      ticketsAvailable: 500,
      category: "Music",
      rating: 4.9,
      price: "₦10,000"
    },
    {
      id: 3,
      title: "Food & Wine Expo",
      date: "2024-01-10",
      location: "Port Harcourt, Nigeria",
      image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      ticketsAvailable: 180,
      category: "Food & Drink",
      rating: 4.7,
      price: "₦8,500"
    }
  ];

  // Mock trending events
  const trendingEvents = [
    {
      id: 4,
      title: "Startup Pitch Competition",
      date: "2023-12-01",
      location: "Ibadan, Nigeria",
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      category: "Business",
      rating: 4.6,
      price: "₦5,000"
    },
    {
      id: 5,
      title: "Art & Culture Summit",
      date: "2023-11-25",
      location: "Kano, Nigeria",
      image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      category: "Art",
      rating: 4.9,
      price: "₦15,000"
    }
  ];

  // Categories for event discovery
  const categories = [
    { name: "Music", icon: "🎵", count: 24 },
    { name: "Food & Drink", icon: " cuisine", count: 18 },
    { name: "Business", icon: "💼", count: 32 },
    { name: "Technology", icon: "💻", count: 27 },
    { name: "Health", icon: "🧘", count: 15 },
    { name: "Arts", icon: "🎨", count: 22 }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/events?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-primary/90 text-white py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-6">
              Discover events that bring you together
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Find and attend the best events happening near you. From concerts to conferences, 
              workshops to festivals - there's something for everyone.
            </p>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="What are you looking for? Try 'Music', 'Food', or 'Technology'..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 text-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-primary text-lg"
                />
                <Button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white text-primary px-6 py-2 rounded-full hover:bg-gray-100">
                  Search
                </Button>
              </div>
            </form>

            {/* Popular searches */}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {['Concerts', 'Food festivals', 'Tech events', 'Workshops', 'Networking'].map((item) => (
                <button 
                  key={item}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full text-sm transition-colors"
                  onClick={() => {
                    setSearchQuery(item);
                    window.location.href = `/events?search=${encodeURIComponent(item)}`;
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">Browse by category</h2>
            <Link to="/events" className="text-primary hover:underline">
              View all
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {categories.map((category) => (
              <div 
                key={category.name}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setSearchQuery(category.name);
                  window.location.href = `/events?search=${encodeURIComponent(category.name)}`;
                }}
              >
                <div className="text-2xl mb-2">{category.icon}</div>
                <h3 className="font-medium">{category.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{category.count} events</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">Featured events</h2>
            <Link to="/events" className="text-primary hover:underline">
              View all
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredEvents.map((event) => (
              <div key={event.id} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <div className="relative">
                  <img 
                    src={event.image} 
                    alt={event.title} 
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-white dark:bg-gray-900 px-2 py-1 rounded-full flex items-center text-sm">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    <span>{event.rating}</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold mb-1">{event.title}</h3>
                      <div className="flex items-center text-gray-600 dark:text-gray-300 mb-2">
                        <Tag className="h-4 w-4 mr-1" />
                        <span className="text-sm">{event.category}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{event.price}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-600 dark:text-gray-300 mb-2">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{new Date(event.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-300 mb-4">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{event.location}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{event.ticketsAvailable} tickets left</span>
                    </div>
                    <Link to={`/events/${event.id}`}>
                      <Button>Get Tickets</Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Events */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">Trending events</h2>
            <Link to="/events?sort=trending" className="text-primary hover:underline">
              View all
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {trendingEvents.map((event) => (
              <div key={event.id} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow flex">
                <img 
                  src={event.image} 
                  alt={event.title} 
                  className="w-1/3 h-full object-cover"
                />
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold">{event.title}</h3>
                    <div className="flex items-center bg-primary/10 text-primary px-2 py-1 rounded-full text-sm">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      <span>Trending</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-600 dark:text-gray-300 mb-1">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{new Date(event.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-300 mb-2">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{event.location}</span>
                  </div>
                  
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-lg font-bold">{event.price}</div>
                    <Link to={`/events/${event.id}`}>
                      <Button>View Event</Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-12">How Eventify Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-4">Find Events</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Browse thousands of events in your area or search for specific interests. 
                Filter by date, location, price, and category.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Ticket className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-4">Book Tickets</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Securely purchase tickets and receive digital tickets directly to your device. 
                Get updates about your events.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-4">Attend Events</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Use your digital tickets to access events and enjoy an incredible experience. 
                Connect with other attendees.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to host your event?</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of organizers using Eventify to create and manage their events. 
            It's free to get started.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/organizers">
              <Button variant="secondary" size="lg" className="bg-white text-primary hover:bg-gray-100">
                Create an event
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
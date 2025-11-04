import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Ticket, Search, Star, TrendingUp, Clock, Tag, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';
import EventCarousel from '../components/carousel/EventCarousel';
import { motion } from 'framer-motion';
import EventCard from '../components/EventCard';

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
      <section className="relative bg-primary text-primary-foreground py-16 md:py-24 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6"
            >
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Discover Amazing Events</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80"
            >
              Discover events that bring you together
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl mb-10 max-w-3xl mx-auto text-white/90"
            >
              Find and attend the best events happening near you. From concerts to conferences, 
              workshops to festivals - there's something for everyone.
            </motion.p>
            
            {/* Search Bar */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              onSubmit={handleSearch}
              className="max-w-2xl mx-auto"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="What are you looking for? Try 'Music', 'Food', or 'Technology'..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-white/50 text-lg shadow-xl"
                />
                <Button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 rounded-full shadow-lg">
                  Search
                </Button>
              </div>
            </motion.form>

            {/* Popular searches */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 flex flex-wrap justify-center gap-3"
            >
              {['Concerts', 'Food festivals', 'Tech events', 'Workshops', 'Networking'].map((item) => (
                <button 
                  key={item}
                  className="px-4 py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full text-sm transition-all hover:scale-105"
                  onClick={() => {
                    setSearchQuery(item);
                    window.location.href = `/events?search=${encodeURIComponent(item)}`;
                  }}
                >
                  {item}
                </button>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trending Events Carousel */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-3xl font-bold flex items-center gap-2">
                <TrendingUp className="h-8 w-8 text-primary" />
                Trending Events
              </h2>
              <Link to="/events?sort=trending" className="text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <p className="text-gray-600 dark:text-gray-400">Don't miss out on these popular events</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <EventCarousel events={trendingEvents} />
          </motion.div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex justify-between items-center mb-8"
          >
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">Browse by category</h2>
              <p className="text-gray-600 dark:text-gray-400">Find events that match your interests</p>
            </div>
            <Link to="/events" className=" hover:underline hidden sm:flex items-center gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4"
          >
            {categories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 text-center hover:shadow-lg transition-all cursor-pointer border border-transparent hover:border-primary/20"
                onClick={() => {
                  setSearchQuery(category.name);
                  window.location.href = `/events?category=${encodeURIComponent(category.name)}`;
                }}
              >
                <div className="text-3xl mb-3">{category.icon}</div>
                <h3 className="font-semibold mb-1">{category.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{category.count} events</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex justify-between items-center mb-8"
          >
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">Featured events</h2>
              <p className="text-gray-600 dark:text-gray-400">Hand-picked events just for you</p>
            </div>
            <Link to="/events" className=" hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {featuredEvents.map((event, index) => (
              <EventCard
                key={event.id}
                event={event}
                variant="featured"
                showRating={true}
                showTicketsAvailable={true}
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How Eventify Works</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Get started in three simple steps</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center p-6 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-4">Find Events</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Browse thousands of events in your area or search for specific interests. 
                Filter by date, location, price, and category.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center p-6 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Ticket className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-4">Book Tickets</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Securely purchase tickets and receive digital tickets directly to your device. 
                Get updates about your events.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center p-6 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-4">Attend Events</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Use your digital tickets to access events and enjoy an incredible experience. 
                Connect with other attendees.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">Ready to host your event?</h2>
            <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto text-white/90">
              Join thousands of organizers using Eventify to create and manage their events. 
              It's free to get started.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/organizers">
                <Button variant="secondary" size="lg" className="bg-white text-primary hover:bg-gray-100 shadow-xl">
                  Create an event <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="#">
                <Button variant="outline" size="lg" className="border border-2 bg-transparent dark:border-white shadow-xl">
                  Contact Sales
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
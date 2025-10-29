import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Filter, Search } from 'lucide-react';
import { Button } from '../components/ui/Button';

// Mock data for events
const mockEvents = [
  {
    id: 1,
    title: "Tech Conference 2023",
    date: "2023-12-15",
    location: "Lagos, Nigeria",
    category: "Technology",
    price: 5000,
    ticketsAvailable: 250,
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
  },
  {
    id: 2,
    title: "Music Festival",
    date: "2023-11-20",
    location: "Abuja, Nigeria",
    category: "Music",
    price: 10000,
    ticketsAvailable: 500,
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
  },
  {
    id: 3,
    title: "Food & Wine Expo",
    date: "2024-01-10",
    location: "Port Harcourt, Nigeria",
    category: "Food",
    price: 7500,
    ticketsAvailable: 180,
    image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
  },
  {
    id: 4,
    title: "Art & Culture Summit",
    date: "2023-12-05",
    location: "Ibadan, Nigeria",
    category: "Arts",
    price: 3000,
    ticketsAvailable: 320,
    image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
  },
  {
    id: 5,
    title: "Business Leadership Conference",
    date: "2024-02-15",
    location: "Kano, Nigeria",
    category: "Business",
    price: 8000,
    ticketsAvailable: 120,
    image: "https://images.unsplash.com/photo-1521737711867-e3b97375f7b7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1184&q=80"
  },
  {
    id: 6,
    title: "Environmental Sustainability Summit",
    date: "2024-03-20",
    location: "Enugu, Nigeria",
    category: "Environment",
    price: 4500,
    ticketsAvailable: 200,
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1171&q=80"
  }
];

const EventsPage = () => {
  const [events, setEvents] = useState(mockEvents);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Extract unique categories
  const categories = ['all', ...new Set(mockEvents.map(event => event.category))];

  // Filter events based on search term and category
  useEffect(() => {
    let filtered = mockEvents;
    
    if (searchTerm) {
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(event => event.category === selectedCategory);
    }
    
    setEvents(filtered);
  }, [searchTerm, selectedCategory]);

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Upcoming Events</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Discover and book tickets for events happening near you
          </p>
        </div>

        {/* Search and filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search bar */}
            <div className="relative flex-grow max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search events or locations..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Filter toggle for mobile */}
            <Button
              variant="outline"
              className="md:hidden flex items-center"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
          
          {/* Category filters - hidden on mobile unless toggled */}
          <div className={`mt-4 md:mt-6 ${showFilters ? 'block' : 'hidden md:block'}`}>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    selectedCategory === category
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Events grid */}
        {events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => (
              <div key={event.id} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <img 
                  src={event.image} 
                  alt={event.title} 
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold">{event.title}</h3>
                    <span className="bg-primary/10 text-primary text-sm font-medium px-2 py-1 rounded">
                      ₦{event.price.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-gray-600 dark:text-gray-300 mb-2">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{new Date(event.date).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600 dark:text-gray-300 mb-2">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{event.location}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600 dark:text-gray-300 mb-4">
                    <Users className="h-4 w-4 mr-2" />
                    <span>{event.ticketsAvailable} tickets left</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs px-2 py-1 rounded">
                      {event.category}
                    </span>
                    <Link to={`/events/${event.id}`}>
                      <Button>View Details</Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium mb-2">No events found</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Try adjusting your search or filter criteria
            </p>
            <Button onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
            }}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;
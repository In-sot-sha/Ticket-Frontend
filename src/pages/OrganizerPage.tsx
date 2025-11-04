import React from 'react';
import { Mail, MapPin, Calendar, Users, Globe, Phone, Building2, Star, ArrowRight, CheckCircle, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { motion } from 'framer-motion';
import EventCard from '../components/EventCard';

const OrganizerPage: React.FC = () => {
  // Mock organizer profile
  const organizer = {
    name: 'Eventify Productions',
    avatar: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?q=80&w=200&auto=format&fit=crop',
    banner: 'https://images.unsplash.com/photo-1515165562835-c3b8c4812833?q=80&w=1400&auto=format&fit=crop',
    location: 'Lagos, Nigeria',
    website: 'https://eventify.example.com',
    email: 'hello@eventify.com',
    phone: '+234 801 234 5678',
    followers: 12450,
    eventsHosted: 156,
    rating: 4.8,
    verified: true,
    bio: 'We produce world‑class experiences across music, technology, culture and community. Our mission is to bring people together through unforgettable events that inspire, educate, and entertain.',
    specialties: ['Music Festivals', 'Tech Conferences', 'Corporate Events', 'Cultural Celebrations'],
  };

  const organizerEvents = [
    {
      id: 101,
      title: 'Tech Conference 2025',
      date: '2025-02-20',
      location: 'Eko Convention Centre',
      price: '₦25,000',
      attendees: 500,
      image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=60',
    },
    {
      id: 102,
      title: 'Summer Music Fest',
      date: '2025-03-14',
      location: 'Tafawa Balewa Square',
      price: '₦10,000',
      attendees: 2000,
      image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=60',
    },
    {
      id: 103,
      title: 'Design & Creativity Summit',
      date: '2025-04-09',
      location: 'Landmark Centre',
      price: '₦15,000',
      attendees: 300,
      image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=60',
    },
  ];

  const stats = [
    { label: 'Events Hosted', value: organizer.eventsHosted, icon: Calendar },
    { label: 'Total Attendees', value: '50K+', icon: Users },
    { label: 'Average Rating', value: organizer.rating, icon: Star },
    { label: 'Years Active', value: '8+', icon: Award },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Banner Section */}
      <div className="relative h-80 md:h-96 w-full overflow-hidden">
        <img 
          src={organizer.banner} 
          alt="Organizer banner" 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        
        {/* Verified Badge */}
        {organizer.verified && (
          <div className="absolute top-6 right-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full shadow-lg">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold text-sm">Verified Organizer</span>
            </div>
          </div>
        )}
      </div>

      <div className="container mx-auto px-4 -mt-24 relative z-10">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className="relative">
              <img
                src={organizer.avatar}
                alt={organizer.name}
                className="w-32 h-32 rounded-2xl object-cover ring-4 ring-white dark:ring-gray-800 shadow-xl"
              />
              <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full shadow-lg">
                <Award className="h-5 w-5" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    {organizer.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 " /> 
                      {organizer.location}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-4 w-4 " /> 
                      {organizer.followers.toLocaleString()} followers
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> 
                      {organizer.rating} rating
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${organizer.email}`} className="inline-flex items-center gap-2">
                      <Mail className="h-4 w-4" /> Contact
                    </a>
                  </Button>
                  <Button size="sm" asChild>
                    <a href={organizer.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2">
                      <Globe className="h-4 w-4" /> Website
                    </a>
                  </Button>
                </div>
              </div>

              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                {organizer.bio}
              </p>

              {/* Specialties */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                  Specialties
                </h3>
                <div className="flex flex-wrap gap-2">
                  {organizer.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-primary/10  text-sm font-medium rounded-full"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>

              {/* Contact Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Mail className="h-5 w-5 " />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Email</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {organizer.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Phone className="h-5 w-5 " />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Phone</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {organizer.phone}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building2 className="h-5 w-5 " />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Location</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {organizer.location}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <stat.icon className="h-5 w-5 " />
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Upcoming Events Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="pb-16"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Upcoming Events
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Discover what we have planned for you
              </p>
            </div>
            <Link to="/events" className=" hover:underline flex items-center gap-1 font-semibold">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizerEvents.map((event, index) => (
              <EventCard
                key={event.id}
                event={event}
                variant="organizer"
                showPrice={true}
              />
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default OrganizerPage;

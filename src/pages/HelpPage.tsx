import React, { useState } from 'react';
import { Search, MessageCircle, Users, Ticket, Store, Calendar, CreditCard, User, Menu, X, ChevronRight } from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

const HelpPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('role') as 'user' | 'organizer' | 'vendor') || 'user';

  const setActiveTab = (tab: 'user' | 'organizer' | 'vendor') => {
    setSearchParams({ role: tab });
  };

  // Mock data for help categories based on user type
  const userCategories = [
    {
      id: 1,
      title: 'Getting Started',
      icon: Users,
      description: 'Learn the basics of using PartyStorm',
      articles: [
        'How to create an account',
        'Navigating the dashboard',
        'Understanding event types',
        'Updating your profile',
        'Setting up notifications'
      ]
    },
    {
      id: 2,
      title: 'Finding Events',
      icon: Calendar,
      description: 'Discover and browse events',
      articles: [
        'Searching for events',
        'Filtering by location and date',
        'Following organizations',
        'Saving events to your calendar'
      ]
    },
    {
      id: 3,
      title: 'Purchasing Tickets',
      icon: Ticket,
      description: 'Buy and manage event tickets',
      articles: [
        'How to buy tickets',
        'Group ticket purchases',
        'Using discount codes',
        'Ticket refunds and transfers',
        'Digital tickets and QR codes'
      ]
    },
    {
      id: 4,
      title: 'Managing Your Tickets',
      icon: Ticket,
      description: 'Access and use your tickets',
      articles: [
        'Viewing your tickets',
        'Downloading tickets',
        'Transferring tickets',
        'Checking event details',
        'Getting event updates'
      ]
    },
    {
      id: 5,
      title: 'Account Management',
      icon: User,
      description: 'Manage your profile and settings',
      articles: [
        'Updating your profile',
        'Managing notifications',
        'Privacy settings',
        'Two-factor authentication',
        'Connected applications',
        'Deleting your account'
      ]
    },
    {
      id: 6,
      title: 'Payments',
      icon: CreditCard,
      description: 'Learn about payment processing',
      articles: [
        'Payment methods accepted',
        'Transaction fees',
        'Refunds and cancellations',
        'Billing information',
        'Payment disputes'
      ]
    }
  ];

  const organizerCategories = [
    {
      id: 1,
      title: 'Getting Started',
      icon: Users,
      description: 'Set up your organizer account',
      articles: [
        'Becoming an organizer',
        'Creating your organization',
        'Setting up your profile',
        'Understanding organizer tools'
      ]
    },
    {
      id: 2,
      title: 'Creating Events',
      icon: Calendar,
      description: 'Set up and manage your events',
      articles: [
        'Creating your first event',
        'Setting up ticket types',
        'Managing event details',
        'Promoting your event',
        'Recurring events',
        'Event templates'
      ]
    },
    {
      id: 3,
      title: 'Ticketing',
      icon: Ticket,
      description: 'Sell and manage tickets',
      articles: [
        'Setting ticket prices',
        'Managing ticket sales',
        'Checking attendees',
        'Refund policies',
        'Group tickets',
        'Discount codes'
      ]
    },
    {
      id: 4,
      title: 'Vendor Management',
      icon: Store,
      description: 'Manage vendor applications',
      articles: [
        'Creating vendor types',
        'Reviewing applications',
        'Managing vendor payments',
        'Vendor communication',
        'Vendor dashboards',
        'Multiple vendor types'
      ]
    },
    {
      id: 5,
      title: 'Marketing & Promotion',
      icon: Users,
      description: 'Promote your event',
      articles: [
        'Social media sharing',
        'Email marketing',
        'Event listings',
        'Attendee engagement'
      ]
    },
    {
      id: 6,
      title: 'Analytics & Reports',
      icon: Users,
      description: 'Track your event performance',
      articles: [
        'Sales reports',
        'Attendee demographics',
        'Revenue tracking',
        'Event analytics'
      ]
    }
  ];

  const vendorCategories = [
    {
      id: 1,
      title: 'Getting Started',
      icon: Store,
      description: 'Set up your vendor profile',
      articles: [
        'Becoming a vendor',
        'Creating your vendor profile',
        'Setting up your business info',
        'Understanding vendor tools'
      ]
    },
    {
      id: 2,
      title: 'Applying to Events',
      icon: Calendar,
      description: 'Apply to events as a vendor',
      articles: [
        'Finding events to apply to',
        'Submitting vendor applications',
        'Application status updates',
        'Communicating with organizers'
      ]
    },
    {
      id: 3,
      title: 'Managing Applications',
      icon: Store,
      description: 'Track your vendor applications',
      articles: [
        'Viewing your applications',
        'Updating application details',
        'Handling rejections',
        'Following up on applications'
      ]
    },
    {
      id: 4,
      title: 'At the Event',
      icon: Store,
      description: 'Vendor event day experience',
      articles: [
        'Event day logistics',
        'Payment processing',
        'Customer service tips',
        'Post-event follow-up'
      ]
    },
    {
      id: 5,
      title: 'Account & Payments',
      icon: CreditCard,
      description: 'Manage your vendor account',
      articles: [
        'Updating business details',
        'Payment methods',
        'Payment processing',
        'Tax information'
      ]
    },
    {
      id: 6,
      title: 'Best Practices',
      icon: Users,
      description: 'Vendor success tips',
      articles: [
        'Creating attractive vendor displays',
        'Customer engagement strategies',
        'Building relationships with organizers',
        'Growing your vendor business'
      ]
    }
  ];

  // Mock data for popular articles based on user type
  const userPopularArticles = [
    {
      id: 1,
      title: 'How to create an account',
      description: 'A step-by-step guide to setting up your PartyStorm account',
      category: 'Getting Started',
      helpful: 245
    },
    {
      id: 2,
      title: 'Finding events near you',
      description: 'Learn how to search for events in your area',
      category: 'Finding Events',
      helpful: 189
    },
    {
      id: 3,
      title: 'Purchasing your first tickets',
      description: 'Everything you need to know about buying tickets',
      category: 'Purchasing Tickets',
      helpful: 142
    },
    {
      id: 4,
      title: 'Managing your ticket collection',
      description: 'How to access and show your digital tickets',
      category: 'Managing Your Tickets',
      helpful: 131
    },
    {
      id: 5,
      title: 'Setting up notifications',
      description: 'Customize your notification preferences',
      category: 'Account Management',
      helpful: 98
    },
    {
      id: 6,
      title: 'Using discount codes',
      description: 'How to apply promotion codes to your purchases',
      category: 'Purchasing Tickets',
      helpful: 76
    }
  ];

  const organizerPopularArticles = [
    {
      id: 1,
      title: 'Creating your first event',
      description: 'A step-by-step guide to setting up your first event on PartyStorm',
      category: 'Getting Started',
      helpful: 245
    },
    {
      id: 2,
      title: 'Setting up ticket sales',
      description: 'Learn how to create different ticket types and manage sales',
      category: 'Ticketing',
      helpful: 189
    },
    {
      id: 3,
      title: 'Vendor registration process',
      description: 'How to enable and manage vendor applications for your events',
      category: 'Vendor Management',
      helpful: 142
    },
    {
      id: 4,
      title: 'Payment and payout information',
      description: 'Understanding fees, payments, and when you get paid',
      category: 'Payment',
      helpful: 131
    },
    {
      id: 5,
      title: 'Promoting your event',
      description: 'Tips and strategies to maximize attendance',
      category: 'Marketing',
      helpful: 98
    },
    {
      id: 6,
      title: 'Analyzing event performance',
      description: 'Understanding your event analytics and reports',
      category: 'Analytics',
      helpful: 76
    }
  ];

  const vendorPopularArticles = [
    {
      id: 1,
      title: 'Creating your vendor profile',
      description: 'How to set up your professional vendor profile',
      category: 'Getting Started',
      helpful: 245
    },
    {
      id: 2,
      title: 'Applying to your first event',
      description: 'Step-by-step guide to submitting your first vendor application',
      category: 'Applying to Events',
      helpful: 189
    },
    {
      id: 3,
      title: 'Managing your applications',
      description: 'How to track and update your event applications',
      category: 'Managing Applications',
      helpful: 142
    },
    {
      id: 4,
      title: 'Preparing for event day',
      description: 'Tips for a successful event day experience',
      category: 'At the Event',
      helpful: 131
    },
    {
      id: 5,
      title: 'Setting up vendor payments',
      description: 'How to receive payments and manage your finances',
      category: 'Account & Payments',
      helpful: 98
    },
    {
      id: 6,
      title: 'Best practices for vendors',
      description: 'Tips for creating a successful vendor presence',
      category: 'Best Practices',
      helpful: 76
    }
  ];

  // Mock data for FAQ based on user type
  const userFAQ = [
    {
      question: 'How do I purchase tickets?',
      answer: 'To purchase tickets, find an event you\'re interested in, select the ticket type and quantity, enter your information, and complete the payment process.'
    },
    {
      question: 'Can I transfer my tickets to someone else?',
      answer: 'Yes, you can transfer tickets to others through your account. Go to "My Tickets" and select the ticket you want to transfer.'
    },
    {
      question: 'How do I get a refund for my tickets?',
      answer: 'Refund policies vary by event. Check the event page for specific refund information or contact the event organizer.'
    },
    {
      question: 'How do I access my digital tickets?',
      answer: 'Digital tickets can be accessed in your account under "My Tickets". You can also access them through the confirmation email.'
    },
    {
      question: 'How do I update my account information?',
      answer: 'Visit the "Profile" section in your account settings to update your personal information.'
    },
    {
      question: 'How do I unsubscribe from emails?',
      answer: 'Go to your account settings and adjust your notification preferences to manage email subscriptions.'
    }
  ];

  const organizerFAQ = [
    {
      question: 'How do I create an event?',
      answer: 'To create an event, click the "Create Event" button in your dashboard, fill in the event details, set up ticket types, and publish when ready.'
    },
    {
      question: 'What fees does PartyStorm charge?',
      answer: 'PartyStorm charges a small percentage fee on each ticket sold. The exact fee depends on your plan and can be found on our pricing page.'
    },
    {
      question: 'How do I manage vendor applications?',
      answer: 'When creating an event, you can enable vendor applications and set up different vendor types. Applications will appear in your dashboard for review.'
    },
    {
      question: 'How do I access my payouts?',
      answer: 'Payouts are processed according to the schedule you set in your account settings. Funds are sent to the bank account you provided.'
    },
    {
      question: 'How can I promote my event?',
      answer: 'You can promote your event through social media sharing, email marketing, and by encouraging attendees to share with friends.'
    },
    {
      question: 'How do I check in attendees?',
      answer: 'Use the PartyStorm mobile app to scan QR codes at the event entrance. The app will verify ticket validity and mark attendees as present.'
    }
  ];

  const vendorFAQ = [
    {
      question: 'How do I become a vendor?',
      answer: 'To become a vendor, navigate to your profile and select "Become a Vendor", then complete your vendor profile information.'
    },
    {
      question: 'How do I apply to events?',
      answer: 'Find events that allow vendor applications, then submit your vendor profile and details to the event organizer.'
    },
    {
      question: 'How do I get paid as a vendor?',
      answer: 'Payment arrangements are typically made directly with the event organizer. Payment details are specified in your vendor agreement.'
    },
    {
      question: 'Can I apply to multiple events?',
      answer: 'Yes, you can apply to multiple events. Just submit separate applications to each event you\'re interested in.'
    },
    {
      question: 'How do I update my vendor profile?',
      answer: 'Go to your vendor profile section in your account settings to update your business information, photos, and other details.'
    },
    {
      question: 'What should I do if an application is rejected?',
      answer: 'If an application is rejected, review the organizer\'s feedback and consider applying to other events that might be a better fit.'
    }
  ];

  const getCategories = () => {
    switch(activeTab) {
      case 'organizer':
        return organizerCategories;
      case 'vendor':
        return vendorCategories;
      default:
        return userCategories;
    }
  };

  const getPopularArticles = () => {
    switch(activeTab) {
      case 'organizer':
        return organizerPopularArticles;
      case 'vendor':
        return vendorPopularArticles;
      default:
        return userPopularArticles;
    }
  };

  const getFAQ = () => {
    switch(activeTab) {
      case 'organizer':
        return organizerFAQ;
      case 'vendor':
        return vendorFAQ;
      default:
        return userFAQ;
    }
  };

  // Combine all articles for search based on active tab
  const allArticles = [
    ...getPopularArticles(),
    ...getCategories().flatMap(category => 
      category.articles.map(article => ({
        id: `${category.id}-${article}`,
        title: article,
        description: `Learn more about ${article.toLowerCase()}`,
        category: category.title
      }))
    )
  ];

  // Filter articles based on search query
  const filteredArticles = searchQuery 
    ? allArticles.filter(article => 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">PartyStorm Help Center</h1>
            </div>
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                <Button variant="ghost" className="text-gray-700 dark:text-gray-300">
                  Contact Support
                </Button>
              </div>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
              >
                {isMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Button variant="ghost" className="w-full text-left text-gray-700 dark:text-gray-300">
              Contact Support
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Type Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-1 bg-gray-100 dark:bg-gray-800">
            <button
              onClick={() => setActiveTab('user')}
              className={`px-6 py-2.5 text-sm font-bold rounded-full transition-all ${
                activeTab === 'user'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              For Guests
            </button>
            <button
              onClick={() => setActiveTab('organizer')}
              className={`px-6 py-2.5 text-sm font-bold rounded-full transition-all ${
                activeTab === 'organizer'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              For Hosts
            </button>
            <button
              onClick={() => setActiveTab('vendor')}
              className={`px-6 py-2.5 text-sm font-bold rounded-full transition-all ${
                activeTab === 'vendor'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              For Vendors
            </button>
          </div>
        </div>

        {/* Search Section */}
        <section className="mb-12">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              How can we help you?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Search for answers or browse our help topics
            </p>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeTab === 'user' ? 'guest' : activeTab === 'organizer' ? 'host' : 'vendor'} help articles...`}
                className="block w-full pl-12 pr-4 py-4 border border-neutral-200 dark:border-neutral-800 rounded-full bg-white dark:bg-gray-900 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-base shadow-sm"
              />
            </div>
          </div>

          {/* Ticket Recovery Banner */}
          <div className="max-w-3xl mx-auto mt-8 p-6 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/10 rounded-2xl border border-rose-100 dark:border-rose-900/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-neutral-900 dark:text-white text-base">Lost your tickets?</h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                Easily recover all valid tickets purchased using your email address or phone number.
              </p>
            </div>
            <Link
              to="/recover-ticket"
              className="shrink-0 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl text-xs font-bold px-5 py-3 shadow-md hover:shadow-lg hover:opacity-95 transition-all active:scale-[0.98]"
            >
              Recover Tickets
            </Link>
          </div>
          
          {/* Search Results */}
          {searchQuery && filteredArticles.length > 0 && (
            <div className="mt-8 max-w-4xl mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Search Results ({filteredArticles.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredArticles.map((article) => (
                  <div 
                    key={article.id} 
                    className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">{article.title}</h4>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        {article.category}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">{article.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {searchQuery && filteredArticles.length === 0 && (
            <div className="mt-8 max-w-4xl mx-auto text-center">
              <p className="text-gray-600 dark:text-gray-300">No results found for "{searchQuery}". Try different keywords.</p>
            </div>
          )}
        </section>

        {/* Popular Articles - only show when not searching */}
        {!searchQuery && (
          <section className="mb-16">
            <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white mb-6 tracking-tight">Popular Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getPopularArticles().map((article) => (
                <div 
                  key={article.id} 
                  className="bg-white dark:bg-gray-900 rounded-3xl p-6 hover:shadow-md transition-shadow cursor-pointer border border-neutral-150 dark:border-neutral-800 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                      {article.category}
                    </span>
                    {article.helpful && (
                      <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mt-1">{article.helpful} helpful</span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-2">{article.title}</h3>
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">{article.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Help Categories */}
        <section className="mb-16">
          <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white mb-6 tracking-tight">Browse Help by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getCategories().map((category) => {
              const IconComponent = category.icon;
              return (
                <div 
                  key={category.id} 
                  className="bg-white dark:bg-gray-900 rounded-3xl p-6 hover:shadow-md transition-shadow cursor-pointer border border-neutral-150 dark:border-neutral-800 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center mb-4">
                      <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 mr-4">
                        <IconComponent className="h-6 w-6 text-rose-500" />
                      </div>
                      <h3 className="text-base font-bold text-neutral-900 dark:text-white">{category.title}</h3>
                    </div>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-5 leading-relaxed">{category.description}</p>
                    <ul className="text-sm text-neutral-600 dark:text-neutral-300 space-y-2">
                      {category.articles.map((article, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-rose-500 mr-2 mt-0.5">•</span>
                          <span>{article}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex justify-start pt-6 mt-auto">
                    <span className="text-xs font-bold text-rose-500 flex items-center gap-0.5 hover:underline">
                      View all articles <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Step-by-Step Guides */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Step-by-Step Guides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeTab === 'user' && (
              <>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">How to Purchase Your First Ticket</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-300">
                    <li>Find an event you're interested in</li>
                    <li>Select the ticket type and quantity</li>
                    <li>Enter your information</li>
                    <li>Complete the payment process</li>
                    <li>Check your email for confirmation</li>
                    <li>Access your ticket in the app</li>
                  </ol>
                  <Button variant="link" className="p-0 mt-4 text-primary hover:text-primary/80">
                    Read full guide →
                  </Button>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">How to Transfer Your Ticket</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-300">
                    <li>Open your PartyStorm app</li>
                    <li>Navigate to "My Tickets"</li>
                    <li>Select the ticket you want to transfer</li>
                    <li>Tap "Transfer Ticket"</li>
                    <li>Enter the recipient's email</li>
                    <li>Confirm the transfer</li>
                  </ol>
                  <Button variant="link" className="p-0 mt-4 text-primary hover:text-primary/80">
                    Read full guide →
                  </Button>
                </div>
              </>
            )}
            {activeTab === 'organizer' && (
              <>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">How to Create Your First Event</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-300">
                    <li>Click "Create Event" in your dashboard</li>
                    <li>Fill in event details (title, date, location)</li>
                    <li>Upload an event image</li>
                    <li>Set up ticket types and pricing</li>
                    <li>Configure vendor settings if needed</li>
                    <li>Review and publish your event</li>
                  </ol>
                  <Button variant="link" className="p-0 mt-4 text-primary hover:text-primary/80">
                    Read full guide →
                  </Button>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">How to Manage Vendor Applications</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-300">
                    <li>Create different vendor types for your event</li>
                    <li>Set capacity and fees for each vendor type</li>
                    <li>Enable vendor registration in event settings</li>
                    <li>Review applications as they come in</li>
                    <li>Approve or reject applications</li>
                    <li>Communicate with approved vendors</li>
                  </ol>
                  <Button variant="link" className="p-0 mt-4 text-primary hover:text-primary/80">
                    Read full guide →
                  </Button>
                </div>
              </>
            )}
            {activeTab === 'vendor' && (
              <>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">How to Create Your Vendor Profile</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-300">
                    <li>Click "Become a Vendor" in your profile</li>
                    <li>Enter your business information</li>
                    <li>Upload your business logo</li>
                    <li>Add your business description</li>
                    <li>Specify your service offerings</li>
                    <li>Publish your vendor profile</li>
                  </ol>
                  <Button variant="link" className="p-0 mt-4 text-primary hover:text-primary/80">
                    Read full guide →
                  </Button>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">How to Apply to an Event</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-300">
                    <li>Find an event you want to join</li>
                    <li>Click "Apply as Vendor"</li>
                    <li>Select your vendor category</li>
                    <li>Complete the application form</li>
                    <li>Submit required documentation</li>
                    <li>Wait for organizer approval</li>
                  </ol>
                  <Button variant="link" className="p-0 mt-4 text-primary hover:text-primary/80">
                    Read full guide →
                  </Button>
                </div>
              </>
            )}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white mb-6 tracking-tight">Frequently Asked Questions</h2>
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-neutral-150 dark:border-neutral-800 divide-y divide-neutral-150 dark:divide-neutral-800">
            {getFAQ().map((item, index) => (
              <div key={index} className="p-6">
                <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-2">{item.question}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Support */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center border border-gray-200 dark:border-gray-700">
          <MessageCircle className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Still need help?</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
            Our support team is ready to help you with any questions that aren't answered here.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <MessageCircle className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">Live Chat</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Chat with our support team instantly</p>
              <Button variant="outline" size="sm" className="w-full">
                Start Chat
              </Button>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <MessageCircle className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">Email Support</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Send us a detailed message</p>
              <Button variant="outline" size="sm" className="w-full">
                Email Us
              </Button>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <MessageCircle className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">Request Callback</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Get a call from our team</p>
              <Button variant="outline" size="sm" className="w-full">
                Request Callback
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex justify-center md:justify-start">
              <span className="text-lg font-bold text-gray-900 dark:text-white">PartyStorm Help Center</span>
            </div>
            <div className="mt-8 md:mt-0 flex justify-center space-x-6 md:order-2">
              <a href="#" className="text-gray-400 hover:text-gray-500">
                Terms of Service
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                Cookie Policy
              </a>
            </div>
          </div>
          <div className="mt-8 text-center md:mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              &copy; 2025 PartyStorm. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HelpPage;
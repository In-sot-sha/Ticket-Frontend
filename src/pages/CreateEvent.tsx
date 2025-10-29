import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Ticket,
  Image,
  Clock,
  Tag,
  Hash,
  Link as LinkIcon,
  Globe,
  CheckCircle,
  FileText,
  BarChart3,
  Camera,
  Settings,
  CreditCard,
  ExternalLink,
  Upload
} from 'lucide-react';

const CreateEvent = () => {
  const navigate = useNavigate();
  
  // Step tracking
  const [currentStep, setCurrentStep] = useState(1);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    date: '',
    startTime: '',
    endTime: '',
    timezone: 'Africa/Lagos',
    locationType: 'physical',
    location: '',
    capacity: '',
    tickets: [
      { id: 1, name: 'General Admission', price: '', quantity: '', isFree: false }
    ],
    imageUrl: '',
    website: '',
    publishStatus: 'draft'
  });

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle nested field changes (for tickets)
  const handleTicketChange = (index: number, field: string, value: string | number | boolean) => {
    const updatedTickets = [...formData.tickets];
    updatedTickets[index] = { ...updatedTickets[index], [field]: value };
    setFormData(prev => ({ ...prev, tickets: updatedTickets }));
  };

  // Add a new ticket type
  const addTicket = () => {
    const newTicket = {
      id: formData.tickets.length + 1,
      name: '',
      price: '',
      quantity: '',
      isFree: false
    };
    setFormData(prev => ({ ...prev, tickets: [...prev.tickets, newTicket] }));
  };

  // Remove a ticket type
  const removeTicket = (index: number) => {
    if (formData.tickets.length > 1) {
      const updatedTickets = [...formData.tickets];
      updatedTickets.splice(index, 1);
      setFormData(prev => ({ ...prev, tickets: updatedTickets }));
    }
  };

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Navigation functions
  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  // Submit the event
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would create an event via an API
    console.log('Creating event:', formData);
    // Navigate to a success page or back to dashboard after creation
    navigate('/organizer/events');
  };

  // Check if a step is completed
  const isStepComplete = (step: number): boolean => {
    switch(step) {
      case 1: // Basics
        return formData.title.length > 0 && formData.description.length > 0;
      case 2: // Date & Time
        return formData.date.length > 0 && formData.startTime.length > 0 && formData.endTime.length > 0;
      case 3: // Location
        return formData.locationType === 'online' || (formData.location.length > 0 && formData.capacity.length > 0);
      case 4: // Tickets
        return formData.tickets.length > 0 && 
               formData.tickets.every(ticket => ticket.name.length > 0 && ticket.quantity.length > 0);
      case 5: // Publishing
        return formData.title.length > 0; // At least the title should be set
      default:
        return false;
    }
  };

  // Sidebar navigation items
  const sidebarItems = [
    { id: 1, label: 'Event Basics', icon: FileText, completed: isStepComplete(1) },
    { id: 2, label: 'Date & Time', icon: Calendar, completed: isStepComplete(2) },
    { id: 3, label: 'Venue', icon: MapPin, completed: isStepComplete(3) },
    { id: 4, label: 'Tickets', icon: Ticket, completed: isStepComplete(4) },
    { id: 5, label: 'Publish', icon: ExternalLink, completed: isStepComplete(5) },
  ];

  // Render the current step
  const renderStep = () => {
    switch(currentStep) {
      case 1: // Basic Information
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Event Basics</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Let's start with the basics. What's your event called?
            </p>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Give it a title that tells people what it is"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Names that include date, location, or ticket type will be rejected
                </p>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Tell people more about your event"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Include highlights and details about your event
                </p>
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <div className="relative">
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                  >
                    <option value="">Select a category</option>
                    <option value="business">Business</option>
                    <option value="tech">Technology</option>
                    <option value="music">Music</option>
                    <option value="art">Art & Culture</option>
                    <option value="food">Food & Drink</option>
                    <option value="health">Health & Wellness</option>
                    <option value="education">Education</option>
                  </select>
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                </div>
              </div>
            </div>
          </div>
        );
      
      case 2: // Date & Time
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Date and Time</h2>
            <p className="text-gray-600 dark:text-gray-300">
              When is your event happening?
            </p>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Time *
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      id="startTime"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Time *
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      id="endTime"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Timezone
                </label>
                <div className="relative">
                  <select
                    id="timezone"
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                  >
                    <option value="Africa/Lagos">West Africa Time (WAT)</option>
                    <option value="Africa/Accra">Ghana Time</option>
                    <option value="UTC">UTC</option>
                  </select>
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                </div>
              </div>
            </div>
          </div>
        );
      
      case 3: // Location & Capacity
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Venue</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Where is your event happening?
            </p>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, locationType: 'physical' }))}
                  className={`py-5 px-4 rounded-lg border ${
                    formData.locationType === 'physical'
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/5 dark:bg-primary/10'
                      : 'border-gray-300 dark:border-gray-600 hover:border-primary'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <MapPin className={`h-6 w-6 mb-2 ${
                      formData.locationType === 'physical' 
                        ? 'text-primary' 
                        : 'text-gray-500'
                    }`} />
                    <span className={`font-medium ${
                      formData.locationType === 'physical' 
                        ? 'text-primary' 
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>A physical venue</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">In-person event</span>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, locationType: 'online' }))}
                  className={`py-5 px-4 rounded-lg border ${
                    formData.locationType === 'online'
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/5 dark:bg-primary/10'
                      : 'border-gray-300 dark:border-gray-600 hover:border-primary'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <LinkIcon className={`h-6 w-6 mb-2 ${
                      formData.locationType === 'online' 
                        ? 'text-primary' 
                        : 'text-gray-500'
                    }`} />
                    <span className={`font-medium ${
                      formData.locationType === 'online' 
                        ? 'text-primary' 
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>Online event</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">Live online event</span>
                  </div>
                </button>
              </div>
              
              {formData.locationType === 'physical' ? (
                <div className="space-y-6">
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Event Location *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        required
                        placeholder="Enter event location"
                        className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Capacity
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="capacity"
                        name="capacity"
                        value={formData.capacity}
                        onChange={handleChange}
                        min="1"
                        placeholder="Number of attendees"
                        className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Online Event Platform
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      id="website"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      required
                      placeholder="https://meet.jit.si/my-event"
                      className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Enter the URL where your online event will take place
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      
      case 4: // Tickets & Pricing
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tickets</h2>
            <p className="text-gray-600 dark:text-gray-300">
              How many tickets do you want to sell?
            </p>
            
            <div className="space-y-4">
              {formData.tickets.map((ticket, index) => (
                <div key={ticket.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-5">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Ticket Type {index + 1}</h3>
                    {formData.tickets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTicket(index)}
                        className="text-red-600 hover:text-red-800 dark:hover:text-red-400 text-sm font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ticket Name</label>
                      <input
                        type="text"
                        value={ticket.name}
                        onChange={(e) => handleTicketChange(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="e.g. General Admission"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={ticket.quantity}
                        onChange={(e) => handleTicketChange(index, 'quantity', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="How many tickets?"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <div className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          id={`isFree-${index}`}
                          checked={ticket.isFree}
                          onChange={(e) => handleTicketChange(index, 'isFree', e.target.checked)}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor={`isFree-${index}`} className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          This is a free ticket
                        </label>
                      </div>
                    </div>
                    
                    {!ticket.isFree && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price (₦)</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            value={ticket.price}
                            onChange={(e) => handleTicketChange(index, 'price', e.target.value)}
                            className="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="0.00"
                          />
                          <Ticket className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addTicket}
                className="flex items-center text-primary hover:text-primary/80 text-sm font-medium"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add another ticket type
              </button>
            </div>
          </div>
        );
      
      case 5: // Media & Publishing
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Publishing</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Add an image and set publishing options for your event.
            </p>
            
            <div className="space-y-6">
              {/* Image Upload Section */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Event Image</h3>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Image className="h-4 w-4 mr-1" />
                    <span>Required for publish</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div 
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                    onClick={() => document.getElementById('image-upload')?.click()}
                  >
                    {imagePreview ? (
                      <div className="space-y-4">
                        <img 
                          src={imagePreview} 
                          alt="Event preview" 
                          className="max-h-48 mx-auto rounded-lg object-contain"
                        />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Click to change image</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="mx-auto">
                          <Camera className="h-12 w-12 text-gray-400 mx-auto" />
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-300 font-medium">
                            Add a cover photo
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            JPG, GIF, or PNG. 1920x1080 recommended.
                          </p>
                        </div>
                        <button 
                          type="button"
                          className="mt-4 inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Image
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="image-upload"
                    onChange={handleImageChange}
                  />
                  
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <p>Make sure your image is at least 2160x1080 pixels to look sharp on high-resolution displays. Max file size: 10MB.</p>
                  </div>
                </div>
              </div>
              
              {/* Website Section */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Event Website (Optional)</h3>
                <div className="relative">
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://yoursite.com/event"
                    className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                </div>
              </div>
              
              {/* Publish Settings */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Publish Settings</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, publishStatus: 'draft' }))}
                    className={`flex-1 py-3 px-4 rounded-lg border ${
                      formData.publishStatus === 'draft'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, publishStatus: 'published' }))}
                    className={`flex-1 py-3 px-4 rounded-lg border ${
                      formData.publishStatus === 'published'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Publish Event
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create an event</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Fill out the information below to create your event.
            </p>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <div className="w-full lg:w-1/4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Event Setup</h2>
                <nav className="space-y-1">
                  {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => goToStep(item.id)}
                        className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg ${
                          currentStep === item.id
                            ? 'bg-primary/10 text-primary'
                            : isStepComplete(item.id)
                              ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Icon className={`h-5 w-5 mr-3 ${
                          currentStep === item.id ? 'text-primary' : 'text-gray-500'
                        }`} />
                        <span>{item.label}</span>
                        {item.completed && (
                          <CheckCircle className="ml-auto h-5 w-5 text-green-500" />
                        )}
                      </button>
                    );
                  })}
                </nav>
                
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => navigate('/organizer')}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <Settings className="h-5 w-5 mr-3 inline text-gray-500" />
                    Event Dashboard
                  </button>
                </div>
              </div>
            </div>
            
            {/* Main Content */}
            <div className="w-full lg:w-3/4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className="p-6">
                  <form onSubmit={handleSubmit}>
                    {renderStep()}
                    
                    <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/organizer/events')}
                      >
                        Cancel
                      </Button>
                      
                      <div className="flex space-x-3">
                        {currentStep > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCurrentStep(currentStep - 1)}
                          >
                            Back
                          </Button>
                        )}
                        
                        {currentStep < 5 ? (
                          <Button 
                            type="button"
                            onClick={() => setCurrentStep(currentStep + 1)}
                          >
                            Save and continue
                          </Button>
                        ) : (
                          <Button type="submit">
                            {formData.publishStatus === 'published' ? 'Publish Event' : 'Save Draft'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Icon for the button
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

export default CreateEvent;
import React, { useState, useEffect } from 'react';
import { useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { Calendar as ShadcnCalendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { api } from '../services/api';
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
  Upload,
  Info,
  Plus
} from 'lucide-react';
import { useToast, ToastViewport } from '../components/ui/Toast';
import { Switch } from '../components/ui/Switch';
// import { Calendar } from '@/components/ui/Calendar';

const CreateEvent = () => {
  const navigate = useNavigate();
  const { toast, toasts, dismiss } = useToast();
  const formContainerRef = useRef<HTMLDivElement>(null);
  
  // Step tracking
  const [currentStep, setCurrentStep] = useState(1); // 1: Build, 2: Tickets, 3: Publish
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  
  // State for event ID (when editing an existing event)
  const [eventId, setEventId] = useState<number | null>(null);
  
  // Track which steps have been saved/completed
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  
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
    onlineUrl: '',
    capacity: '',
    tickets: [
      { id: 1, name: 'General Admission', price: '', quantity: '', isFree: false }
    ],
    imageUrl: '',
    website: '',
    publishStatus: 'draft',
    // Add vendor fields
    allowVendors: false,
    vendorTypes: [
      { id: 1, name: '', fee: '', maxVendors: '' }
    ],
    vendorDeadline: '',
    // Add recurring event fields
    isRecurring: false,
    recurrencePattern: 'NONE',
    recurrenceEnd: '',
    recurrenceInterval: 1,
    // Add tags field
    tags: [] as string[]
  });
  
  // Get event ID from URL params for editing
  const { id } = useParams<{ id: string }>();
  
  // Validation for organizer info
  const [organizerInfoMissing, setOrganizerInfoMissing] = useState<boolean>(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  
  // State for tags
  const [availableTags, setAvailableTags] = useState<string[]>([
    'Business', 'Technology', 'Music', 'Art', 'Food', 'Health', 'Education', 
    'Sports', 'Conference', 'Workshop', 'Networking', 'Charity', 'Entertainment'
  ]);
  const [tagInput, setTagInput] = useState('');

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle tag input change
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  };

  // Add a new tag
  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  // Remove a tag
  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Handle tag input key press (Enter to add tag)
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  // Load event data if editing
  useEffect(() => {
    const loadEventData = async () => {
      if (id) {
        try {
          const response = await api.events.getById(Number(id));
          const event = response.data;
          
          // Set the event ID so we know we're editing
          setEventId(event.id);
          
          // Populate form data with event data
          setFormData({
            title: event.title || '',
            description: event.description || '',
            category: event.category || '',
            date: event.startDate ? new Date(event.startDate).toISOString().split('T')[0] : '',
            startTime: event.startDate ? new Date(event.startDate).toTimeString().substring(0, 5) : '',
            endTime: event.endDate ? new Date(event.endDate).toTimeString().substring(0, 5) : '',
            timezone: event.timezone || 'Africa/Lagos',
            locationType: event.locationType || 'physical',
            location: event.location || '',
            onlineUrl: event.onlineUrl || '',
            capacity: event.capacity ? String(event.capacity) : '',
            tickets: event.ticketTypes?.map((tt: any) => ({
              id: tt.id,
              name: tt.name,
              price: String(tt.price),
              quantity: String(tt.quantity),
              isFree: tt.price === 0
            })) || [{ id: 1, name: 'General Admission', price: '', quantity: '', isFree: false }],
            imageUrl: event.imageUrl || '',
            website: event.website || '',
            publishStatus: event.isPublished ? 'published' : 'draft',
            allowVendors: event.allowVendors || false,
            vendorTypes: event.vendorTypes && event.vendorTypes.length > 0 ? 
              event.vendorTypes.map((vt: any) => ({
                id: vt.id,
                name: vt.name || '',
                fee: vt.fee ? String(vt.fee) : '',
                maxVendors: vt.maxVendors ? String(vt.maxVendors) : ''
              })) : 
              [{ id: 1, name: '', fee: '', maxVendors: '' }],
            vendorDeadline: event.vendorDeadline ? new Date(event.vendorDeadline).toISOString().split('T')[0] : '',
            // Add recurring event fields
            isRecurring: event.isRecurring || false,
            recurrencePattern: event.recurrencePattern || 'NONE',
            recurrenceEnd: event.recurrenceEnd ? new Date(event.recurrenceEnd).toISOString().split('T')[0] : '',
            recurrenceInterval: event.recurrenceInterval || 1,
            // Add tags field (assuming tags are in an array format)
            tags: event.tags ? event.tags.map((tag: any) => tag.name) : []
          });
          
          // Set image preview if image URL exists
          if (event.imageUrl) {
            setImagePreview(event.imageUrl);
          }
          
        } catch (error) {
          console.error('Error loading event data:', error);
          toast({
            title: "Load Failed",
            description: 'Failed to load event data. Please try again.',
            variant: "destructive",
          });
        }
      }
    };

    loadEventData();
  }, [id]);

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

  // Add a new vendor type
  const addVendorType = () => {
    const newVendorType = {
      id: formData.vendorTypes.length + 1,
      name: '',
      fee: '',
      maxVendors: ''
    };
    setFormData(prev => ({ 
      ...prev, 
      vendorTypes: [...prev.vendorTypes, newVendorType] 
    }));
  };

  // Remove a vendor type
  const removeVendorType = (index: number) => {
    if (formData.vendorTypes.length > 1) {
      const updatedVendorTypes = [...formData.vendorTypes];
      updatedVendorTypes.splice(index, 1);
      setFormData(prev => ({ ...prev, vendorTypes: updatedVendorTypes }));
    }
  };

  // Handle vendor type changes
  const handleVendorTypeChange = (index: number, field: string, value: string) => {
    const updatedVendorTypes = [...formData.vendorTypes];
    updatedVendorTypes[index] = { ...updatedVendorTypes[index], [field]: value };
    setFormData(prev => ({ ...prev, vendorTypes: updatedVendorTypes }));
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

  // Submit the event
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    // Set appropriate loading state based on publish status
    if (formData.publishStatus === 'published') {
      setPublishLoading(true);
    } else {
      setSaveDraftLoading(true);
    }
    
    try {
      // Create FormData object to send multipart data
      const eventFormData = new FormData();
      
      // Add form fields to FormData
      eventFormData.append('title', formData.title);
      eventFormData.append('description', formData.description);
      eventFormData.append('category', formData.category);
      
      // Format the dates properly
      const startDate = new Date(`${formData.date}T${formData.startTime}`);
      const endDate = new Date(`${formData.date}T${formData.endTime}`);
      
      eventFormData.append('startDate', startDate.toISOString());
      eventFormData.append('endDate', endDate.toISOString());
      eventFormData.append('location', formData.locationType === 'online' ? formData.onlineUrl : formData.location);
      eventFormData.append('onlineUrl', formData.onlineUrl);
      eventFormData.append('locationType', formData.locationType);
      eventFormData.append('price', formData.tickets[0]?.price || '0');
      eventFormData.append('capacity', formData.capacity);
      eventFormData.append('ticketTypes', JSON.stringify(formData.tickets));
      eventFormData.append('isPublished', formData.publishStatus === 'published' ? 'true' : 'false');
      eventFormData.append('website', formData.website);
      
      // Add recurring event fields
      eventFormData.append('isRecurring', formData.isRecurring ? 'true' : 'false');
      eventFormData.append('recurrencePattern', formData.recurrencePattern);
      eventFormData.append('recurrenceEnd', formData.recurrenceEnd);
      eventFormData.append('recurrenceInterval', String(formData.recurrenceInterval));
      
      // Add tags
      eventFormData.append('tags', JSON.stringify(formData.tags));
      
      // Add image file if selected
      if (selectedImage) {
        eventFormData.append('image', selectedImage);
      }
      
      // Add vendor fields to FormData
      eventFormData.append('allowVendors', formData.allowVendors ? 'true' : 'false');
      
      // Add vendor types array to FormData as JSON
      eventFormData.append('vendorTypes', JSON.stringify(formData.vendorTypes));
      
      if (formData.vendorDeadline) {
        eventFormData.append('vendorDeadline', new Date(formData.vendorDeadline).toISOString());
      }

      // Make API call to create/update event using the API service
      let response;
      if (eventId) {
        // Update existing event
        response = await api.events.updateWithImage(eventId, eventFormData);
      } else {
        // Create new event
        response = await api.events.createWithImage(eventFormData);
        setEventId(response.data.event.id);
      }
      
      console.log('Event saved successfully:', response.data);
      
      // Show success toast
      toast({
        title: "Success!",
        description: formData.publishStatus === 'published' 
          ? "Your event has been published successfully!" 
          : "Your event has been saved as a draft.",
      });
      
      // Navigate to events page after successful creation
      navigate('/organizer/events');
    } catch (error: any) {
      console.error('Error saving event:', error);
      toast({
        title: "Save Failed",
        description: error.response?.data?.message || error.message || 'Failed to save event. Please try again.',
        variant: "destructive",
      });
    } finally {
      // Reset loading states
      setPublishLoading(false);
      setSaveDraftLoading(false);
    }
  };

  // Function to save event data at each step
  const saveEventData = async (step: number): Promise<any> => {
    try {
      // Create FormData object to send multipart data
      const eventFormData = new FormData();
      
      // Add form fields to FormData based on current step
      if (step === 1 || step === 3) { // Event details step
        eventFormData.append('title', formData.title);
        eventFormData.append('description', formData.description);
        eventFormData.append('category', formData.category);
        
        // Format the dates properly
        const startDate = new Date(`${formData.date}T${formData.startTime}`);
        const endDate = new Date(`${formData.date}T${formData.endTime}`);
        
        eventFormData.append('startDate', startDate.toISOString());
        eventFormData.append('endDate', endDate.toISOString());
        eventFormData.append('location', formData.locationType === 'online' ? formData.onlineUrl : formData.location);
        eventFormData.append('onlineUrl', formData.onlineUrl);
        eventFormData.append('locationType', formData.locationType);
        eventFormData.append('price', formData.tickets[0]?.price || '0');
        eventFormData.append('capacity', formData.capacity);
        eventFormData.append('isPublished', 'false'); // Always save as draft when saving mid-process
        eventFormData.append('website', formData.website); // Add website to the event
        
        // Add recurring event fields
        eventFormData.append('isRecurring', formData.isRecurring ? 'true' : 'false');
        eventFormData.append('recurrencePattern', formData.recurrencePattern);
        eventFormData.append('recurrenceEnd', formData.recurrenceEnd);
        eventFormData.append('recurrenceInterval', String(formData.recurrenceInterval));
        
        // Add tags
        eventFormData.append('tags', JSON.stringify(formData.tags));
        
        // Add image file if selected
        if (selectedImage) {
          eventFormData.append('image', selectedImage);
        }
      }
      
      if (step === 2 || step === 3) { // Tickets and vendors step
        eventFormData.append('ticketTypes', JSON.stringify(formData.tickets));
        eventFormData.append('allowVendors', formData.allowVendors ? 'true' : 'false');
        
        // Add vendor types array to FormData as JSON
        eventFormData.append('vendorTypes', JSON.stringify(formData.vendorTypes));
        
        if (formData.vendorDeadline) {
          eventFormData.append('vendorDeadline', new Date(formData.vendorDeadline).toISOString());
        }
      }
      
      // For the final step, we'll handle publishing differently
      if (step === 3) {
        eventFormData.append('isPublished', formData.publishStatus === 'published' ? 'true' : 'false');
      }
      
      // Make API call to save event using the API service
      // If we have an event ID (editing), update the event; otherwise, create it
      let response;
      if (eventId) {
        // If we already have an event ID, update the existing event
        response = await api.events.updateWithImage(eventId, eventFormData);
      } else {
        // If this is a new event, create it and save the ID
        response = await api.events.createWithImage(eventFormData);
        // Set the event ID so we can update it in future saves
        setEventId(response.data.event.id);
      }
      
      // Mark step as completed after successful save
      if (!completedSteps.includes(step)) {
        setCompletedSteps(prev => [...prev, step]);
      }
      
      console.log(`Event data saved for step ${step}:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Error saving event data at step ${step}:`, error);
      toast({
        title: "Save Failed",
        description: error.response?.data?.message || error.message || `Failed to save event at step ${step}. Please try again.`,
        variant: "destructive",
      });
      return null;
    }
  };

  // State for loading states
  const [nextStepLoading, setNextStepLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [saveDraftLoading, setSaveDraftLoading] = useState(false);

  // Navigation functions
  const goToNextStep = async () => {
    if (currentStep < 3) {
      // Save the current step's data before moving to the next step
      if (isStepComplete(currentStep)) {
        setNextStepLoading(true);
        const saveResult = await saveEventData(currentStep);
        if (saveResult) {
          // If this is the first step and we're creating a new event, 
          // add the event ID to the URL
          if (currentStep === 1 && !id && saveResult.event?.id) {
            // Update the URL to include the event ID for continued editing
            navigate(`/events/create/${saveResult.event.id}`, { replace: true });
          }
          setCurrentStep(currentStep + 1);
        } else {
          // Error already shown in saveEventData
        }
        setNextStepLoading(false);
      } else {
        toast({
          title: "Incomplete Step",
          description: `Please complete all required fields in Step ${currentStep} before continuing.`,
          variant: "destructive",
        });
      }
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Check if required fields are completed for each step with improved validation
  const isStepComplete = (step: number): boolean => {
    switch(step) {
      case 1: // Build Event (Event Basics, Date & Time, Venue)
        // Validate event basics
        if (!formData.title.trim() || formData.title.trim().length < 3) return false;
        if (!formData.description.trim() || formData.description.trim().length < 10) return false;
        if (!formData.category) return false;
        
        // Validate date and time
        if (!formData.date) return false;
        if (!formData.startTime) return false;
        if (!formData.endTime) return false;
        
        // Validate that end time is after start time
        const startDate = new Date(`${formData.date}T${formData.startTime}`);
        const endDate = new Date(`${formData.date}T${formData.endTime}`);
        if (endDate <= startDate) return false;
        
        // Validate location based on type
        if (formData.locationType === 'physical') {
          if (!formData.location.trim()) return false;
          if (!formData.capacity || isNaN(Number(formData.capacity)) || Number(formData.capacity) <= 0) return false;
        } else if (formData.locationType === 'online') {
          if (!formData.onlineUrl.trim() || !isValidUrl(formData.onlineUrl)) return false;
        }
        
        return true;
        
      case 2: // Tickets
        // Check if tickets are properly filled
        const ticketsValid = formData.tickets.length > 0 && 
                            formData.tickets.every(ticket => 
                              ticket.name.trim().length > 0 && 
                              ticket.quantity && 
                              !isNaN(Number(ticket.quantity)) && 
                              Number(ticket.quantity) > 0 &&
                              (ticket.isFree || (ticket.price && !isNaN(Number(ticket.price)) && Number(ticket.price) >= 0))
                            );
        
        // If vendors are enabled, check vendor fields too
        const vendorsValid = !formData.allowVendors || 
                            (formData.vendorTypes.length > 0 && 
                             formData.vendorTypes.every(vt => 
                               vt.name.trim().length > 0 && 
                               vt.maxVendors && 
                               !isNaN(Number(vt.maxVendors)) && 
                               Number(vt.maxVendors) > 0 &&
                               (vt.fee === '' || (vt.fee && !isNaN(Number(vt.fee)) && Number(vt.fee) >= 0))
                             ));
        
        return ticketsValid && vendorsValid;
        
      case 3: // Publish
        return formData.title.trim().length > 0; // At least the title should be set
        
      default:
        return false;
    }
  };
  
  // Helper function to validate URLs
  const isValidUrl = (urlString: string): boolean => {
    try {
      const url = new URL(urlString);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (err) {
      return false;
    }
  };
  
  // Check if all required fields for publishing are completed with improved validation
  const isPublishComplete = (): boolean => {
    // Basic required fields
    if (!formData.title.trim() || formData.title.trim().length < 3) return false;
    if (!formData.description.trim() || formData.description.trim().length < 10) return false;
    if (!formData.category) return false;
    if (!formData.date) return false;
    if (!formData.startTime) return false;
    if (!formData.endTime) return false;
    
    // Validate that end time is after start time
    const startDate = new Date(`${formData.date}T${formData.startTime}`);
    const endDate = new Date(`${formData.date}T${formData.endTime}`);
    if (endDate <= startDate) return false;
    
    // Image is required for publish
    if (!imagePreview) return false;
    
    // Check tickets
    if (!formData.tickets.length || !formData.tickets.every(ticket => 
      ticket.name.trim().length > 0 && 
      ticket.quantity && 
      !isNaN(Number(ticket.quantity)) && 
      Number(ticket.quantity) > 0 &&
      (ticket.isFree || (ticket.price && !isNaN(Number(ticket.price)) && Number(ticket.price) >= 0))
    )) return false;
    
    // Validate location based on type
    if (formData.locationType === 'physical') {
      if (!formData.location.trim()) return false;
      if (!formData.capacity || isNaN(Number(formData.capacity)) || Number(formData.capacity) <= 0) return false;
    } else if (formData.locationType === 'online') {
      if (!formData.website.trim() || !isValidUrl(formData.website)) return false;
    }
    
    // If vendors are allowed, check required vendor fields
    if (formData.allowVendors) {
      if (!formData.vendorTypes.length || !formData.vendorTypes.every(vt => 
        vt.name.trim().length > 0 && 
        vt.maxVendors && 
        !isNaN(Number(vt.maxVendors)) && 
        Number(vt.maxVendors) > 0 &&
        (vt.fee === '' || (vt.fee && !isNaN(Number(vt.fee)) && Number(vt.fee) >= 0))
      )) return false;
      
      // Vendor deadline should be before event date if provided
      if (formData.vendorDeadline) {
        const vendorDeadline = new Date(formData.vendorDeadline);
        const eventDate = new Date(formData.date);
        if (vendorDeadline >= eventDate) return false;
      }
    }
    
    return true;
  };
  
  // Function to validate and navigate to missing field with improved validation
  const validateAndPublish = () => {
    // Validate event basics
    if (!formData.title.trim() || formData.title.trim().length < 3) {
      setCurrentStep(1);
      toast({
        title: "Validation Error",
        description: "Please add a title for your event (at least 3 characters)",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.description.trim() || formData.description.trim().length < 10) {
      setCurrentStep(1);
      toast({
        title: "Validation Error",
        description: "Please add a description for your event (at least 10 characters)",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.category) {
      setCurrentStep(1);
      toast({
        title: "Validation Error",
        description: "Please select a category for your event",
        variant: "destructive",
      });
      return;
    }
    
    // Validate date and time
    if (!formData.date) {
      setCurrentStep(1);
      toast({
        title: "Validation Error",
        description: "Please add a date for your event",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.startTime) {
      setCurrentStep(1);
      toast({
        title: "Validation Error",
        description: "Please add a start time for your event",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.endTime) {
      setCurrentStep(1);
      toast({
        title: "Validation Error",
        description: "Please add an end time for your event",
        variant: "destructive",
      });
      return;
    }
    
    // Validate that end time is after start time
    const startDate = new Date(`${formData.date}T${formData.startTime}`);
    const endDate = new Date(`${formData.date}T${formData.endTime}`);
    if (endDate <= startDate) {
      setCurrentStep(1);
      toast({
        title: "Validation Error",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return;
    }
    
    // Validate location based on type
    if (formData.locationType === 'physical') {
      if (!formData.location.trim()) {
        setCurrentStep(1);
        toast({
          title: "Validation Error",
          description: "Please add a location for your event",
          variant: "destructive",
        });
        return;
      }
      
      if (!formData.capacity || isNaN(Number(formData.capacity)) || Number(formData.capacity) <= 0) {
        setCurrentStep(1);
        toast({
          title: "Validation Error",
          description: "Please add a valid capacity for your event",
          variant: "destructive",
        });
        return;
      }
    } else if (formData.locationType === 'online') {
      if (!formData.website.trim() || !isValidUrl(formData.website)) {
        setCurrentStep(1);
        toast({
          title: "Validation Error",
          description: "Please add a valid online event platform URL",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Image is required for publish
    if (!imagePreview) {
      setCurrentStep(1);
      toast({
        title: "Validation Error",
        description: "Please add an event image",
        variant: "destructive",
      });
      return;
    }
    
    // Check tickets
    if (!formData.tickets.length || !formData.tickets.every(ticket => 
      ticket.name.trim().length > 0 && 
      ticket.quantity && 
      !isNaN(Number(ticket.quantity)) && 
      Number(ticket.quantity) > 0 &&
      (ticket.isFree || (ticket.price && !isNaN(Number(ticket.price)) && Number(ticket.price) >= 0))
    )) {
      setCurrentStep(2);
      toast({
        title: "Validation Error",
        description: "Please add at least one ticket type with a name and valid quantity",
        variant: "destructive",
      });
      return;
    }
    
    // If vendors are allowed, validate vendor fields
    if (formData.allowVendors) {
      if (!formData.vendorTypes.length || !formData.vendorTypes.every(vt => 
        vt.name.trim().length > 0 && 
        vt.maxVendors && 
        !isNaN(Number(vt.maxVendors)) && 
        Number(vt.maxVendors) > 0 &&
        (vt.fee === '' || (vt.fee && !isNaN(Number(vt.fee)) && Number(vt.fee) >= 0))
      )) {
        setCurrentStep(2);
        toast({
          title: "Validation Error",
          description: "Please specify valid vendor types with names and max vendors",
          variant: "destructive",
        });
        return;
      }
      
      // Vendor deadline should be before event date if provided
      if (formData.vendorDeadline) {
        const vendorDeadline = new Date(formData.vendorDeadline);
        const eventDate = new Date(formData.date);
        if (vendorDeadline >= eventDate) {
          setCurrentStep(2);
          toast({
            title: "Validation Error",
            description: "Vendor registration deadline must be before the event date",
            variant: "destructive",
          });
          return;
        }
      }
    }
    
    // If all validations pass, submit the event
    handleSubmit(new Event('submit') as unknown as React.FormEvent);
  };

  // Check if organizer info is complete
  useEffect(() => {
    const checkOrganizerInfo = () => {
      // In a real implementation, we would fetch this from the API
      // For now, we'll just assume the organizer info is missing
      // In the real app, you'd check the user's organizer profile
      
      // For demo purposes, we'll assume these are missing
      const missing = [];
      
      // In a real app, we would fetch the organizer profile from the backend
      // and check if businessName, description, and contactInfo are filled
      // For now, we'll set a mock condition
      if (formData.title.length < 3) {
        missing.push("Event title needs at least 3 characters");
      }
      
      if (formData.description.length < 10) {
        missing.push("Event description needs at least 10 characters");
      }
      
      setMissingFields(missing);
      setOrganizerInfoMissing(missing.length > 0);
    };
    
    checkOrganizerInfo();
  }, [formData]);

  // Sidebar navigation items
  const sidebarItems = [
    { id: 1, label: 'Event Details', icon: FileText, completed: completedSteps.includes(1) },
    { id: 2, label: 'Tickets', icon: Ticket, completed: completedSteps.includes(2) },
    { id: 3, label: 'Publish', icon: ExternalLink, completed: completedSteps.includes(3) },
  ];

  // Render the current step
  const renderStep = () => {
    switch(currentStep) {
      case 1: // Build Event: Event Basics, Date & Time, Venue with Image
        return (
          <div className="space-y-4">
            {/* Event Image Section */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Event Image
                </h2>
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <Image className="h-3 w-3 mr-1" />
                  <span>Required for publish</span>
                </div>
              </div>

              <div className="space-y-3">
                <div
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() =>
                    document.getElementById("image-upload")?.click()
                  }
                >
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Event preview"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-lg opacity-0 hover:opacity-100 transition-opacity">
                        <div className="text-white text-center">
                          <Camera className="h-8 w-8 mx-auto" />
                          <p className="mt-1">Click to change image</p>
                        </div>
                      </div>
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
                  <p>
                    Make sure your image is at least 2160x1080 pixels to look
                    sharp on high-resolution displays. Max file size: 10MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Event Basics Section */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                Event Basics
              </h2>

              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Event Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    aria-required="true"
                    aria-describedby="title-error"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Give it a title that tells people what it is"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Names that include date, location, or ticket type will be
                    rejected
                  </p>
                  {formData.title.length > 0 && formData.title.length < 3 && (
                    <p id="title-error" className="mt-1 text-xs text-red-500">
                      Title must be at least 3 characters
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Description *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    aria-required="true"
                    aria-describedby="description-error"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Tell people more about your event"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Include highlights and details about your event
                  </p>
                  {formData.description.length > 0 &&
                    formData.description.length < 10 && (
                      <p
                        id="description-error"
                        className="mt-1 text-xs text-red-500"
                      >
                        Description must be at least 10 characters
                      </p>
                    )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "business", label: "Business" },
                      { value: "tech", label: "Technology" },
                      { value: "music", label: "Music" },
                      { value: "art", label: "Art & Culture" },
                      { value: "food", label: "Food & Drink" },
                      { value: "health", label: "Health & Wellness" },
                      { value: "education", label: "Education" },
                      { value: "sports", label: "Sports" },
                      { value: "conference", label: "Conference" },
                      { value: "workshop", label: "Workshop" },
                      { value: "networking", label: "Networking" },
                      { value: "charity", label: "Charity" },
                      { value: "entertainment", label: "Entertainment" },
                    ].map((category) => (
                      <button
                        key={category.value}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            category: category.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setFormData((prev) => ({
                              ...prev,
                              category: category.value,
                            }));
                          }
                        }}
                        tabIndex={0}
                        role="radio"
                        aria-checked={formData.category === category.value}
                        className={`px-3 py-1.5 text-sm rounded-full ${
                          formData.category === category.value
                            ? "bg-primary text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {category.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tags
                  </label>
                  <div className="relative">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.tags.map((tag, index) => (
                        <div
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-primary hover:bg-primary/20 focus:outline-none"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="relative flex">
                      <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <input
                        type="text"
                        value={tagInput}
                        onChange={handleTagInputChange}
                        onKeyPress={handleTagKeyPress}
                        placeholder="Add tags (press Enter)"
                        className="flex-1 px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-l-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                        list="available-tags"
                      />
                      <datalist id="available-tags">
                        {availableTags.map((tag, index) => (
                          <option key={index} value={tag} />
                        ))}
                      </datalist>
                      <button
                        type="button"
                        onClick={addTag}
                        className="px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-r-lg hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Add relevant tags to help users find your event
                  </p>
                </div>
              </div>
            </div>

            {/* Date & Time Section */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                Date & Time
              </h2>

              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="date"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Date *
                  </label>
                  <div className="relative">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={`w-full justify-start text-left font-normal ${
                            !formData.date && "text-muted-foreground"
                          }`}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {formData.date ? new Date(formData.date).toLocaleDateString() : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <ShadcnCalendar
                          mode="single"
                          selected={formData.date ? new Date(formData.date) : undefined}
                          onSelect={(date) => setFormData(prev => ({ ...prev, date: date ? date.toISOString().split('T')[0] : '' }))}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  {!formData.date && (
                    <p id="date-error" className="mt-1 text-xs text-red-500">
                      Please select a date for your event
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="startTime"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
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
                        aria-required="true"
                        aria-describedby="time-error"
                        className="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="endTime"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
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
                        aria-required="true"
                        aria-describedby="time-error"
                        className="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    </div>
                  </div>
                </div>
                {formData.date && formData.startTime && formData.endTime && (
                  <div className="mt-1">
                    {(() => {
                      const startDate = new Date(
                        `${formData.date}T${formData.startTime}`
                      );
                      const endDate = new Date(
                        `${formData.date}T${formData.endTime}`
                      );
                      if (endDate <= startDate) {
                        return (
                          <p id="time-error" className="text-xs text-red-500">
                            End time must be after start time
                          </p>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="timezone"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Timezone
                  </label>
                  <div className="relative">
                    <select
                      id="timezone"
                      name="timezone"
                      value={formData.timezone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                    >
                      <option value="Africa/Lagos">
                        West Africa Time (WAT)
                      </option>
                      <option value="Africa/Accra">Ghana Time</option>
                      <option value="UTC">UTC</option>
                    </select>
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Venue Section */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                Venue
              </h2>

              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        locationType: "physical",
                      }))
                    }
                    className={`py-3 px-3 rounded-lg border ${
                      formData.locationType === "physical"
                        ? "border-primary ring-2 ring-primary/20 bg-primary/5 dark:bg-primary/10"
                        : "border-gray-300 dark:border-gray-600 hover:border-primary"
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <MapPin
                        className={`h-5 w-5 mb-1 ${
                          formData.locationType === "physical"
                            ? "text-primary"
                            : "text-gray-500"
                        }`}
                      />
                      <span
                        className={`font-medium text-sm ${
                          formData.locationType === "physical"
                            ? "text-primary"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        Physical venue
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        In-person event
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        locationType: "online",
                      }))
                    }
                    className={`py-3 px-3 rounded-lg border ${
                      formData.locationType === "online"
                        ? "border-primary ring-2 ring-primary/20 bg-primary/5 dark:bg-primary/10"
                        : "border-gray-300 dark:border-gray-600 hover:border-primary"
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <LinkIcon
                        className={`h-5 w-5 mb-1 ${
                          formData.locationType === "online"
                            ? "text-primary"
                            : "text-gray-500"
                        }`}
                      />
                      <span
                        className={`font-medium text-sm ${
                          formData.locationType === "online"
                            ? "text-primary"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        Online event
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Live online event
                      </span>
                    </div>
                  </button>
                </div>

                {formData.locationType === "physical" ? (
                  <div className="space-y-3">
                    <div>
                      <label
                        htmlFor="location"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
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
                          aria-required="true"
                          aria-describedby="location-error"
                          placeholder="Enter event location"
                          className="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                      </div>
                      {!formData.location && (
                        <p
                          id="location-error"
                          className="mt-1 text-xs text-red-500"
                        >
                          Please enter the event location
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="capacity"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
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
                          aria-describedby="capacity-error"
                          placeholder="Number of attendees"
                          className="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                      </div>
                      {formData.capacity &&
                        (isNaN(Number(formData.capacity)) ||
                          Number(formData.capacity) <= 0) && (
                          <p
                            id="capacity-error"
                            className="mt-1 text-xs text-red-500"
                          >
                            Please enter a valid capacity (greater than 0)
                          </p>
                        )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label
                      htmlFor="onlineUrl"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Online Event Platform *
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        id="onlineUrl"
                        name="onlineUrl"
                        value={formData.onlineUrl}
                        onChange={handleChange}
                        required
                        aria-required="true"
                        aria-describedby="onlineUrl-error"
                        placeholder="https://meet.jit.si/my-event"
                        className="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Enter the URL where your online event will take place
                    </p>
                    {formData.onlineUrl && !isValidUrl(formData.onlineUrl) && (
                      <p
                        id="onlineUrl-error"
                        className="mt-1 text-xs text-red-500"
                      >
                        Please enter a valid URL (e.g., https://example.com)
                      </p>
                    )}
                  </div>
                )}

                {/* Event Website Field for both venue types */}
                <div>
                  <label
                    htmlFor="eventWebsite"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Event Website (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      id="eventWebsite"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="https://yoursite.com/event"
                      className="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Enter your event website if you have one
                  </p>
                </div>

                {/* Recurring Event Toggle */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Recurring Event
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Make this a recurring event
                      </p>
                    </div>
                    <Switch
                      id="isRecurring"
                      checked={formData.isRecurring}
                      onCheckedChange={(checked: boolean) =>
                        setFormData((prev) => ({
                          ...prev,
                          isRecurring: checked,
                        }))
                      }
                    />
                  </div>

                  {formData.isRecurring && (
                    <div className="mt-3 space-y-3">
                      <div>
                        <label
                          htmlFor="recurrencePattern"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                          Recurrence Pattern
                        </label>
                        <select
                          id="recurrencePattern"
                          name="recurrencePattern"
                          value={formData.recurrencePattern}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="DAILY">Daily</option>
                          <option value="WEEKLY">Weekly</option>
                          <option value="MONTHLY">Monthly</option>
                          <option value="YEARLY">Yearly</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label
                            htmlFor="recurrenceInterval"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          >
                            Interval
                          </label>
                          <input
                            type="number"
                            id="recurrenceInterval"
                            name="recurrenceInterval"
                            min="1"
                            value={formData.recurrenceInterval}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Every 1 week"
                          />
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            How often to repeat (e.g. every 2 weeks)
                          </p>
                        </div>

                        <div>
                          <label
                            htmlFor="recurrenceEnd"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          >
                            End Date
                          </label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={`w-full justify-start text-left font-normal ${
                                  !formData.recurrenceEnd && "text-muted-foreground"
                                }`}
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                {formData.recurrenceEnd ? new Date(formData.recurrenceEnd).toLocaleDateString() : "Pick a date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <ShadcnCalendar
                                mode="single"
                                selected={formData.recurrenceEnd ? new Date(formData.recurrenceEnd) : undefined}
                                onSelect={(date) => setFormData(prev => ({ ...prev, recurrenceEnd: date ? date.toISOString().split('T')[0] : '' }))}
                                disabled={(date) => date < new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            When the recurrence should end
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      
      case 2: // Tickets
        return (
          <div className="space-y-4">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Tickets</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                How many tickets do you want to sell?
              </p>
              
              <div className="space-y-3">
                {formData.tickets.map((ticket, index) => (
                  <div key={ticket.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-md font-medium">Ticket Type {index + 1}</h3>
                      {formData.tickets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTicket(index)}
                          className="text-red-600 hover:text-red-800 dark:hover:text-red-400 text-xs font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ticket Name</label>
                        <input
                          type="text"
                          value={ticket.name}
                          onChange={(e) => handleTicketChange(index, 'name', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                          placeholder="e.g. General Admission"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={ticket.quantity}
                          onChange={(e) => handleTicketChange(index, 'quantity', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                          placeholder="How many tickets?"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <div className="flex items-center mb-1">
                          <input
                            type="checkbox"
                            id={`isFree-${index}`}
                            checked={ticket.isFree}
                            onChange={(e) => handleTicketChange(index, 'isFree', e.target.checked)}
                            className="h-3 w-3 text-primary focus:ring-primary border-gray-300 rounded"
                          />
                          <label htmlFor={`isFree-${index}`} className="ml-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                            This is a free ticket
                          </label>
                        </div>
                      </div>
                      
                      {!ticket.isFree && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Price (₦)</label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              value={ticket.price}
                              onChange={(e) => handleTicketChange(index, 'price', e.target.value)}
                              className="w-full px-2 py-1 pl-8 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                              placeholder="0.00"
                            />
                            <Ticket className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-500" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addTicket}
                  className="flex items-center text-primary hover:text-primary/80 text-xs font-medium"
                >
                  <PlusIcon  />
                  Add another ticket type
                </button>
              </div>
            </div>
            
            {/* Vendor Section */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Vendor Registration</h2>
                  <div className="relative group ml-2">
                    <Info className="h-4 w-4 text-gray-500 cursor-pointer" />
                    <div className="absolute left-1/2 transform -translate-x-1/2 -top-8 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 w-48">
                      Enable vendor registration for your event. Vendors can register for available stalls.
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full border-8 border-transparent border-t-gray-800"></div>
                    </div>
                  </div>
                </div>
                <Switch
                  id="allowVendors"
                  checked={formData.allowVendors}
                  onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, allowVendors: checked }))}
                />
              </div>
              
              {formData.allowVendors && (
                <div className="space-y-4">
                  {/* Vendor Types List */}
                  {formData.vendorTypes.map((vendorType, index) => (
                    <div key={vendorType.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 relative">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-md font-medium text-gray-900 dark:text-white">
                          Vendor Type {index + 1} {index === 0 ? '(Primary)' : ''}
                        </h3>
                        {formData.vendorTypes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVendorType(index)}
                            className="text-red-600 hover:text-red-800 dark:hover:text-red-400 text-xs font-medium"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Stall Type *
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={vendorType.name}
                              onChange={(e) => handleVendorTypeChange(index, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="e.g. Food, Drinks"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Stall Fee (₦)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              value={vendorType.fee}
                              onChange={(e) => handleVendorTypeChange(index, 'fee', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="0 for free"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Max Vendors *
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="1"
                              value={vendorType.maxVendors}
                              onChange={(e) => handleVendorTypeChange(index, 'maxVendors', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="How many?"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Add Vendor Type Button */}
                  <button
                    type="button"
                    onClick={addVendorType}
                    className="flex items-center text-primary hover:text-primary/80 text-sm font-medium mt-2"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Another Vendor Type
                  </button>
                  
                  {/* Common Vendor Fields */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center">
                      <label htmlFor="vendorDeadline" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Vendor Registration Deadline
                      </label>
                      <div className="relative group ml-2">
                        <Info className="h-4 w-4 text-gray-500 cursor-pointer" />
                        <div className="absolute left-1/2 transform -translate-x-1/2 -top-8 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 w-48">
                          Last date for vendors to register for stalls at your event
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full border-8 border-transparent border-t-gray-800"></div>
                        </div>
                      </div>
                    </div>
                    <div className="relative">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={`w-full justify-start text-left font-normal ${
                              !formData.vendorDeadline && "text-muted-foreground"
                            }`}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {formData.vendorDeadline ? new Date(formData.vendorDeadline).toLocaleDateString() : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <ShadcnCalendar
                            mode="single"
                            selected={formData.vendorDeadline ? new Date(formData.vendorDeadline) : undefined}
                            onSelect={(date) => setFormData(prev => ({ ...prev, vendorDeadline: date ? date.toISOString().split('T')[0] : '' }))}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      
      case 3: // Publish
        return (
          <div className="space-y-6">
            {/* Alert for missing organizer info */}
            {organizerInfoMissing && (
              <div className="border-l-4 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Missing required information
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                      <ul className="list-disc pl-5 space-y-1">
                        {missingFields.map((field, index) => (
                          <li key={index}>{field}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-4">
                      <div className="-mx-2 -my-1.5 flex">
                        <button
                          type="button"
                          onClick={() => navigate('/profile')}
                          className="px-3 py-1.5 rounded-md text-sm font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600 dark:bg-yellow-800 dark:text-yellow-100 dark:hover:bg-yellow-700"
                        >
                          Update organizer profile
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Event Preview Section */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-md font-medium text-gray-900 dark:text-white">Event Preview</h3>
                <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
                  Preview
                </span>
              </div>
              
              {/* Preview Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="Event preview" 
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="bg-gray-200 dark:bg-gray-700 h-48 flex items-center justify-center">
                    <span className="text-gray-500 dark:text-gray-400">Event Image Preview</span>
                  </div>
                )}
                
                <div className="p-4">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                    {formData.title || "Your Event Title"}
                  </h4>
                  
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formData.date ? new Date(formData.date).toLocaleDateString() : "Not set"}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <Clock className="h-4 w-4 mr-2" />
                      {formData.startTime && formData.endTime 
                        ? `${formData.startTime} - ${formData.endTime}` 
                        : "Not set"}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <MapPin className="h-4 w-4 mr-2" />
                      {formData.locationType === 'physical' 
                        ? (formData.location || "Event Location") 
                        : (formData.website || "Online Event Platform")}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <Users className="h-4 w-4 mr-2" />
                      {formData.capacity ? `${formData.capacity} capacity` : "Capacity not set"}
                    </div>
                    
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                        {formData.description || "Event description will appear here..."}
                      </p>
                    </div>
                  </div>
                  
                  {/* Ticket Types Preview */}
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Tickets</h5>
                    <div className="space-y-1">
                      {formData.tickets.map((ticket, index) => (
                        <div key={ticket.id} className="flex justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-300">
                            {ticket.name || `Ticket ${index + 1}`}
                          </span>
                          <span className="text-gray-900 dark:text-white">
                            {ticket.isFree ? "Free" : `₦${ticket.price || 0}`}
                            {ticket.quantity && ` · ${ticket.quantity} available`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Vendor Preview */}
                  {formData.allowVendors && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Vendors</h5>
                      <div className="space-y-1">
                        {formData.vendorTypes.map((vt, index) => (
                          <div key={index} className="text-sm text-gray-600 dark:text-gray-300">
                            {vt.name || 'Vendor stall'} • {vt.fee ? `₦${vt.fee} fee` : 'Free stall'} • Up to {vt.maxVendors || 'unlimited'} vendors
                          </div>
                        ))}
                      </div>
                      {formData.vendorDeadline && (
                        <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          Registration deadline: {new Date(formData.vendorDeadline).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Publish Settings */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5">
              <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">Publish Settings</h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, publishStatus: 'draft' }))}
                  className="flex-1 py-2 px-4 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, publishStatus: 'published' }))}
                  className="flex-1 py-2 px-4 rounded border border-primary bg-primary text-white text-sm"
                >
                  Publish
                </button>
              </div>
              
              {/* Publish Status Indicator */}
              <div className="mt-4 p-3 rounded-lg border flex items-start">
                {formData.publishStatus === 'published' ? (
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-800 dark:text-green-300">Published</h4>
                      <p className="text-sm text-green-700 dark:text-green-400">
                        Your event is live and visible to everyone
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start">
                    <FileText className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-gray-200">Draft</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Your event is saved but not visible to the public
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

    return (
      <div className=" bg-gray-50 dark:bg-gray-900 flex flex-col">
        {/* Fixed Header */}
        {/* <header className="bg-white dark:bg-gray-800 shadow-sm py-4 px-6 z-10 ">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Create an event
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Fill out the information below to create your event.
              </p>
            </div>
          </div>
        </header> */}
        {/* <div></div> */}
        <div className="flex flex-1 overflow-hidde">
          {/* Fixed Sidebar */}
          <div className="w-64 bg-white dark:bg-gray-800 shadow-sm p-4 overflow-y-auto flex-shrink-0 sticky top-2 h-[calc(100vh-20rem)]">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Event Setup Create an event
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Fill out the information below to create your event.
            </p>
            <nav className="space-y-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentStep(item.id)}
                    className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg ${
                      currentStep === item.id
                        ? "bg-primary/10 text-primary"
                        : isStepComplete(item.id)
                        ? "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 mr-3 ${
                        currentStep === item.id
                          ? "text-primary"
                          : "text-gray-500"
                      }`}
                    />
                    <span>{item.label}</span>
                    {item.completed && (
                      <CheckCircle className="ml-auto h-4 w-4 text-green-500" />
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => navigate("/organizer")}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <Settings className="h-4 w-4 mr-3 inline text-gray-500" />
                Event Dashboard
              </button>
            </div>
          </div>

          {/* Scrollable Form Content */}
          <div className="flex-1 overflow-y-aut p-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidde">
                <div className="p-4">
                  <form onSubmit={currentStep === 3 ? handleSubmit : undefined}>
                    {renderStep()}

                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate("/organizer/events")}
                        className="text-sm"
                      >
                        Cancel
                      </Button>

                      <div className="flex space-x-2">
                        {currentStep > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={goToPreviousStep}
                            className="text-sm"
                          >
                            Back
                          </Button>
                        )}

                        {currentStep < 3 ? (
                          <Button
                            type="button"
                            className="text-sm"
                            onClick={goToNextStep}
                            disabled={
                              !isStepComplete(currentStep) || nextStepLoading
                            }
                          >
                            {nextStepLoading ? (
                              <>
                                <Spinner className="mr-2 h-4 w-4" />
                                Saving...
                              </>
                            ) : (
                              "Save and Continue"
                            )}
                          </Button>
                        ) : (
                          // </div>
                          <div className="flex space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setSaveDraftLoading(true);
                                setFormData((prev) => ({
                                  ...prev,
                                  publishStatus: "draft",
                                }));
                                handleSubmit(
                                  new Event(
                                    "submit"
                                  ) as unknown as React.FormEvent
                                ).finally(() => {
                                  setSaveDraftLoading(false);
                                });
                              }}
                              className="text-sm"
                              disabled={saveDraftLoading}
                            >
                              {saveDraftLoading ? (
                                <>
                                  <Spinner className="mr-2 h-4 w-4" />
                                  Saving...
                                </>
                              ) : (
                                "Save as Draft"
                              )}
                            </Button>
                            <Button
                              type="button"
                              className="text-sm"
                              onClick={validateAndPublish}
                              disabled={!isPublishComplete() || publishLoading}
                            >
                              {publishLoading ? (
                                <>
                                  <Spinner className="mr-2 h-4 w-4" />
                                  Publishing...
                                </>
                              ) : (
                                "Publish"
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Toast viewport */}
        {/* <ToastViewport toasts={toasts} dismiss={dismiss} /> */}
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
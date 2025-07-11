// Configuration file for dynamic settings
const config = {
  // API Configuration
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  
  // App Configuration
  appName: import.meta.env.VITE_APP_NAME || 'Neighbor Aid Connect',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // Jobs Configuration
  jobs: [
    { value: 'student', label: 'Student' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'engineer', label: 'Engineer' },
    { value: 'doctor', label: 'Doctor' },
    { value: 'nurse', label: 'Nurse' },
    { value: 'lawyer', label: 'Lawyer' },
    { value: 'accountant', label: 'Accountant' },
    { value: 'designer', label: 'Designer' },
    { value: 'developer', label: 'Software Developer' },
    { value: 'manager', label: 'Manager' },
    { value: 'sales', label: 'Sales Representative' },
    { value: 'marketing', label: 'Marketing Specialist' },
    { value: 'writer', label: 'Writer' },
    { value: 'artist', label: 'Artist' },
    { value: 'musician', label: 'Musician' },
    { value: 'chef', label: 'Chef' },
    { value: 'waiter', label: 'Waiter/Waitress' },
    { value: 'driver', label: 'Driver' },
    { value: 'mechanic', label: 'Mechanic' },
    { value: 'electrician', label: 'Electrician' },
    { value: 'plumber', label: 'Plumber' },
    { value: 'carpenter', label: 'Carpenter' },
    { value: 'gardener', label: 'Gardener' },
    { value: 'cleaner', label: 'Cleaner' },
    { value: 'security', label: 'Security Guard' },
    { value: 'police', label: 'Police Officer' },
    { value: 'firefighter', label: 'Firefighter' },
    { value: 'military', label: 'Military' },
    { value: 'retired', label: 'Retired' },
    { value: 'unemployed', label: 'Unemployed' },
    { value: 'homemaker', label: 'Homemaker' },
    { value: 'entrepreneur', label: 'Entrepreneur' },
    { value: 'consultant', label: 'Consultant' },
    { value: 'freelancer', label: 'Freelancer' },
    { value: 'other', label: 'Other' }
  ],
  
  // Service Categories - Now dynamic and configurable
  serviceCategories: [
    { value: 'plumbing', label: 'Plumbing', icon: 'Wrench', color: 'blue' },
    { value: 'electrical', label: 'Electrical', icon: 'Settings', color: 'yellow' },
    { value: 'maid', label: 'Maid', icon: 'CheckCircle', color: 'green' },
    { value: 'cook', label: 'Cook', icon: 'ChefHat', color: 'orange' },
    { value: 'cleaning', label: 'Cleaning', icon: 'Sparkles', color: 'purple' },
    { value: 'gardening', label: 'Gardening', icon: 'TreePine', color: 'emerald' },
    { value: 'security', label: 'Security', icon: 'Shield', color: 'red' },
    { value: 'maintenance', label: 'Maintenance', icon: 'Hammer', color: 'gray' },
    { value: 'other', label: 'Other', icon: 'MoreHorizontal', color: 'slate' }
  ],
  
  // Urgency Levels
  urgencyLevels: [
    { value: 'low', label: 'Low', color: 'green' },
    { value: 'medium', label: 'Medium', color: 'orange' },
    { value: 'high', label: 'High', color: 'red' }
  ],
  
  // Available Roles - Now dynamic and configurable
  availableRoles: [
    'resident',
    'volunteer',
    'staff',
    'manager',
    'technician',
    'cook',
    'maid',
    'security',
    'gardener',
    'plumber',
    'electrician',
    'cleaner',
    'maintenance',
    'custom'
  ],
  
  // Profile Configuration
  profile: {
    genderOptions: [
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' },
      { value: 'other', label: 'Other' },
      { value: 'prefer-not-to-say', label: 'Prefer not to say' }
    ],
    skillCategories: [
      'plumbing', 'electrical', 'cooking', 'cleaning', 'gardening',
      'security', 'maintenance', 'childcare', 'eldercare', 'petcare',
      'driving', 'technology', 'language', 'tutoring', 'art',
      'music', 'fitness', 'healthcare', 'legal', 'financial'
    ],
    maxBioLength: 500,
    maxSkillsCount: 10,
    formLabels: {
      basicInfo: 'Basic Information',
      contactInfo: 'Contact Information',
      profileInfo: 'Profile Information',
      emergencyContact: 'Emergency Contact',
      preferences: 'Preferences',
      name: 'Full Name',
      email: 'Email Address',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      address: 'Address',
      phone: 'Phone Number',
      bio: 'Bio',
      skills: 'Skills',
      profilePicture: 'Profile Picture',
      dateOfBirth: 'Date of Birth',
      gender: 'Gender',
      occupation: 'Occupation',
      emergencyContactName: 'Emergency Contact Name',
      emergencyContactPhone: 'Emergency Contact Phone',
      emergencyContactRelationship: 'Relationship',
      notifications: 'Enable Notifications',
      emailUpdates: 'Email Updates',
      publicProfile: 'Public Profile'
    },
    formPlaceholders: {
      name: 'John Doe',
      email: 'you@example.com',
      password: '••••••••',
      address: '123 Main St, Anytown, ST 12345',
      phone: '+1 (555) 123-4567',
      bio: 'Tell us about yourself...',
      occupation: 'Software Engineer',
      emergencyContactName: 'Jane Doe',
      emergencyContactPhone: '+1 (555) 987-6543',
      emergencyContactRelationship: 'Spouse'
    },
    validationMessages: {
      required: 'This field is required',
      email: 'Please enter a valid email address',
      passwordMatch: 'Passwords do not match',
      passwordLength: 'Password must be at least 4 characters',
      bioLength: 'Bio must be less than 500 characters',
      maxSkills: 'You can select up to 10 skills',
      phoneFormat: 'Please enter a valid phone number'
    }
  },
  
  // Navigation Items - Now dynamic and configurable
  navigationItems: [
    { id: 'home', label: 'Home', path: '/' },
    { id: 'about', label: 'About', path: '/about' },
    { id: 'services', label: 'Services', path: '/services' },
    { id: 'community', label: 'Community', path: '/community' },
    { id: 'contact', label: 'Contact', path: '/contact' }
  ],
  
  // Feature Cards - Now dynamic and configurable
  featureCards: [
    {
      key: 'helpers',
      icon: 'Users',
      title: 'Find Nearby Helpers',
      description: 'Connect with neighbors who can provide assistance with everyday tasks',
      link: '/dashboard'
    },
    {
      key: 'volunteer',
      icon: 'Heart',
      title: 'Volunteer Opportunities',
      description: 'Discover ways to give back and support others in your community',
      link: '/dashboard'
    },
    {
      key: 'forums',
      icon: 'MessageCircle',
      title: 'Community Forums',
      description: 'Join discussions and stay informed about local news and events',
      link: '/dashboard'
    }
  ],
  
  // Dashboard Navigation - Now dynamic and configurable
  dashboardNavItems: [
    { id: 'overview', label: 'Overview', icon: 'Home', adminOnly: false },
    { id: 'requests', label: 'Requests', icon: 'FileText', adminOnly: false },
    { id: 'staff', label: 'Staff', icon: 'Star', adminOnly: false },
    { id: 'chats', label: 'Chats', icon: 'MessageCircle', adminOnly: false },
    { id: 'profile', label: 'Profile', icon: 'User', adminOnly: false },
    { id: 'notifications', label: 'Notifications', icon: 'Bell', adminOnly: false },
    { id: 'directory', label: 'Service Directory', icon: 'Wrench', adminOnly: false },
    { id: 'assignroles', label: 'Manage Roles', icon: 'UserCog', adminOnly: true }
  ],
  
  // Status Colors
  statusColors: {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    'in-progress': { bg: 'bg-blue-100', text: 'text-blue-800' },
    completed: { bg: 'bg-green-100', text: 'text-green-800' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-800' }
  },
  
  // Urgency Colors
  urgencyColors: {
    low: 'bg-green-500',
    medium: 'bg-orange-500',
    high: 'bg-red-500'
  },
  
  // Staff Configuration
  staffConfig: {
    defaultRating: 4.5,
    defaultTotalRatings: 5,
    defaultAvailableHours: '9AM-6PM',
    defaultRole: 'Volunteer'
  },
  
  // Quick Actions Configuration
  quickActions: [
    { 
      label: 'Post Help Request', 
      icon: 'PlusCircle', 
      link: '/post-request',
      description: 'Request help from your community'
    },
    { 
      label: 'Browse Services', 
      icon: 'Wrench', 
      link: '/dashboard?tab=directory',
      description: 'Find available services'
    },
    { 
      label: 'Chat with Volunteers', 
      icon: 'MessageCircle', 
      link: '/dashboard?tab=chats',
      description: 'Connect with community helpers'
    }
  ],
  
  // Service Directory Configuration
  serviceDirectory: {
    emptyStateMessage: 'No service directory information available.',
    loadingMessage: 'Loading service directory...',
    noServicesMessage: 'No services available at the moment.',
    requestServiceText: 'Request Service',
    callText: 'Call',
    ratingText: 'ratings',
    categoryText: 'Category:',
    availableHoursText: 'Available Hours:',
    phoneText: 'Phone:',
    emailText: 'Email:',
    ratingLabel: 'Rating:'
  },
  
  // Overview Section Configuration
  overview: {
    welcomeMessage: 'Welcome, {name} 👋',
    communityRequestsTitle: 'Community Help Requests',
    searchPlaceholder: 'Search tasks or users...',
    noRequestsMessage: 'No community help requests at the moment.',
    noSearchResultsMessage: 'No results found for your search',
    alreadyAssignedText: 'Already assigned',
    offerHelpText: 'Offer Help',
    tableHeaders: {
      number: 'No.',
      category: 'Category',
      description: 'Description',
      urgency: 'Urgency',
      time: 'Time',
      status: 'Status',
      action: 'Action'
    }
  },
  
  // Requests Section Configuration
  requests: {
    title: 'Your Help Requests',
    noRequestsMessage: "You haven't created any help requests yet.",
    createNewRequestText: 'Create New Request',
    postedText: 'Posted',
    preferredTimeText: 'Preferred time:',
    acceptedByText: 'Accepted by',
    completedText: 'Completed',
    pendingText: 'Pending',
    noteText: 'Note:',
    chatWithHelperText: 'Chat with Helper',
    markCompletedText: 'Mark Completed',
    deleteRequestText: 'Delete Request',
    statusLabels: {
      'in-progress': 'In Progress',
      'completed': 'Completed',
      'pending': 'Pending'
    }
  },
  
  // Service Request Modal Configuration
  serviceRequestModal: {
    title: 'Request Service',
    subtitle: 'Request service from {name}',
    serviceTypeLabel: 'Service Type',
    descriptionLabel: 'Service Description',
    descriptionPlaceholder: 'Describe the service you need in detail...',
    preferredDateLabel: 'Preferred Date',
    preferredTimeLabel: 'Preferred Time',
    addressLabel: 'Service Address',
    addressPlaceholder: 'Enter service address (optional)',
    urgencyLabel: 'Urgency Level',
    additionalNotesLabel: 'Additional Notes',
    additionalNotesPlaceholder: 'Any additional information or special requirements...',
    cancelText: 'Cancel',
    submitText: 'Submit Request',
    submittingText: 'Submitting...',
    requiredFieldText: 'Please fill in all required fields',
    successMessage: 'Service request submitted successfully!',
    errorMessage: 'Failed to submit service request: {error}'
  }
};

export default config; 
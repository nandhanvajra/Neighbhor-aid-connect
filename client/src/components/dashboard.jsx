import React, { useState, useEffect } from 'react';
import {
  Users,
  MessageCircle,
  Wrench,
  PlusCircle,
  CheckCircle,
  Home,
  LogOut,
  Bell,
  FileText,
  Star,
  Clock,
  AlertTriangle,
  Search,
  UserCog,
  Phone,
  Mail,
  Hammer,
  Settings
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import UserList from './UserList';
import ServiceRequestModal from './ServiceRequestModal';
import ClickableUserName from './ClickableUserName';
import config from '../config/config';
import io from 'socket.io-client';
import UserProfile from './UserProfile';
import RatingModal from './RatingModal';
import RatingDisplay from './RatingDisplay';
import AdminDashboard from './AdminDashboard';

// Legacy RatingModal component - keeping for backward compatibility
function LegacyRatingModal({ open, onClose, requestId, onRated }) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleRate = async (rating) => {
    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const url = `${config.apiBaseUrl}/api/requests/${requestId}/rate`;
      const options = {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating })
      };
      console.log('Rating fetch:', { url, options });
      const res = await fetch(url, options);
      let data = null;
      try { data = await res.json(); } catch (e) { data = null; }
      console.log('Rating response:', { status: res.status, data });
      if (!res.ok) throw new Error((data && data.message) || 'Failed to submit rating');
      setSelected(rating);
      if (onRated) onRated();
    } catch (err) {
      setError(err.message);
      console.error('Rating error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-80 text-center">
        <h3 className="text-lg font-bold mb-2 text-gray-800">Rate the Helper</h3>
        <div className="flex items-center justify-center mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <button
              key={`legacy-star-${requestId}-${i}`}
              type="button"
              className={`w-8 h-8 focus:outline-none transition-colors ${i < (hovered || selected) ? 'text-yellow-500' : 'text-gray-300'}`}
              onMouseEnter={() => setHovered(i + 1)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => handleRate(i + 1)}
              disabled={submitting}
            >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><polygon points="9.9,1.1 7.6,6.6 1.6,7.3 6.1,11.2 4.8,17.1 9.9,14.1 15,17.1 13.7,11.2 18.2,7.3 12.2,6.6 "/></svg>
            </button>
          ))}
        </div>
        {submitting && <div className="text-xs text-gray-400 mb-2">Submitting...</div>}
        {error && <div className="text-xs text-red-500 mb-2">{error}</div>}
        <button className="mt-2 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-gray-700" onClick={onClose} disabled={submitting}>Cancel</button>
      </div>
    </div>
  );
}

// Legacy RatingStars component - keeping for backward compatibility
function LegacyRatingStars({ requestId, onRated }) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleRate = async (rating) => {
    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${config.apiBaseUrl}/api/requests/${requestId}/rate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit rating');
      setSelected(rating);
      if (onRated) onRated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center" key={`rating-${requestId}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <button
          key={`${requestId}-star-${i}`}
          type="button"
          className={`w-6 h-6 focus:outline-none transition-colors ${i < (hovered || selected) ? 'text-yellow-500' : 'text-gray-300'}`}
          onMouseEnter={() => setHovered(i + 1)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => handleRate(i + 1)}
          disabled={submitting}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><polygon points="9.9,1.1 7.6,6.6 1.6,7.3 6.1,11.2 4.8,17.1 9.9,14.1 15,17.1 13.7,11.2 18.2,7.3 12.2,6.6 "/></svg>
        </button>
      ))}
      {submitting && <span className="ml-2 text-xs text-gray-400">Submitting...</span>}
      {error && <span className="ml-2 text-xs text-red-500">{error}</span>}
    </div>
  );
}

export default function ResidentDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [volunteers, setVolunteers] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [directoryData, setDirectoryData] = useState([]);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [selectedStaffMember, setSelectedStaffMember] = useState(null);
  // Notifications state (placeholder for now)
  const [notifications, setNotifications] = useState([
    // Example notification
    // { title: 'Welcome!', body: 'Thanks for joining Neighbor Aid Connect.', time: 'Just now' }
  ]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const navigate = useNavigate();
  // Add state for rating modal
  const [ratingModal, setRatingModal] = useState({ open: false, requestId: null, requestCategory: null });
  const [selectedRole, setSelectedRole] = useState('all');

  // Helper function to get user ID consistently
  const getUserId = () => user?._id || user?.id;

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      if (!storedToken || !userData) {
        navigate('/login');
        return;
      }

      const parsedUser = JSON.parse(userData);
      // parsedUser.isAdmin=true
      console.log(parsedUser)
      setUser(parsedUser);
      setToken(storedToken);
      setIsAdmin(parsedUser.isAdmin === true);
    } catch (error) {
      console.error('Invalid user JSON in localStorage:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if ((activeTab === 'overview' || activeTab === 'requests') && token) {
      // Fetch all requests when on overview or requests tab with auth token
      fetch(`${config.apiBaseUrl}/api/requests/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          console.log('All requests response:', data);
          // Check if data has a requests property that is an array
          if (data && data.requests && Array.isArray(data.requests)) {
            setAllRequests(data.requests);
            
            // Debug: Log the first request to see its structure
            if (data.requests.length > 0) {
              console.log('First request structure:', data.requests[0]);
            }
            
            // For overview tab, filter out user's own requests for display
            if (activeTab === 'overview' && user) {
              const otherRequests = data.requests.filter((req) => req.userId !== getUserId());
              // No need to modify the original allRequests array here
              // Just use filtering when displaying in the UI
            }
          } else {
            setAllRequests([]);
          }
        })
        .catch(err => {
          console.error('Error loading all requests', err);
          setAllRequests([]);
        });
    }
  }, [activeTab, user, token]);

  // Effect to listen for refresh requests event
  useEffect(() => {
    const handleRefreshRequests = () => {
      if ((activeTab === 'overview' || activeTab === 'requests') && token) {
        fetch(`${config.apiBaseUrl}/api/requests/all`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
          .then(res => {
            if (!res.ok) {
              throw new Error(`HTTP error! Status: ${res.status}`);
            }
            return res.json();
          })
          .then(data => {
            if (data && data.requests && Array.isArray(data.requests)) {
              setAllRequests(data.requests);
            }
          })
          .catch(err => {
            console.error('Error refreshing requests:', err);
          });
      }
    };

    window.addEventListener('refreshRequests', handleRefreshRequests);
    return () => window.removeEventListener('refreshRequests', handleRefreshRequests);
  }, [activeTab, token]);

  // New effect to fetch service directory data
  useEffect(() => {
    if (activeTab === 'directory' && token) {
      setDirectoryLoading(true);
      fetch(`${config.apiBaseUrl}/api/directory`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          console.log('Directory data response:', data);
          setDirectoryData(data);
          setDirectoryLoading(false);
        })
        .catch(err => {
          console.error('Error loading directory data', err);
          setDirectoryData([]);
          setDirectoryLoading(false);
        });
    }
  }, [activeTab, token]);

  // Keeping the original effect for completed tasks in case you still want it
  useEffect(() => {
    if (activeTab === 'directory' && token && user) {
      // Fetch tasks completed by the current user
      fetch(`${config.apiBaseUrl}/api/requests/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          if (data && data.requests && Array.isArray(data.requests)) {
            // Filter requests where the current user is listed as completedBy
            const userCompletedTasks = data.requests.filter(
              req => req.completedBy === getUserId()
            );
            setCompletedTasks(userCompletedTasks);
          } else {
            setCompletedTasks([]);
          }
        })
        .catch(err => {
          console.error('Error loading completed tasks', err);
          setCompletedTasks([]);
        });
    }
  }, [activeTab, user, token]);

  useEffect(() => {
    if (activeTab === 'staff' && token) {
      fetch(`${config.apiBaseUrl}/api/volunteers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          console.log('Volunteers response:', data);
          if (Array.isArray(data)) {
            setVolunteers(data);
          } else {
            setVolunteers([]);
          }
        })
        .catch(err => {
          console.error('Error loading volunteers', err);
          setVolunteers([]);
        });
    }
  }, [activeTab, token]);

  useEffect(() => {
    if (!user || !getUserId()) return;
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    // Set up socket.io connection
    const socket = io(config.apiBaseUrl);
    // Join a room for this user
    socket.emit('joinRoom', getUserId());

    // Function to show browser notification
    const showBrowserNotification = (title, body) => {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body: body,
          icon: '/vite.svg', // You can replace with your app icon
          badge: '/vite.svg'
        });
      }
    };

    // Listen for someone offering help to our request
    socket.on('requestHelp', (data) => {
      const notification = {
        title: 'Someone offered to help!',
        body: `A user has offered to help with your request.`,
        time: new Date().toLocaleString(),
        ...data
      };
      setNotifications(prev => [notification, ...prev]);
      setUnreadNotifications(prev => prev + 1);
      showBrowserNotification(notification.title, notification.body);
    });

    // Listen for new help requests matching our preferences (future enhancement)
    socket.on('newHelpRequest', (data) => {
      const notification = {
        title: 'New Help Request',
        body: `A new help request was posted that matches your preferences.`,
        time: new Date().toLocaleString(),
        ...data
      };
      setNotifications(prev => [notification, ...prev]);
      setUnreadNotifications(prev => prev + 1);
      showBrowserNotification(notification.title, notification.body);
    });

    // Listen for direct service requests (when someone requests services from you)
    socket.on('directServiceRequest', (data) => {
      const notification = {
        title: 'Direct Service Request',
        body: `${data.fromUserName} has requested your services for ${data.category}.`,
        time: new Date().toLocaleString(),
        ...data
      };
      setNotifications(prev => [notification, ...prev]);
      setUnreadNotifications(prev => prev + 1);
      showBrowserNotification(notification.title, notification.body);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const getNavLinks = () => {
    const iconMap = {
      'Home': Home,
      'FileText': FileText,
      'Star': Star,
      'MessageCircle': MessageCircle,
      'Users': Users,
      'Bell': Bell,
      'Wrench': Wrench,
      'UserCog': UserCog,
      'LogOut': LogOut
    };
    
    const baseLinks = config.dashboardNavItems
      .filter(item => !item.adminOnly || isAdmin)
      .map(item => ({
        ...item,
        icon: iconMap[item.icon] || Home
      }));
    

    
    // Add logout at the end
    baseLinks.push({ id: 'logout', label: 'Logout', icon: LogOut });
    
    return baseLinks;
  };

  // Function to determine badge color based on urgency
  const getUrgencyColor = (urgency) => {
    return config.urgencyColors[urgency?.toLowerCase()] || 'bg-blue-500';
  };
  
  // Function to get category icon - using dynamic configuration
  const getCategoryIcon = (category) => {
    const iconMap = {
      'Wrench': Wrench,
      'Settings': Settings,
      'CheckCircle': CheckCircle,
      'Users': Users,
      'Star': Star,
      'Hammer': Hammer,
      'MessageCircle': MessageCircle,
      'Bell': Bell,
      'FileText': FileText,
      'Clock': Clock,
      'Phone': Phone,
      'Mail': Mail
    };
    
    const categoryConfig = config.serviceCategories.find(cat => cat.value === category?.toLowerCase());
    if (categoryConfig) {
      const Icon = iconMap[categoryConfig.icon] || Wrench;
      return <Icon className={`text-${categoryConfig.color}-500`} size={20} />;
    }
    
    return <Wrench className="text-gray-500" size={20} />;
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Function to handle tab changes and clear notifications when viewing them
  const handleTabChange = (tabId) => {
    if (tabId === 'notifications') {
      setUnreadNotifications(0);
    }
    setActiveTab(tabId);
  };

  // New function to handle offering help
  const handleOfferHelp = (requestId) => {
    if (!user || !token) {
      alert("You must be logged in to offer help");
      return;
    }
    console.log(`'''''''${requestId}`)

    fetch(`${config.apiBaseUrl}/api/requests/${requestId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        completedBy: user.id,
        status: 'in-progress'
      })
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('Request updated:', data);
        alert('You have successfully offered to help with this request!');
        
        // Update the local requests list to reflect the change
        setAllRequests(prevRequests => 
          prevRequests.map(req => 
            req._id === requestId 
              ? { ...req, completedBy: getUserId(), status: 'in-progress' } 
              : req
          )
        );
      })
      .catch(err => {
        console.error('Error offering help:', err);
        alert('Failed to offer help. Please try again.');
      });
  };

  // Function to mark a request as completed
  const handleMarkCompleted = (requestId) => {
    if (!token || !user) {
      alert("You must be logged in to update requests");
      return;
    }

    const confirmed = window.confirm("Are you sure you want to mark this request as completed?");
    if (!confirmed) return;

    fetch(`${config.apiBaseUrl}/api/requests/${requestId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'completed'
      })
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('Request marked as completed:', data);
        
        // Update the local requests list to reflect the change
        setAllRequests(prevRequests => 
          prevRequests.map(req => 
            req._id === requestId 
              ? { ...req, status: 'completed' } 
              : req
          )
        );
        
        alert('Request has been marked as completed!');
        // If the current user is the poster, show the rating modal
        const updatedRequest = data.request;
        if (updatedRequest && updatedRequest.userId === getUserId() && updatedRequest.completedBy) {
          setRatingModal({ open: true, requestId, requestCategory: updatedRequest.category });
        }
      })
      .catch(err => {
        console.error('Error updating request:', err);
        alert('Failed to mark request as completed. Please try again.');
      });
  };

  // Function to handle opening service request modal
  const handleRequestService = (staffMember) => {
    setSelectedStaffMember(staffMember);
    setIsServiceModalOpen(true);
  };

  // Function to handle service request submission
  const handleServiceRequestSubmit = async (requestData) => {
    if (!user || !token) {
      alert("You must be logged in to request services");
      return;
    }

    try {
      const response = await fetch(`${config.apiBaseUrl}/api/requests`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category: requestData.serviceType,
          description: requestData.description,
          urgency: requestData.urgency,
          preferredTime: `${requestData.preferredDate} ${requestData.preferredTime}`,
          addressNote: requestData.address || requestData.additionalNotes,
          staffMemberId: requestData.staffMemberId,
          staffMemberName: requestData.staffMemberName
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit service request');
      }

      const result = await response.json();
      alert(config.serviceRequestModal.successMessage);
      
      // Refresh the requests list
      window.dispatchEvent(new Event('refreshRequests'));
      
    } catch (error) {
      console.error('Error submitting service request:', error);
      alert(config.serviceRequestModal.errorMessage.replace('{error}', error.message));
      throw error; // Re-throw to let the modal handle the error
    }
  };

  // Function to delete a request
  const handleDeleteRequest = (requestId) => {
    if (!token || !user) {
      alert("You must be logged in to delete requests");
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete this request? This action cannot be undone.");
    if (!confirmed) return;

    fetch(`${config.apiBaseUrl}/api/requests/${requestId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('Request deleted:', data);
        
        // Remove the deleted request from the local state
        setAllRequests(prevRequests => 
          prevRequests.filter(req => req._id !== requestId)
        );
        
        alert('Request has been deleted successfully!');
      })
      .catch(err => {
        console.error('Error deleting request:', err);
        alert('Failed to delete request. Please try again.');
      });
  };

  // Filter requests based on search term
  const filteredRequests = allRequests.filter(request => {
    // Skip user's own requests in the overview tab
    if (activeTab === 'overview' && user && request.userId === getUserId()) {
      return false;
    }
    
    const searchTermLower = searchTerm.toLowerCase();
    return (
      (request.category && request.category.toLowerCase().includes(searchTermLower)) ||
      (request.description && request.description.toLowerCase().includes(searchTermLower)) ||
      (request.addressNote && request.addressNote.toLowerCase().includes(searchTermLower)) ||
      (request.userName && request.userName.toLowerCase().includes(searchTermLower))
    );
  });

  const navLinks = getNavLinks();

  // Function to refresh requests (used after rating)
  const refreshRequests = () => {
    if (token) {
      fetch(`${config.apiBaseUrl}/api/requests/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data && data.requests && Array.isArray(data.requests)) {
            setAllRequests(data.requests);
          }
        });
    }
  };

  return (
    <div className="flex min-h-screen font-sans bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-sm hidden md:flex flex-col py-6 px-4">
        <h2 className="text-2xl font-bold text-orange-500 mb-8">Dashboard</h2>
        <nav className="flex flex-col space-y-4">
          {navLinks.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                if (id === 'logout') handleLogout();
                else handleTabChange(id);
              }}
              className={`flex items-center text-left text-gray-700 hover:text-orange-500 ${
                activeTab === id ? 'text-orange-500 font-semibold' : ''
              }`}
            >
              <Icon className="mr-2" size={20} />
              {label}
              {id === 'notifications' && unreadNotifications > 0 && (
                <span className="ml-2 inline-block h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {activeTab === 'overview' && user && (
          <div>
            <h1 className="text-3xl font-bold text-orange-500 mb-2">{config.overview.welcomeMessage.replace('{name}', user.name)}</h1>
            {/* <p className="text-gray-700 mb-6">You have 2 active requests • 1 maid assigned • 3 new messages</p> */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {config.quickActions.map(({ label, icon: IconName, link, description }) => {
                const iconMap = {
                  'PlusCircle': PlusCircle,
                  'Wrench': Wrench,
                  'MessageCircle': MessageCircle
                };
                const Icon = iconMap[IconName] || PlusCircle;
                
                return (
                  <Link
                    to={link}
                    key={label}
                    className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-all text-center group"
                  >
                    <Icon size={32} className="text-orange-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">{label}</h3>
                    <p className="text-sm text-gray-600">{description}</p>
                  </Link>
                );
              })}
            </div>

            {/* Rating Statistics */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Rating Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-lg shadow text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {allRequests.filter(req => req.userId === getUserId()).length}
                  </div>
                  <div className="text-sm text-gray-600">Total Requests</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {allRequests.filter(req => req.userId === getUserId() && req.status === 'completed').length}
                  </div>
                  <div className="text-sm text-gray-600">Completed Services</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {allRequests.filter(req => req.userId === getUserId() && req.status === 'completed' && req.completedBy && !req.rating?.stars).length}
                  </div>
                  <div className="text-sm text-gray-600">Pending Ratings</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow text-center">
                  <div className="text-3xl font-bold text-yellow-600 mb-2">
                    {allRequests.filter(req => req.userId === getUserId() && req.status === 'completed' && req.completedBy && req.rating?.stars).length}
                  </div>
                  <div className="text-sm text-gray-600">Rated Services</div>
                </div>
              </div>
            </div>

            {/* Helper Rating Statistics */}
            {allRequests.filter(req => req.completedBy === getUserId() && req.status === 'completed').length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Helper Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-6 rounded-lg shadow text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      {allRequests.filter(req => req.completedBy === getUserId() && req.status === 'completed').length}
                    </div>
                    <div className="text-sm text-gray-600">Services Provided</div>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow text-center">
                    <div className="text-3xl font-bold text-indigo-600 mb-2">
                      {allRequests.filter(req => req.completedBy === getUserId() && req.status === 'completed' && req.rating?.stars).length}
                    </div>
                    <div className="text-sm text-gray-600">Services Rated</div>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow text-center">
                    <div className="text-3xl font-bold text-pink-600 mb-2">
                      {(() => {
                        const ratedServices = allRequests.filter(req => req.completedBy === getUserId() && req.status === 'completed' && req.rating?.stars);
                        if (ratedServices.length === 0) return 0;
                        const totalRating = ratedServices.reduce((sum, req) => sum + req.rating.stars, 0);
                        return (totalRating / ratedServices.length).toFixed(1);
                      })()}
                    </div>
                    <div className="text-sm text-gray-600">Average Rating</div>
                  </div>
                </div>
              </div>
            )}

            {/* Community Help Requests (exclude completed and in-progress) */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">{config.overview.communityRequestsTitle}</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{config.overview.tableHeaders.number}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{config.overview.tableHeaders.category}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{config.overview.tableHeaders.description}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{config.overview.tableHeaders.urgency}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{config.overview.tableHeaders.time}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{config.overview.tableHeaders.status}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{config.overview.tableHeaders.action}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRequests
                      .filter(request => request.status !== 'completed' && request.status !== 'in-progress')
                      .map((request, index) => (
                        <tr key={request._id || index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">{request.category}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">{request.description}</div>
                            {request.addressNote && (
                              <div className="text-xs text-gray-500 italic mt-1">Note: {request.addressNote}</div>
                            )}
                            {request.userName && (
                              <div className="text-xs text-gray-500 mt-1">
                                Posted by: <ClickableUserName userId={request.userId} userName={request.userName} />
                                {/* Debug info */}
                                <span className="text-xs text-gray-400 ml-2">
                                  (ID: {request.userId})
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-white ${getUrgencyColor(request.urgency)}`}>
                              {request.urgency || "N/A"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <Clock size={16} className="mr-1" />
                              {request.preferredTime || 'Any time'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${config.statusColors[request.status] ? `${config.statusColors[request.status].bg} ${config.statusColors[request.status].text}` : 'bg-yellow-100 text-yellow-800'}`}>
                              {request.status || "pending"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {request.completedBy ? (
                              <span className="text-gray-500">{config.overview.alreadyAssignedText}</span>
                            ) : (
                              <button 
                                onClick={() => handleOfferHelp(request._id)}
                                className="text-orange-500 hover:text-orange-700"
                              >
                                {config.overview.offerHelpText}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* In Progress Tasks Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">In Progress Tasks</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{config.overview.tableHeaders.number}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{config.overview.tableHeaders.category}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{config.overview.tableHeaders.description}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{config.overview.tableHeaders.urgency}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{config.overview.tableHeaders.time}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{config.overview.tableHeaders.status}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{config.overview.tableHeaders.action}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRequests
                      .filter(request => request.status === 'in-progress')
                      .map((request, index) => (
                        <tr key={request._id || index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">{request.category}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">{request.description}</div>
                            {request.addressNote && (
                              <div className="text-xs text-gray-500 italic mt-1">Note: {request.addressNote}</div>
                            )}
                            {request.userName && (
                              <div className="text-xs text-gray-500 mt-1">
                                Posted by: <ClickableUserName userId={request.userId} userName={request.userName} />
                                <span className="text-xs text-gray-400 ml-2">
                                  (ID: {request.userId})
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-white ${getUrgencyColor(request.urgency)}`}>
                              {request.urgency || "N/A"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <Clock size={16} className="mr-1" />
                              {request.preferredTime || 'Any time'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${config.statusColors[request.status] ? `${config.statusColors[request.status].bg} ${config.statusColors[request.status].text}` : 'bg-yellow-100 text-yellow-800'}`}>
                              {request.status || "pending"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {/* Actions for in-progress tasks can go here if needed */}
                            <span className="text-blue-500">In Progress</span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Completed Tasks Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">All Completed Tasks</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{config.overview.tableHeaders.number}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{config.overview.tableHeaders.category}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{config.overview.tableHeaders.description}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{config.overview.tableHeaders.urgency}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{config.overview.tableHeaders.time}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{config.overview.tableHeaders.status}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{config.overview.tableHeaders.action}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRequests
                      .filter(request => request.status === 'completed')
                      .map((request, index) => (
                        <tr key={request._id || index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">{request.category}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">{request.description}</div>
                            {request.addressNote && (
                              <div className="text-xs text-gray-500 italic mt-1">Note: {request.addressNote}</div>
                            )}
                            {request.userName && (
                              <div className="text-xs text-gray-500 mt-1">
                                Posted by: <ClickableUserName userId={request.userId} userName={request.userName} />
                                {/* Debug info */}
                                <span className="text-xs text-gray-400 ml-2">
                                  (ID: {request.userId})
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-white ${getUrgencyColor(request.urgency)}`}>
                              {request.urgency || "N/A"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <Clock size={16} className="mr-1" />
                              {request.preferredTime || 'Any time'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${config.statusColors[request.status] ? `${config.statusColors[request.status].bg} ${config.statusColors[request.status].text}` : 'bg-yellow-100 text-yellow-800'}`}>
                              {request.status || "pending"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {/* No actions for completed tasks */}
                            <span className="text-gray-400">Completed</span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'requests' && user && (
          <>
            {/* Unrated Completed Tasks Section */}
            {allRequests.filter(service => service.status === 'completed' && service.userId === user._id && service.completedBy && !service.rating?.stars).length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-orange-700 mb-4">Rate Your Completed Services</h2>
                <div className="space-y-4">
                  {allRequests
                    .filter(service => service.status === 'completed' && service.userId === user._id && service.completedBy && !service.rating?.stars)
                    .map((service, index) => (
                      <div key={service._id || index} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-all border-l-4 border-orange-500">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getCategoryIcon(service.category)}
                              <h3 className="text-xl font-semibold text-gray-800">{service.category}</h3>
                              <span className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full text-white ${getUrgencyColor(service.urgency)}`}>
                                {service.urgency || "Normal"}
                              </span>
                            </div>
                            <p className="text-gray-700 mb-2">{service.description}</p>
                            <div className="flex items-center text-sm text-gray-500 mb-2">
                              <Clock size={16} className="mr-1" />
                              <span>Completed on {new Date(service.updatedAt || service.createdAt).toLocaleDateString()}</span>
                            </div>
                            {service.completedByName && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Helper:</span> {service.completedByName}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <button
                              onClick={() => setRatingModal({ 
                                open: true, 
                                requestId: service._id, 
                                requestCategory: service.category 
                              })}
                              className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                            >
                              <Star size={16} className="mr-2" />
                              Rate This Service
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
            
            {/* Rated Completed Tasks Section */}
            {allRequests.filter(service => service.status === 'completed' && service.userId === user._id && service.completedBy && service.rating?.stars).length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-green-700 mb-4">Your Rated Services</h2>
                <div className="space-y-4">
                  {allRequests
                    .filter(service => service.status === 'completed' && service.userId === user._id && service.completedBy && service.rating?.stars)
                    .map((service, index) => (
                      <div key={service._id || index} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-all border-l-4 border-green-500">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getCategoryIcon(service.category)}
                              <h3 className="text-xl font-semibold text-gray-800">{service.category}</h3>
                              <span className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full text-white ${getUrgencyColor(service.urgency)}`}>
                                {service.urgency || "Normal"}
                              </span>
                            </div>
                            <p className="text-gray-700 mb-2">{service.description}</p>
                            <div className="flex items-center text-sm text-gray-500 mb-2">
                              <Clock size={16} className="mr-1" />
                              <span>Completed on {new Date(service.updatedAt || service.createdAt).toLocaleDateString()}</span>
                            </div>
                            {service.completedByName && (
                              <p className="text-sm text-gray-600 mb-2">
                                <span className="font-medium">Helper:</span> {service.completedByName}
                              </p>
                            )}
                            {service.rating && (
                              <div className="flex items-center">
                                <div className="flex mr-2">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      size={16}
                                      className={`${
                                        star <= service.rating.stars
                                          ? 'text-yellow-500 fill-current'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-gray-600">
                                  {service.rating.stars}/5 stars
                                  {service.rating.review && (
                                    <span className="ml-2 text-gray-500">- "{service.rating.review}"</span>
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
            
            {/* Community Help Requests (exclude completed and in-progress) */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">{config.requests.title}</h2>
              
              {/* Loading state */}
              {!allRequests ? (
                <div className="flex justify-center items-center h-48">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
                </div>
              ) : allRequests.filter(req => req.userId === user._id).length === 0 ? (
                <div className="bg-white p-6 rounded-lg shadow text-center">
                  <AlertTriangle size={32} className="text-orange-500 mx-auto mb-2" />
                  <p className="text-gray-700 mb-4">{config.requests.noRequestsMessage}</p>
                  <Link 
                    to="/post-request" 
                    className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                  >
                    <PlusCircle size={18} className="mr-2" />
                    {config.requests.createNewRequestText}
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {allRequests
                    .filter(req => req.userId === user._id)
                    .map((request) => (
                      <div key={request._id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-all">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {getCategoryIcon(request.category)}
                              <h3 className="text-xl font-semibold text-orange-500">{request.category}</h3>
                              <span className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full text-white ${getUrgencyColor(request.urgency)}`}>
                                {request.urgency || "Normal"}
                              </span>
                            </div>
                            <p className="text-gray-800 mb-3">{request.description}</p>
                            <p className="text-sm text-gray-500 mb-2">
                              {config.requests.postedText} {new Date(request.createdAt).toLocaleDateString()} • 
                              {request.preferredTime && ` ${config.requests.preferredTimeText} ${request.preferredTime} • `}
                              {request.status === 'in-progress' && request.completedBy ? 
                                <span className="font-medium text-blue-600"> {config.requests.acceptedByText} <ClickableUserName userId={request.completedBy} userName={request.completedByName || 'Volunteer'} /></span> :
                                request.status === 'completed' ?
                                <span className="font-medium text-green-600"> {config.requests.completedText}</span> :
                                <span className="font-medium text-yellow-600"> {config.requests.pendingText}</span>
                              }
                            </p>
                            
                            {request.addressNote && (
                              <p className="text-sm italic text-gray-500 mb-3">{config.requests.noteText} {request.addressNote}</p>
                            )}
                          </div>
                          
                          <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                            config.statusColors[request.status] ? 
                              `${config.statusColors[request.status].bg} ${config.statusColors[request.status].text}` : 
                              'bg-yellow-100 text-yellow-800'
                          }`}>
                            {config.requests.statusLabels[request.status] || 'Pending'}
                          </span>
                        </div>
                        
                        <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
                          {/* Show chat button only if there's someone who accepted the task */}
                          {request.status === 'in-progress' && request.completedBy && (
                            <Link 
                              to={`/chat/${request.completedBy}`} 
                              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center"
                            >
                              <MessageCircle size={16} className="mr-2" />
                              {config.requests.chatWithHelperText}
                            </Link>
                          )}
                          
                          {/* Show mark completed button only if in progress */}
                          {request.status === 'in-progress' && (
                            <button 
                              onClick={() => handleMarkCompleted(request._id)}
                              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center"
                            >
                              <CheckCircle size={16} className="mr-2" />
                              {config.requests.markCompletedText}
                            </button>
                          )}
                          
                          {/* Delete button always shown */}
                          <button 
                            onClick={() => handleDeleteRequest(request._id)}
                            className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors flex items-center"
                          >
                            <AlertTriangle size={16} className="mr-2" />
                            {config.requests.deleteRequestText}
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'staff' && user && (
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Suggested Staff for You</h2>
            
            {/* Role Filter */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">Filter by Role:</span>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="all">All Roles</option>
                    <option value="resident">Resident</option>
                    <option value="volunteer">Volunteer</option>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="text-sm text-gray-600">
                  {(() => {
                    const filteredCount = volunteers.filter(vol => 
                      selectedRole === 'all' || vol.role?.toLowerCase() === selectedRole.toLowerCase()
                    ).length;
                    return `${filteredCount} ${filteredCount === 1 ? 'member' : 'members'} found`;
                  })()}
                </div>
              </div>
            </div>

            {volunteers.length > 0 ? (
              <div className="space-y-4">
                {volunteers
                  .filter(vol => selectedRole === 'all' || vol.role?.toLowerCase() === selectedRole.toLowerCase())
                  .map(vol => (
                    <div key={vol._id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-800 mb-1">
                            <ClickableUserName userId={vol._id} userName={vol.name} />
                          </h3>
                          {/* Role Tag */}
                          <div className="mb-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              vol.role?.toLowerCase() === 'resident' ? 'bg-blue-100 text-blue-800' :
                              vol.role?.toLowerCase() === 'volunteer' ? 'bg-green-100 text-green-800' :
                              vol.role?.toLowerCase() === 'staff' ? 'bg-purple-100 text-purple-800' :
                              vol.role?.toLowerCase() === 'admin' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {vol.role || 'Volunteer'}
                            </span>
                          </div>
                          
                          {/* Rating Information */}
                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            {vol.hasRatings ? (
                              <span className="flex items-center">
                                <span className="flex items-center mr-2">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${i < Math.round(vol.rating) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                                    />
                                  ))}
                                </span>
                                <span>
                                  {vol.rating.toFixed(1)} by {vol.totalRatings} {config.staffConfig.ratingText}
                                </span>
                              </span>
                            ) : (
                              <span>{config.staffConfig.noRatingText}</span>
                            )}
                          </div>
                          
                          {/* Skills */}
                          {vol.skills && vol.skills.length > 0 && (
                            <div className="mb-3">
                              <p className="text-sm text-gray-600 mb-1">Skills:</p>
                              <div className="flex flex-wrap gap-1">
                                {vol.skills.slice(0, 3).map((skill, index) => (
                                  <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-orange-100 text-orange-800">
                                    {skill}
                                  </span>
                                ))}
                                {vol.skills.length > 3 && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-600">
                                    +{vol.skills.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Bio */}
                          {vol.bio && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {vol.bio}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                        <button 
                          onClick={() => handleRequestService(vol)}
                          className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors text-sm"
                        >
                          Request Service
                        </button>
                        <Link 
                          to={`/chat/${vol._id}`} 
                          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
                        >
                          Message
                        </Link>
                        {vol.hasRatings && (
                          <Link 
                            to={`/ratings/${vol._id}`} 
                            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm"
                          >
                            View Ratings
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <AlertTriangle size={32} className="text-orange-500 mx-auto mb-2" />
                <p className="text-gray-700">
                  {selectedRole === 'all' 
                    ? 'No staff members available at the moment.' 
                    : `No ${selectedRole} members available at the moment.`
                  }
                </p>
              </div>
            )}
          </section>
        )}

        {activeTab === 'chats' && user && (
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Helpers You've Chatted With</h2>
            <ul className="space-y-2">
              {(() => {
                // 1. Get all requests for the current user (as requester)
                const myRequests = allRequests.filter(req => req.userId === user._id);
                // 2. Get unique user IDs who accepted the current user's requests
                const acceptedUserIds = [
                  ...new Set(
                    myRequests
                      .filter(req => req.completedBy && (req.status === 'in-progress' || req.status === 'completed'))
                      .map(req => req.completedBy)
                  )
                ];
                // 3. Get all requests where the current user is the helper (as completedBy)
                const helpingRequests = allRequests.filter(req => req.completedBy === user._id);
                // 4. Get unique user IDs who you are helping
                const helpingUserIds = [
                  ...new Set(
                    helpingRequests
                      .filter(req => req.userId && (req.status === 'in-progress' || req.status === 'completed'))
                      .map(req => req.userId)
                  )
                ];
                // 5. Merge both lists and remove duplicates
                const allChatUserIds = [...new Set([...acceptedUserIds, ...helpingUserIds])];
                // 6. Render chat list
                return allChatUserIds.length === 0 ? (
                  <li className="text-gray-500">No helpers or users to chat with yet.</li>
                ) : (
                  allChatUserIds.map(chatUserId => {
                    // Find a request with this user to get their name
                    let userName = chatUserId;
                    // If this is a helper, get completedByName; if this is a requester, get userName
                    const reqWithHelper = allRequests.find(r => r.completedBy === chatUserId && r.completedByName);
                    const reqWithRequester = allRequests.find(r => r.userId === chatUserId && r.userName);
                    if (reqWithHelper) userName = reqWithHelper.completedByName;
                    else if (reqWithRequester) userName = reqWithRequester.userName;
                    return (
                      <li key={chatUserId} className="bg-white p-3 rounded shadow hover:shadow-md flex items-center justify-between">
                        <span className="text-gray-700 font-medium">
                          <ClickableUserName userId={chatUserId} userName={userName} />
                        </span>
                        <Link to={`/chat/${chatUserId}`} className="text-orange-500 hover:underline">Message</Link>
                      </li>
                    );
                  })
                );
              })()}
            </ul>
          </section>
        )}

        {activeTab === 'notifications' && user && (
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Notifications</h2>
            {(!notifications || notifications.length === 0) ? (
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <Bell size={32} className="text-orange-500 mx-auto mb-2" />
                <p className="text-gray-700">You have no notifications at this time.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notif, idx) => (
                  <div key={idx} className="bg-white p-4 rounded shadow flex items-center gap-4">
                    <Bell className="text-orange-500" size={20} />
                    <div>
                      <p className="text-gray-800 font-medium">{notif.title || 'Notification'}</p>
                      <p className="text-gray-600 text-sm">{notif.body || notif.message}</p>
                      {notif.time && <p className="text-xs text-gray-400 mt-1">{notif.time}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        
        

        {activeTab === 'directory' && user && (
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Service Directory</h2>
            {directoryLoading ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
                <p className="ml-3 text-gray-600">{config.serviceDirectory.loadingMessage}</p>
              </div>
            ) : completedTasks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedTasks
                  .filter(service => service.completedBy === user._id)
                  .map((service, index) => (
                    <div key={service._id || index} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                      <div className="p-5">
                        <div className="flex items-center mb-3">
                          {getCategoryIcon(service.category)}
                          <h3 className="text-xl font-bold text-gray-800 ml-2">{service.category}</h3>
                        </div>
                        <div className="mb-3">
                          <p className="text-gray-600">{service.description}</p>
                        </div>
                        {/* Add posted by info */}
                        {service.userId && service.userName && (
                          <div className="mb-2 text-sm text-gray-500">
                            <span className="font-medium">Posted by: </span>
                            <ClickableUserName userId={service.userId} userName={service.userName} />
                          </div>
                        )}
                        <div className="space-y-2 text-sm text-gray-500">
                          {service.preferredTime && (
                            <div><span className="font-medium">Preferred Time:</span> {service.preferredTime}</div>
                          )}
                          {service.addressNote && (
                            <div><span className="font-medium">Note:</span> {service.addressNote}</div>
                          )}
                          <div><span className="font-medium">Status:</span> {service.status}</div>
                        </div>
                        {/* Rating UI for task poster */}
                        {service.status === 'completed' && service.userId === user._id && service.completedBy && (
                          <div className="mt-2">
                            {service.rating && service.rating.stars ? (
                              <RatingDisplay 
                                rating={service.rating} 
                                compact={true}
                                showReview={false}
                                showMetadata={false}
                              />
                            ) : (
                              <button
                                onClick={() => setRatingModal({ 
                                  open: true, 
                                  requestId: service._id, 
                                  requestCategory: service.category 
                                })}
                                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                              >
                                Rate this helper
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <AlertTriangle size={32} className="text-orange-500 mx-auto mb-2" />
                <p className="text-gray-700">No service directory information available.</p>
              </div>
            )}
          </section>
        )}

        {activeTab === 'profile' && user && (
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">My Profile</h2>
            <div className="bg-white p-6 rounded-lg shadow">
              {/* Render the UserProfile component for the current user */}
              <UserProfile />
            </div>
          </section>
        )}

        {activeTab === 'assignroles' && user && isAdmin && (
          <UserList token={token} />
        )}

        {activeTab === 'admin' && user && isAdmin && (
          <AdminDashboard token={token} />
        )}


      </main>

      {/* Service Request Modal */}
      <ServiceRequestModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        staffMember={selectedStaffMember}
        onSubmit={handleServiceRequestSubmit}
      />
      {/* Rating Modal */}
      <RatingModal
        open={ratingModal.open}
        onClose={() => setRatingModal({ open: false, requestId: null, requestCategory: null })}
        requestId={ratingModal.requestId}
        requestCategory={ratingModal.requestCategory}
        onRated={refreshRequests}
      />
    </div>
  );
}
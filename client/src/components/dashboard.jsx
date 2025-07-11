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
              const otherRequests = data.requests.filter((req) => req.userId !== user._id);
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
              req => req.completedBy === user._id
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
    if (activeTab === 'chats' && token) {
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
    if (!user || !user._id) return;
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    // Set up socket.io connection
    const socket = io(config.apiBaseUrl);
    // Join a room for this user
    socket.emit('joinRoom', user._id);

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
              ? { ...req, completedBy: user._id, status: 'in-progress' } 
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
    if (activeTab === 'overview' && user && request.userId === user._id) {
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

            {/* Test Profile Navigation */}
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-700 mb-2">Debug: Test profile navigation</p>
              <button
                onClick={() => {
                  console.log('Testing profile navigation for user:', user._id);
                  window.location.href = `/profile/${user._id}`;
                }}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                Test My Profile
              </button>
            </div>

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

            {/* Community Help Requests Section */}
            <div className="mt-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 space-y-2 md:space-y-0">
                <h2 className="text-2xl font-bold text-gray-800">{config.overview.communityRequestsTitle}</h2>
                
                {/* Search Bar */}
                <div className="relative w-full md:w-auto">
                  <input
                    type="text"
                    placeholder={config.overview.searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                </div>
              </div>
              
              {filteredRequests.length > 0 ? (
                <div className="bg-white rounded-lg shadow overflow-x-auto">
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
                      {filteredRequests.map((request, index) => (
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
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              config.statusColors[request.status] ? 
                                `${config.statusColors[request.status].bg} ${config.statusColors[request.status].text}` : 
                                'bg-yellow-100 text-yellow-800'
                            }`}>
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
              ) : (
                <div className="bg-white p-6 rounded-lg shadow text-center">
                  <AlertTriangle size={32} className="text-orange-500 mx-auto mb-2" />
                  <p className="text-gray-700">
                    {searchTerm ? config.overview.noSearchResultsMessage : config.overview.noRequestsMessage}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'requests' && user && (
          <section>
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
          </section>
        )}

        {activeTab === 'staff' && user && (
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Suggested Staff for You</h2>
            {volunteers.length > 0 ? (
              <div className="space-y-4">
                {volunteers.map(vol => (
                  <div key={vol._id} className="bg-white p-4 rounded shadow hover:shadow-md transition-all">
                    <p className="font-bold text-gray-700">
                      <ClickableUserName userId={vol._id} userName={vol.name} /> ({vol.role || 'Volunteer'})
                    </p>
                    <p className="text-gray-500 text-sm">
                      {vol.availableHours ? `Available ${vol.availableHours} • ` : `Available ${config.staffConfig.defaultAvailableHours} • `}
                      {vol.rating ? `Rated ${vol.rating}★ by ${vol.totalRatings || config.staffConfig.defaultTotalRatings} homes` : `Rated ${config.staffConfig.defaultRating}★ by ${config.staffConfig.defaultTotalRatings} homes`}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button 
                        onClick={() => handleRequestService(vol)}
                        className="text-orange-500 hover:underline hover:text-orange-600 transition-colors"
                      >
                        Request Service
                      </button>
                      <Link to={`/chat/${vol._id}`} className="text-blue-500 hover:underline hover:text-blue-600 transition-colors">Message</Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <AlertTriangle size={32} className="text-orange-500 mx-auto mb-2" />
                <p className="text-gray-700">No staff members available at the moment.</p>
              </div>
            )}
          </section>
        )}

        {activeTab === 'chats' && user && (
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Volunteers to Chat With</h2>
            <ul className="space-y-2">
              {volunteers.map(vol => (
                <li key={vol._id} className="bg-white p-3 rounded shadow hover:shadow-md flex items-center justify-between">
                  <span className="text-gray-700 font-medium">
                    <ClickableUserName userId={vol._id} userName={vol.name} />
                  </span>
                  <Link to={`/chat/${vol._id}`} className="text-orange-500 hover:underline">Message</Link>
                </li>
              ))}
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
                {completedTasks.map((service, index) => (
                  <div key={service._id || index} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <div className="p-5">
                      <div className="flex items-center mb-3">
                        {getCategoryIcon(service.category)}
                        <h3 className="text-xl font-bold text-gray-800 ml-2">{service.name}</h3>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-gray-600">{service.description}</p>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-500">
                        {service.category && (
                          <div className="flex items-center">
                            <span className="font-medium mr-2">{config.serviceDirectory.categoryText}</span>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800`}>
                              {service.category}
                            </span>
                          </div>
                        )}
                        
                        {service.availableHours && (
                          <div className="flex items-center">
                            <Clock size={16} className="mr-2" />
                            <span>{config.serviceDirectory.availableHoursText} {service.availableHours}</span>
                          </div>
                        )}
                        
                        {service.phone && (
                          <div className="flex items-center">
                            <Phone size={16} className="mr-2" />
                            <span>{config.serviceDirectory.phoneText} {service.phone}</span>
                          </div>
                        )}
                        
                        {service.email && (
                          <div className="flex items-center">
                            <Mail size={16} className="mr-2" />
                            <span>{config.serviceDirectory.emailText} {service.email}</span>
                          </div>
                        )}
                        
                        {service.rating && (
                          <div className="flex items-center">
                            <Star size={16} className="text-yellow-500 mr-2" />
                            <span>{config.serviceDirectory.ratingLabel} {service.rating} ({service.totalRatings || 0} {config.serviceDirectory.ratingText})</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between">
                        <button 
                          className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                        >
                          {config.serviceDirectory.requestServiceText}
                        </button>
                        
                        {service.phone && (
                          <a 
                            href={`tel:${service.phone}`}
                            className="px-4 py-2 border border-orange-500 text-orange-500 rounded-md hover:bg-orange-50 transition-colors flex items-center"
                          >
                            <Phone size={16} className="mr-1" />
                            {config.serviceDirectory.callText}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <AlertTriangle size={32} className="text-orange-500 mx-auto mb-2" />
                <p className="text-gray-700">{config.serviceDirectory.emptyStateMessage}</p>
              </div>
            )}
            
            {/* Previously this was showing completed tasks, now showing as a separate section */}
            {directoryData.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Tasks You've Helped With</h3>
                <div className="space-y-4">
                  {directoryData.map((task) => (
                    <div key={task._id} className="bg-white p-4 rounded shadow">
                      <p className="text-lg font-semibold text-orange-500">{task.category}</p>
                      <p className="text-gray-700">{task.description}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full ${
                          config.statusColors[task.status] ? 
                            `${config.statusColors[task.status].bg} ${config.statusColors[task.status].text}` : 
                            'bg-yellow-100 text-yellow-800'
                        }`}>
                          {task.status || "pending"}
                        </span>
                        <p className="text-sm text-gray-500">
                          Preferred time: {task.preferredTime || 'Any time'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === 'assignroles' && user && isAdmin && (
          <UserList token={token} />
        )}
      </main>

      {/* Service Request Modal */}
      <ServiceRequestModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        staffMember={selectedStaffMember}
        onSubmit={handleServiceRequestSubmit}
      />
    </div>
  );
}
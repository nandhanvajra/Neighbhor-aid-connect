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
      parsedUser.isAdmin=true
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
      fetch('http://localhost:3000/api/requests/all', {
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

  // New effect to fetch service directory data
  useEffect(() => {
    if (activeTab === 'directory' && token) {
      setDirectoryLoading(true);
      fetch('http://localhost:3000/api/directory', {
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
      fetch('http://localhost:3000/api/requests/all', {
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
      fetch(`http://localhost:3000/api/volunteers`, {
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

  const getNavLinks = () => {
    const baseLinks = [
      { id: 'overview', label: 'Overview', icon: Home },
      { id: 'requests', label: 'Requests', icon: FileText },
      { id: 'staff', label: 'Staff', icon: Star },
      { id: 'chats', label: 'Chats', icon: MessageCircle },
      { id: 'house', label: 'House', icon: Users },
      { id: 'notifications', label: 'Notifications', icon: Bell },
      
      { id: 'directory', label: 'Service Directory', icon: Wrench },
    ];
    
    // Add admin-only link if user is admin
    if (isAdmin) {
      baseLinks.push({ id: 'assignroles', label: 'Manage Roles', icon: UserCog });
    }
    
    // Add logout at the end
    baseLinks.push({ id: 'logout', label: 'Logout', icon: LogOut });
    
    return baseLinks;
  };

  // Function to determine badge color based on urgency
  const getUrgencyColor = (urgency) => {
    switch(urgency?.toLowerCase()) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-orange-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-blue-500';
    }
  };
  
  // Function to get category icon - using only icons available in lucide-react
  const getCategoryIcon = (category) => {
    switch(category?.toLowerCase()) {
      case 'plumbing':
        return <Wrench className="text-blue-500" size={20} />;
      case 'electrical':
        return <Settings className="text-yellow-500" size={20} />;
      case 'cleaning':
        return <CheckCircle className="text-green-500" size={20} />;
      default:
        return <Wrench className="text-gray-500" size={20} />;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  // New function to handle offering help
  const handleOfferHelp = (requestId) => {
    if (!user || !token) {
      alert("You must be logged in to offer help");
      return;
    }
    console.log(`'''''''${requestId}`)

    fetch(`http://localhost:3000/api/requests/${requestId}`, {
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

    fetch(`http://localhost:3000/api/requests/${requestId}`, {
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

  // Function to delete a request
  const handleDeleteRequest = (requestId) => {
    if (!token || !user) {
      alert("You must be logged in to delete requests");
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete this request? This action cannot be undone.");
    if (!confirmed) return;

    fetch(`http://localhost:3000/api/requests/${requestId}`, {
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
                else setActiveTab(id);
              }}
              className={`flex items-center text-left text-gray-700 hover:text-orange-500 ${
                activeTab === id ? 'text-orange-500 font-semibold' : ''
              }`}
            >
              <Icon className="mr-2" size={20} />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {activeTab === 'overview' && user && (
          <div>
            <h1 className="text-3xl font-bold text-orange-500 mb-2">Welcome, {user.name} 👋</h1>
            <p className="text-gray-700 mb-6">You have 2 active requests • 1 maid assigned • 3 new messages</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[{ label: 'Post Help Request', icon: PlusCircle, link: '/post-request' }, { label: 'My Requests', icon: CheckCircle, link: '/my-requests' }, { label: 'Service Directory', icon: Wrench, link: '/directory' }].map(({ label, icon: Icon, link }) => (
                <Link
                  to={link}
                  key={label}
                  className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-all text-center"
                >
                  <Icon size={32} className="text-orange-500 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold text-gray-800">{label}</h3>
                </Link>
              ))}
            </div>

            {/* Community Help Requests Section */}
            <div className="mt-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 space-y-2 md:space-y-0">
                <h2 className="text-2xl font-bold text-gray-800">Community Help Requests</h2>
                
                {/* Search Bar */}
                <div className="relative w-full md:w-auto">
                  <input
                    type="text"
                    placeholder="Search tasks or users..."
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Urgency</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
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
                              <div className="text-xs text-gray-500 mt-1">Posted by: {request.userName}</div>
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
                              request.status === 'completed' ? 'bg-green-100 text-green-800' : 
                              request.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {request.status || "pending"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {request.completedBy ? (
                              <span className="text-gray-500">Already assigned</span>
                            ) : (
                              <button 
                                onClick={() => handleOfferHelp(request._id)}
                                className="text-orange-500 hover:text-orange-700"
                              >
                                Offer Help
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
                    {searchTerm ? 'No results found for your search' : 'No community help requests at the moment.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'requests' && user && (
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Help Requests</h2>
            
            {/* Loading state */}
            {!allRequests ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
              </div>
            ) : allRequests.filter(req => req.userId === user._id).length === 0 ? (
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <AlertTriangle size={32} className="text-orange-500 mx-auto mb-2" />
                <p className="text-gray-700 mb-4">You haven't created any help requests yet.</p>
                <Link 
                  to="/post-request" 
                  className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                >
                  <PlusCircle size={18} className="mr-2" />
                  Create New Request
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
                            Posted {new Date(request.createdAt).toLocaleDateString()} • 
                            {request.preferredTime && ` Preferred time: ${request.preferredTime} • `}
                            {request.status === 'in-progress' && request.completedBy ? 
                              <span className="font-medium text-blue-600"> Accepted by {request.completedByName || 'Volunteer'}</span> :
                              request.status === 'completed' ?
                              <span className="font-medium text-green-600"> Completed</span> :
                              <span className="font-medium text-yellow-600"> Pending</span>
                            }
                          </p>
                          
                          {request.addressNote && (
                            <p className="text-sm italic text-gray-500 mb-3">Note: {request.addressNote}</p>
                          )}
                        </div>
                        
                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                          request.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          request.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {request.status === 'in-progress' ? 'In Progress' : 
                          request.status === 'completed' ? 'Completed' : 'Pending'}
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
                            Chat with Helper
                          </Link>
                        )}
                        
                        {/* Show mark completed button only if in progress */}
                        {request.status === 'in-progress' && (
                          <button 
                            onClick={() => handleMarkCompleted(request._id)}
                            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center"
                          >
                            <CheckCircle size={16} className="mr-2" />
                            Mark Completed
                          </button>
                        )}
                        
                        {/* Delete button always shown */}
                        <button 
                          onClick={() => handleDeleteRequest(request._id)}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors flex items-center"
                        >
                          <AlertTriangle size={16} className="mr-2" />
                          Delete Request
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
            <div className="bg-white p-4 rounded shadow">
              <p className="font-bold text-gray-700">Neha (Cook)</p>
              <p className="text-gray-500 text-sm">Available 3–6PM • Rated 4.8★ by 10 homes</p>
              <div className="mt-2">
                <button className="text-orange-500 hover:underline">Request Service</button>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'chats' && user && (
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Volunteers to Chat With</h2>
            <ul className="space-y-2">
              {volunteers.map(vol => (
                <li key={vol._id} className="bg-white p-3 rounded shadow hover:shadow-md flex items-center justify-between">
                  <span className="text-gray-700 font-medium">{vol.name}</span>
                  <Link to={`/chat/${vol._id}`} className="text-orange-500 hover:underline">Message</Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {activeTab === 'house' && user && (
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">House Summary</h2>
            <div className="bg-white p-4 rounded shadow">
              <p className="text-gray-700">House Number: {user.houseNumber || 'Not Assigned'}</p>
              <p className="text-gray-700">Assigned Staff: Neha (Cook), Kavita (Maid)</p>
              <p className="text-gray-700">Last service used: Plumber (3 days ago)</p>
            </div>
          </section>
        )}

        {activeTab === 'notifications' && user && (
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Notifications</h2>
            <div className="bg-white p-4 rounded shadow space-y-2">
              <p className="text-gray-700">✅ Ramesh (Electrician) accepted your request</p>
              <p className="text-gray-700">📨 You have 1 unread message in #maids</p>
              <p className="text-gray-700">✅ Maid Kavita marked your task as completed</p>
            </div>
          </section>
        )}

        {activeTab === 'directory' && user && (
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Service Directory</h2>
            
            {directoryLoading ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
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
                            <span className="font-medium mr-2">Category:</span>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800`}>
                              {service.category}
                            </span>
                          </div>
                        )}
                        
                        {service.availableHours && (
                          <div className="flex items-center">
                            <Clock size={16} className="mr-2" />
                            <span>{service.availableHours}</span>
                          </div>
                        )}
                        
                        {service.phone && (
                          <div className="flex items-center">
                            <Phone size={16} className="mr-2" />
                            <span>{service.phone}</span>
                          </div>
                        )}
                        
                        {service.email && (
                          <div className="flex items-center">
                            <Mail size={16} className="mr-2" />
                            <span>{service.email}</span>
                          </div>
                        )}
                        
                        {service.rating && (
                          <div className="flex items-center">
                            <Star size={16} className="text-yellow-500 mr-2" />
                            <span>{service.rating} ({service.totalRatings || 0} ratings)</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between">
                        <button 
                          className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                        >
                          Request Service
                        </button>
                        
                        {service.phone && (
                          <a 
                            href={`tel:${service.phone}`}
                            className="px-4 py-2 border border-orange-500 text-orange-500 rounded-md hover:bg-orange-50 transition-colors flex items-center"
                          >
                            <Phone size={16} className="mr-1" />
                            Call
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
                <p className="text-gray-700">No service directory information available.</p>
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
                          task.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 
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
    </div>
  );
}
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
  Star
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function ResidentDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(null);
  const [volunteers, setVolunteers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      if (!token || !userData) {
        navigate('/login');
        return;
      }

      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } catch (error) {
      console.error('Invalid user JSON in localStorage:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (activeTab === 'chats') {
      fetch(`http://localhost:3000/api/volunteers`)
        .then(res => res.json())
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
  }, [activeTab]);

  const navLinks = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'requests', label: 'Requests', icon: FileText },
    { id: 'staff', label: 'Staff', icon: Star },
    { id: 'chats', label: 'Chats', icon: MessageCircle },
    { id: 'house', label: 'House', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'logout', label: 'Logout', icon: LogOut }
  ];

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          </div>
        )}

        {activeTab === 'requests' && user && (
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Help Requests</h2>
            <div className="bg-white p-4 rounded shadow">
              <p className="text-lg font-semibold text-orange-500">Need help fixing a leaky tap</p>
              <p className="text-sm text-gray-500 mb-2">Plumbing • Posted 2 days ago • Accepted by Ramesh (AC Tech)</p>
              <div className="space-x-2">
                <Link to="/chat/house20" className="text-orange-500 hover:underline">View Chat</Link>
                <button className="text-sm text-white bg-orange-500 hover:bg-orange-600 px-3 py-1 rounded">Mark Completed</button>
              </div>
            </div>
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
      </main>
    </div>
  );
}

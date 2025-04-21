import React, { useState } from 'react';
import { Menu, ChevronRight, Users, Heart, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const [activeButton, setActiveButton] = useState(null);
  const [hoveredFeature, setHoveredFeature] = useState(null);

  return (
    <div className="flex flex-col min-h-screen font-sans bg-gray-100">
      {/* Header/Navigation */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-orange-500">Neighbor Aid Connect</h1>

            <div className="hidden md:flex items-center space-x-4">
              <Link
                to="/"
                className={`px-3 py-2 transition-colors duration-200 ${activeButton === 'home' ? 'text-orange-500' : 'text-gray-700 hover:text-orange-500'}`}
                onMouseEnter={() => setActiveButton('home')}
                onMouseLeave={() => setActiveButton(null)}
              >
                Home
              </Link>
              <button className="px-3 py-2 text-gray-700 hover:text-orange-500 transition-colors duration-200">About</button>
              <button className="px-3 py-2 text-gray-700 hover:text-orange-500 transition-colors duration-200">Services</button>
              <button className="px-3 py-2 text-gray-700 hover:text-orange-500 transition-colors duration-200">Community</button>
              <button className="px-3 py-2 text-gray-700 hover:text-orange-500 transition-colors duration-200">Contact</button>

              <Link
                to="/login"
                className={`px-4 py-2 border rounded transition-all duration-200 ${
                  activeButton === 'login'
                    ? 'border-orange-600 bg-orange-50 text-orange-600 shadow-sm'
                    : 'border-orange-500 text-orange-500 hover:bg-orange-50'
                }`}
                onMouseEnter={() => setActiveButton('login')}
                onMouseLeave={() => setActiveButton(null)}
              >
                Login
              </Link>
              <Link
                to="/signup"
                className={`px-4 py-2 rounded transition-all duration-200 text-white ${
                  activeButton === 'signup'
                    ? 'bg-orange-600 shadow-md transform scale-105'
                    : 'bg-orange-500 hover:bg-orange-600'
                }`}
                onMouseEnter={() => setActiveButton('signup')}
                onMouseLeave={() => setActiveButton(null)}
              >
                Sign Up
              </Link>
            </div>

            <button className="md:hidden p-2 rounded text-gray-700 hover:bg-gray-100 transition-colors duration-200">
              <Menu />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-400 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">Connecting Neighbors</h2>
          <p className="text-xl mb-6 text-white">
            Building stronger communities through local support and collaboration
          </p>
          <div className="space-x-4">
            <Link
              to="/signup"
              className={`px-6 py-3 rounded shadow transition-all duration-200 ${
                activeButton === 'getstarted'
                  ? 'bg-gray-100 text-orange-600 transform scale-105'
                  : 'bg-white text-orange-500 hover:bg-gray-100'
              }`}
              onMouseEnter={() => setActiveButton('getstarted')}
              onMouseLeave={() => setActiveButton(null)}
            >
              Get Started
            </Link>
            <button
              className={`px-6 py-3 border rounded transition-all duration-200 ${
                activeButton === 'learnmore'
                  ? 'border-white bg-orange-600 text-white transform scale-105'
                  : 'border-white text-white hover:bg-orange-600'
              }`}
              onMouseEnter={() => setActiveButton('learnmore')}
              onMouseLeave={() => setActiveButton(null)}
            >
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">How We Connect Communities</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { key: 'helpers', icon: Users, title: 'Find Nearby Helpers', desc: 'Connect with neighbors who can provide assistance with everyday tasks' },
              { key: 'volunteer', icon: Heart, title: 'Volunteer Opportunities', desc: 'Discover ways to give back and support others in your community' },
              { key: 'forums', icon: MessageCircle, title: 'Community Forums', desc: 'Join discussions and stay informed about local news and events' },
            ].map(({ key, icon: Icon, title, desc }) => (
              <div
                key={key}
                className={`bg-white p-6 rounded-lg text-center transition-all duration-300 ${
                  hoveredFeature === key ? 'shadow-lg transform scale-105' : 'shadow hover:shadow-md cursor-pointer'
                }`}
                onMouseEnter={() => setHoveredFeature(key)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div className="flex justify-center mb-4">
                  <Icon size={48} className={`${hoveredFeature === key ? 'text-orange-600' : 'text-orange-500'} transition-colors duration-300`} />
                </div>
                <h3 className={`text-xl font-bold mb-2 transition-colors duration-300 ${hoveredFeature === key ? 'text-orange-600' : 'text-gray-800'}`}>{title}</h3>
                <p className="text-gray-600">{desc}</p>
                <div className={`mt-4 transition-opacity duration-300 ${hoveredFeature === key ? 'opacity-100' : 'opacity-0'}`}>
                  <button className="text-orange-500 hover:text-orange-600 font-medium flex items-center justify-center mx-auto">
                    Learn more <ChevronRight size={16} className="ml-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-orange-50 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4 text-gray-800">Ready to Connect With Your Neighbors?</h2>
          <p className="text-xl mb-8 text-gray-600 max-w-3xl mx-auto">
            Join thousands of communities already strengthening their neighborhoods through Neighbor Aid Connect
          </p>
          <div className="max-w-md mx-auto flex">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-grow px-4 py-3 rounded-l border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              className={`px-6 py-3 rounded-r flex items-center transition-all duration-200 text-white ${
                activeButton === 'join'
                  ? 'bg-orange-600 transform scale-105'
                  : 'bg-orange-500 hover:bg-orange-600'
              }`}
              onMouseEnter={() => setActiveButton('join')}
              onMouseLeave={() => setActiveButton(null)}
            >
              Join<ChevronRight className="ml-1" size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

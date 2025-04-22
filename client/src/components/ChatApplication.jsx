import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';

// Create socket outside component to prevent multiple connections
const socket = io('http://localhost:3000');

export default function ChatApplication() {
  // Use chatid (lowercase) to match the route in App.js
  const { chatid } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  
  // Track processed socket messages to prevent duplicates
  const processedMessages = useRef(new Set());

  // Debug logging
  useEffect(() => {
    console.log("ChatApplication mounted with chatid:", chatid);
  }, []);

  // Get user from localStorage with better error handling
  useEffect(() => {
    console.log("Attempting to get user from localStorage");
    const storedUser = localStorage.getItem('user');
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log("Found user in localStorage:", parsedUser);
        
        if (!parsedUser || !parsedUser._id) {
          console.error('Invalid user data (missing _id):', parsedUser);
          setError('Invalid user data. Please log in again.');
        } else {
          setUser(parsedUser);
          console.log('User loaded successfully:', parsedUser);
        }
      } catch (err) {
        console.error('Failed to parse user from localStorage:', err);
        setError('Failed to parse user data. Please log in again.');
      }
    } else {
      console.error('User not found in localStorage');
      // Create a temporary user for testing if needed
      const tempUser = {
        _id: "temp_" + Date.now(),
        name: "Guest User",
        email: "guest@example.com"
      };
      localStorage.setItem('user', JSON.stringify(tempUser));
      setUser(tempUser);
      console.log('Created temporary user for testing:', tempUser);
    }
  }, []);

  // Fetch initial messages
  useEffect(() => {
    if (!chatid) {
      console.error("No chatid provided in URL");
      setLoading(false);
      setError("No chat ID found in URL. Please navigate to a valid chat room.");
      return;
    }
    
    console.log("Fetching messages for chatid:", chatid);
    setLoading(true);

    // Try the messages route first
    fetch(`http://localhost:3000/api/messages/${chatid}`)
      .then(res => {
        console.log("Messages fetch response status:", res.status);
        if (!res.ok) {
          // If first route fails, try the alternative route
          console.log("First route failed, trying alternative...");
          return fetch(`http://localhost:3000/api/chat/${chatid}/messages`);
        }
        return res;
      })
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load messages: ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log("Received messages:", data);
        if (Array.isArray(data)) {
          setMessages(data);
          // Store message IDs to prevent duplicates
          data.forEach(msg => {
            if (msg._id) processedMessages.current.add(msg._id);
          });
        } else {
          console.error('Invalid message format from server:', data);
          setError('Failed to load messages: Invalid data format');
        }
      })
      .catch(err => {
        console.error('Error loading messages:', err);
        setError(`Failed to load messages: ${err.message}`);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [chatid]);

  // Socket.io setup with duplicate prevention
  useEffect(() => {
    if (!chatid) return;
    
    console.log(`Joining socket room: ${chatid}`);
    // Join the chat room
    socket.emit('joinRoom', chatid);
    
    // Handle incoming messages with duplicate prevention
    const handleReceiveMessage = (msg) => {
      console.log("Received message via socket:", msg);
      
      // Skip if we've already processed this message
      if (msg._id && processedMessages.current.has(msg._id)) {
        console.log("Skipping duplicate message:", msg._id);
        return;
      }
      
      // Add to processed set
      if (msg._id) processedMessages.current.add(msg._id);
      
      setMessages(prev => {
        // Check if this is replacing a pending message
        const pendingMsgIndex = prev.findIndex(m => 
          m.pending && m.text === msg.text && 
          (m.sender?._id === msg.sender?._id || m.sender === msg.sender?._id)
        );
        
        if (pendingMsgIndex >= 0) {
          // Replace pending message
          const newMessages = [...prev];
          newMessages[pendingMsgIndex] = msg;
          return newMessages;
        } else {
          // Add as new message
          return [...prev, msg];
        }
      });
    };
    
    socket.on('receiveMessage', handleReceiveMessage);
    console.log("Socket listener set up for 'receiveMessage' events");
    
    // Cleanup function
    return () => {
      console.log(`Leaving socket room: ${chatid}`);
      socket.off('receiveMessage', handleReceiveMessage);
      socket.emit('leaveRoom', chatid);
    };
  }, [chatid]);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Format timestamp for display
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (err) {
      return '';
    }
  };

  // Handle sending messages
  const sendMessage = async (e) => {
    e?.preventDefault();
    
    if (!newMsg.trim()) return;
    
    if (!chatid) {
      setError('No chat ID found. Please navigate to a valid chat room.');
      console.error('Missing chatid', { chatid });
      return;
    }

    if (!user || !user._id) {
      setError('User information missing. Please reload the page or re-login.');
      console.error('Missing user', { user });
      return;
    }
    
    console.log("Sending message:", { chatid, userId: user._id, text: newMsg });
    
    // Optimistically add message to UI
    const tempId = `temp_${Date.now()}`;
    const tempMessage = {
      _id: tempId,
      text: newMsg,
      sender: {
        _id: user._id,
        name: user.name || 'You'
      },
      createdAt: new Date().toISOString(),
      pending: true
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setNewMsg('');
    
    try {
      const response = await fetch(`http://localhost:3000/api/chat/${chatid}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          senderId: user._id, 
          text: newMsg 
        })
      });
      
      console.log("Send message response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }
      
      // Server will emit this via socket.io, no need to update state directly
      // Just capture the ID to prevent duplicates
      const message = await response.json();
      if (message._id) processedMessages.current.add(message._id);
      
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(`Failed to send message: ${err.message}`);
      
      // Remove the pending message on error
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
    }
  };

  // Handle pressing Enter to send
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md p-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-orange-600">Neighborhood Connect</h2>
          <p className="text-sm text-gray-500">Chat Room: {chatid || 'Unknown'}</p>
        </div>
        {user && (
          <div className="text-sm bg-green-50 px-3 py-1 rounded-full border border-green-200">
            <span className="font-medium">Logged in as:</span> {user.name}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mx-4 mt-2 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded flex justify-between items-center">
          <span>{error}</span>
          <button 
            className="ml-2 text-sm underline"
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main chat area */}
      <div className="flex-1 overflow-hidden p-4">
        <div className="bg-white rounded-lg shadow-md h-full flex flex-col">
          {/* Messages container */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="h-8 w-8 bg-orange-200 rounded-full"></div>
                  <p className="text-gray-500 mt-2">Loading messages...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-full text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-center">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isCurrentUser = user && msg.sender && (
                  msg.sender._id === user._id || 
                  msg.sender === user._id
                );
                
                return (
                  <div 
                    key={msg._id || index} 
                    className={`mb-3 flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`px-4 py-2 rounded-lg max-w-xs md:max-w-md lg:max-w-lg break-words ${
                        isCurrentUser 
                          ? 'bg-orange-500 text-white rounded-br-none' 
                          : 'bg-gray-200 text-gray-800 rounded-bl-none'
                      } ${msg.pending ? 'opacity-60' : ''}`}
                    >
                      {!isCurrentUser && (
                        <div className="font-medium text-xs mb-1">
                          {(msg.sender && msg.sender.name) || 'User'}
                        </div>
                      )}
                      <div>{msg.text}</div>
                      <div className="text-xs mt-1 flex justify-end">
                        {formatTime(msg.createdAt)}
                        {msg.pending && (
                          <span className="ml-1 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Sending...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Message input */}
          <div className="p-3 border-t">
            <form onSubmit={sendMessage} className="flex items-center">
              <input
                type="text"
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 border border-gray-300 rounded-l-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Type a message..."
                disabled={loading || !user}
              />
              <button
                type="submit"
                className="bg-orange-500 text-white rounded-r-full px-6 py-2 hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                disabled={!newMsg.trim() || loading || !user}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </form>
            
            {!user && (
              <p className="text-sm text-center text-gray-500 mt-2">
                You need to be logged in to send messages.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
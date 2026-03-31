import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import config from '../config/config';

// Create socket outside component to prevent multiple connections
const socket = io(config.apiBaseUrl);

function getSpeechRecognitionConstructor() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function speechSupported() {
  return typeof window !== 'undefined' && !!window.speechSynthesis;
}

export default function ChatApplication() {
  const { chatid } = useParams();
  const location = useLocation();
  const isGroupChat = location.pathname.startsWith('/chat/group/');
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [user, setUser] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [chatTitle, setChatTitle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRequestCompleted, setIsRequestCompleted] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);
  const [showMembers, setShowMembers] = useState(true);
  const [listening, setListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Track processed socket messages to prevent duplicates
  const processedMessages = useRef(new Set());

  const sttSupported = typeof window !== 'undefined' && !!getSpeechRecognitionConstructor();
  const ttsSupported = typeof window !== 'undefined' && speechSupported();

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

        if (!parsedUser || (!parsedUser._id && !parsedUser.id)) {
          console.error('Invalid user data (missing _id):', parsedUser);
          setError('Invalid user data. Please log in again.');
        } else {
          setUser({
            ...parsedUser,
            _id: parsedUser._id || parsedUser.id
          });
          console.log('User loaded successfully:', parsedUser);
        }
      } catch (err) {
        console.error('Failed to parse user from localStorage:', err);
        setError('Failed to parse user data. Please log in again.');
      }
    } else {
      console.error('User not found in localStorage');
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
    if (!chatid || !user) {
      console.error("No chatid or user provided");
      setLoading(false);
      setError("No chat ID or user found. Please navigate to a valid chat room.");
      return;
    }

    console.log("Setting up chat for chatid:", chatid, "with user:", user._id, "group:", isGroupChat);
    setLoading(true);
    setError(null);

    const setupChat = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        let resolvedChatId;
        let titleForHeader = chatid;

        if (isGroupChat) {
          const chatRes = await fetch(`${config.apiBaseUrl}/api/chats/${chatid}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!chatRes.ok) {
            const errBody = await chatRes.json().catch(() => ({}));
            throw new Error(errBody.message || `Failed to load group chat: ${chatRes.status}`);
          }
          const chatData = await chatRes.json();
          resolvedChatId = chatData._id;
          titleForHeader = chatData.name || 'Group chat';
          setGroupMembers(
            Array.isArray(chatData.participants) ? chatData.participants : []
          );
          setIsRequestCompleted(false);
        } else {
          setGroupMembers([]);
          const chatResponse = await fetch(`${config.apiBaseUrl}/api/chats/create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              participant1: user._id,
              participant2: chatid
            })
          });

          if (!chatResponse.ok) {
            throw new Error(`Failed to create/get chat: ${chatResponse.status}`);
          }

          const chatData = await chatResponse.json();
          resolvedChatId = chatData._id;
          titleForHeader = chatid;

          const checkRequestStatus = async () => {
            try {
              const requestsResponse = await fetch(`${config.apiBaseUrl}/api/requests/all`, {
                headers: { Authorization: `Bearer ${token}` }
              });

              if (requestsResponse.ok) {
                const requestsData = await requestsResponse.json();
                if (requestsData.requests && Array.isArray(requestsData.requests)) {
                  const activeRequest = requestsData.requests.find(req =>
                    (req.status === 'pending' || req.status === 'in-progress') &&
                    ((req.userId === user._id && req.completedBy === chatid) ||
                      (req.userId === chatid && req.completedBy === user._id))
                  );

                  if (activeRequest) {
                    setIsRequestCompleted(false);
                  } else {
                    const completedRequest = requestsData.requests.find(req =>
                      req.status === 'completed' &&
                      ((req.userId === user._id && req.completedBy === chatid) ||
                        (req.userId === chatid && req.completedBy === user._id))
                    );

                    if (completedRequest) {
                      setIsRequestCompleted(true);
                    }
                  }
                }
              }
            } catch (err) {
              console.error('Error checking request status:', err);
            }
          };

          await checkRequestStatus();
        }

        const messagesResponse = await fetch(`${config.apiBaseUrl}/api/chats/${resolvedChatId}/messages`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!messagesResponse.ok) {
          throw new Error(`Failed to load messages: ${messagesResponse.status}`);
        }

        const messagesData = await messagesResponse.json();

        if (Array.isArray(messagesData)) {
          setMessages(messagesData);
          messagesData.forEach(msg => {
            if (msg._id) processedMessages.current.add(msg._id);
          });
        } else {
          setError('Failed to load messages: Invalid data format');
        }

        setChatId(resolvedChatId);
        setChatTitle(titleForHeader);
        setError(null);
      } catch (err) {
        console.error('Error setting up chat:', err);
        setError(`Failed to set up chat: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    setupChat();
  }, [chatid, user, isGroupChat]);

  // Socket.io setup with duplicate prevention
  useEffect(() => {
    if (!chatId) return;

    console.log(`Joining socket room: ${chatId}`);
    socket.emit('joinRoom', chatId);

    const handleReceiveMessage = (msg) => {
      console.log("Received message via socket:", msg);

      if (msg._id && processedMessages.current.has(msg._id)) {
        console.log("Skipping duplicate message:", msg._id);
        return;
      }

      if (msg._id) processedMessages.current.add(msg._id);

      setMessages(prev => {
        const pendingMsgIndex = prev.findIndex(m =>
          m.pending && m.text === msg.text &&
          (m.sender?._id === msg.sender?._id || m.sender === msg.sender?._id)
        );

        if (pendingMsgIndex >= 0) {
          const newMessages = [...prev];
          newMessages[pendingMsgIndex] = msg;
          return newMessages;
        } else {
          return [...prev, msg];
        }
      });
    };

    socket.on('receiveMessage', handleReceiveMessage);

    return () => {
      console.log(`Leaving socket room: ${chatId}`);
      socket.off('receiveMessage', handleReceiveMessage);
      socket.emit('leaveRoom', chatId);
    };
  }, [chatId]);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      try {
        recognitionRef.current?.stop();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    };
  }, []);

  const toggleSpeechToText = useCallback(() => {
    const Ctor = getSpeechRecognitionConstructor();
    if (!Ctor) {
      setError('Speech-to-text is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    // Check for secure context (HTTPS or localhost) — required by most browsers
    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      setError('Speech-to-text requires HTTPS or localhost. Please use a secure connection.');
      return;
    }

    if (listening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
      setListening(false);
      return;
    }

    setError(null);
    const rec = new Ctor();
    rec.lang = navigator.language || 'en-US';
    rec.interimResults = true;
    rec.continuous = true;

    rec.onresult = (event) => {
      let finals = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finals += event.results[i][0].transcript;
        }
      }
      const chunk = finals.trim();
      if (chunk) {
        setNewMsg((prev) => (prev ? `${prev} ${chunk}` : chunk));
      }
    };

    rec.onerror = (ev) => {
      if (ev.error === 'not-allowed') {
        setError('Microphone access denied. Allow the mic and ensure you are on HTTPS or localhost.');
      } else if (ev.error === 'no-speech') {
        // No speech detected is not a critical error, just stop quietly
        setListening(false);
        recognitionRef.current = null;
        return;
      } else if (ev.error !== 'aborted') {
        setError(`Speech recognition error: ${ev.error}`);
      }
      setListening(false);
      recognitionRef.current = null;
    };

    rec.onend = () => {
      // Auto-restart if user hasn't explicitly stopped
      if (recognitionRef.current === rec && listening) {
        try {
          rec.start();
          return;
        } catch {
          /* fall through to stop */
        }
      }
      setListening(false);
      recognitionRef.current = null;
    };

    try {
      rec.start();
      recognitionRef.current = rec;
      setListening(true);
    } catch (err) {
      setError(`Could not start microphone: ${err.message}`);
    }
  }, [listening]);

  const speakMessage = useCallback((msgId, text, senderLabel) => {
    if (!text || !ttsSupported) return;
    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }
    window.speechSynthesis.cancel();

    const doSpeak = () => {
      const utter = new SpeechSynthesisUtterance(
        senderLabel ? `${senderLabel} says: ${text}` : text
      );
      utter.lang = navigator.language || 'en-US';
      // Try to pick a voice explicitly (Chrome sometimes needs this)
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const preferred = voices.find(v => v.lang.startsWith(utter.lang.split('-')[0]));
        if (preferred) utter.voice = preferred;
      }
      utter.onend = () => setSpeakingMsgId(null);
      utter.onerror = () => setSpeakingMsgId(null);
      setSpeakingMsgId(msgId);
      window.speechSynthesis.speak(utter);
    };

    // Chrome lazy-loads voices — wait for them if needed
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      const onVoicesChanged = () => {
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
        doSpeak();
      };
      window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
      // Fallback: if voices never load, speak anyway after 500ms
      setTimeout(() => {
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
        if (speakingMsgId !== msgId) doSpeak();
      }, 500);
    } else {
      doSpeak();
    }
  }, [speakingMsgId, ttsSupported]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (err) {
      return '';
    }
  };

  const sendMessage = async (e) => {
    e?.preventDefault();

    const outgoing = newMsg.trim();
    if (!outgoing) return;

    if (!chatId) {
      setError('No chat ID found. Please navigate to a valid chat room.');
      console.error('Missing chatId', { chatId });
      return;
    }

    if (!user || !user._id) {
      setError('User information missing. Please reload the page or re-login.');
      console.error('Missing user', { user });
      return;
    }

    const tempId = `temp_${Date.now()}`;
    const tempMessage = {
      _id: tempId,
      text: outgoing,
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
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${config.apiBaseUrl}/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: outgoing })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const message = await response.json();
      if (message._id) processedMessages.current.add(message._id);

      setError(null);
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(`Failed to send message: ${err.message}`);
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
    }
  };

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
          <p className="text-sm text-gray-500">
            {isGroupChat
              ? (chatTitle || 'Group chat')
              : `Chat with: ${chatid || 'Unknown'}`}
            {chatId && (
              <span className="ml-2 text-xs text-gray-400">
                ({isGroupChat ? 'Group' : 'Room'}: {String(chatId).slice(-8)})
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {ttsSupported && speakingMsgId && (
            <button
              type="button"
              onClick={() => {
                window.speechSynthesis.cancel();
                setSpeakingMsgId(null);
              }}
              className="text-xs px-2 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Stop speech
            </button>
          )}
          {user && (
            <div className="text-sm bg-green-50 px-3 py-1 rounded-full border border-green-200">
              <span className="font-medium">Logged in as:</span> {user.name}
            </div>
          )}
        </div>
      </div>

      {/* Group members panel */}
      {isGroupChat && groupMembers.length > 0 && !loading && (
        <div className="mx-4 mt-2 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setShowMembers((v) => !v)}
            className="w-full px-4 py-2 text-left text-sm font-medium text-gray-800 flex justify-between items-center bg-gray-50 hover:bg-gray-100"
          >
            <span>Members ({groupMembers.length}) — view only</span>
            <span className="text-gray-500 text-xs">{showMembers ? 'Hide' : 'Show'}</span>
          </button>
          {showMembers && (
            <ul className="divide-y border-t border-gray-100 max-h-44 overflow-y-auto">
              {groupMembers.map((m) => (
                <li
                  key={m._id || String(m)}
                  className="px-4 py-2 text-sm text-gray-800 flex justify-between items-center gap-2"
                >
                  <span className="font-medium">{m.name || 'Member'}</span>
                  <span className="text-xs text-gray-500 capitalize shrink-0">
                    {m.userType || m.role || 'member'}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {user?.isAdmin ? (
            <p className="px-4 py-2 text-xs text-gray-600 border-t border-gray-100 bg-gray-50">
              To add or remove residents, use Dashboard → Chats → Manage on this group.
            </p>
          ) : (
            <p className="px-4 py-2 text-xs text-gray-500 border-t border-gray-100 bg-amber-50/50">
              Member list is read-only. Only admins can change members from the dashboard.
            </p>
          )}
        </div>
      )}

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
                  <p className="text-gray-500 mt-2">
                    {!chatId ? 'Setting up chat room...' : 'Loading messages...'}
                  </p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-full text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-center">No messages yet. Start the conversation!</p>
                <p className="text-xs text-gray-300 mt-1">Chat room is ready</p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isCurrentUser = user && msg.sender && (
                  msg.sender._id === user._id ||
                  msg.sender === user._id ||
                  msg.sender?._id === user?.id
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
                      <div className="flex items-start gap-2 justify-between">
                        <div className="min-w-0 flex-1">{msg.text}</div>
                        {ttsSupported && msg.text && (
                          <button
                            type="button"
                            onClick={() =>
                              speakMessage(
                                msg._id,
                                msg.text,
                                !isCurrentUser
                                  ? (msg.sender && msg.sender.name) || 'Someone'
                                  : undefined
                              )
                            }
                            title={speakingMsgId === msg._id ? 'Stop reading' : 'Read aloud'}
                            className={`shrink-0 p-1 rounded-md border ${
                              speakingMsgId === msg._id
                                ? isCurrentUser
                                  ? 'border-white/80 bg-white/20 text-white'
                                  : 'border-orange-400 bg-orange-100 text-orange-800'
                                : isCurrentUser
                                  ? 'border-white/40 text-white/90 hover:bg-white/10'
                                  : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                            }`}
                            aria-label={speakingMsgId === msg._id ? 'Stop reading' : 'Read message aloud'}
                          >
                            {speakingMsgId === msg._id ? (
                              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.617 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.617l3.766-3.793a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
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
            {!isGroupChat && isRequestCompleted && (
              <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800 text-center">
                This service request has been completed. You can view the chat history but cannot send new messages.
              </div>
            )}
            <form onSubmit={sendMessage} className="flex items-stretch gap-0">
              {sttSupported && (
                <button
                  type="button"
                  onClick={toggleSpeechToText}
                  disabled={loading || !user || (!isGroupChat && isRequestCompleted)}
                  title={listening ? 'Stop dictation' : 'Speak to type (microphone)'}
                  className={`shrink-0 px-3 py-2 border border-r-0 border-gray-300 rounded-l-full transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed ${
                    listening
                      ? 'bg-red-500 text-white border-red-500 animate-pulse'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400 hover:bg-orange-50'
                  }`}
                  aria-pressed={listening}
                  aria-label={listening ? 'Stop dictation' : 'Start speech to text'}
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
              <input
                type="text"
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                onKeyDown={handleKeyDown}
                className={`flex-1 min-w-0 border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  sttSupported ? 'rounded-none border-l-0' : 'rounded-l-full'
                }`}
                placeholder={
                  !isGroupChat && isRequestCompleted
                    ? 'Service completed - messages disabled'
                    : listening
                      ? 'Listening… speak now'
                      : 'Type a message…'
                }
                disabled={loading || !user || (!isGroupChat && isRequestCompleted)}
              />
              <button
                type="submit"
                disabled={loading || !user || (!isGroupChat && isRequestCompleted)}
                className="bg-orange-500 text-white rounded-r-full px-5 sm:px-6 py-2 hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shrink-0"
                title="Send"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </form>
            {(sttSupported || ttsSupported) && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                {sttSupported && (
                  <span>
                    <strong>Speech to text:</strong> mic button (Chrome/Edge recommended).{' '}
                  </span>
                )}
                {ttsSupported && (
                  <span>
                    <strong>Text to speech:</strong> speaker icon on each message.
                  </span>
                )}
              </p>
            )}
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
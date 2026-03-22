import React, { useState } from 'react';
import config from '../config/config';

const SAMPLE_PROMPTS = [
  'Who are the top plumbers?',
  'Show top 3 maids',
  'Which workers completed the most requests?',
  'What do people say about Ravi?'
];

export default function ResidentAssistant({ token }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hi! Ask me about top workers, completed jobs, or service feedback.'
    }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setMessages(prev => [...prev, { role: 'user', text: trimmed }]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`${config.apiBaseUrl}/api/assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: trimmed })
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      const reply =
        data?.reply ||
        data?.message ||
        (!response.ok
          ? `Request failed (${response.status}). Please try again.`
          : 'I could not process that request right now.');

      if (import.meta.env.DEV) {
        console.log('Assistant intent:', data?.intent);
      }

      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: 'Something went wrong while contacting the assistant.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">AI Assistant</h2>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="h-80 overflow-y-auto border rounded-md p-3 bg-gray-50 space-y-3">
          {messages.map((msg, index) => (
            <div
              key={`${msg.role}-${index}`}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                  msg.role === 'user'
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-800 border'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="text-sm text-gray-500">Assistant is thinking...</div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder="Ask: top plumbers, best maids by rating, feedback for Ravi..."
            className="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-4 py-2 rounded-md bg-orange-500 text-white hover:bg-orange-600 disabled:bg-gray-300"
          >
            Send
          </button>
        </div>

        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_PROMPTS.map(prompt => (
              <button
                key={prompt}
                type="button"
                disabled={loading}
                onClick={() => setInput(prompt)}
                className="text-xs px-2 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 disabled:opacity-60"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

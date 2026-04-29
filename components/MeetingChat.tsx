import React, { useState, useEffect, useRef } from 'react';
import { meetingService } from '../services/meetingService';

interface MeetingChatProps {
  meetingId: string;
  transcript: string;
}

const MeetingChat: React.FC<MeetingChatProps> = ({ meetingId, transcript }) => {
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([
    { role: 'model', text: 'Hi! I can answer questions about this meeting. What would you like to know?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await meetingService.askMeetingQuestion(meetingId, userMessage);
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (error) {
      console.error("Error sending message", error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface-light dark:bg-surface-dark">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-primary text-white rounded-br-sm' 
                  : 'bg-background-light dark:bg-background-dark/50 text-text-main dark:text-gray-200 rounded-bl-sm border border-border-light dark:border-border-dark'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-background-light dark:bg-background-dark/50 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1">
              <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce delay-100"></span>
              <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce delay-200"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t border-border-light dark:border-border-dark bg-background-light/50 dark:bg-background-dark/50 backdrop-blur-sm">
        <div className="relative">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about the meeting..."
            className="w-full pl-4 pr-12 py-3 rounded-xl bg-white dark:bg-black/20 border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary/50 text-sm text-text-main dark:text-white"
            disabled={isLoading}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1.5 p-1.5 text-primary hover:text-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingChat;
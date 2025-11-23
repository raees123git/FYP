"use client";

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle, Minimize2, RefreshCw, Bot, User, Brain, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m your SkillEdge-AI assistant. I can help you with questions about our platform or analyze your interview reports. How can I assist you today?',
      timestamp: new Date(),
      sources: ['SkillEdge-AI Knowledge Base']
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [chatMode, setChatMode] = useState('general'); // 'general', 'reports', or 'resume'
  const [resumeAvailable, setResumeAvailable] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [resumeStatus, setResumeStatus] = useState(null);
  
  const messagesEndRef = useRef(null);
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isAuthenticated) {
      checkResumeStatus();
    }
  }, [isAuthenticated]);

  const checkResumeStatus = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      console.log('Checking resume status...');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chatbot/resume/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Resume status:', data);
        setResumeStatus(data);
        setResumeAvailable(data.can_use_resume_chat);
        
        // Auto-reindex if resume exists but not indexed
        if (data.has_resume_file && !data.has_resume_index && !isIndexing) {
          console.log('Resume needs indexing, triggering automatic reindex...');
          await reindexResume();
        }
      } else {
        console.error('Resume status check failed:', response.status);
      }
    } catch (error) {
      console.error('Error checking resume status:', error);
    }
  };

  const reindexResume = async () => {
    try {
      setIsIndexing(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chatbot/resume/reindex`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Resume reindexed successfully:', data);
        toast.success('Resume indexed successfully!');
        // Recheck status after indexing
        await checkResumeStatus();
      } else {
        const error = await response.json();
        console.error('Reindex failed:', error);
        toast.error('Failed to index resume.');
      }
    } catch (error) {
      console.error('Error reindexing resume:', error);
      toast.error('Failed to index resume.');
    } finally {
      setIsIndexing(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !isAuthenticated) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chatbot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversation_id: conversationId,
          include_reports: chatMode === 'reports',
          include_resume: chatMode === 'resume'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      const assistantMessage = {
        id: Date.now().toString() + '_assistant',
        role: 'assistant',
        content: data.message,
        timestamp: new Date(data.timestamp),
        sources: data.sources
      };

      setMessages(prev => [...prev, assistantMessage]);
      setConversationId(data.conversation_id);

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
      
      const errorMessage = {
        id: Date.now().toString() + '_error',
        role: 'assistant',
        content: 'I apologize, but I\'m experiencing technical difficulties. Please try again later.',
        timestamp: new Date(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearConversation = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Hi! I\'m your SkillEdge-AI assistant. I can help you with questions about our platform, analyze your interview reports, or answer questions about your resume. How can I assist you today?',
        timestamp: new Date(),
        sources: ['SkillEdge-AI Knowledge Base']
      }
    ]);
    setConversationId(null);
    setChatMode('general');
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (authLoading) return null;

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              size="lg"
              className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Widget */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className={`fixed bottom-6 right-6 z-50 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 ${
              isMinimized ? 'h-16' : 'h-[600px]'
            } w-96 flex flex-col transition-all duration-300`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-2xl">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">SkillEdge Assistant</h3>
                  <p className="text-xs text-white/80">AI-powered career guidance</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Mode Toggle */}
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-1">
                      <Button
                        variant={chatMode === 'general' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setChatMode('general')}
                        className="flex items-center space-x-1 text-xs flex-1"
                      >
                        <Brain className="h-3 w-3" />
                        <span>General</span>
                      </Button>
                      <Button
                        variant={chatMode === 'reports' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setChatMode('reports')}
                        className="flex items-center space-x-1 text-xs flex-1"
                      >
                        <BarChart3 className="h-3 w-3" />
                        <span>Reports</span>
                      </Button>
                      <Button
                        variant={chatMode === 'resume' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setChatMode('resume')}
                        className="flex items-center space-x-1 text-xs flex-1"
                        disabled={!resumeAvailable}
                        title={!resumeAvailable ? "Upload a resume in your profile" : "Ask about your resume"}
                      >
                        <User className="h-3 w-3" />
                        <span>Resume</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearConversation}
                        className="h-7 w-7 p-0"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] ${
                          message.role === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : message.isError 
                              ? 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                        } rounded-2xl px-4 py-2`}>
                          <div className="flex items-start space-x-2">
                            {message.role === 'assistant' && (
                              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Bot className="w-3 h-3 text-white" />
                              </div>
                            )}
                            {message.role === 'user' && (
                              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <User className="w-3 h-3 text-white" />
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className={`text-xs ${
                                  message.role === 'user' 
                                    ? 'text-white/70' 
                                    : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                  {formatTime(message.timestamp)}
                                </span>
                                {message.sources && (
                                  <div className="flex flex-wrap gap-1">
                                    {message.sources.map((source, index) => (
                                      <Badge key={index} variant="secondary" className="text-xs">
                                        {source}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    
                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                      >
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                              <Bot className="w-3 h-3 text-white" />
                            </div>
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                  <div ref={messagesEndRef} />
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex space-x-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={
                        chatMode === 'reports'
                          ? "Ask about your interview reports..." 
                          : chatMode === 'resume'
                            ? "Ask about your resume..."
                            : "Ask about SkillEdge-AI..."
                      }
                      disabled={isLoading || !user}
                      className="flex-1"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!input.trim() || isLoading || !user}
                      size="sm"
                      className="px-3"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  {!user && (
                    <p className="text-xs text-gray-500 mt-2">Please sign in to use the chatbot</p>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatbotWidget;